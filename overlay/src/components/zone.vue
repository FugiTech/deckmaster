<template>
  <div class="zone" :class="{ vert: Vert, hori: !Vert, voteable: Voteable, chosen: chosen, visible: visible }" :style="zoneStyle" @mouseover="hover = true" @mouseout="hover = false">
    <div class="name" v-if="Trigger">
      {{ Trigger }}
      <a class="close" @click="$store.commit('setActiveTrigger', null)">close</a>
    </div>
    <div class="inner-zone" :style="{ visibility: numCards && visible ? 'visible' : 'hidden'}">
      <span class="card-holder" v-for="(card, idx) in Cards" :key="idx" @mouseover="hovered(idx)" @mouseout="$emit('input', null)" :style="cardHolderStyle">
        <LazyImage @click="clicked(card)" :card="card" :style="cardStyle.main[idx]" />
        <template v-if="Attachments">
          <LazyImage class="attachment" v-for="(card2, idx2) in Attachments[idx]" :key="`${idx}-${idx2}`" :card="card2" :style="cardStyle.attach[idx][idx2]" />
        </template>
      </span>
    </div>
    <div class="score"><div :style="scoreStyle">{{ Score }}</div></div>
  </div>
</template>

<script>
import LazyImage from './lazy_image'

const attachAdjust = 8

export default {
  name: 'Zone',
  props: ['value', 'Vert', 'Voteable', 'Cards', 'Attachments', 'Trigger', 'Score', 'X', 'Y', 'H', 'W'],
  components: {
    LazyImage,
  },
  data: function() {
    return {
      hover: false,
    }
  },
  beforeDestroy() {
    if (this.hover) {
      this.$emit('input', null)
    }
  },
  computed: {
    numCards() {
      return this.Cards ? this.Cards.length : 0
    },
    visible() {
      return this.Trigger ? this.Trigger === this.$store.state.activeTrigger : this.hover || this.$store.state.forceOpen
    },
    zoneStyle() {
      return {
        left: this.X,
        top: this.Y,
        height: this.H,
        width: this.W,
        visibility: this.numCards && (!this.Trigger || this.visible) ? 'visible' : 'hidden',
      }
    },
    cardHolderStyle() {
      return this.Vert ? {} : { 'max-width': 100 / this.numCards - 1 + '%' }
    },
    cardStyle() {
      let r = {
        main: [],
        attach: {},
      }
      this.Cards.forEach((_, i) => {
        if (!this.Attachments || !(i in this.Attachments)) {
          r.main.push({})
          return
        }

        let a = this.Attachments[i]
        let s = {
          height: `${100 - attachAdjust * a.length}%`,
          'z-index': a.length,
        }
        let sa = []

        a.forEach((_, j) => {
          sa.push({
            height: `${100 - attachAdjust * a.length}%`,
            top: `${attachAdjust * (j + 1)}%`,
            left: `${attachAdjust * (j + 1)}%`,
            'z-index': a.length - (j + 1),
          })
        })

        r.main.push(s)
        r.attach[i] = sa
      })
      return r
    },
    zoneID() {
      if (!this.$store.state.draftID || this.numCards !== 1 || !this.Voteable) return false
      return `${this.$store.state.draftID}-${this.Cards[0]}`
    },
    chosen() {
      return this.$store.state.draftSelect === this.zoneID
    },
    scoreStyle() {
      if (!this.Score || this.Score === '0%') return { display: 'none' }
      return {
        height: this.Score,
      }
    },
  },
  methods: {
    hovered(idx) {
      this.$emit('input', [this.Cards[idx]].concat((this.Attachments || {})[idx] || []))
    },
    clicked(card) {
      if (!this.zoneID) return
      this.$store.dispatch('vote', { draftID: this.$store.state.draftID, card, zoneID: this.zoneID })
    },
  },
}
</script>

<style scoped>
.zone {
  position: absolute;
  overflow: hidden;
  text-align: center;
  color: white;
  padding: 5px;
}
.zone.vert {
  overflow-y: auto;
}
.zone > div {
  opacity: 0;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.1s;
}
.zone.visible > div {
  opacity: 1;
}

