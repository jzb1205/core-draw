
const path = require('path');
module.exports = {
    mode: 'production',
    entry: './package/index.js',
    output: {
        filename: 'Topology.js',
        path: path.resolve(__dirname, 'lib'),
        library: "Topology",
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
}