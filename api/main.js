const http = require('http')
const express = require('express')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const WebSocket = require('ws')
const nanoid = require('nanoid')
const fetch = require('node-fetch')

const hostname = '0.0.0.0'
const port = process.env.PORT || 8080
const client_id = 'cplheah4pxjyuwe9mkno9kbmb11lyc'
const redirect_uri = 'http://localhost:8080/login'
const ext_secret = Buffer.from(process.env.EXT_SECRET, 'base64')
const client_secret = process.env.CLIENT_SECRET

let wsByState = new Map()
let wsByUID = new Map()

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const jwks = jwksClient({
  cache: true,
  rateLimit: true,
  jwksUri: 'https://id.twitch.tv/oauth2/keys',
})

app.use(express.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

setImmediate(() => {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
  })
})

// New auth & voting code
app.get('/login', (req, res) => {
  if (!wsByState.has(req.query.state)) {
    res.send('Invalid state')
    return
  }
  let ws = wsByState.get(req.query.state)
  let code = req.query.code
  fetch(`https://id.twitch.tv/oauth2/token?grant_type=authorization_code&client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`, {
    method: 'POST',
  })
    .then(r => r.json())
    .then(loginData => {
      return new Promise(r => {
        jwt.verify(
          loginData.id_token,
          (header, callback) => {
            jwks.getSigningKey(header.kid, (err, key) => {
              console.log(err)
              callback(err, key.publicKey || key.rsaPublicKey)
            })
          },
          {
            audience: client_id,
            issuer: ['https://id.twitch.tv/oauth2'],
          },
          (err, decoded) => {
            r()
            console.log(err)
            if (err) return
            loginData.username = decoded.preferred_username
            loginData.token = jwt.sign(
              {
                role: 'external',
                exp: 253370764800,
                user_id: decoded.sub,
                channel_id: decoded.sub,
                pubsub_perms: { send: ['broadcast', 'whisper-*'] },
              },
              ext_secret,
            )
            ws.send(JSON.stringify({ loginData }))
          },
        )
      })
    })
    .then(() => {
      res.send('You may close the window and check Deckmaster now')
    })
})
wss.on('connection', (ws, req) => {
  let state = nanoid()
  wsByState.set(state, ws)
  ws.send(JSON.stringify({ state }))
  ws.on('message', message => {
    let d = JSON.parse(message)
    if ('token' in d) {
      let token = jwt.verify(d.token, ext_secret)
      if (token.role !== 'external' || token.user_id !== token.channel_id) return
      wsByUID.set(token.channel_id, ws)
    }
  })
})

// Old auth & voting code
let votes = new Map()
const voteTTL = 60000 // 1 minute
setInterval(() => {
  let now = new Date()
  for (let [channel, cdata] of votes) {
    for (let [card, users] of cdata) {
      for (let [uid, time] of users) {
        if (now - time > voteTTL) users.delete(uid)
      }
      if (users.size === 0) cdata.delete(card)
    }
    if (cdata.size === 0) votes.delete(channel)
  }
}, 1000)

// Broadcaster
app.post('/auth', (req, res) => {
  let token = jwt.verify(req.body.token, ext_secret)
  if (token.role !== 'broadcaster' || token.user_id !== token.channel_id) throw new Error('invalid token')

  token.role = 'external'
  token.exp = 253370764800

  res.send(jwt.sign(token, ext_secret))
})

app.get('/vote_results', (req, res) => {
  let token = jwt.verify(req.query.token, ext_secret)
  if (token.role !== 'external' || token.user_id !== token.channel_id) throw new Error('invalid token')

  let results = []

  if (votes.has(token.user_id)) {
    for (let [card, users] of votes.get(token.user_id)) {
      results.push({ card: +card, votes: users.size })
    }
  }

  res.send(JSON.stringify(results))
})

// Public
app.post('/vote', (req, res) => {
  let token = jwt.verify(req.body.token, ext_secret)

  if (!votes.has(token.channel_id)) votes.set(token.channel_id, new Map())
  let cdata = votes.get(token.channel_id)

  for (let [card, users] of cdata) {
    users.delete(token.opaque_user_id)
  }

  if (!cdata.has(req.body.card)) cdata.set(req.body.card, new Map())
  cdata.get(req.body.card).set(token.opaque_user_id, new Date())

  res.send('')
})
