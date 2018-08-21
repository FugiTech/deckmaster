import { app } from 'electron'
import { URL } from 'url'
import nanoid from 'nanoid'
import _ from 'lodash'
import AllCards from '../cards'

const mutations = {
  updateVersion(state) {
    state.version = 'v' + app.getVersion()
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
  refresh(state, d) {
    state.oauth = Object.assign({}, state.oauth, {
      token: d.access_token,
      refresh: d.refresh_token,
      expires: d.expires_in * 1000 + +new Date(),
    })
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
  archiveExtensions(state, v) {
    state.archiveExtensions = v
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
  addDraftVote(state, { draftID, card, ip, flags }) {
    // Only works if you voted for the right pack
    if (!state.draftEnabled || draftID !== state.draftID) return
    // Clear previous vote by this user and add it to the right card
    for (let r of Object.values(state.draftVotes)) {
      delete r[ip]
    }
    if (!(card in state.draftVotes)) state.draftVotes[card] = {}
    state.draftVotes[card][ip] = flags
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

export default mutations
