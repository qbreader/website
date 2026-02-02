export default {
  mode: 'production',
  experiments: { outputModule: true },
  // below is based on https://stackoverflow.com/questions/35903246/how-to-create-multiple-output-paths-in-webpack-config
  entry: {
    'play/tossups/index': './client/play/tossups/index.jsx',
    'play/bonuses/index': './client/play/bonuses/index.jsx',
    'play/mp/room': './client/play/mp/room.jsx',
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
