<template>
  <div id="app">
    <div id="inner-app" :style="innerAppStyle">
      <div id="deckmaster" @mouseover="showDeckmaster = true" @mouseout="showDeckmaster = false" :style="dmStyle">
        <h1 v-if="showDeckmaster">Deckmaster</h1>
        <img id="logo" src="https://deckmaster.fugi.io/logo.png" />
        <template v-if="showDeckmaster">
          <div class="link" @click="$store.commit('toggleGlobalHide')">
            <template v-if="$store.state.globalHide">Enable extension (persists through reloads)</template>
            <template v-if="!$store.state.globalHide">Disable extension (persists through reloads)</template>
          </div>
          <div class="small">Give feedback & ask questions at discord.gg/DXJS6jb</div>
          <div class="small">Support development at patreon.com/fugi</div>
        </template>
      </div>

      <template v-if="!$store.state.globalHide">
        <div id="focusCard" v-if="focusCard">
          <template v-for="(card, idx) in focusCard">
            <LazyImage :card="card" :key="idx" />
            <LazyImage v-if="doubleSided[card]" :card="card" :back="true" :key="idx+'-back'" />
          </template>
        </div>
        <Zone v-for="(zone, idx) in zones" :key="'zone'+idx" v-model="focusCard" v-bind="zone" />
        <Trigger v-for="(trigger, idx) in triggers" :key="'trigger'+idx" :d="trigger" />
      </template>
    </div>
  </div>
</template>

<script>
import LazyImage from './components/lazy_image'
import Zone from './components/zone'
import Trigger from './components/trigger'

export default {
  name: 'app',
  components: {
    LazyImage,
    Zone,
    Trigger,
  },
  data: function() {
    return {
      showDeckmaster: false,
    }
  },
  computed: {
    focusCard: {
      get() {
        return this.$store.state.focusCard
      },
      set(v) {
        this.$store.commit('setFocusCard', v)
      },
    },
    activeTrigger: {
      get() {
        return this.$store.state.activeTrigger
      },
      set(v) {
        this.$store.commit('setActiveTrigger', v)
      },
    },
    zones() {
      return this.$store.state.zones
    },
    triggers() {
      return this.$store.state.triggers
    },
    activeDeck() {
      return this.$store.state.activeDeck
    },
    doubleSided() {
      return this.$store.state.doubleSided
    },
    dmStyle() {
      return this.$store.state.forceOpen ? { opacity: '1 !important' } : {}
    },
    innerAppStyle() {
      return this.$store.state.overlayPositioning
    },
  },
}
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  position: relative;
  font-family: Montserrat, Verdana, Helvetica, Arial, sans-serif;
}
#inner-app {
  position: absolute;
}

.card {
  border-radius: 5%;
}
</style>

<style scoped>
#logo {
  height: 50px;
}

#deckmaster {
  z-index: 10;
  position: absolute;
  top: 100px;
  right: 0.5%;
  line-height: 0;
  color: white;
  font-size: 0.8em;
  opacity: 0;
  text-align: right;
  transition: opacity 0.3s;
}
#app:hover #deckmaster {
  opacity: 1;
}
#deckmaster:hover {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.8);
}
#deckmaster h1 {
  display: inline-block;
  margin: 0 10px;
  vertical-align: top;
  line-height: 50px;
  font-size: 32px;
  font-weight: 200;
}
#deckmaster div {
  line-height: normal;
  padding: 0.5em;
}
#deckmaster div.link {
  cursor: pointer;
}
#deckmaster div.link:hover {
  text-decoration: underline;
}
#deckmaster div.small {
  font-weight: 200;
  font-size: 0.8em;
  line-height: 0.8em;
}

#focusCard {
  position: absolute;
  top: 100px;
  height: calc(80% - 100px);
  left: 1%;
  z-index: 100;
  pointer-events: none;
}
#focusCard img {
  height: 100%;
}
</style>
