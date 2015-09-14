const path = require('path');
const webpack = require('webpack');

const serverEnv = {
  port: 3000,
  host: 'localhost',
};

module.exports = {
  _serverEnv: serverEnv,
  devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-dev-server/client?http://' + serverEnv.host + ':' + serverEnv.port,
    'webpack/hot/only-dev-server',
    './index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: { fallback: path.join(__dirname, 'node_modules') },
  resolveLoader: { fallback: path.join(__dirname, 'node_modules') },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/,
        include: __dirname
      },
      {
        test: /\.(png|jpg|jpeg)$/,
        loader: 'url-loader?limit=8192'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
    ]
  }
};
