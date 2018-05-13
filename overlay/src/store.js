import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let store = new Vuex.Store({
  state: {
    game: {
      PlayerHand: [],
      PlayerLands: [],
      PlayerCreatures: [],
      PlayerPermanents: [],
      OpponentHand: [],
      OpponentLands: [],
      OpponentCreatures: [],
      OpponentPermanents: [],
    },
  },
  mutations: {
    setGamestate(state, gamestate) {
      state.game.PlayerHand = gamestate.PlayerHand || []
      state.game.PlayerLands = gamestate.PlayerLands || []
      state.game.PlayerCreatures = gamestate.PlayerCreatures || []
      state.game.PlayerPermanents = gamestate.PlayerPermanents || []
      state.game.OpponentHand = gamestate.OpponentHand || []
      state.game.OpponentLands = gamestate.OpponentLands || []
      state.game.OpponentCreatures = gamestate.OpponentCreatures || []
      state.game.OpponentPermanents = gamestate.OpponentPermanents || []
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
    store.commit('setGamestate', JSON.parse(message))
  }, delay)
})

export default store
