<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center>
      <div class="grey darken-3" style="--aspect-ratio: 16/9;">
        <div><overlay /></div>
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import Overlay from '../../../../../overlay/src/App'

export default {
  components: {
    Overlay,
  },
}
</script>

<style scoped>
.layout > div {
  /* Pretty gross but whatever */
  width: 100vw;
  max-width: calc((100vh - 156px) / 9 * 16);
}
</style>
