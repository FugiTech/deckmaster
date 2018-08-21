import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const globalHideKey = 'deckmaster.globalHide'

let token
window.Twitch.ext.onAuthorized(data => {
  token = data.token
})

let store = new Vuex.Store({
  state: {
    // Set by API
    zones: [],
    triggers: [],
    activeDeck: '', // deprecated
    doubleSided: {},
    draftID: false, // If set a draft is going on, distinguishes between packs
    overlayPositioning: {
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%',
    },
    // Set by viewer
    lang: new URL(window.location.href).searchParams.get('language') || 'en',
    focusCard: null,
    activeTrigger: null,
    draftSelect: null,
    globalHide: JSON.parse(localStorage.getItem(globalHideKey)) || false,
  },
  mutations: {
    handleBroadcast(state, data) {
      state.zones = data.zones || data.Zones || []
      state.triggers = data.triggers || data.Triggers || []
      state.activeDeck = data.activeDeck || data.ActiveDeck || ''
      state.doubleSided = data.doubleSided || data.DoubleSided || {}
      state.draftID = data.draftID || false
      state.overlayPositioning = data.overlayPositioning || state.overlayPositioning
    },
    setFocusCard(state, card) {
      state.focusCard = card
    },
    setActiveTrigger(state, t) {
      state.activeTrigger = t
    },
    setDraftSelect(state, zoneID) {
      state.draftSelect = zoneID
    },
    toggleGlobalHide(state) {
      state.globalHide = !state.globalHide
      localStorage.setItem(globalHideKey, JSON.stringify(state.globalHide))
    },
  },
  actions: {
    vote({ commit }, { draftID, card, zoneID }) {
      fetch('https://deckmaster.fugi.tech/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `token=${token}&card=${card}&draft_id=${draftID}`,
      })
      commit('setDraftSelect', zoneID)
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

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Connect to dev websocket since going through pubsub hurts
  let ws = new WebSocket('ws://localhost:22223/')
  ws.onmessage = e => {
    store.commit('handleBroadcast', JSON.parse(e.data))
  }
}

export default store
