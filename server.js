const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');
const port = config._serverEnv.port;
const host = config._serverEnv.host;

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  stats: {
    colors: true,
  },
}).listen(port, host, function(err) {
  if (err) {
    console.log(err);
  }

  console.log('http://' + host + ':' + port);
});
