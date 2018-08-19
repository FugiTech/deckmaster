import { client_id, serverURL } from '../vars'

export default {
  voteCost(state) {
    return state.bitVoting ? state.realVoteCost : 0
  },
  loginURL: _state => requestPermissions => {
    let redirect_uri = `http${serverURL}/login`
    let scope = ['openid', 'channel_check_subscription', 'user:read:broadcast', 'user:edit:broadcast'].join(' ')
    let nonce = _state.loginNonce
    let state = _state.loginState

    if (!requestPermissions) scope = 'openid'

    return `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&nonce=${nonce}&state=${state}`
  },
}
