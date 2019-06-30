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
const static_file_1 = require("@yarn-tool/static-file");
exports.defaultCopyStaticFiles = static_file_1.defaultCopyStaticFiles;
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
function copyStaticFiles(file_map, options) {
    return static_file_1.default({
        ...options,
        file_map,
    });
}
exports.copyStaticFiles = copyStaticFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUVoQyxxRUFBc0U7QUFDdEUsK0JBQWdDO0FBQ2hDLDZCQUE4QjtBQUU5Qix3REFBa0Y7QUFzSnpFLGlDQXRKa0Isb0NBQXNCLENBc0psQjtBQXBKL0IsU0FBZ0IsVUFBVSxDQUFDLFNBQWtCLEVBQUUsR0FBWTtJQUUxRCxJQUFJLElBQUksR0FBRztRQUNWLFNBQVM7S0FDVCxDQUFDO0lBRUYsU0FBUyxHQUFHLFNBQVMsSUFBSSxLQUFLLENBQUM7SUFFL0IsSUFBSSxTQUFTLEtBQUssTUFBTSxFQUN4QjtRQUNDLElBQUksR0FBRztZQUNOLFVBQVU7U0FDVixDQUFBO0tBQ0Q7SUFFRCxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDekMsR0FBRztRQUNILFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUNaO1FBQ0MsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFBO0tBQ2Q7SUFFRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtTQUMvQixPQUFPLENBQUMsMEJBQTBCLEVBQUUsRUFBRSxDQUFDO1NBQ3ZDLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7U0FDakMsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FDMUI7SUFFRCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRS9CLE9BQU8sSUFBSSxDQUFBO0FBQ1osQ0FBQztBQWxDRCxnQ0FrQ0M7QUFFRCxTQUFnQixZQUFZLENBQUMsT0FPNUI7SUFFQSxJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxVQUFV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O0tBQ1IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVZELDBDQVVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xMS8yOC8wMjguXG4gKi9cblxuaW1wb3J0IGNyb3NzU3Bhd24gPSByZXF1aXJlKCdjcm9zcy1zcGF3bi1leHRyYScpO1xuaW1wb3J0IEpTT041ID0gcmVxdWlyZSgnanNvbjUnKTtcblxuaW1wb3J0IF92YWxpZGF0ZU5wbVBhY2thZ2VOYW1lID0gcmVxdWlyZSgndmFsaWRhdGUtbnBtLXBhY2thZ2UtbmFtZScpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5pbXBvcnQgX2NvcHlTdGF0aWNGaWxlcywgeyBkZWZhdWx0Q29weVN0YXRpY0ZpbGVzIH0gZnJvbSAnQHlhcm4tdG9vbC9zdGF0aWMtZmlsZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBucG1WZXJzaW9uKG5wbUNsaWVudD86IHN0cmluZywgY3dkPzogc3RyaW5nKVxue1xuXHRsZXQgYXJncyA9IFtcblx0XHQndmVyc2lvbicsXG5cdF07XG5cblx0bnBtQ2xpZW50ID0gbnBtQ2xpZW50IHx8ICducG0nO1xuXG5cdGlmIChucG1DbGllbnQgPT09ICd5YXJuJylcblx0e1xuXHRcdGFyZ3MgPSBbXG5cdFx0XHQndmVyc2lvbnMnLFxuXHRcdF1cblx0fVxuXG5cdGxldCBjcCA9IGNyb3NzU3Bhd24uc3luYyhucG1DbGllbnQsIGFyZ3MsIHtcblx0XHRjd2QsXG5cdFx0c3RyaXBBbnNpOiB0cnVlLFxuXHR9KTtcblxuXHRpZiAoY3AuZXJyb3IpXG5cdHtcblx0XHR0aHJvdyBjcC5lcnJvclxuXHR9XG5cblx0bGV0IG91dHB1dCA9IGNwLnN0ZG91dC50b1N0cmluZygpXG5cdFx0LnJlcGxhY2UoL155YXJuIHZlcnNpb25zIFteXFxuXSskL2dtLCAnJylcblx0XHQucmVwbGFjZSgvXkRvbmUgaW4gW15cXG5dKyQvZ20sICcnKVxuXHRcdC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcblx0O1xuXG5cdGxldCBqc29uID0gSlNPTjUucGFyc2Uob3V0cHV0KTtcblxuXHRyZXR1cm4ganNvblxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFyZ2V0RGlyKG9wdGlvbnM6IHtcblx0aW5wdXROYW1lOiBzdHJpbmcsXG5cdGN3ZDogc3RyaW5nLFxuXG5cdHRhcmdldE5hbWU/OiBzdHJpbmcsXG5cdGhhc1dvcmtzcGFjZT86IHN0cmluZyxcblx0d29ya3NwYWNlUHJlZml4Pzogc3RyaW5nLFxufSlcbntcblx0bGV0IHRhcmdldERpcjogc3RyaW5nO1xuXHRsZXQgdGFyZ2V0TmFtZTogc3RyaW5nID0gb3B0aW9ucy50YXJnZXROYW1lIHx8IG51bGw7XG5cdGxldCB7IGlucHV0TmFtZSwgY3dkLCBoYXNXb3Jrc3BhY2UsIHdvcmtzcGFjZVByZWZpeCB9ID0gb3B0aW9ucztcblxuXHRpZiAoaGFzV29ya3NwYWNlICYmICF3b3Jrc3BhY2VQcmVmaXgpXG5cdHtcblx0XHR0aHJvdyBuZXcgUmFuZ2VFcnJvcihgY2FuJ3QgZm91bmQgd29ya3NwYWNlIHByZWZpeGApO1xuXHR9XG5cblx0aWYgKHRhcmdldE5hbWUpXG5cdHtcblx0XHR2YWxpZGF0ZU5wbVBhY2thZ2VOYW1lKHRhcmdldE5hbWUsIHRydWUpO1xuXHR9XG5cblx0aWYgKGlucHV0TmFtZSlcblx0e1xuXHRcdHRhcmdldE5hbWUgPSB0YXJnZXROYW1lIHx8IGlucHV0TmFtZTtcblxuXHRcdGxldCByZXQgPSB2YWxpZGF0ZU5wbVBhY2thZ2VOYW1lKGlucHV0TmFtZSwgdHJ1ZSk7XG5cdFx0bGV0IG5hbWUgPSBpbnB1dE5hbWU7XG5cblx0XHRsZXQgYmFzZVBhdGg6IHN0cmluZztcblxuXHRcdGlmIChoYXNXb3Jrc3BhY2UpXG5cdFx0e1xuXHRcdFx0YmFzZVBhdGggPSBwYXRoLmpvaW4oaGFzV29ya3NwYWNlLCB3b3Jrc3BhY2VQcmVmaXgpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0YmFzZVBhdGggPSBjd2Q7XG5cdFx0fVxuXG5cdFx0aWYgKHJldC5zY29wZWRQYWNrYWdlUGF0dGVybilcblx0XHR7XG5cdFx0XHRuYW1lID0gbmFtZVxuXHRcdFx0XHQucmVwbGFjZSgvW1xcL1xcXFxdKy9nLCAnXycpXG5cdFx0XHRcdC5yZXBsYWNlKC9eQC9nLCAnJylcblx0XHRcdDtcblxuXHRcdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIHJldC5zdWJuYW1lKSkpXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWUgPSByZXQuc3VibmFtZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0YXJnZXREaXIgPSBwYXRoLnJlc29sdmUoYmFzZVBhdGgsIG5hbWUpO1xuXG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0dGFyZ2V0RGlyID0gY3dkO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHR0YXJnZXREaXIsXG5cdFx0dGFyZ2V0TmFtZSxcblx0XHRjd2QsXG5cdH1cbn1cblxuY29uc3Qgc2NvcGVkUGFja2FnZVBhdHRlcm4gPSBuZXcgUmVnRXhwKCdeKD86QChbXi9dKz8pWy9dKT8oW14vXSs/KSQnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTnBtUGFja2FnZU5hbWUobmFtZTogc3RyaW5nLCB0aHJvd0Vycj86IGJvb2xlYW4pXG57XG5cdGxldCByZXQ6IHtcblx0XHR2YWxpZEZvck5ld1BhY2thZ2VzOiBib29sZWFuLFxuXHRcdHZhbGlkRm9yT2xkUGFja2FnZXM6IGJvb2xlYW4sXG5cdFx0c2NvcGVkUGFja2FnZVBhdHRlcm46IGJvb2xlYW4sXG5cdFx0d2FybmluZ3M/OiBzdHJpbmdbXSxcblx0XHRlcnJvcnM/OiBzdHJpbmdbXSxcblxuXHRcdG5hbWU6IHN0cmluZyxcblx0XHR1c2VyPzogc3RyaW5nLFxuXHRcdHN1Ym5hbWU/OiBzdHJpbmcsXG5cblx0fSA9IF92YWxpZGF0ZU5wbVBhY2thZ2VOYW1lKG5hbWUpO1xuXG5cdHJldC5uYW1lID0gbmFtZTtcblxuXHRpZiAoIXJldC5lcnJvcnMgfHwgIXJldC5lcnJvcnMubGVuZ3RoKVxuXHR7XG5cdFx0Y29uc3QgbmFtZU1hdGNoID0gbmFtZS5tYXRjaChzY29wZWRQYWNrYWdlUGF0dGVybik7XG5cblx0XHRpZiAobmFtZU1hdGNoKVxuXHRcdHtcblx0XHRcdHJldC5zY29wZWRQYWNrYWdlUGF0dGVybiA9IHRydWU7XG5cblx0XHRcdHJldC51c2VyID0gbmFtZU1hdGNoWzFdO1xuXHRcdFx0cmV0LnN1Ym5hbWUgPSBuYW1lTWF0Y2hbMl07XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRyZXQuc2NvcGVkUGFja2FnZVBhdHRlcm4gPSBmYWxzZTtcblx0XHR9XG5cdH1cblx0ZWxzZSBpZiAodGhyb3dFcnIpXG5cdHtcblx0XHR0aHJvdyBuZXcgUmFuZ2VFcnJvcihyZXQuZXJyb3JzLmNvbmNhdChyZXQud2FybmluZ3MgfHwgW10pLmpvaW4oJyA7ICcpKTtcblx0fVxuXG5cdHJldHVybiByZXQ7XG59XG5cbmV4cG9ydCB7IGRlZmF1bHRDb3B5U3RhdGljRmlsZXMgfVxuXG5leHBvcnQgZnVuY3Rpb24gY29weVN0YXRpY0ZpbGVzKGZpbGVfbWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgW3N0cmluZywgc3RyaW5nLCBzdHJpbmc/XVtdLCBvcHRpb25zOiB7XG5cdGN3ZDogc3RyaW5nLFxuXHRzdGF0aWNSb290Pzogc3RyaW5nLFxuXHRvdmVyd3JpdGU/OiBib29sZWFuLFxufSlcbntcblx0cmV0dXJuIF9jb3B5U3RhdGljRmlsZXMoe1xuXHRcdC4uLm9wdGlvbnMsXG5cdFx0ZmlsZV9tYXAsXG5cdH0pO1xufVxuIl19