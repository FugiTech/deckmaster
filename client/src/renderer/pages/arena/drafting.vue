<template>
  <v-container fluid>
    <v-layout row>
      <v-flex xs5 offset-xs1>
        <v-switch color="green" label="Draft Voting" v-model="enabled" hide-details />
      </v-flex>
      <v-flex xs5 v-show="enabled">
        <v-switch label="Disable after current draft" v-model="autoDisable" hide-details />
      </v-flex>
    </v-layout>
    <v-layout row v-show="enabled" class="mt-3">
      <v-flex xs5 offset-xs1>
        <div class="headline">Results</div>
        <div v-for="item in results" :key="item.name" class="ma-3">
          {{ item.score }}: {{ item.name }}
        </div>
      </v-flex>
      <v-flex xs5>
        <div class="headline">Base votes per user type</div>
        <v-layout row>
          <v-flex xs5 class="d-flex justify-end align-center pr-3">
            <span class="subheading label">Everyone</span>
          </v-flex>
          <v-flex xs5>
            <v-slider :max="10" v-model="allVotes" hide-details class="pt-0" />
          </v-flex>
          <v-flex xs2>
            <v-text-field v-model="allVotes" type="number" min="0" step="1" hide-details class="pt-0" />
          </v-flex>
        </v-layout>
        <v-layout row>
          <v-flex xs5 class="d-flex justify-end align-center pr-3">
            <span class="subheading label">Followers</span>
          </v-flex>
          <v-flex xs5>
            <v-slider :max="10" v-model="followVotes" hide-details class="pt-0" />
          </v-flex>
          <v-flex xs2>
            <v-text-field v-model="followVotes" type="number" min="0" step="1" hide-details class="pt-0" />
          </v-flex>
        </v-layout>
        <v-layout row>
          <v-flex xs5 class="d-flex justify-end align-center pr-3">
            <span class="subheading label">Subscribers</span>
          </v-flex>
          <v-flex xs5>
            <v-slider :max="10" v-model="subVotes" hide-details class="pt-0" />
          </v-flex>
          <v-flex xs2>
            <v-text-field v-model="subVotes" type="number" min="0" step="1" hide-details class="pt-0" />
          </v-flex>
        </v-layout>
        <v-layout row>
          <v-flex xs5 class="d-flex justify-end align-center pr-3">
            <span class="subheading label">Mods</span>
          </v-flex>
          <v-flex xs5>
            <v-slider :max="10" v-model="modVotes" hide-details class="pt-0" />
          </v-flex>
          <v-flex xs2>
            <v-text-field v-model="modVotes" type="number" min="0" step="1" hide-details class="pt-0" />
          </v-flex>
        </v-layout>

        <!-- <div class="headline mt-3">Extra vote cost in Bits</div>
        <v-layout row>
          <v-flex xs2>
            <v-switch color="green" v-model="bitVoting" hide-details />
          </v-flex>
          <v-flex xs8>
            <v-slider :max="1000" :step="10" v-model="voteCost" hide-details class="pt-0" />
          </v-flex>
          <v-flex xs2>
            <v-text-field v-model="voteCost" :disabled="!bitVoting" type="number" min="0" step="10" hide-details class="pt-0" />
          </v-flex>
        </v-layout> -->
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { Model } from '@/store'

export default {
  computed: {
    enabled: Model('draftEnabled'),
    autoDisable: Model('draftAutoDisable'),
    allVotes: Model('allVotes'),
    followVotes: Model('followVotes'),
    subVotes: Model('subVotes'),
    modVotes: Model('modVotes'),
    bitVoting: Model('bitVoting'),
    voteCost: Model('voteCost'),
    results() {
      return [{ name: 'Corusdeer', score: 10 }, { name: 'Beans', score: 7 }, { name: 'Coffee', score: 5 }, { name: 'Pineapple on pizza', score: 4 }, { name: 'Memes', score: 1 }]
    },
  },
}
</script>

<style scoped>
.headline {
  font-weight: 200;
}

.label {
  flex: 0 0 auto !important;
}
</style>

<style>
input[type='number'] {
  text-align: right;
}
</style>
