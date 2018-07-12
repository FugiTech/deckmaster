<template>
  <v-container fluid fill-height>
    <v-layout>
      <v-spacer>
        <overlay />
      </v-spacer>
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
</style>
