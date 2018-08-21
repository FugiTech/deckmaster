import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: require('@/pages/index').default,
    },
    {
      path: '/zone/:zone',
      component: require('@/pages/zone').default,
    },
    {
      path: '/cards/:zone/:idx',
      component: require('@/pages/cards').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
})
