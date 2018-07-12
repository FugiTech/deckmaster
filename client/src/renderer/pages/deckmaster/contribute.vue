<template>
  <v-container fluid fill-height>
    <v-layout column justify-center align-center>
      <v-btn @click="open('https://www.patreon.com/fugi')">
        <v-icon class="mr-2">fab fa-patreon</v-icon> fugi
      </v-btn>
      <v-btn @click="open('https://www.paypal.me/fugiman')">
        <v-icon class="mr-2">fab fa-paypal</v-icon> fugiman
      </v-btn>
      <v-btn @click="open('https://github.com/fugiman/deckmaster')">
        <v-icon class="mr-2">fab fa-github</v-icon> fugiman/deckmaster
      </v-btn>
    </v-layout>
  </v-container>
</template>

<script>
export default {}
</script>

<style>
</style>
