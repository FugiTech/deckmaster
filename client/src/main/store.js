import { readFileSync } from 'fs'
import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persistfile'
import { URL } from 'url'
import WebSocket from 'ws'
import nanoid from 'nanoid'
import _ from 'lodash'
import VERSION from './version'
import AllCards from './cards'

Vue.use(Vuex)

const serverURL = '://localhost:8080' // 's://deckmaster-api.fugi.io'

export const getters = {
  voteCost(state) {
    return state.bitVoting ? state.realVoteCost : 0
  },
  loginURL: _state => requestPermissions => {
    let client_id = 'cplheah4pxjyuwe9mkno9kbmb11lyc'
    let redirect_uri = `http${serverURL}/login`
    let scope = ['openid', 'channel_check_subscription', 'user:read:broadcast', 'user:edit:broadcast'].join(' ')
    let nonce = _state.loginNonce
    let state = _state.loginState

    if (!requestPermissions) scope = 'openid'

    return `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&nonce=${nonce}&state=${state}`
  },
}

export const mutations = {
  updateVersion(state) {
    state.version = VERSION
  },
  setToken(state, token) {
    let d = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    state.token = { jwt: token, channelID: d['channel_id'], expires: d['exp'] }
  },
  fakeLogin(state) {
    if (state.loggedIn || !state.token) return
    state.loggedIn = true
    state.enabledFeatures = {}
  },
  login(state, loginData) {
    if (loginData.nonce !== state.loginNonce) return

    state.loggedIn = true
    if (_.includes(loginData.scope, 'channel_check_subscription')) {
      state.enabledFeatures.followsAndSubs = true
    }
    if (_.includes(loginData.scope, 'user:read:broadcast') && _.includes(loginData.scope, 'user:edit:broadcast')) {
      state.enabledFeatures.extensionManagement = true
    }
    mutations.setToken(state, loginData.token)
    state.oauth = {
      username: loginData.username,
      token: loginData.access_token,
      refresh: loginData.refresh_token,
      expires: loginData.expires_in * 1000 + +new Date(),
    }
  },
  loginState(state, loginState) {
    state.loginState = loginState
    state.loginNonce = nanoid()
  },
  logout(state) {
    state.loggedIn = false
    state.enabledFeatures = {}
    state.token = null
    state.oauth = null
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
    if (!state.enabledFeatures.followsAndSubs) {
      state.followVotes = v
      state.subVotes = v
    }
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
  gameState(state, { zones, triggers, doubleSided, draftID }) {
    state.zones = zones || []
    state.triggers = triggers || []
    state.doubleSided = doubleSided || {}
    state.draftID = draftID || false
    state.draftVotes = {}
    state.draftResults = []
    if (!draftID && state.draftAutoDisable) state.draftEnabled = false
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
  addDraftVote(state, { draftID, card, user, flags }) {
    // Only works if you voted for the right pack
    if (draftID !== state.draftID) return
    // Clear previous vote by this user and add it to the right card
    for (let r of Object.values(state.draftVotes)) {
      delete r[user]
    }
    if (!(card in state.draftVotes)) state.draftVotes[card] = {}
    state.draftVotes[card][user] = flags
    // Recalculate all the results
    let results = []
    for (let [card, votes] of Object.entries(state.draftVotes)) {
      let score = 0
      for (let flags of Object.values(votes)) {
        if (flags.sub) {
          score += state.subVotes
        } else if (flags.follow) {
          score += state.followVotes
        } else {
          score += state.allVotes
        }
      }
      results.push({ id: +card, name: AllCards.get(+card).name, score })
    }
    results = _.sortBy(results, [o => -o.score])
    state.draftResults = results.slice(0, 5)
    // Update the zones
    let total = _.sumBy(results, 'score')
    state.zones.forEach(z => {
      if (z.Cards.length !== 1) return
      let r = _.find(results, { id: +z.Cards[0] })
      if (r) {
        z.Score = `${((100 * r.score) / total).toFixed(1)}%`
      }
    })
  },
}

export const actions = {
  vote({ state, commit, dispatch }, { draftID, card, zoneID }) {
    // Used for voting via the preview menu, NOT for receiving votes from server
    if (!state.loggedIn) return
    commit('setDraftSelect', zoneID)
    dispatch('addDraftVote', {
      draftID: draftID,
      card: card,
      user: state.token.channelID,
    })
  },
  async addDraftVote({ state, commit }, { draftID, card, user }) {
    let flags = {}
    if (state.enabledFeatures.followsAndSubs && user !== state.token.channelID) {
      let headers = {
        Accept: 'application/vnd.twitchtv.v5+json',
        Authorization: `OAuth ${state.oauth.token}`,
      }
      if (state.followVotes !== state.allVotes) {
        let r = await fetch(`https://api.twitch.tv/kraken/users/${user}/follows/channels/${state.token.channelID}`, { headers })
        let j = await r.json()
        flags.follow = !!j.created_at
      }
      if (state.subVotes !== state.allVotes) {
        let r = await fetch(`https://api.twitch.tv/kraken/channels/${state.token.channelID}/subscriptions/${user}`, { headers })
        let j = await r.json()
        flags.sub = !!j.created_at
      }
    }
    commit('addDraftVote', { draftID, card, user, flags })
  },
}

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
      overlayPositioning: {
        left: '0%',
        top: '0%',
        width: '100%',
        height: '100%',
      },
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
      // for preview -- sent from deckmaster
      zones: [],
      triggers: [],
      activeDeck: '',
      doubleSided: {},
      draftID: false, // If set a draft is going on, distinguishes between packs
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

  let connectToServer = () => {
    let ws = new WebSocket(`ws${serverURL}`)
    let handleDisconnect = () => {
      store.commit('statusUpdate', { deckmasterws: false })
      setTimeout(connectToServer, 5000)
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
      }
    })
  }
  connectToServer()

  return store
}
