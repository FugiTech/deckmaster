<template>
  <div id="app">
    <div id="bigCard" v-show="!!bigCard">
      <LazyImage :src="`/cards/${folder(bigCard)}/${bigCard}.png`" />
      <LazyImage :src="`/cards/${folder(bigCard)}/${bigCard}_back.png`" />
    </div>
    <div id="playerHandHitbox" :style="{opacity: showPlayerHand ? 100 : 0 }" @mouseover="showPlayerHand = true" @mouseout="showPlayerHand = false">
      <img @mouseover="bigCard = card" @mouseout="bigCard = null" v-for="(card, idx) in playerHand" :src="`/cards/${folder(card)}/${card}.png`" :key="idx" :style="{width: (100/playerHand.length)-1 + '%'}" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import LazyImage from './components/lazy_image'

export default {
  name: 'app',
  components: {
    LazyImage,
  },
  data: function() {
    return {
      bigCard: null,
      showPlayerHand: false,
    }
  },
  computed: mapState({
    playerHand: state => state.gamestate.PlayerHand,
  }),
  methods: {
    folder(card) {
      return ('' + card % 20).padStart(2, '0')
    }
  }
}
</script>

<style scoped>
#app {
  position: relative;
  background: url('/hand.png');
  height: 720px;
  width: 1280px;

  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#playerHandHitbox {
  position: absolute;
  bottom: 0;
  left: 240px;
  right: 240px;
  height: 100px;
  background: rgba(0,0,0,50%);
  overflow: hidden;
}

#playerHandHitbox img {
  margin: 0 0.5%;
}

#bigCard {
  position: absolute;
  top: 5%;
  height: 70%;
  left: 1%;
}

#bigCard img {
  height: 100%;
}

</style>
