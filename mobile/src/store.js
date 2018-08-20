import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

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
    // Set by viewer
    lang: new URL(window.location.href).searchParams.get('language') || 'en',
    focusCard: null,
    activeTrigger: null,
    draftSelect: null,
    dark: true,
  },
  getters: {
    zones(state) {
      let m = new Map()
      let o = []
      state.zones.forEach(z => {
        if (!z.Cards.length) return
        let name = z.Name || z.Trigger || 'Uncategorized'
        let zz = m.get(name) || {}
        m.set(name, {
          name: name,
          voteable: !!z.Voteable,
          count: z.Cards.length + (zz.count || 0),
          cards: (zz.cards || []).concat(
            z.Cards.map((c, i) => {
              return {
                id: c,
                attached: z.Attachments ? z.Attachments[i] || [] : [],
              }
            }),
          ),
        })
        o.push(name)
      })

      let r = []
      o.forEach(name => {
        if (m.has(name)) {
          r.push(m.get(name))
          m.delete(name)
        }
      })
      return r
    },
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
    setTheme(state, theme) {
      state.dark = theme === 'dark'
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
  store.commit('setTheme', context.theme)
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
