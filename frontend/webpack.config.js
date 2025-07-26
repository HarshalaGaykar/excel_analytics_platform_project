module.exports = {
  // ... other config
  module: {
    rules: [
      // Existing JS loaders (if any)
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        // 👇 This excludes plotly.js source map warnings from showing
        exclude: [
          /node_modules\/plotly\.js/,
          /node_modules\\plotly\.js/, // For Windows path compatibility
        ],
      },
    ],
  },
};
