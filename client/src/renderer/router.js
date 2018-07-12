import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/arena',
      component: {
        template: '<router-view/>',
      },
      children: [
        {
          path: 'status',
          name: 'status',
          component: require('@/pages/arena/status').default,
        },
        {
          path: 'positioning',
          name: 'positioning',
          component: require('@/pages/arena/positioning').default,
        },
        {
          path: 'drafting',
          name: 'drafting',
          component: require('@/pages/arena/drafting').default,
        },
        {
          path: 'preview',
          name: 'preview',
          component: require('@/pages/arena/preview').default,
        },
        {
          path: 'streamdecker',
          name: 'streamdecker',
          component: require('@/pages/arena/streamdecker').default,
        },
        {
          path: '*',
          redirect: 'status',
        },
      ],
    },
    {
      path: '/deckmaster',
      component: {
        template: '<router-view/>',
      },
      children: [
        {
          path: 'changelog',
          name: 'changelog',
          component: require('@/pages/deckmaster/changelog').default,
        },
        {
          path: 'contact',
          name: 'contact',
          component: require('@/pages/deckmaster/contact').default,
        },
        {
          path: 'contribute',
          name: 'contribute',
          component: require('@/pages/deckmaster/contribute').default,
        },
        {
          path: '*',
          redirect: 'changelog',
        },
      ],
    },
    {
      path: '*',
      redirect: '/arena/',
    },
  ],
})
