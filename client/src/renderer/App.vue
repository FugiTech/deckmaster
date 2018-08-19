<template>
  <v-app dark>
    <v-system-bar app status color="grey darken-4">
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

    <v-toolbar app prominent clipped-left>
      <v-toolbar-title>
        <span class="logo">
          <img src="@/assets/logo.png" />
        </span>
        <span class="title-holder hidden-xs-only">
          <div class="title">Deckmaster</div>
          <div class="subtitle">
            <v-speed-dial class="logout" open-on-hover direction="bottom" transition="slide-y-transition" v-if="$store.state.loggedIn">
              <v-btn slot="activator" flat>{{ $store.state.oauth ? $store.state.oauth.username : '------' }}</v-btn>
              <v-list dense>
                <v-list-tile @click="$store.commit('logout')">
                  <v-list-tile-content> Logout </v-list-tile-content>
                </v-list-tile>
              </v-list>
            </v-speed-dial>
            <v-spacer />
            <v-speed-dial class="language" direction="bottom" transition="slide-y-transition" v-if="false">
              <v-btn slot="activator" flat>{{ languages[language] }}</v-btn>
              <v-list dense>
                <v-list-tile v-for="(name, code) in languages" :key="code" @click="language = code">
                  <v-list-tile-content>
                    {{ name.toUpperCase() }}
                  </v-list-tile-content>
                </v-list-tile>
              </v-list>
            </v-speed-dial>
            <v-spacer />
            <div class="version">{{ $store.state.version }}</div>
          </div>
        </span>
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn flat to="/arena/">MTG Arena</v-btn>
        <v-btn flat to="/deckmaster/">Deckmaster</v-btn>
      </v-toolbar-items>
    </v-toolbar>

    <v-bottom-nav app :value="true" height="36">
      <v-btn v-for="r in currentRoutes" :key="r.name" :to="{name: r.name}">
        <span>{{ r.name.toUpperCase() }}</span>
        <v-icon>{{ r.icon }}</v-icon>
      </v-btn>
    </v-bottom-nav>

    <v-content>
      <v-fade-transition>
        <router-view />
      </v-fade-transition>
    </v-content>
  </v-app>
</template>

<script>
export default {
  data: function() {
    return {
      language: 'en',
      languages: {
        en: 'english',
        ja: 'japanese',
        zht: 'chinese',
      },
    }
  },
  computed: {
    w() {
      return this.$electron.remote.getCurrentWindow()
    },
    currentRoutes() {
      return Object.values(this.$router.options.routes)
        .filter(r => {
          return (r.children || []).some(c => {
            return c.name == this.$route.name
          })
        })[0]
        .children.filter(c => {
          return c.path !== '*'
        })
    },
  },
}
</script>

<style lang="stylus">
$body-font-family = 'Montserrat'

@import '~vuetify/src/stylus/main'

html
  overflow-y: hidden
</style>

<style>
.v-system-bar {
  padding: 0 !important;
  z-index: 4;
}
.v-system-bar .drag {
  height: 100%;

  -webkit-app-region: drag;
}
.v-system-bar .v-btn {
  height: 24px;
  width: 36px;
  min-width: 24px;
  margin: 0;
  border-radius: 0;

  -webkit-app-region: no-drag;
}
.v-system-bar .v-btn .v-btn__content {
  padding: 4px;
}
.v-system-bar .v-btn.red--text:before {
  opacity: 1;
}
.v-system-bar .v-btn .v-icon {
  margin: 0;
  z-index: 5;
}

.subtitle .v-list__tile {
  height: 20px !important;
  font-size: 10px;
  font-weight: 200;
  line-height: 20px;
}

::-webkit-scrollbar {
  width: 1em;
}

::-webkit-scrollbar-track {
  background-color: #212121;
}

::-webkit-scrollbar-thumb {
  background-color: #9e9e9e;
}

[style*='--aspect-ratio'] > :first-child {
  width: 100%;
}
[style*='--aspect-ratio'] > img {
  height: auto;
}
@supports (--custom: property) {
  [style*='--aspect-ratio'] {
    position: relative;
  }
  [style*='--aspect-ratio']::before {
    content: '';
    display: block;
    padding-bottom: calc(100% / (var(--aspect-ratio)));
  }
  [style*='--aspect-ratio'] > :first-child {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
  }
}
</style>

<style scoped>
#app {
  user-select: none;
}

.v-toolbar__title {
  overflow: visible;
}
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
.subtitle,
.subtitle .v-btn {
  display: flex;
  font-size: 10px !important;
  font-weight: 200 !important;
}
.subtitle .v-btn {
  margin: 0;
  height: 15px;
  min-width: 0;
}
.content {
  max-height: 100vh;
}
</style>
