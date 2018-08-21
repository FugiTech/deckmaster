import Vue from 'vue'
import Vuex from 'vuex'
import { ipcRenderer } from 'electron'

Vue.use(Vuex)

let state = ipcRenderer.sendSync('vuex-connect')
import { getters, mutations, actions } from '../main/store'

let store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state,
  getters,
  mutations,
  actions,
})

let { commit } = store

store.commit = (...args) => {
  ipcRenderer.send('vuex-mutation', args)
}
store.dispatch = (...args) => {
  Vue.nextTick(() => {
    ipcRenderer.send('vuex-action', args)
  })
}
ipcRenderer.on('vuex-apply-mutation', (event, { type, payload }) => {
  commit(type, payload)
})
ipcRenderer.on('vuex-error', (event, error) => console.error(error))

export default store

export function Model(name) {
  return {
    get() {
      return name in store.getters ? store.getters[name] : store.state[name]
    },
    set(v) {
      store.commit(name, v)
    },
  }
}
