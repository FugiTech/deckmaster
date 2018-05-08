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

import 'promise-polyfill/src/polyfill'
import 'whatwg-fetch'
let update = async function() {
  let r = await fetch('http://localhost:22223/data')
  let d = await r.json()
  for (let [k, v] of Object.entries(d)) s.commit(k, v)
}
update()
setInterval(update, 5000)

export default s
