module.exports = {
    output: {
      filename: 'bundle.js',
      library: 'Circuit',
      libraryTarget: 'var'
    },
    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",
    entry: './src/index.js',

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};