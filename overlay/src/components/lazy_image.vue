<template>
  <img :src="src" @load="loaded = true" :style="{opacity: loaded ? 100 : 0}" />
</template>

<script>
export default {
  name: 'LazyImage',
  props: ['src'],
  data: function() {
    return {
      loaded: false,
    }
  },
  watch: {
    'src': function() { this.loaded = false },
  }
}
</script>
