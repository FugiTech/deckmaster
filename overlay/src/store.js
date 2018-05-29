import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let send = d => {}

let store = new Vuex.Store({
  state: {
    focusCard: null,
    activeTrigger: null,
    zones: [],
    triggers: [],
    activeDeck: '',
    doubleSided: {},
  },
  mutations: {
    handleBroadcast(state, data) {
      state.zones = data.Zones || []
      state.triggers = data.Triggers || []
      state.activeDeck = data.ActiveDeck || ''
      state.doubleSided = data.DoubleSided || {}
      if (data.Reset) {
        state.focusCard = null
        state.activeTrigger = null
      }
    },
    setFocusCard(state, card) {
      state.focusCard = card
    },
    setActiveTrigger(state, t) {
      state.activeTrigger = t
    },
  },
  actions: {
    send(context, v) {
      send(v)
    },
  },
})

let delay = 0
window.Twitch.ext.onContext((context, diffProps) => {
  delay = context.hlsLatencyBroadcaster * 1000
})
window.Twitch.ext.onAuthorized(data => {
  send = d => {
    window.Twitch.ext.send(
      `whisper-U${data.channelId}`,
      'application/json',
      JSON.stringify({
        UserID: data.userId,
        Data: d,
      }),
    )
  }
  window.Twitch.ext.listen(`whisper-${data.userId}`, (target, contentType, message) => {
    console.log(target, contentType, message)
  })
})
window.Twitch.ext.listen('broadcast', (target, contentType, message) => {
  setTimeout(() => {
    store.commit('handleBroadcast', JSON.parse(message))
  }, delay)
})

export default store
