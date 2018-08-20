<template>
  <v-app :dark="$store.state.dark">
    <v-toolbar app dense>
      <v-icon class="home-icon" v-if="home">home</v-icon>
      <v-btn icon @click="$router.go(-1)" v-else>
        <v-icon>arrow_back</v-icon>
      </v-btn>

      <v-toolbar-title class="title">
        <img id="logo" src="@/assets/logo.png" />
        <span>Deckmaster</span>
      </v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid grid-list-md>
        <router-view></router-view>
      </v-container>
    </v-content>
    <v-footer app>
      <v-layout column>
        <v-flex xs12>Give feedback & ask questions at discord.gg/DXJS6jb</v-flex>
        <v-flex xs12>Support development at patreon.com/fugi</v-flex>
      </v-layout>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  computed: {
    home() {
      return this.$route.path === '/'
    },
  },
}
</script>

<style lang="stylus">
$body-font-family = 'Montserrat'

@import '~vuetify/src/stylus/main'

html
  overflow-y: auto
</style>

<style scoped>
#logo {
  display: inline-block;
  vertical-align: middle;
  height: 42px;
}

.title span {
  vertical-align: middle;
  font-weight: 200;
  font-size: 24px;
}

.home-icon {
  margin-right: 12px;
}

.v-footer {
  text-align: center;
  font-size: 10px;
}
</style>
