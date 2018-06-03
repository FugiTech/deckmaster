<template>
  <div class="zone" :class="{ vert: d.Vert, hori: !d.Vert }" :style="zoneStyle" @mouseover="hover = true" @mouseout="hover = false">
    <div class="name" v-if="d.Trigger">
      {{ d.Trigger }}
      <a class="close" @click="$store.commit('setActiveTrigger', null)">close</a>
    </div>
    <div class="inner-zone" :style="{ visibility: visible ? 'visible' : 'hidden'}">
      <img class="card" @click="clicked(card)" @mouseover="$emit('input', card)" @mouseout="$emit('input', null)" v-for="(card, idx) in d.Cards" :key="idx" :src="cardSrc(card)" :style="cardStyle" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Zone',
  props: ['value', 'd'],
  data: function() {
    return {
      hover: false,
    }
  },
  computed: {
    numCards() {
      return this.d.Cards ? this.d.Cards.length : 0
    },
    visible() {
      return this.d.Trigger ? this.d.Trigger === this.$store.state.activeTrigger : this.hover
    },
    zoneStyle() {
      return {
        left: this.d.X,
        top: this.d.Y,
        height: this.d.H,
        width: this.d.W,
        opacity: this.visible ? 100 : 0,
        visibility: this.numCards && (!this.d.Trigger || this.visible) ? 'visible' : 'hidden',
      }
    },
    cardStyle() {
      return this.d.Vert
        ? {
            width: '100%',
            'margin-bottom': '-125%',
          }
        : {
            'max-width': 100 / this.numCards - 1 + '%',
          }
    },
  },
  methods: {
    clicked(card) {
      this.$store.dispatch('vote', card)
    },
  },
}
</script>

<style scoped>
.zone {
  position: absolute;
  background: rgba(0, 0, 0, 50%);
  overflow: hidden;
  text-align: center;
  color: white;
  transition: opacity 0.1s;
  padding: 5px;
}
.zone.vert {
  overflow-y: auto;
}

.inner-zone {
  min-width: 100%;
}
.zone.hori .inner-zone {
  height: 100%;
}

img {
  margin: 0 0.5%;
  max-height: 100%;
}

.name {
  font-size: 20px;
}
.close {
  font-size: 14px;
  font-weight: 200;
}
.close:hover {
  cursor: pointer;
  text-decoration: underline;
}

.card:hover {
  cursor: pointer;
  box-shadow: 0 0 6px 2px #0ff;
}

::-webkit-scrollbar {
  background: transparent;
  width: 0.5vw;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.5);
}
</style>
