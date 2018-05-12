import Vue from 'vue'
import App from './App.vue'
import store from './store'

Vue.config.productionTip = false

Vue.use({
  install: function(Vue, options) {
    Vue.cardSrc = function(card, back) {
      let folder = ('' + card % 20).padStart(2, '0')
      let back_text = back ? '_back' : ''
      return `https://deckmaster.fugi.io/cards/${folder}/${card}${back_text}.jpg`
    }
  },
})

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
