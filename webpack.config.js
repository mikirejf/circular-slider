const path = require('path');
const appPath = path.resolve(__dirname, 'app');

const config = {
  context: appPath,
  entry: './src/app.js',
  output: {
    path: appPath,
    filename: 'bundle.js',
    publicPath: '/'
  },
  mode: 'development',
  devServer: {
    host: '0.0.0.0',
    contentBase: appPath,
    watchContentBase: true,
    clientLogLevel: 'none'
  }
};

module.exports = (env = {}) => {
  if (env.mode === 'development') {
    config.devtool = 'inline-source-map';
  }

  if (env.babel === 'true') {
    config.module = {
      rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
      }]
    };    
  }

  return config;
};
