// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as toolLib from 'azure-pipelines-tool-lib/tool';
// import * as path from 'path';

export async function getNode16() {
    const node16 = '16.15.0';
    console.log(node16);
    return getNode(node16);
}

export async function getNode(version: string) {
    const toolPath = await acquireNode(version);
    console.log(toolPath);
}


async function acquireNode(version: string): Promise<string> {
    const osPlat = 'linux';
    const osArch = 'x64';
    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    version = toolLib.cleanVersion(version);
    const fileName: string = 'node-v' + version + '-' + osPlat + '-' + osArch;
    const urlFileName: string = fileName + '.tar.gz';

    const downloadUrl = 'https://nodejs.org/dist/v' + version + '/' + urlFileName;

    console.log(downloadUrl);
    let downloadPath: string;
    try {
        downloadPath = await toolLib.downloadTool(downloadUrl);
    } 
    catch (err) {
        throw err;
    }

    console.log(downloadPath);
    return downloadPath;

    // //
    // // Extract
    // //
    // const extPath = await toolLib.extractTar(downloadPath);

    // //
    // // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
    // //
    // const toolRoot = path.join(extPath, fileName);
    // return await toolLib.cacheDir(toolRoot, 'node', version, osArch);
}
