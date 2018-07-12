import { readFileSync } from 'fs'
import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persistfile'
import moment from 'moment'
import { URL } from 'url'

Vue.use(Vuex)

export const getters = {
  voteCost(state) {
    return state.bitVoting ? state.realVoteCost : 0
  },
}

export const mutations = {
  setToken(state, token) {
    let d = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    state.token = {
      jwt: token,
      channelID: d['channel_id'],
      expires: d['exp'],
    }
    console.log(state.token)
  },
  windowOptions(state, [pos, url]) {
    state.windowOptions = Object.assign({}, state.windowOptions, pos, { anchor: new URL(url).hash })
  },
  statusUpdate(state, s) {
    state.status = Object.assign({}, state.status, s)
  },
  positioning(state, p) {
    state.overlayPositioning = Object.assign({}, p)
  },
  enableDrafting(state, v) {
    state.enableDrafting = v
  },

  draftEnabled(state, v) {
    state.draftEnabled = v
  },
  draftAutoDisable(state, v) {
    state.draftAutoDisable = v
  },
  allVotes(state, v) {
    state.allVotes = v
  },
  followVotes(state, v) {
    state.followVotes = v
  },
  subVotes(state, v) {
    state.subVotes = v
  },
  modVotes(state, v) {
    state.modVotes = v
  },
  bitVoting(state, v) {
    state.bitVoting = v
  },
  voteCost(state, v) {
    if (state.bitVoting) state.realVoteCost = v
  },
}

export const actions = {}

export default function(path, ipc) {
  let persist = new VuexPersist({
    path,
  })
  let store = new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    plugins: [persist.subscribe()],
    state: {
      version: `v${moment().format('YYYY.MM.DD')}`,
      token: null,
      windowOptions: {
        height: 500,
        width: 800,
        x: undefined,
        y: undefined,
        anchor: '',
      },
      status: {},
      overlayPositioning: {
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
      },
      draftEnabled: false,
      draftAutoDisable: false,
      allVotes: 1,
      followVotes: 1,
      subVotes: 1,
      modVotes: 1,
      bitVoting: false,
      realVoteCost: 100,
    },
    getters,
    mutations,
    actions,
  })

  if (store.state.token === null) {
    try {
      store.commit(
        'setToken',
        readFileSync(`${path}/token.txt`)
          .toString()
          .trim(),
      )
    } catch (e) {}
  }

  let clients = []
  store.subscribe((mutation, state) => {
    console.log(mutation)
    clients.forEach(client => {
      client.send('vuex-apply-mutation', mutation)
    })
  })
  ipc.on('vuex-connect', event => {
    let winId = event.sender.id

    event.sender.on('destroyed', () => {
      clients[winId] = null
      delete clients[winId]
    })

    clients[winId] = event.sender
    event.returnValue = store.state
  })
  ipc.on('vuex-mutation', (event, args) => {
    try {
      store.commit(...args)
    } catch (error) {
      event.sender.send('vuex-error', error)
    }
  })
  ipc.on('vuex-action', (event, args) => {
    try {
      store.dispatch(...args)
    } catch (error) {
      event.sender.send('vuex-error', error)
    }
  })

  setInterval(() => {
    let status = {
      appdata: true,
      logexist: true,
      logupdate: true,
      gameongoing: true,
      tokenvalid: true,
      pubsub: true,
      deckmasterws: true,
    }

    //store.commit('statusUpdate', status)
  }, 5000)

  return store
}
