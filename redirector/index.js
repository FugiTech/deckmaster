const url = require('url')
const fs = require('fs')
const { send } = require('micro')
const Cards = require('./cards')

module.exports = async (request, response) => {
  response.setHeader('Cache-Control', 'max-age=3600')
  let u = url.parse(request.url)
  let p = u.pathname.split('/')
  if (p.length < 5 || p[1] !== 'cards') {
    response.setHeader('Location', `https://deckmaster.netlify.com${u.path}`)
    send(response, 301)
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
    send(response, 301)
  }
}
