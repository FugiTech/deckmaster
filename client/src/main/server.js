import express from 'express'

export default function startServer(store) {
  let server = express()
  server.get('/auth', (req, res) => {
    store.commit('setToken', req.query.token)
    res.end('<!doctype html><script>window.close()</script>')
  })
  server.listen(22223, '127.0.0.1')
}
