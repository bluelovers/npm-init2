"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findYarnWorkspaceRoot = require("find-yarn-workspace-root");
const yargs = require("yargs");
const crossSpawn = require("cross-spawn");
const fs = require("fs-extra");
const path = require("path");
const workspaces_config_1 = require("workspaces-config");
const npm_package_json_loader_1 = require("npm-package-json-loader");
let cli = yargs
    .default({})
    .option('npmClient', {
    alias: ['N'],
    requiresArg: true,
    normalize: true,
    description: 'npm, yarn, ...etc',
    default: 'npm',
    type: 'string',
})
    .option('yes', {
    alias: ['y'],
    type: 'boolean',
})
    .option('cwd', {
    alias: ['C'],
    requiresArg: true,
    normalize: true,
    defaultDescription: '.',
    type: 'string',
})
    .option('skipCheckWorkspace', {
    alias: ['W'],
    type: 'boolean',
})
    .option('force', {
    alias: ['f'],
    type: 'boolean',
})
    .option('private', {
    alias: ['p'],
    type: 'boolean',
});
let argv = cli.argv._;
let cwd = path.resolve(cli.argv.cwd || process.cwd());
let hasWorkspace;
if (!cli.argv.skipCheckWorkspace) {
    hasWorkspace = findYarnWorkspaceRoot(cwd);
}
let targetDir;
if (argv.length) {
    let name = argv[0];
    if (hasWorkspace) {
        let ws = workspaces_config_1.parseStaticPackagesPaths(workspaces_config_1.default(hasWorkspace));
        if (ws.prefix.length) {
            name = path.join(hasWorkspace, ws.prefix[0], name);
        }
        else {
            throw new RangeError();
        }
    }
    targetDir = path.resolve(name);
}
else {
    targetDir = cwd;
}
fs.ensureDirSync(targetDir);
let flags = Object.keys(cli.argv)
    .reduce(function (a, f) {
    if (/^[a-z]$/.test(f) && cli.argv[f]) {
        a.push(f);
    }
    return a;
}, [])
    .join('');
let args = [
    'init',
    (flags && '-' + flags),
].filter(v => v);
crossSpawn.sync(cli.argv.npmClient, args, {
    stdio: 'inherit',
    cwd: targetDir,
});
{
    let pkg = new npm_package_json_loader_1.default(path.join(targetDir, 'package.json'));
    if (pkg.exists()) {
        if (cli.argv.p && cli.argv.npmClient != 'yarn') {
            pkg.data.private = true;
        }
        pkg.autofix();
        if (cli.argv.sort) {
            pkg.sort();
        }
        pkg.writeWhenLoaded();
    }
}
