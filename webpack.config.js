export default {
  mode: 'production',
  experiments: { outputModule: true },
  // below is based on https://stackoverflow.com/questions/35903246/how-to-create-multiple-output-paths-in-webpack-config
  entry: {
    'singleplayer/tossups/index': './client/singleplayer/tossups/index.jsx',
    'singleplayer/bonuses/index': './client/singleplayer/bonuses/index.jsx',
    'multiplayer/room': './client/multiplayer/room.jsx',
    'db/index': './client/db/index.jsx',
    'db/frequency-list/subcategory': './client/db/frequency-list/subcategory.jsx',
    'admin/category-reports/index': './client/admin/category-reports/index.jsx'
  },
  output: {
    filename: '[name].min.js',
    path: import.meta.dirname + '/client',
    module: true // needed since .jsx files import from CDNs
  },
  // below is copied from https://www.npmjs.com/package/babel-loader
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            targets: 'defaults',
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  }
};
