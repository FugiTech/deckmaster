import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let store = new Vuex.Store({
  state: {
    dark: false,
  },
  mutations: {
    setTheme(state, theme) {
      state.dark = theme === 'dark'
    },
  },
})

window.Twitch.ext.onContext((context, diffProps) => {
  store.commit('setTheme', context.theme)
})

export default store
