<template>
  <v-layout row>
    <h1>Something will go here eventually</h1>
  </v-layout>
</template>

<script>
export default {
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link)
    },
  },
}
</script>

<style>
</style>
