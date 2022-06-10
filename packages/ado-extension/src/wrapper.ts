// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { acquireNode } from './install-node';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';

// This wrapper exists because as of writing, the latest version of Node that
// we can tell Azure DevOps to run our task with directly is Node 10, but several
// of our dependencies require Node >= 16.
async function wrapper() {
    console.log('##[group]Installing runtime dependencies');

    let nodeExecutableString = 'node';
    let npmExecutableString = 'npm';
    let yarnExecutableString = 'yarn';

    if (os.platform() == 'win32') {
        nodeExecutableString += '.exe';
        npmExecutableString += '.cmd';
        yarnExecutableString += '.cmd';
    }

    const nodeVersion = '16.15.0';
    const nodeDirPath = await acquireNode(nodeVersion);

    const npmPath = path.join(nodeDirPath, 'bin', npmExecutableString);
    execFileSync(npmPath, ['install', '-g', 'yarn'], {
        stdio: 'inherit',
        cwd: __dirname,
    });

    execFileSync(yarnExecutableString, ['install', '--prod', '--frozen-lockfile'], {
        stdio: 'inherit',
        cwd: __dirname,
    });

    console.log('##[endgroup]');

    const mainPath = path.join(__dirname, '../dist/pkg/main.js');

    const nodePath = path.join(nodeDirPath, 'bin', nodeExecutableString);
    execFileSync(nodePath, [mainPath], {
        stdio: 'inherit',
        env: process.env,
    });
}

void wrapper();
