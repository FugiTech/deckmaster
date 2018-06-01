module.exports = {
  configureWebpack: {
    output: {
      publicPath: process.env.NODE_ENV === 'production' ? '' : '/',
    },
  },
  chainWebpack: config => {
    config.optimization.minimize(false)
  },
}
