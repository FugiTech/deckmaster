<template>
  <v-app :dark="$store.state.dark">
    <v-content>
      <v-container fill-height>
        <v-layout justify-center align-center>
          <v-card>
            <v-card-title>All configuration and setup has moved to the Deckmaster application. Please use the button below to get started.</v-card-title>
            <v-card-actions><v-btn large block color="primary" href="https://github.com/Fugiman/deckmaster/releases" target="_blank">Download</v-btn></v-card-actions>
          </v-card>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {}
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>
