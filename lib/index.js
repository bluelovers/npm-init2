"use strict";
/**
 * Created by user on 2018/11/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crossSpawn = require("cross-spawn-extra");
const JSON5 = require("json5");
const _validateNpmPackageName = require("validate-npm-package-name");
const fs = require("fs-extra");
const path = require("path");
function npmVersion(npmClient, cwd) {
    let args = [
        'version',
    ];
    npmClient = npmClient || 'npm';
    if (npmClient === 'yarn') {
        args = [
            'versions',
        ];
    }
    let cp = crossSpawn.sync(npmClient, args, {
        cwd,
        stripAnsi: true,
    });
    if (cp.error) {
        throw cp.error;
    }
    let output = cp.stdout.toString()
        .replace(/^yarn versions [^\n]+$/gm, '')
        .replace(/^Done in [^\n]+$/gm, '')
        .replace(/^\s+|\s+$/g, '');
    let json = JSON5.parse(output);
    return json;
}
exports.npmVersion = npmVersion;
function getTargetDir(options) {
    let targetDir;
    let targetName = options.targetName || null;
    let { inputName, cwd, hasWorkspace, workspacePrefix } = options;
    if (hasWorkspace && !workspacePrefix) {
        throw new RangeError(`can't found workspace prefix`);
    }
    if (targetName) {
        validateNpmPackageName(targetName, true);
    }
    if (inputName) {
        targetName = targetName || inputName;
        let ret = validateNpmPackageName(inputName, true);
        let name = inputName;
        let basePath;
        if (hasWorkspace) {
            basePath = path.join(hasWorkspace, workspacePrefix);
        }
        else {
            basePath = cwd;
        }
        if (ret.scopedPackagePattern) {
            name = name
                .replace(/[\/\\]+/g, '_')
                .replace(/^@/g, '');
            if (!fs.pathExistsSync(path.join(basePath, ret.subname))) {
                name = ret.subname;
            }
        }
        targetDir = path.resolve(basePath, name);
    }
    else {
        targetDir = cwd;
    }
    return {
        targetDir,
        targetName,
        cwd,
    };
}
exports.getTargetDir = getTargetDir;
const scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$');
function validateNpmPackageName(name, throwErr) {
    let ret = _validateNpmPackageName(name);
    ret.name = name;
    if (!ret.errors || !ret.errors.length) {
        const nameMatch = name.match(scopedPackagePattern);
        if (nameMatch) {
            ret.scopedPackagePattern = true;
            ret.user = nameMatch[1];
            ret.subname = nameMatch[2];
        }
        else {
            ret.scopedPackagePattern = false;
        }
    }
    else if (throwErr) {
        throw new RangeError(ret.errors.concat(ret.warnings || []).join(' ; '));
    }
    return ret;
}
exports.validateNpmPackageName = validateNpmPackageName;
//# sourceMappingURL=index.js.map