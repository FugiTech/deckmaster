<template>
  <div id="app">
    <div id="deckmaster" @mouseover="showDeckmaster = true" @mouseout="showDeckmaster = false">
      <img src="./assets/deckmaster.jpg" />
      <template v-if="showDeckmaster">
        <div class="link" @click="globalHide = !globalHide">
          <template v-if="globalHide">Enable interactive elements</template>
          <template v-if="!globalHide">Disable interactive elements</template>
        </div>
        <div>Send feedback to @Fugiman or fugi@fugiman.com</div>
        <div>Source code at github.com/fugiman/deckmaster</div>
      </template>
    </div>

    <template v-if="!globalHide">
      <div id="bigCard" v-show="!!bigCard">
        <LazyImage :src="cardSrc(bigCard)" />
        <LazyImage :src="cardSrc(bigCard, true)" />
      </div>
      <Zone id="PlayerHand" :cards="$store.state.game.PlayerHand" v-model="bigCard" />
      <Zone id="PlayerLands" :cards="$store.state.game.PlayerLands" v-model="bigCard" />
      <Zone id="PlayerCreatures" :cards="$store.state.game.PlayerCreatures" v-model="bigCard" />
      <Zone id="PlayerPermanents" :cards="$store.state.game.PlayerPermanents" v-model="bigCard" />
      <Zone id="OpponentHand" :cards="$store.state.game.OpponentHand" v-model="bigCard" />
      <Zone id="OpponentLands" :cards="$store.state.game.OpponentLands" v-model="bigCard" />
      <Zone id="OpponentCreatures" :cards="$store.state.game.OpponentCreatures" v-model="bigCard" />
      <Zone id="OpponentPermanents" :cards="$store.state.game.OpponentPermanents" v-model="bigCard" />
    </template>
  </div>
</template>

<script>
import LazyImage from './components/lazy_image'
import Zone from './components/zone'

export default {
  name: 'app',
  components: {
    LazyImage,
    Zone,
  },
  data: function() {
    return {
      bigCard: null,
      showDeckmaster: false,
      globalHide: false,
    }
  },
}
</script>

<style>
@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Light.eot');
    src: local('Montserrat Light'), local('Montserrat-Light'),
        url('./assets/Montserrat-Light.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Light.woff2') format('woff2'),
        url('./assets/Montserrat-Light.woff') format('woff'),
        url('./assets/Montserrat-Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Regular.eot');
    src: local('Montserrat Regular'), local('Montserrat-Regular'),
        url('./assets/Montserrat-Regular.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Regular.woff2') format('woff2'),
        url('./assets/Montserrat-Regular.woff') format('woff'),
        url('./assets/Montserrat-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Bold.eot');
    src: local('Montserrat Bold'), local('Montserrat-Bold'),
        url('./assets/Montserrat-Bold.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Bold.woff2') format('woff2'),
        url('./assets/Montserrat-Bold.woff') format('woff'),
        url('./assets/Montserrat-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Medium.eot');
    src: local('Montserrat Medium'), local('Montserrat-Medium'),
        url('./assets/Montserrat-Medium.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Medium.woff2') format('woff2'),
        url('./assets/Montserrat-Medium.woff') format('woff'),
        url('./assets/Montserrat-Medium.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
}

* {
  box-sizing: border-box;
}

html, body, #app {
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

#deckmaster {
  position: absolute;
  top: 100px;
  right: 0.5%;
  background: rgba(0,0,0,80%);
  line-height: 0;
  color: white;
  font-size: 0.8em;
  opacity: 0.2;
  text-align: right;
}
#deckmaster:hover {
  opacity: 1.0;
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

#bigCard {
  position: absolute;
  top: 5%;
  height: 70%;
  left: 1%;
  z-index: 100;
  pointer-events: none;
}
#bigCard img {
  height: 100%;
}

#PlayerHand { bottom: 0%; left: 30%; right: 30%; height: 14%; }
#PlayerLands { bottom: 20%; left: 10%; right: 54%; height: 15%; }
#PlayerPermanents { bottom: 20%; left: 54%; right: 10%; height: 15%; }
#PlayerCreatures { bottom: 35%; left: 10%; right: 10%; height: 18%; }
#OpponentHand { top: 0%; left: 30%; right: 30%; height: 10%; }
#OpponentLands { top: 14%; left: 10%; right: 53%; height: 10%; }
#OpponentPermanents { top: 14%; left: 53%; right: 10%; height: 10%; }
#OpponentCreatures { top: 25%; left: 10%; right: 10%; height: 18%; }
</style>
