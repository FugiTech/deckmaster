const express = require('express')
const jwt = require('jsonwebtoken')

const hostname = '0.0.0.0'
const port = process.env.PORT || 8080
const ext_secret = Buffer.from(process.env.EXT_SECRET, 'base64')

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

const app = express()

app.use(express.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

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
  if (!cdata.has(req.body.card)) cdata.set(req.body.card, new Map())
  cdata.get(req.body.card).set(token.opaque_user_id, new Date())

  res.send('')
})

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
