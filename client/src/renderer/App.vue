<template>
  <v-app dark>
    <v-system-bar status color="grey darken-4">
      <v-spacer class="drag"></v-spacer>
      <v-btn flat @click.native="w.minimize()">
        <v-icon>remove</v-icon>
      </v-btn>
      <v-btn flat @click.native="w.isMaximized() ? w.unmaximize() : w.maximize()">
        <v-icon>check_box_outline_blank</v-icon>
      </v-btn>
      <v-btn flat color="red" @click.native="w.close()">
        <v-icon>close</v-icon>
      </v-btn>
    </v-system-bar>
    <v-toolbar prominent>
      <v-toolbar-title>
        <span class="logo">
          <img src="https://deckmaster.fugi.io/logo.png" />
        </span>
        <span class="title-holder">
          <div class="title">Deckmaster</div>
          <div class="version">v1.000</div>
        </span>
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn flat to="status">Status</v-btn>
        <v-btn flat to="status">Something</v-btn>
        <v-btn flat to="status">Contact</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  computed: {
    w() {
      return this.$electron.remote.getCurrentWindow()
    },
  },
}
</script>

<style lang="stylus">
$body-font-family = 'Montserrat'

@import '~vuetify/src/stylus/main'

html {
  overflow-y: hidden;
}
</style>

<style>
.system-bar {
  padding: 0 !important;
  box-shadow: none !important;
  z-index: 4;

  -webkit-user-select: none;
}
.system-bar .drag {
  height: 100%;

  -webkit-app-region: drag;
}
.system-bar .btn {
  height: 24px;
  width: 36px;
  min-width: 24px;
  margin: 0;
  border-radius: 0;

  -webkit-app-region: no-drag;
}
.system-bar .btn .btn__content {
  padding: 4px;
}
.system-bar .btn.red--text .btn__content:before {
  opacity: 1;
}
.system-bar .btn .icon {
  margin: 0;
  z-index: 5;
}
</style>

<style scoped>
.logo {
  display: inline-block;
  vertical-align: middle;
  height: 64px;
  width: 86px;
}
.logo img {
  position: relative;
  top: -12px;
  height: 86px;
}
.title-holder {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  vertical-align: middle;
  height: 64px;
}
.title {
  font-size: 40px !important;
  font-weight: 200;
}
.version {
  font-size: 10px;
  font-weight: 200;
  text-align: right;
}
</style>
