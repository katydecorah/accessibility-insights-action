// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { acquireNode } from './install-node';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as process from 'process';

// This wrapper exists because as of writing, the latest version of Node that
// we can tell Azure DevOps to run our task with directly is Node 10, but several
// of our dependencies require Node >= 16.
async function wrapper() {
    console.log('##[group]Installing runtime dependencies');

    const nodeVersion = '16.15.0';
    const nodeDirPath = await acquireNode(nodeVersion);
    console.log('nodePath', nodeDirPath);

    const npmPath = path.join(nodeDirPath, 'npm.cmd');
    execFileSync(npmPath, ['install', '--global', 'yarn'], {
        stdio: 'inherit',
        cwd: __dirname,
    });

    const yarnPath = path.join(nodeDirPath, 'yarn.cmd');
    execFileSync(yarnPath, ['install', '--prod', '--frozen-lockfile'], {
        stdio: 'inherit',
        cwd: __dirname,
    });

    console.log('##[endgroup]');

    console.log('dirname', __dirname); // why is this not /dist/pkg?
    const mainPath = path.join(__dirname, '../dist/pkg/main.js');

    const nodePath = path.join(nodeDirPath, 'node.exe');
    execFileSync(nodePath, [mainPath], {
        stdio: 'inherit',
        env: process.env,
    });
}

void wrapper();
