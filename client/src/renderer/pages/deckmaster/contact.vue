<template>
  <v-container fluid fill-height>
    <v-layout column justify-center align-center>
      <v-btn @click="open('https://discord.gg/DXJS6jb')">
        <v-icon class="mr-2">fab fa-discord</v-icon> Deckmaster Server
      </v-btn>
      <v-btn @click="open('mailto:fugi@fugiman.com')">
        <v-icon class="mr-2">email</v-icon> fugi@fugiman.com
      </v-btn>
      <v-btn @click="open('https://twitter.com/fugiman')">
        <v-icon class="mr-2">fab fa-twitter</v-icon> fugiman
      </v-btn>
      <v-btn @click="open('https://discordapp.com/users/81867328765034496')">
        <v-icon class="mr-2">fab fa-discord</v-icon> fugi#4777
      </v-btn>
    </v-layout>
  </v-container>
</template>

<script>
export default {}
</script>

<style>
</style>
