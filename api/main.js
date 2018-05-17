const express = require('express')
const jwt = require('jsonwebtoken')

const hostname = '0.0.0.0'
const port = process.env.PORT || 8080
const ext_secret = Buffer.from(process.env.EXT_SECRET, 'base64')

const app = express()

app.use(express.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.post('/auth', (req, res) => {
  let token = jwt.verify(req.body.token, ext_secret)
  if (token.role !== 'broadcaster' || token.user_id !== token.channel_id) throw new Error('invalid token')

  token.role = 'external'
  token.exp = 253370764800

  res.send(jwt.sign(token, ext_secret))
})

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
