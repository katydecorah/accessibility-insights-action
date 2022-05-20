// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as path from 'path';

export async function acquireNode(version: string): Promise<string> {
    const osPlat = 'linux';
    const osArch = 'x64';

    version = toolLib.cleanVersion(version);

    const cachedPath = toolLib.findLocalTool('node', version, osArch);
    if (cachedPath) {
        return cachedPath;
    }

    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    const fileName: string = 'node-v' + version + '-' + osPlat + '-' + osArch;
    const urlFileName: string = fileName + '.tar.gz';

    const downloadUrl = 'https://nodejs.org/dist/v' + version + '/' + urlFileName;

    console.log(downloadUrl);
    let downloadPath: string;
    try {
        downloadPath = await toolLib.downloadTool(downloadUrl);
    } catch (err) {
        console.log('##[error][Exception] Exception thrown in extension while downloading Node: ', err);
        throw err;
    }

    console.log(downloadPath);

    //
    // Extract
    //
    const extPath = await toolLib.extractTar(downloadPath);

    //
    // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
    //
    const toolRoot = path.join(extPath, fileName);
    return await toolLib.cacheDir(toolRoot, 'node', version, osArch);
}
