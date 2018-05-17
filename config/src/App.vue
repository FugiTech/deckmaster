<template>
  <v-app>
    <v-content>
      <v-container>
        <v-layout justify-center>
          <v-flex md12 lg9 xl6>
            <v-stepper v-model="step">
              <v-stepper-header>
                <v-stepper-step :complete="step > 1" step="1">Download Client</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :complete="step > 2" step="2">Authorize Client</v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :complete="step > 3" step="3">Launch Arena <small>Optional</small></v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step step="4">All Set</v-stepper-step>
              </v-stepper-header>
              <v-stepper-items class="text-xs-right">
                <v-stepper-content step="1">
                  <v-card flat class="text-xs-center mb-2">
                    To begin, please first download the Deckmaster client.
                    This is required to detect the state of your Arena games.
                    The Deckmaster client does not interact with Arena directly in any way.
                    It only reads a log file that Arena produces, so it is safe to use.
                    <br><br>
                    <v-btn large color="primary" href="https://deckmaster.fugi.io/deckmaster-windows-4.0-amd64.exe" target="_blank">Download Windows client</v-btn>
                    <br><br>
                    When the download is complete please start the client and proceed to the next step.
                  </v-card>
                  <v-btn color="primary" @click.native="step = 2">it's running</v-btn>
                </v-stepper-content>
                <v-stepper-content step="2">
                  <v-card flat class="text-xs-center">
                    The client requires an authorization token from Twitch to publish the game state to your viewers.
                    Normally this token would be passed to the client from the extension panel on your dashboard, but for now we'll pass it from this page.
                    This should progress automatically, and if everything goes well you can proceed when the button unlocks.
                    If anything goes wrong make sure the client is running and press retry.
                    If it continues to fail please contact me at either <a href="https://twitter.com/fugiman">twitter.com/fugiman</a> or fugi@fugiman.com

                    <v-stepper alt-labels v-model="authStep" class="mx-5 my-3">
                      <v-stepper-header>
                        <v-stepper-step :complete="authStep > 1" step="1">Fetch Twitch token</v-stepper-step>
                        <v-divider></v-divider>
                        <v-stepper-step :rules="[() => !authError]" :complete="authStep > 2" step="2">Pass token to Client</v-stepper-step>
                      </v-stepper-header>
                    </v-stepper>
                  </v-card>
                  <v-btn dark color="red" @click.native="sendAuth" v-show="authError">Retry</v-btn>
                  <v-btn color="primary" @click.native="step = 3" :disabled="authStep < 3">Continue</v-btn>
                </v-stepper-content>
                <v-stepper-content step="3">
                  <v-card flat class="text-xs-center mb-2">
                    To ensure the client is working completely, please launch Arena and start a game.
                    If everything is working as expected the "Continue" button should unlock.
                    Otherwise check the Deckmaster client to see if it's reporting any issues, and try restarting it.
                    If the client displays an error that the token is out of date you can use the "Resend Auth Token" button to refresh it.
                  </v-card>
                  <v-btn @click.native="sendAuth">Resend Auth Token</v-btn>
                  <v-btn color="primary" @click.native="step = 4" :disabled="!arenaWorks">Continue</v-btn>
                  <v-btn dark color="red" @click.native="step = 4">Skip</v-btn>
                </v-stepper-content>
                <v-stepper-content step="4">
                  <v-card flat class="text-xs-center mb-2">
                    That's it, everything should work!
                    <br><br>
                    Remember to keep the dashboard panel open and set to Deckmaster while streaming to ensure the client continues to work.
                  </v-card>
                </v-stepper-content>
              </v-stepper-items>
            </v-stepper>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
let token
let tokenPromise = new Promise(resolve => {
  window.Twitch.ext.onAuthorized(auth => {
    token = auth.token
    resolve()
  })
})
let pubsubPromise = new Promise(resolve => {
  window.Twitch.ext.listen('broadcast', (target, contentType, message) => {
    if (JSON.parse(message).PlayerHand) resolve()
  })
})

export default {
  data() {
    return {
      step: 1,
      authStep: 1,
      authError: false,
      arenaWorks: false,
    }
  },
  mounted() {
    tokenPromise.then(() => {
      this.authStep = 2
      this.sendAuth()
    })
    pubsubPromise.then(() => {
      this.arenaWorks = true
    })
  },
  methods: {
    sendAuth() {
      this.authError = false
      let i = new Image()
      i.onerror = () => {
        this.authError = true
      }
      i.onload = () => {
        this.authStep = 3
      }
      i.src = `http://localhost:22223/auth?token=${token}`
    },
  },
}
</script>
