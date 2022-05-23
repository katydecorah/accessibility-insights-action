// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

const commonConfig = {
    devtool: 'cheap-source-map',
    // We special case MPL-licensed dependencies ('axe-core', '@axe-core/puppeteer') because we want to avoid including their source in the same file as non-MPL code.
    externals: ['axe-core', 'accessibility-insights-report', 'accessibility-insights-scan', '@types/react', '@types/react-dom'],
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            experimentalWatchApi: true,
                        },
                    },
                ],
                exclude: ['/node_modules/', /\.(spec|e2e)\.ts$/],
            },
        ],
    },
    output: {
        path: path.resolve('./dist/pkg'),
        filename: '[name].js',
        libraryTarget: 'commonjs2',
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new CaseSensitivePathsPlugin(),
        // we ignore encoding because of https://github.com/microsoft/accessibility-insights-action/pull/752#issuecomment-893026690
        new webpack.IgnorePlugin({ resourceRegExp: /^encoding$/, contextRegExp: /node_modules[/\\]node-fetch[/\\]lib$/ }),

        // The azure-pipelines-*-lib libraries use dynamic require() statements to import package.json and lib.json
        // data files at runtime. These ContextReplacementPlugins tell Webpack in advance exactly which .json files
        // need to be bundled and set up for dynamic require() support.
        new webpack.ContextReplacementPlugin(/azure-pipelines-task-lib/, require.resolve('azure-pipelines-task-lib'), {
            '..\\..\\node_modules\\azure-pipelines-task-lib\\lib.json': 'azure-pipelines-task-lib/lib.json',
            '..\\..\\node_modules\\azure-pipelines-tool-lib\\lib.json': 'azure-pipelines-tool-lib/lib.json',
        }),
        new webpack.ContextReplacementPlugin(/azure-pipelines-tool-lib/, require.resolve('azure-pipelines-tool-lib'), {
            '..\\..\\node_modules\\azure-pipelines-tool-lib\\package.json': 'azure-pipelines-tool-lib/package.json',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        mainFields: ['main'], //This is fix for this issue https://www.gitmemory.com/issue/bitinn/node-fetch/450/494475397
    },
};

const mainConfig = {
    ...commonConfig,
    name: 'main',
    entry: {
        ['main']: path.resolve('./src/main.ts'),
    },
    node: {
        __dirname: false,
    },
    target: 'node16',
};

const wrapperConfig = {
    ...commonConfig,
    name: 'wrapper',
    entry: {
        ['wrapper']: path.resolve('./src/wrapper.ts'),
    },
    node: {
        __dirname: true,
    },
    target: 'node10',
};

module.exports = [mainConfig, wrapperConfig];
