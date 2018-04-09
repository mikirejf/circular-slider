const path = require('path');
const appPath = path.resolve(__dirname, 'app');

module.exports = {
  context: appPath,
  entry: './src/app.js',
  output: {
    path: '/',
    filename: 'bundle.js',
    publicPath: '/'
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: appPath,
    watchContentBase: true,
    clientLogLevel: 'none'
  }
};