<template>
  <div id="app">
    <div id="deckmaster" @mouseover="showDeckmaster = true" @mouseout="showDeckmaster = false">
      <img id="logo" src="https://deckmaster.fugi.io/logo.png" />
      <template v-if="showDeckmaster">
        <div class="link" @click="globalHide = !globalHide">
          <template v-if="globalHide">Enable interactive elements</template>
          <template v-if="!globalHide">Disable interactive elements</template>
        </div>
        <div class="link" v-if="activeDeck" @click.prevent="clipboard(activeDeck)">
          Copy active deck to clipboard
        </div>
        <div class="small">Send feedback to @Fugiman or fugi@fugiman.com</div>
        <div class="small">Source code at github.com/fugiman/deckmaster</div>
      </template>
    </div>

    <template v-if="!globalHide">
      <div id="focusCard" v-if="focusCard">
        <LazyImage :src="cardSrc(focusCard)" />
        <LazyImage v-if="doubleSided[focusCard]" :src="cardSrc(focusCard, true)" />
      </div>
      <Zone v-for="(zone, idx) in zones" :key="'zone'+idx" v-model="focusCard" :d="zone" />
      <Trigger v-for="(trigger, idx) in triggers" :key="'trigger'+idx" :d="trigger" />
    </template>
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
      globalHide: false,
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
  },
  methods: {
    clipboard(text) {
      let textArea = document.createElement('textarea')

      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed'
      textArea.style.top = 0
      textArea.style.left = 0

      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em'
      textArea.style.height = '2em'

      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0

      // Clean up any borders.
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'

      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent'

      textArea.value = text

      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
      } catch (err) {}

      document.body.removeChild(textArea)
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

.card {
  border-radius: 5%;
}

#logo {
  height: 50px;
}

#deckmaster {
  z-index: 10;
  position: absolute;
  top: 100px;
  right: 0.5%;
  background: rgba(0, 0, 0, 80%);
  line-height: 0;
  color: white;
  font-size: 0.8em;
  opacity: 0;
  text-align: right;
  transition: opacity 0.3s;
}
#app:hover #deckmaster {
  opacity: 0.2;
}
#deckmaster:hover {
  opacity: 1 !important;
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
  font-weight: 300;
  font-size: 0.8em;
  line-height: 0.8em;
}

#focusCard {
  position: absolute;
  top: 5%;
  height: 70%;
  left: 1%;
  z-index: 100;
  pointer-events: none;
}
#focusCard img {
  height: 100%;
}
</style>
