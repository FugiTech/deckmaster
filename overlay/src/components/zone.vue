<template>
  <div class="zone" :style="{opacity: visible && cards.length ? 100 : 0 }" @mouseover="visible = true" @mouseout="visible = false">
    <img class="card" @mouseover="$emit('input', card)" @mouseout="$emit('input', null)" v-for="(card, idx) in cards" :key="idx" :src="cardSrc(card)" :style="cardStyle" />
  </div>
</template>

<script>
export default {
  name: 'Zone',
  props: ['value', 'cards'],
  data: function() {
    return {
      visible: false,
    }
  },
  computed: {
    cardStyle() {
      return {
        'max-width': 100 / this.cards.length - 1 + '%',
      }
    },
  },
}
</script>

<style scoped>
.zone {
  position: absolute;
  background: rgba(0,0,0,50%);
  overflow: hidden;
  text-align: center;
}

img {
  margin: 0 0.5%;
  max-height: 100%;
}
</style>
