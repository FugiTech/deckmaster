<template>
  <v-container fluid>
    <v-layout column>
      <v-layout row class="mb-2" v-for="r in releases" :key="r.name">
        <v-flex xs2 class="text-xs-right pr-2">{{ r.name }}</v-flex>
        <v-flex xs10 class="pl-4">
          <ul>
            <li v-for="c in r.changes" :key="c">{{ c }}</li>
          </ul>
        </v-flex>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
let ghpromise = fetch('https://api.github.com/repos/fugiman/deckmaster/releases').then(r => {
  return r.json()
})

export default {
  data: function() {
    return {
      releases: [],
    }
  },
  created() {
    ghpromise.then(d => {
      this.releases = d.map(r => {
        return {
          name: r.tag_name,
          changes: r.body
            .trim()
            .split('\n')
            .map(l => {
              return l.substr(2)
            }),
        }
      })
    })
  },
}
</script>

<style scoped>
.container {
  overflow-y: auto;
  height: 100%;
}

.layout.row {
  flex-grow: 0;
  height: auto;
}

.flex.xs2 {
  font-weight: 200;
}
</style>
