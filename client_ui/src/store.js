import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let s = new Vuex.Store({
  state: {
    version: '------',
    status: {},
  },
  getters: {
    healthy(state) {
      for (let v of Object.values(state.status)) {
        if (v) return false
      }
      return true
    },
  },
  mutations: {
    status(state, data) {
      state.status = data
    },
    version(state, version) {
      state.version = version
    },
  },
  actions: {},
})

window.store = s // Needed for interaction with go

export default s
