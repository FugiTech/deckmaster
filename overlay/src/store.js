import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let token
window.Twitch.ext.onAuthorized(data => {
  token = data.token
})

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
    vote(context, card) {
      fetch('https://deckmaster-api.fugi.io/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `token=${token}&card=${card}`,
      })
    },
  },
})

let delay = 0
window.Twitch.ext.onContext((context, diffProps) => {
  delay = context.hlsLatencyBroadcaster * 1000
})
window.Twitch.ext.listen('broadcast', (target, contentType, message) => {
  setTimeout(() => {
    store.commit('handleBroadcast', JSON.parse(message))
  }, delay)
})

export default store
