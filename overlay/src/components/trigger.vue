<template>
  <div class="trigger" :style="triggerStyle" @mouseover="visible = true" @mouseout="visible = false" @click="$store.commit('setActiveTrigger', d.ID)">
    <div ref="name" class="name" :style="nameStyle">{{ d.Name }}</div>
    <div ref="help" class="help" :style="helpStyle">Click to view</div>
    <div ref="count" class="count" :style="countStyle">{{ d.CardCount }}</div>
  </div>
</template>

<script>
const lineHeightMultiplier = 1.1

export default {
  name: 'Trigger',
  props: ['d'],
  data: function() {
    return {
      visible: false,
      nameSize: 12,
      helpSize: 12,
      countSize: 12,
    }
  },
  computed: {
    triggerStyle() {
      return {
        left: this.d.X,
        top: this.d.Y,
        height: this.d.H,
        width: this.d.W,
        opacity: this.visible ? 100 : 0,
        visibility: this.d.CardCount ? 'visible' : 'hidden',
      }
    },
    nameStyle() {
      return {
        'font-size': this.nameSize + 'px',
        'line-height': lineHeightMultiplier * this.nameSize + 'px',
      }
    },
    helpStyle() {
      return {
        'font-size': this.helpSize + 'px',
        'line-height': lineHeightMultiplier * this.helpSize + 'px',
      }
    },
    countStyle() {
      return {
        'font-size': this.countSize + 'px',
        'line-height': lineHeightMultiplier * this.countSize + 'px',
      }
    },
  },
  mounted() {
    window.addEventListener('resize', this.calculateFontSize)
    this.calculateFontSize()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateFontSize)
  },
  watch: {
    d: function() {
      this.calculateFontSize()
    },
  },
  methods: {
    calculateFontSize: function() {
      requestAnimationFrame(() => {
        this.nameSize *= this.$el.clientWidth / this.$refs.name.scrollWidth
        this.helpSize *= this.$el.clientWidth / this.$refs.help.scrollWidth
        this.countSize = Math.min((this.$el.clientHeight - lineHeightMultiplier * this.nameSize - lineHeightMultiplier * this.helpSize) / lineHeightMultiplier, this.$el.clientWidth / this.$refs.count.scrollWidth * this.countSize)
      })
    },
  },
}
</script>

<style scoped>
.trigger {
  position: absolute;
  background: rgba(0, 0, 0, 50%);
  overflow: hidden;
  text-align: center;
  color: white;
  transition: opacity 0.1s;
  line-height: 0;
}
.trigger:hover {
  cursor: pointer;
}

.name,
.help,
.count {
  display: inline-block;
  white-space: nowrap;
}
.name {
  font-weight: 500;
}
.help,
.count {
  font-weight: 200;
}
</style>
