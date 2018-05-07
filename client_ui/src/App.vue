<template>
  <div id="app" :style="appStyle">
    <div id="innerApp">
      <div id="logo">
        <img src="./assets/deckmaster.jpg">
      </div>
      <div class="status" v-for="(status, name) in $store.state.status" :key="name">
        <span>{{ icon(status) }}</span>
        <strong>{{ name }}</strong>
        <em>{{ status }}</em>
      </div>
      <div id="spacer"></div>
      <div id="help" v-show="!$store.getters.healthy">
        Make sure you have your twitch dashboard loaded with the extension panel open and set to Deckmaster.
      </div>
      <div id="version">
        Version {{ $store.state.version.toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',
  computed: {
    appStyle() {
      return {
        backgroundColor: this.$store.getters.healthy ? '#DFD' : '#FDD',
      }
    },
  },
  methods: {
    icon(status) {
      return status ? '⚠️' : '✅'
    },
  },
}
</script>

<style>
@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Light.eot');
    src: local('Montserrat Light'), local('Montserrat-Light'),
        url('./assets/Montserrat-Light.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Light.woff2') format('woff2'),
        url('./assets/Montserrat-Light.woff') format('woff'),
        url('./assets/Montserrat-Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Regular.eot');
    src: local('Montserrat Regular'), local('Montserrat-Regular'),
        url('./assets/Montserrat-Regular.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Regular.woff2') format('woff2'),
        url('./assets/Montserrat-Regular.woff') format('woff'),
        url('./assets/Montserrat-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Bold.eot');
    src: local('Montserrat Bold'), local('Montserrat-Bold'),
        url('./assets/Montserrat-Bold.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Bold.woff2') format('woff2'),
        url('./assets/Montserrat-Bold.woff') format('woff'),
        url('./assets/Montserrat-Bold.ttf') format('truetype');
    font-weight: bold;
    font-style: normal;
}

@font-face {
    font-family: 'Montserrat';
    src: url('./assets/Montserrat-Medium.eot');
    src: local('Montserrat Medium'), local('Montserrat-Medium'),
        url('./assets/Montserrat-Medium.eot?#iefix') format('embedded-opentype'),
        url('./assets/Montserrat-Medium.woff2') format('woff2'),
        url('./assets/Montserrat-Medium.woff') format('woff'),
        url('./assets/Montserrat-Medium.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
}

html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Montserrat';
}
#innerApp {
  height: 200px;
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
#logo {
  line-height: 0;
}
#logo img {
  width: 360px;
  margin: 5px;
}
.status {
  width: 320px;
  flex: auto;
}
.status span,
.status strong {
  padding-right: 4px;
  font-size: 20px;
}
.status em {
  font-size: 12px;
  font-weight: 300;
  font-style: normal;
}
#spacer {
  flex: auto;
}
#help {
  margin: 5px;
  font-size: 14px;
  font-weight: 500;
}
#version {
  font-size: 10px;
  width: 100%;
  text-align: right;
  font-weight: 300;
}
</style>
