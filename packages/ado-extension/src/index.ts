// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { installRuntimeDependencies } from './install-runtime-dependencies';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
import('./install-node').then((installNode) => {
    installNode.getNode16();
});

installRuntimeDependencies();

// eslint-disable-next-line @typescript-eslint/no-floating-promises
import('./ado-extension').then((adoExtension) => {
    adoExtension.runScan();
});
