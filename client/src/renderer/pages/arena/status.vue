<template>
  <v-container fluid fill-height>
    <v-layout column justify-space-around v-if="$store.state.loggedIn" class="status">
      <v-flex xs1 :style="s.logexist">Arena log file exists</v-flex>
      <v-flex xs1 :style="s.logupdate">Arena log file has updated in last 10 minutes</v-flex>
      <v-flex xs1 :style="s.gameongoing">Game or Draft is occurring</v-flex>
      <v-flex xs1 :style="s.extinstalled">
        <v-layout row align-center>
          <div :class="{'grey--text': !$store.state.enabledFeatures.extensionManagement}">Deckmaster extension installed</div>
          <template v-if="!$store.state.enabledFeatures.extensionManagement">
            <v-spacer />
            <v-btn small color="" @click="open($store.getters.loginURL(true))">LOGIN</v-btn>
            <div class="body-1">to unlock this feature</div>
          </template>
          <template v-if="$store.state.enabledFeatures.extensionManagement && $store.state.status.extinstalled === false">
            <v-btn small color="" @click="open('https://www.twitch.tv/ext/cplheah4pxjyuwe9mkno9kbmb11lyc')">INSTALL</v-btn>
          </template>
        </v-layout>
      </v-flex>
      <v-flex xs1 :style="s.extactive">
        <v-layout row align-center>
          <div :class="{'grey--text': !$store.state.enabledFeatures.extensionManagement}">Deckmaster extension active</div>
          <template v-if="!$store.state.enabledFeatures.extensionManagement">
            <v-spacer />
            <v-btn small color="" @click="open($store.getters.loginURL(true))">LOGIN</v-btn>
            <div class="body-1">to unlock this feature</div>
          </template>
        </v-layout>
      </v-flex>
      <v-flex xs1 :style="s.pubsub">Twitch pubsub messages sending successfully</v-flex>
      <v-flex xs1 :style="s.deckmasterws">Connected to Deckmaster server</v-flex>
    </v-layout>
    <v-layout column justify-center align-center v-else class="login">
      <v-btn large color="primary" @click="open($store.getters.loginURL(true))">LOGIN</v-btn>
      <p>
        For Deckmaster to operate we require you login to verify your identity. <br>
        We also request some additional access to your Twitch account for these features: <br>
        - Your follower and subscriber lists are used when tallying votes for drafting <br>
        - Adjusting your extensions allows us to enable &amp; disable Deckmaster automatically <br>
        If you prefer not to grant this access, <a href="#" @click="open($store.getters.loginURL())">use this login link</a> and we'll disable those features
      </p>
      <p v-if="$store.state.token">
        We've detected existing authorization from an old version of Deckmaster. If you'd like to continue without the features described above, <a href="#" @click="$store.commit('fakeLogin')">click here</a>.
      </p>
    </v-layout>
  </v-container>
</template>

<script>
import colors from 'vuetify/es5/util/colors'

export default {
  computed: {
    s() {
      let r = {}
      for (let [k, v] of Object.entries(this.$store.state.status)) {
        if (v !== true && v !== false) continue
        r[k] = {
          color: v ? colors.green.base : colors.red.base,
          'font-weight': v ? 300 : 700,
        }
      }
      return r
    },
  },
}
</script>

<style scoped>
.layout.column {
  padding: 0 10vw;
}
.status {
  font-size: 18px;
}
.login p {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 300;
  line-height: 1.7em;
}
.login a {
  color: white;
}
</style>
user_subscriptions
user:read:broadcast
user:edit:broadcast
