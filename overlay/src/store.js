import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    gamestate: {
      PlayerHand: [67015,65527,66619,67011,65491,65081,67011],
    },
  },
  mutations: {
    setGamestate(state, gamestate) {
      this.gamestate = gamestate
    }
  },
  actions: {

  }
})