.inner-zone {
  min-width: 100%;
}
.zone.hori .inner-zone {
  height: 100%;
}

img {
  max-height: 100%;
}

.name {
  font-size: 20px;
}
.close {
  font-size: 14px;
  font-weight: 200;
}
.close:hover {
  cursor: pointer;
  text-decoration: underline;
}

.card-holder {
  display: inline-block;
  position: relative;
  margin: 0 0.25%;
  height: 100%;
  vertical-align: top;
}
.card-holder:hover > .card {
  box-shadow: 0 0 6px 2px #0ff;
}
.voteable .card-holder:hover > .card {
  cursor: pointer;
}
.zone.vert .card {
  width: 100%;
  margin-bottom: -125%;
}
.card {
  position: relative;
}
.attachment {
  position: absolute;
  top: 5%;
  left: 5%;
}

::-webkit-scrollbar {
  background: transparent;
  width: 0.5vw;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.5);
}
</style>

<style scoped lang="stylus">
$border-size = 6px

.zone .score
  position: absolute
  top: $border-size
  right: $border-size
  bottom: $border-size
  left: $border-size
  z-index: 10
  display: flex
  flex-direction: row
  align-items: flex-end
  background: none
  pointer-events: none

  > div
    width: 100%
    background: rgba(0, 255, 255, 0.4)
    color: black
    font-weight: 700
    font-size: 1.3em

.zone.chosen
  position: relative

.zone.chosen:after
  position: absolute
  top: 0
  right: 0
  bottom: 0
  left: 0
  z-index: 10
  border-radius: 'calc(2px + %s)' % $border-size
  background: linear-gradient(120deg, gold, orange, gold)
  background-size: 300% 300%
  content: ''
  animation: frame-enter 1s forwards ease-in-out reverse, gradient-animation 1s ease-in-out infinite
  clip-path: polygon(0 100%, $border-size 100%, $border-size $border-size, ('calc(100% - %s)' % $border-size)$border-size, 'calc(100% - %s)' % $border-size 'calc(100% - %s)' % $border-size, $border-size 'calc(100% - %s)' % $border-size, $border-size 100%, 100% 100%, 100% 0, 0 0)

@keyframes gradient-animation
  0%
    background-position: 15% 0
    opacity: 0.9

  50%
    background-position: 85% 100%
    opacity: 1

  100%
    background-position: 15% 0
    opacity: 0.9

@keyframes frame-enter
  0%
    clip-path: polygon(0 100%, $border-size 100%, $border-size $border-size, ('calc(100% - %s)' % $border-size)$border-size, 'calc(100% - %s)' % $border-size 'calc(100% - %s)' % $border-size, $border-size 'calc(100% - %s)' % $border-size, $border-size 100%, 100% 100%, 100% 0, 0 0)

  25%
    clip-path: polygon(0 100%, $border-size 100%, $border-size $border-size, ('calc(100% - %s)' % $border-size)$border-size, 'calc(100% - %s)' % $border-size 'calc(100% - %s)' % $border-size, 'calc(100% - %s)' % $border-size 'calc(100% - %s)' % $border-size, 'calc(100% - %s)' % $border-size 100%, 100% 100%, 100% 0, 0 0)

  50%
    clip-path: polygon(0 100%, $border-size 100%, $border-size $border-size, ('calc(100% - %s)' % $border-size)$border-size, ('calc(100% - %s)' % $border-size)$border-size, ('calc(100% - %s)' % $border-size)$border-size, ('calc(100% - %s)' % $border-size)$border-size, ('calc(100% - %s)' % $border-size)$border-size, 100% 0, 0 0)

  75%
    clip-path: polygon(0 100%, $border-size 100%, $border-size $border-size, $border-size $border-size, $border-size $border-size, $border-size $border-size, $border-size $border-size, $border-size $border-size, $border-size 0, 0 0)

  100%
    clip-path: polygon(0 100%, $border-size 100%, $border-size 100%, $border-size 100%, $border-size 100%, $border-size 100%, $border-size 100%, $border-size 100%, $border-size 100%, 0 100%)
</style>
