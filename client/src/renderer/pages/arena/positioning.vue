<template>
  <v-container fluid fill-height>
    <v-layout row align-center justify-center>
      <span ref="container">
        <img :src="previewImage" />
        <div class="positioning" :style="overlayStyle">
          <div class="top">
            <div class="left" @mousedown.stop="begin('complex', 'complex', $event)" />
            <div class="center" @mousedown.stop="begin('null', 'complex', $event)" />
            <div class="right" @mousedown.stop="begin('simple', 'complex', $event)" />
          </div>
          <div class="middle">
            <div class="left" @mousedown.stop="begin('complex', 'null', $event)" />
            <div class="center" @mousedown.stop="begin('move', 'move', $event)" />
            <div class="right" @mousedown.stop="begin('simple', 'null', $event)" />
          </div>
          <div class="bottom">
            <div class="left" @mousedown.stop="begin('complex', 'simple', $event)" />
            <div class="center" @mousedown.stop="begin('null', 'simple', $event)" />
            <div class="right" @mousedown.stop="begin('simple', 'simple', $event)" />
          </div>
        </div>
      </span>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data: function() {
    return {
      channelLogin: '',
      now: new Date(),
      overlayStyle: Object.assign({}, this.$store.state.overlayPositioning),
      movefns: [this.null, this.null],
      startStyle: {},
      startX: null,
      startY: null,
      interval: null,
    }
  },
  computed: {
    previewImage() {
      return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${this.channelLogin}-1424x800.jpg?ts=${+this.now}`
    },
  },
  mounted() {
    document.documentElement.addEventListener('mousemove', this.onmove, true)
    document.documentElement.addEventListener('mouseup', this.end, true)
    this.interval = setInterval(() => {
      this.now = new Date()
    }, 60000)
  },
  beforeDestroy() {
    document.documentElement.removeEventListener('mousemove', this.onmove, true)
    document.documentElement.removeEventListener('mouseup', this.end, true)
    if (this.interval) clearInterval(this.interval)
  },
  methods: {
    begin(xfn, yfn, e) {
      this.movefns = [this[xfn], this[yfn]]
      this.startStyle = {
        left: this.overlayStyle.left.slice(0, -1) * 1.0,
        top: this.overlayStyle.top.slice(0, -1) * 1.0,
        width: this.overlayStyle.width.slice(0, -1) * 1.0,
        height: this.overlayStyle.height.slice(0, -1) * 1.0,
      }
      this.startX = e.pageX
      this.startY = e.pageY
    },
    end() {
      this.movefns = [this.null, this.null]
      this.$store.commit('positioning', this.overlayStyle)
    },
    onmove(e) {
      this.movefns[0](e, false)
      this.movefns[1](e, true)
    },
    distance(e, vertical) {
      return vertical ? (100 * (e['pageY'] - this['startY'])) / this.$refs.container['clientHeight'] : (100 * (e['pageX'] - this['startX'])) / this.$refs.container['clientWidth']
    },

    null(e, vertical) {},
    move(e, vertical) {
      this.overlayStyle[vertical ? 'top' : 'left'] = this.clamp(this.startStyle[vertical ? 'top' : 'left'] + this.distance(e, vertical), 0, 100 - this.startStyle[vertical ? 'height' : 'width']) + '%'
    },
    simple(e, vertical) {
      this.overlayStyle[vertical ? 'height' : 'width'] = this.clamp(this.startStyle[vertical ? 'height' : 'width'] + this.distance(e, vertical), 10, 100 - this.startStyle[vertical ? 'top' : 'left']) + '%'
    },
    complex(e, vertical) {
      let pos = this.clamp(this.startStyle[vertical ? 'top' : 'left'] + this.distance(e, vertical), 0, this.startStyle[vertical ? 'height' : 'width'] - 10)
      this.overlayStyle[vertical ? 'top' : 'left'] = pos + '%'
      this.overlayStyle[vertical ? 'height' : 'width'] = this.startStyle[vertical ? 'height' : 'width'] + (this.startStyle[vertical ? 'top' : 'left'] - pos) + '%'
    },

    clamp(n, min, max) {
      return Math.max(Math.min(n, max), min)
    },
  },
}
</script>

<style scoped>
span {
  position: relative;
  white-space: nowrap;
  font-size: 0;
  transition: none;
}
img {
  max-height: calc(100vh - 172px);
  max-width: calc(100vw - 48px);
  pointer-events: none;
}
.positioning {
  position: absolute;
  display: flex;
  flex-direction: column;
}
.top,
.middle,
.bottom {
  display: flex;
  flex-direction: row;
}
.top,
.bottom,
.left,
.right {
  flex-basis: 10px;
  background: rgba(0, 0, 255, 0.5);
}
.middle,
.center {
  flex-grow: 1;
}
.middle .center {
  background: rgba(0, 0, 255, 0.3);
}
.top .center,
.bottom .center {
  cursor: ns-resize;
}
.middle .left,
.middle .right {
  cursor: ew-resize;
}
.top .left,
.bottom .right {
  cursor: nwse-resize;
}
.top .right,
.bottom .left {
  cursor: nesw-resize;
}
.middle .center {
  cursor: move;
}
</style>
