// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/*
 * Duplicates NodeTool
 * https://github.com/microsoft/azure-pipelines-tasks/blob/88e80261f6b825f27e98c5fcc7c877accfb5d1b5/Tasks/NodeToolV0/nodetool.ts
 *
 */

import * as taskLib from 'azure-pipelines-task-lib/task';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

const force32bit: boolean = taskLib.getBoolInput('force32bit', false);
const osPlat: string = os.platform();
const osArch: string = getArch();

async function run(): Promise<void> {
    try {
        console.log('##[group]Installing Node 16.x');
        const nodeVersion = '16.14.2';
        await getNode(nodeVersion);
        console.log('##[endgroup]');
        execSync('node -v');
        execSync('node index.js');
    } catch (error) {
        taskLib.setResult(taskLib.TaskResult.Failed, error.message);
    }
}

interface INodeVersion {
    version: string;
    files: string[];
    semanticVersion: string;
}

async function getNode(version: string) {
    // check cache
    let toolPath = toolLib.findLocalTool('node', version, osArch);

    console.log({ toolPath });

    if (!toolPath) {
        // download, extract, cache
        toolPath = await acquireNode(version);
    }

    if (osPlat != 'win32') {
        toolPath = path.join(toolPath, 'bin');
    }

    //
    // prepend the tools path. instructs the agent to prepend for future tasks
    //
    toolLib.prependPath(toolPath);
}

async function acquireNode(version: string): Promise<string> {
    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    version = toolLib.cleanVersion(version);
    const fileName: string = osPlat == 'win32' ? 'node-v' + version + '-win-' + osArch : 'node-v' + version + '-' + osPlat + '-' + osArch;
    const urlFileName: string = osPlat == 'win32' ? fileName + '.7z' : fileName + '.tar.gz';

    const downloadUrl = 'https://nodejs.org/dist/v' + version + '/' + urlFileName;

    let downloadPath: string;

    try {
        downloadPath = await toolLib.downloadTool(downloadUrl);
        console.log({ downloadUrl });
    } catch (err) {
        if (err['httpStatusCode'] && err['httpStatusCode'] == 404) {
            return await acquireNodeFromFallbackLocation(version);
        }

        throw err;
    }

    //
    // Extract
    //
    let extPath: string | undefined;
    if (osPlat == 'win32') {
        taskLib.assertAgent('2.115.0');
        extPath = taskLib.getVariable('Agent.TempDirectory');
        if (!extPath) {
            throw new Error('Expected Agent.TempDirectory to be set');
        }

        const _7zPath = path.join(__dirname, '7zr.exe');
        extPath = await toolLib.extract7z(downloadPath, extPath, _7zPath);
    } else {
        extPath = await toolLib.extractTar(downloadPath);
    }

    //
    // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
    //
    const toolRoot = path.join(extPath, fileName);
    console.log(toolRoot);
    return await toolLib.cacheDir(toolRoot, 'node', version, osArch);
}

// For non LTS versions of Node, the files we need (for Windows) are sometimes located
// in a different folder than they normally are for other versions.
// Normally the format is similar to: https://nodejs.org/dist/v5.10.1/node-v5.10.1-win-x64.7z
// In this case, there will be two files located at:
//      /dist/v5.10.1/win-x64/node.exe
//      /dist/v5.10.1/win-x64/node.lib
// If this is not the structure, there may also be two files located at:
//      /dist/v0.12.18/node.exe
//      /dist/v0.12.18/node.lib
// This method attempts to download and cache the resources from these alternative locations.
// Note also that the files are normally zipped but in this case they are just an exe
// and lib file in a folder, not zipped.
async function acquireNodeFromFallbackLocation(version: string): Promise<string> {
    // Create temporary folder to download in to
    const tempDownloadFolder: string = 'temp_' + Math.floor(Math.random() * 2000000000);
    const tempDirectory = taskLib.getVariable('agent.tempDirectory') || '';
    const tempDir: string = path.join(tempDirectory, tempDownloadFolder);
    taskLib.mkdirP(tempDir);
    let exeUrl: string;
    let libUrl: string;
    try {
        exeUrl = `https://nodejs.org/dist/v${version}/win-${osArch}/node.exe`;
        libUrl = `https://nodejs.org/dist/v${version}/win-${osArch}/node.lib`;

        await toolLib.downloadTool(exeUrl, path.join(tempDir, 'node.exe'));
        await toolLib.downloadTool(libUrl, path.join(tempDir, 'node.lib'));
    } catch (err) {
        if (err['httpStatusCode'] && err['httpStatusCode'] == 404) {
            exeUrl = `https://nodejs.org/dist/v${version}/node.exe`;
            libUrl = `https://nodejs.org/dist/v${version}/node.lib`;

            await toolLib.downloadTool(exeUrl, path.join(tempDir, 'node.exe'));
            await toolLib.downloadTool(libUrl, path.join(tempDir, 'node.lib'));
        } else {
            throw err;
        }
    }
    return await toolLib.cacheDir(tempDir, 'node', version, osArch);
}

function getArch(): string {
    let arch: string = os.arch();
    if (arch === 'ia32' || force32bit) {
        arch = 'x86';
    }
    return arch;
}

void run();
