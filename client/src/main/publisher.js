import fetch from 'node-fetch'
import WebSocket from 'ws'
import { client_id } from './vars'

export default function(store) {
  let devPublish = () => {}
  let devShutdown = () => {}

  if (process.env.NODE_ENV === 'development') {
    let wss = new WebSocket.Server({
      host: '127.0.0.1',
      port: 22223,
      clientTracking: true,
    })
    devPublish = msg => {
      wss.clients.forEach(ws => {
        ws.send(msg)
      })
    }
    devShutdown = () => {
      wss.close()
    }
  }

  let i = setInterval(async () => {
    if (!store.state.token || store.state.token.expires <= +new Date() / 1000) {
      store.commit('statusUpdate', { pubsub: false })
      return
    }

    let msg = JSON.stringify({
      zones: store.state.zones,
      triggers: store.state.triggers,
      activeDeck: store.state.activeDeck,
      doubleSided: store.state.doubleSided,
      draftID: store.state.draftEnabled ? store.state.draftID : false,
      overlayPositioning: store.state.overlayPositioning,
    })

    devPublish(msg)

    try {
      let r = await fetch(`https://api.twitch.tv/extensions/message/${store.state.token.channelID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-ID': client_id,
          Authorization: `Bearer ${store.state.token.jwt}`,
        },
        body: JSON.stringify({
          targets: ['broadcast'],
          content_type: 'application/json',
          message: msg,
        }),
      })
      store.commit('statusUpdate', { pubsub: r.ok })
    } catch (e) {
      console.log(e)
      store.commit('statusUpdate', { pubsub: false })
    }
  }, 1000)
  return () => {
    clearInterval(i)
    devShutdown()
  }
}
