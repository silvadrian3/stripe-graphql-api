const slsw = require("serverless-webpack");
const path = require("path");

module.exports = {
  target: "node",
  entry: slsw.lib.entries,
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  optimization: {
    minimize: false,
  },
  devtool: "inline-cheap-module-source-map",
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  externals: {
    "aws-sdk": "aws-sdk",
  },
};
