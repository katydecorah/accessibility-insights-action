// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as taskLib from 'azure-pipelines-task-lib/task';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as path from 'path';
import * as os from 'os';

export async function acquireNode(version: string): Promise<string> {
    const osPlat: string = os.platform();
    const osArch: string = os.arch() === 'ia32' ? 'x86' : os.arch();

    version = toolLib.cleanVersion(version);

    const cachedPath = toolLib.findLocalTool('node', version, osArch);
    if (cachedPath) {
        return cachedPath;
    }

    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    const fileName: string = osPlat === 'win32' ? 'node-v' + version + '-win-' + osArch : 'node-v' + version + '-' + osPlat + '-' + osArch;
    const urlFileName: string = osPlat === 'win32' ? fileName + '.zip' : fileName + '.tar.gz';

    const downloadUrl = 'https://nodejs.org/dist/v' + version + '/' + urlFileName;

    let downloadPath: string;
    try {
        downloadPath = await toolLib.downloadTool(downloadUrl);
    } catch (err) {
        console.log('##[error][Exception] Exception thrown in extension while downloading Node: ', err);
        throw err;
    }

    //
    // Extract
    //
    let extPath;
    if (osPlat === 'win32') {
        extPath = taskLib.getVariable('Agent.TempDirectory');
        if (!extPath) {
            throw new Error('Expected Agent.TempDirectory to be set');
        }

        // const _7zPath = path.join(__dirname, '7zr.exe');
        // extPath = await toolLib.extract7z(downloadPath, extPath, _7zPath);
        extPath = await toolLib.extractZip(downloadPath, extPath);
    } else {
        extPath = await toolLib.extractTar(downloadPath);
    }

    //
    // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
    //
    const toolRoot = path.join(extPath, fileName);
    return await toolLib.cacheDir(toolRoot, 'node', version, osArch);
}
