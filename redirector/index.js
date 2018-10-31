const url = require('url')
const fs = require('fs')
const { send } = require('micro')
const Cards = require('./cards')

module.exports = async (request, response) => {
  let p = url.parse(request.url).pathname.split('/')
  if (p[1] === 'logo.png') {
    return new Promise(resolve => {
      fs.readFile('logo.png', (err, data) => {
        if (err) {
          send(response, 500)
        } else {
          response.setHeader('Content-type', 'image/png')
          send(response, 200, data)
        }
        resolve()
      })
    })
  }
  if (p.length < 5 || p[1] !== 'cards') {
    send(response, 404)
    return
  }

  let lang = p[2]
  let id = p[4].split('.')[0].split('_')[0]
  let back = p[4].includes('_back')
  let card = Cards.get(`${id}-${lang}`) || Cards.get(`${id}-en`)

  if (!card || (back && card.images.length < 2)) {
    send(response, 404)
  } else {
    response.setHeader('Location', card.images[back ? 1 : 0].normal)
    send(response, 302)
  }
}
