
const path = require('path');
module.exports = {
    mode: 'production',
    entry: './package/index.js',
    output: {
        filename: 'graphDraw.js',
        path: path.resolve(__dirname, 'lib'),
        libraryTarget: "umd"
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"],
                    plugins: ["@babel/plugin-proposal-class-properties"]
                }
            },
            exclude: /node_modules/
        }]
    },
    performance: {
        hints: false
    }
}