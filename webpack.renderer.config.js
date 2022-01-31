const rules = require('./webpack.rules');
const path = require("path");

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    alias: {
      // for accessing static folder from inside stylesheets
      // This nonsense comes from https://github.com/loopmode/electron-webpack-static-examples
      static: path.resolve(__dirname, "static"),
    },
  }
};
