let token

window.Twitch.ext.onAuthorized(auth => {
  token = auth.token
  sendToken(token)
})

document.getElementById('resend').addEventListener('click', () => {
  sendToken(token)
})

function sendToken(token) {
  let i = new Image()
  document.body.style.background = '#999'
  document.getElementById('loading').style.display = ''
  document.getElementById('resend').style.display = ''
  i.onerror = () => {
    document.body.style.background = '#F99'
    document.getElementById('loading').style.display = 'none'
    document.getElementById('resend').style.display = 'inline-block'
  }
  i.onload = () => {
    document.body.style.background = '#9F9'
    document.getElementById('loading').style.display = 'none'
  }
  i.src = `http://localhost:22223/auth?token=${token}`
}
