import fetch from 'node-fetch'
import { client_id } from './vars'

export default function(store) {
  let i = setInterval(async () => {
    if (!store.state.token || store.state.token.expires <= +new Date() / 1000) {
      store.commit('statusUpdate', { pubsub: false })
      return
    }

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
          message: JSON.stringify({
            zones: store.state.zones,
            triggers: store.state.triggers,
            activeDeck: store.state.activeDeck,
            doubleSided: store.state.doubleSided,
            draftID: store.state.draftEnabled ? store.state.draftID : false,
            overlayPositioning: store.state.overlayPositioning,
          }),
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
  }
}
