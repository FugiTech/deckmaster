<template>
  <v-layout row wrap>
    <v-flex xs12 v-if="voteable">
      <v-btn-toggle v-model="draftVote" class="d-block">
        <v-btn :color="draftVote === voteValue ? 'primary' : 'grey'" block :value="voteValue">
          <template v-if="draftVote === voteValue">
            Selected
          </template>
          <template v-else>
            Vote
          </template>
        </v-btn>
      </v-btn-toggle>
    </v-flex>
    <v-flex xs12 md6 class="text-xs-center" v-for="(card, idx) in cards" :key="idx">
      <lazy-image :card="card.id" :back="card.back" />
    </v-flex>
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
      if (!z) return []
      let c = z.cards[+this.$route.params.idx]
      if (!c) return []

      let hasBack = id => !!this.$store.state.doubleSided[id]

      let r = [{ id: c.id }]
      if (hasBack(c.id)) r.push({ id: c.id, back: true })
      c.attached.forEach(id => {
        r.push({ id })
        if (hasBack(id)) r.push({ id, back: true })
      })
      return r
    },
    voteable() {
      let z = this.$store.getters.zones[+this.$route.params.zone]
      return z && z.voteable && this.$store.state.draftID
    },
    voteValue() {
      return `${this.$store.state.draftID}-${this.cards[0].id}`
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
  max-width: 100%;
  border-radius: 5%;
}
.v-btn {
  width: 100%;
}
</style>
