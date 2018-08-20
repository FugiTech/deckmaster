<template>
  <v-layout column>
    <v-list>
      <template v-for="(zone, idx) in $store.getters.zones">
        <v-list-tile :to="`/zone/${idx}`" ripple :key="zone.name">
          <v-list-tile-content>
            <v-list-tile-title>{{ zone.name }}</v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-list-tile-action-text>{{ zone.count }}</v-list-tile-action-text>
          </v-list-tile-action>
        </v-list-tile>
      </template>
    </v-list>
  </v-layout>
</template>

<script>
export default {}
</script>

<style scoped>
</style>
