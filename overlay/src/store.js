import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

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
  actions: {},
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
