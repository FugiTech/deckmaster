<template>
  <img class="card" :src="src" @load="loaded = true" @error="fallback = true" :style="{opacity: loaded ? 100 : 0}" />
</template>

<script>
export default {
  name: 'LazyImage',
  props: ['card', 'back'],
  data: function() {
    return {
      loaded: false,
      fallback: false,
    }
  },
  computed: {
    src() {
      let folder = ('' + this.card % 20).padStart(2, '0')
      let back_text = this.back ? '_back' : ''
      return `https://deckmaster.fugi.io/cards/${this.fallback ? 'en' : this.$store.state.lang}/${folder}/${this.card}${back_text}.jpg`
    },
  },
  watch: {
    src: function() {
      this.loaded = false
    },
  },
}
</script>
