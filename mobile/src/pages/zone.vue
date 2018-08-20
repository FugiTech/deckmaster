<template>
  <v-layout column>
    <v-list dense>
      <v-radio-group v-model="draftVote">
        <template v-for="(card, idx) in cards">
          <v-list-tile :to="`/cards/${$route.params.zone}/${idx}`" ripple :key="idx">
            <v-list-tile-content>
              <v-list-tile-title>
                <lazy-image :card="card.id" />
              </v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action @click.prevent>
              <v-list-tile-action-text v-if="card.attached.length">+{{ card.attached.length }}</v-list-tile-action-text>
              <v-radio v-if="voteable" :value="`${$store.state.draftID}-${card.id}`" />
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-radio-group>
    </v-list>
  </v-layout>
</template>

<script>
import LazyImage from '@/components/lazy_image'

export default {
  components: {
    LazyImage,
  },
  computed: {
    cards() {
      let z = this.$store.getters.zones[+this.$route.params.zone]
      return z ? z.cards : []
    },
    voteable() {
      let z = this.$store.getters.zones[+this.$route.params.zone]
      return z && z.voteable && this.$store.state.draftID
    },
    draftVote: {
      get() {
        return this.$store.state.draftSelect
      },
      set(v) {
        let card = v.split('-')[1]
        this.$store.dispatch('vote', { card, zoneID: v, draftID: this.$store.state.draftID })
      },
    },
  },
}
</script>

<style scoped>
.card {
  position: relative;
  display: block;
  top: -55%;
  max-width: 100%;
  max-height: 1428.6%;
  clip-path: inset(4% 5% 89% 5% round 5%);
}
</style>
