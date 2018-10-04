import { readFileSync } from 'fs'
import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persistfile'
import WebSocket from 'ws'
import { configureScope } from '@sentry/electron'
import getters from './store/getters'
import mutations from './store/mutations'
import actions from './store/actions'
import { serverURL } from './vars'
import _ from 'lodash'

Vue.use(Vuex)

export { getters, mutations, actions }

export default function(path, ipc) {
  let persist = new VuexPersist({
    path,
  })
  let store = new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    plugins: [persist.subscribe()],
    state: {
      version: null,
      loggedIn: false,
      token: null,
      oauth: null,
      loginNonce: '',
      loginState: '',
      enabledFeatures: {
        followsAndSubs: false,
        extensionManagement: false,
      },
      windowOptions: {
        height: 500,
        width: 800,
        x: undefined,
        y: undefined,
        anchor: '',
      },
      status: {},
      draftEnabled: false,
      draftAutoDisable: false,
      draftVotes: {},
      draftResults: {},
      allVotes: 1,
      followVotes: 1,
      subVotes: 1,
      modVotes: 1,
      bitVoting: false,
      realVoteCost: 100,
      archiveExtensions: null,
      // for preview -- sent from deckmaster
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
      // for preview -- set by viewer app
      lang: 'en',
      focusCard: null,
      activeTrigger: null,
      draftSelect: null,
      forceOpen: true, // used for preview in broadcaster app but can't be changed by user
    },
    getters,
    mutations,
    actions,
  })

  store.commit('updateVersion')
  store.commit('statusUpdate', { extinstalled: undefined, extactive: undefined })
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
  if (store.state.token && !store.state.token.login) {
    store.dispatch('hydrateUserLogin')
  }
  configureScope(scope => {
    scope.setUser({
      id: store.state.token ? store.state.token.channelID : undefined,
      username: store.state.oauth ? store.state.oauth.username : undefined,
      token: store.state.token,
      oauth: store.state.oauth,
    })
  })

  let clients = []
  store.subscribe((mutation, state) => {
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

  let connectToServer = _.throttle(
    () => {
      let ws = new WebSocket(`ws${serverURL}`)
      let handleDisconnect = () => {
        store.commit('statusUpdate', { deckmasterws: false })
        connectToServer()
      }
      ws.on('error', handleDisconnect)
      ws.on('open', () => {
        ws.on('close', handleDisconnect)
        store.commit('statusUpdate', { deckmasterws: true })
        if (store.state.token) {
          ws.send(JSON.stringify({ token: store.state.token.jwt }))
        }
      })
      ws.on('message', message => {
        let d = JSON.parse(message)
        console.log(d)
        if ('state' in d) {
          store.commit('loginState', d['state'])
        }
        if ('loginData' in d) {
          store.commit('login', d['loginData'])
          store.dispatch('hydrateUserLogin')
        }
        if ('vote' in d) {
          store.dispatch('addDraftVote', d['vote'])
        }
      })
    },
    5000,
    { leading: true, trailing: true },
  )
  connectToServer()

  return store
}
