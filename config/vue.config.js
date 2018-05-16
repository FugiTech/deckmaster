module.exports = {
  configureWebpack: {
    output: {
      publicPath: '',
    },
  },
  chainWebpack: config => {
    config.optimization.minimize(false)
  },
}
