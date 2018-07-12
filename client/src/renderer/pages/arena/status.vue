<template>
  <v-container fluid fill-height>
    <v-layout column justify-space-around>
      <v-flex xs1 :style="s.logexist">Arena log file exists</v-flex>
      <v-flex xs1 :style="s.logupdate">Arena log file has updated in last minute</v-flex>
      <v-flex xs1 :style="s.gameongoing">Game or Draft is occurring</v-flex>
      <v-flex xs1 :style="s.tokenvalid">Twitch auth token is set and valid</v-flex>
      <v-flex xs1 :style="s.pubsub">Twitch pubsub messages sending successfully</v-flex>
      <v-flex xs1 :style="s.deckmasterws">Connected to Deckmaster server</v-flex>
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
.container {
  font-size: 18px;
}
.layout {
  padding: 0 10vw;
}
</style>
