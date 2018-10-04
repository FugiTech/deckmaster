import fetch from 'node-fetch'
import { serverURL, client_id } from '../vars'

let refreshPromise = null

function startRefresh(state, commit) {
  refreshPromise =
    refreshPromise ||
    new Promise(async ret => {
      let r = await fetch(`http${serverURL}/refresh?token=${state.oauth.refresh}`)
      if (!r.ok) {
        commit('logout')
        refreshPromise = null
        ret(false)
        return
      }
      let d = await r.json()
      commit('refresh', d)
      refreshPromise = null
      ret(d.access_token)
    })
}

async function api({ state, commit }, endpoint, options) {
  let authPrefix = options.headers.Authorization.split(' ')[0]
  if (state.oauth.expires < +new Date() / 1000 - 600) {
    // if it expires within 10min
    startRefresh(state, commit)
  }
  if (refreshPromise) {
    let token = await refreshPromise
    if (!token) return {}
    options.headers.Authorization = `${authPrefix} ${token}`
  }
  let r = await fetch(endpoint, options)
  if (r.status === 401) {
    // refresh
    startRefresh(state, commit)
    let token = await refreshPromise
    if (!token) return {}
    options.headers.Authorization = `${authPrefix} ${token}`
    r = await fetch(endpoint, options)
  }
  if (!r.ok) {
    return {}
  }
  let d = await r.json()
  return d
}

function kraken(ctx, endpoint, options) {
  options = options || {}
  options.headers = options.headers || {}
  options.headers.Authorization = `OAuth ${ctx.state.oauth.token}`
  options.headers.Accept = 'application/vnd.twitchtv.v5+json'
  return api(ctx, `https://api.twitch.tv/kraken/${endpoint}`, options)
}

function helix(ctx, endpoint, options) {
  options = options || {}
  options.headers = options.headers || {}
  options.headers.Authorization = `Bearer ${ctx.state.oauth.token}`
  return api(ctx, `https://api.twitch.tv/helix/${endpoint}`, options)
}

export default {
  vote({ state, commit, dispatch }, { draftID, card, zoneID }) {
    // Used for voting via the preview menu, NOT for receiving votes from server
    if (!state.loggedIn) return
    commit('setDraftSelect', zoneID)
    dispatch('addDraftVote', {
      draftID: draftID,
      card: card,
      ip: 'self',
    })
  },
  async addDraftVote({ state, commit }, { draftID, card, user, ip }) {
    let flags = {}
    if (state.enabledFeatures.followsAndSubs && !!user) {
      let ctx = { state, commit }
      if (state.followVotes !== state.allVotes) {
        let d = await kraken(ctx, `users/${user}/follows/channels/${state.token.channelID}`)
        flags.follow = !!d.created_at
      }
      if (state.subVotes !== state.allVotes) {
        let d = await kraken(ctx, `channels/${state.token.channelID}/subscriptions/${user}`)
        flags.sub = !!d.created_at
      }
    }
    commit('addDraftVote', { draftID, card, ip, flags })
  },
  async enableExtension({ state, commit }) {
    if (!state.enabledFeatures.extensionManagement) return
    if (state.status.extactive === true) return
    let ctx = { state, commit }
    let d = await helix(ctx, 'users/extensions')
    if (!d.data) {
      commit('statusUpdate', { extactive: false })
      return
    }
    commit('archiveExtensions', {
      overlay: d.data.overlay['1'].id === client_id ? { 1: { active: false } } : d.data.overlay,
      component: d.data.component,
    })
    d = await helix(ctx, 'users/extensions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          overlay: { 1: { active: true, id: client_id } },
          // component: { 1: { active: false }, 2: { active: false } },
        },
      }),
    })
    let active = !!d.data && !!d.data.overlay['1'].active && d.data.overlay['1'].id === client_id
    commit('statusUpdate', { extinstalled: active, extactive: active })
  },
  async disableExtension({ state, commit }) {
    if (!state.enabledFeatures.extensionManagement) return
    if (state.status.extactive === false) return
    let ctx = { state, commit }
    let d = await helix(ctx, 'users/extensions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: state.archiveExtensions,
      }),
    })
    let active = !!d.data && !!d.data.overlay['1'].active && d.data.overlay['1'].id === client_id
    commit('statusUpdate', { extactive: active })
  },
  async hydrateUserLogin(ctx) {
    if (!ctx.state.token) return
    let d = await kraken(ctx, `users/${ctx.state.token.channelID}`)
    ctx.commit('hydrateUserLogin', d.name)
  },
}
