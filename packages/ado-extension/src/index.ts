// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { getNode16 } from './install-node';
import { installRuntimeDependencies } from './install-runtime-dependencies';

getNode16();

installRuntimeDependencies();

// eslint-disable-next-line @typescript-eslint/no-floating-promises
import('./ado-extension').then((adoExtension) => {
    adoExtension.runScan();
});
