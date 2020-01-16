#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const crossSpawn = require("cross-spawn-extra");
const fs = require("fs-extra");
const path = require("path");
const workspaces_config_1 = require("workspaces-config");
const npm_package_json_loader_1 = require("npm-package-json-loader");
const index_1 = require("./lib/index");
const yargs_setting_1 = require("./lib/yargs-setting");
const find_root_1 = require("@yarn-tool/find-root");
const pkg_git_info_1 = require("@yarn-tool/pkg-git-info");
//updateNotifier(__dirname);
let cli = yargs_setting_1.default(yargs);
let argv = cli.argv._;
//console.dir(cli.argv);
let cwd = path.resolve(cli.argv.cwd || process.cwd());
let rootData = find_root_1.findRoot({
    cwd,
    skipCheckWorkspace: cli.argv.skipCheckWorkspace,
});
let hasWorkspace = rootData.ws;
let workspacePrefix;
if (hasWorkspace) {
    let ws = workspaces_config_1.parseStaticPackagesPaths(workspaces_config_1.default(hasWorkspace));
    if (ws.prefix.length) {
        workspacePrefix = ws.prefix[0];
    }
}
let { targetDir, targetName } = index_1.getTargetDir({
    inputName: argv.length && argv[0],
    cwd,
    targetName: cli.argv.name || null,
    hasWorkspace,
    workspacePrefix,
});
fs.ensureDirSync(targetDir);
let flags = Object.keys(cli.argv)
    .reduce(function (a, f) {
    if (f === 'silent' || f === 'y' || f === 'yes') {
    }
    else if (/^[a-z]$/.test(f) && cli.argv[f]) {
        a.push(f);
    }
    return a;
}, [])
    .join('');
let args = [
    'init',
    (flags && '-' + flags),
    cli.argv.createModule,
    cli.argv.yes && '-y',
].filter(v => v);
//console.log(args);
let old_pkg_name;
if (cli.argv.yes && !targetName) {
    try {
        let pkg = new npm_package_json_loader_1.default(path.join(targetDir, 'package.json'));
        old_pkg_name = pkg.data.name;
    }
    catch (e) {
    }
}
let cp = crossSpawn.sync(cli.argv.npmClient, args, {
    stdio: 'inherit',
    cwd: targetDir,
});
if (!cp.error) {
    let pkg = new npm_package_json_loader_1.default(path.join(targetDir, 'package.json'));
    if (pkg.exists()) {
        if (cli.argv.p && cli.argv.npmClient != 'yarn') {
            pkg.data.private = true;
        }
        if (targetName && pkg.data.name != targetName) {
            pkg.data.name = targetName;
        }
        else if (cli.argv.yes && old_pkg_name && pkg.data.name != old_pkg_name) {
            pkg.data.name = old_pkg_name;
        }
        // 防止 node- 被 npm 移除
        else if (!cli.argv.yes && old_pkg_name && /^node-/.test(old_pkg_name) && ('node-' + pkg.data.name) === old_pkg_name) {
            pkg.data.name = old_pkg_name;
        }
        if (pkg.data.name && /^@/.test(pkg.data.name) && !pkg.data.publishConfig) {
            //pkg.data.publishConfig = {};
        }
        if (!pkg.data.scripts) {
            pkg.data.scripts = {};
        }
        if (!pkg.data.homepage || !pkg.data.bugs || !pkg.data.repository) {
            try {
                let info = pkg_git_info_1.npmHostedGitInfo(targetDir);
                // @ts-ignore
                pkg.data.homepage = pkg.data.homepage || info.homepage;
                if (hasWorkspace) {
                    let u = new URL(pkg.data.homepage);
                    u.pathname += '/' + pkg.data.name;
                    // @ts-ignore
                    pkg.data.homepage = u.toString();
                }
                pkg.data.bugs = pkg.data.bugs || {
                    url: info.bugs,
                };
                pkg.data.repository = pkg.data.repository || {
                    "type": "git",
                    url: info.repository,
                };
            }
            catch (e) {
            }
        }
        Object
            .entries({
            "test:mocha": "npx mocha --require ts-node/register \"!(node_modules)/**/*.{test,spec}.{ts,tsx}\"",
            "prepublish:lockfile": "npx sync-lockfile .",
            "lint": "npx eslint **/*.ts",
            "ncu": "npx yarn-tool ncu -u",
            "npm:publish": "npm publish",
            "tsc:default": "tsc -p tsconfig.json",
            "tsc:esm": "tsc -p tsconfig.esm.json",
            "sort-package-json": "npx yarn-tool sort",
            "prepublishOnly_": "yarn run ncu && yarn run sort-package-json && yarn run test",
            "postpublish_": `git commit -m "publish new version" .`,
            "coverage": "npx nyc yarn run test",
            "test": "echo \"Error: no test specified\" && exit 1",
        })
            .forEach(([k, v]) => {
            if (pkg.data.scripts[k] == null) {
                pkg.data.scripts[k] = v;
            }
        });
        pkg.autofix();
        if (cli.argv.sort) {
            pkg.sort();
        }
        pkg.writeOnlyWhenLoaded();
        try {
            let copyOptions = {
                overwrite: false,
                preserveTimestamps: true,
                errorOnExist: false,
            };
            fs.copySync(path.join(__dirname, 'lib/static'), targetDir, copyOptions);
        }
        catch (e) {
        }
        index_1.copyStaticFiles(index_1.defaultCopyStaticFiles, {
            cwd: targetDir,
        });
        /*
        fs.copySync(path.join(__dirname, 'lib/file/npmignore'), path.join(targetDir, '.npmignore'), copyOptions);

        fs.copySync(path.join(__dirname, 'lib/file/gitignore'), path.join(targetDir, '.gitignore'), copyOptions);

        if (!fs.pathExistsSync(path.join(targetDir, 'tsconfig.json')))
        {
            fs.copySync(path.join(__dirname, 'lib/file/tsconfig.json.tpl'), path.join(targetDir, 'tsconfig.json.tpl'), copyOptions);
        }
         */
    }
}
else {
    process.exitCode = 1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLEdBQUc7SUFDSCxVQUFVLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSTtJQUNqQyxZQUFZO0lBQ1osZUFBZTtDQUNmLENBQUMsQ0FBQztBQUVILEVBQUUsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFNUIsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0tBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO0lBRXJCLElBQUksQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQzlDO0tBRUM7U0FDSSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDekM7UUFDQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ1Y7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUNWLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDTCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQ1Q7QUFFRCxJQUFJLElBQUksR0FBRztJQUNWLE1BQU07SUFDTixDQUFDLEtBQUssSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWTtJQUNyQixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJO0NBQ3BCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFakIsb0JBQW9CO0FBRXBCLElBQUksWUFBb0IsQ0FBQztBQUV6QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUMvQjtJQUNDLElBQ0E7UUFDQyxJQUFJLEdBQUcsR0FBRyxJQUFJLGlDQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFFdEUsWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO0tBQzVCO0lBQ0QsT0FBTyxDQUFDLEVBQ1I7S0FFQztDQUNEO0FBRUQsSUFBSSxFQUFFLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7SUFDbEQsS0FBSyxFQUFFLFNBQVM7SUFDaEIsR0FBRyxFQUFFLFNBQVM7Q0FDZCxDQUFDLENBQUM7QUFFSCxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFDYjtJQUNDLElBQUksR0FBRyxHQUFHLElBQUksaUNBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUV0RSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFDaEI7UUFDQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU0sRUFDOUM7WUFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7U0FDeEI7UUFFRCxJQUFJLFVBQVUsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVLEVBQzdDO1lBQ0MsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1NBQzNCO2FBQ0ksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxZQUFZLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxFQUN0RTtZQUNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztTQUM3QjtRQUNELG9CQUFvQjthQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxZQUFZLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFlBQVksRUFDbkg7WUFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7U0FDN0I7UUFFRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUN4RTtZQUNDLDhCQUE4QjtTQUM5QjtRQUVELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFDckI7WUFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7U0FDdEI7UUFFRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUNoRTtZQUNDLElBQ0E7Z0JBQ0MsSUFBSSxJQUFJLEdBQUcsK0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUE7Z0JBRXRDLGFBQWE7Z0JBQ2IsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQTtnQkFFdEQsSUFBSSxZQUFZLEVBQ2hCO29CQUNDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBa0IsQ0FBQyxDQUFDO29CQUU3QyxDQUFDLENBQUMsUUFBUSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFFbEMsYUFBYTtvQkFDYixHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7aUJBQ2pDO2dCQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJO29CQUNoQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUk7aUJBQ2QsQ0FBQTtnQkFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSTtvQkFDNUMsTUFBTSxFQUFFLEtBQUs7b0JBQ2IsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVO2lCQUNwQixDQUFBO2FBQ0Q7WUFDRCxPQUFPLENBQUMsRUFDUjthQUVDO1NBQ0Q7UUFFRCxNQUFNO2FBQ0osT0FBTyxDQUFDO1lBQ1IsWUFBWSxFQUFFLG9GQUFvRjtZQUNsRyxxQkFBcUIsRUFBRSxxQkFBcUI7WUFDNUMsTUFBTSxFQUFFLG9CQUFvQjtZQUM1QixLQUFLLEVBQUUsc0JBQXNCO1lBQzdCLGFBQWEsRUFBRSxhQUFhO1lBQzVCLGFBQWEsRUFBRSxzQkFBc0I7WUFDckMsU0FBUyxFQUFFLDBCQUEwQjtZQUNyQyxtQkFBbUIsRUFBRSxvQkFBb0I7WUFDekMsaUJBQWlCLEVBQUUsNkRBQTZEO1lBQ2hGLGNBQWMsRUFBRSx1Q0FBdUM7WUFDdkQsVUFBVSxFQUFFLHVCQUF1QjtZQUNuQyxNQUFNLEVBQUUsNkNBQTZDO1NBQ3JELENBQUM7YUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBRW5CLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUMvQjtnQkFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDeEI7UUFDRixDQUFDLENBQUMsQ0FDRjtRQUVELEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVkLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2pCO1lBQ0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ1g7UUFFRCxHQUFHLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUUxQixJQUNBO1lBQ0MsSUFBSSxXQUFXLEdBQXVCO2dCQUNyQyxTQUFTLEVBQUUsS0FBSztnQkFDaEIsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FBQztZQUVGLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztRQUVELHVCQUFlLENBQUMsOEJBQXNCLEVBQUU7WUFDdkMsR0FBRyxFQUFFLFNBQVM7U0FDZCxDQUFDLENBQUM7UUFFSDs7Ozs7Ozs7O1dBU0c7S0FFSDtDQUNEO0tBRUQ7SUFDQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztDQUNyQiIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IGZpbmRZYXJuV29ya3NwYWNlUm9vdCA9IHJlcXVpcmUoJ2ZpbmQteWFybi13b3Jrc3BhY2Utcm9vdDInKTtcbmltcG9ydCB5YXJncyA9IHJlcXVpcmUoJ3lhcmdzJyk7XG5pbXBvcnQgY3Jvc3NTcGF3biA9IHJlcXVpcmUoJ2Nyb3NzLXNwYXduLWV4dHJhJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgZ2V0Q29uZmlnLCB7IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyB9IGZyb20gJ3dvcmtzcGFjZXMtY29uZmlnJztcbmltcG9ydCBQYWNrYWdlSnNvbkxvYWRlciBmcm9tICducG0tcGFja2FnZS1qc29uLWxvYWRlcic7XG5pbXBvcnQgeyB1cGRhdGVOb3RpZmllciB9IGZyb20gJ0B5YXJuLXRvb2wvdXBkYXRlLW5vdGlmaWVyJztcbmltcG9ydCBwa2cgPSByZXF1aXJlKCAnLi9wYWNrYWdlLmpzb24nICk7XG5pbXBvcnQgeyBjb3B5U3RhdGljRmlsZXMsIGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIGdldFRhcmdldERpciB9IGZyb20gJy4vbGliL2luZGV4JztcbmltcG9ydCBzZXR1cFRvWWFyZ3MgZnJvbSAnLi9saWIveWFyZ3Mtc2V0dGluZyc7XG5pbXBvcnQgeyBmaW5kUm9vdCB9IGZyb20gJ0B5YXJuLXRvb2wvZmluZC1yb290JztcbmltcG9ydCB7IG5wbUhvc3RlZEdpdEluZm8gfSBmcm9tICdAeWFybi10b29sL3BrZy1naXQtaW5mbyc7XG5cbi8vdXBkYXRlTm90aWZpZXIoX19kaXJuYW1lKTtcblxubGV0IGNsaSA9IHNldHVwVG9ZYXJncyh5YXJncyk7XG5cbmxldCBhcmd2ID0gY2xpLmFyZ3YuXztcblxuLy9jb25zb2xlLmRpcihjbGkuYXJndik7XG5cbmxldCBjd2QgPSBwYXRoLnJlc29sdmUoY2xpLmFyZ3YuY3dkIHx8IHByb2Nlc3MuY3dkKCkpO1xuXG5sZXQgcm9vdERhdGEgPSBmaW5kUm9vdCh7XG5cdGN3ZCxcblx0c2tpcENoZWNrV29ya3NwYWNlOiBjbGkuYXJndi5za2lwQ2hlY2tXb3Jrc3BhY2UsXG59KTtcblxubGV0IGhhc1dvcmtzcGFjZTogc3RyaW5nID0gcm9vdERhdGEud3M7XG5cbmxldCB3b3Jrc3BhY2VQcmVmaXg6IHN0cmluZztcblxuaWYgKGhhc1dvcmtzcGFjZSlcbntcblx0bGV0IHdzID0gcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzKGdldENvbmZpZyhoYXNXb3Jrc3BhY2UpKTtcblxuXHRpZiAod3MucHJlZml4Lmxlbmd0aClcblx0e1xuXHRcdHdvcmtzcGFjZVByZWZpeCA9IHdzLnByZWZpeFswXTtcblx0fVxufVxuXG5sZXQgeyB0YXJnZXREaXIsIHRhcmdldE5hbWUgfSA9IGdldFRhcmdldERpcih7XG5cdGlucHV0TmFtZTogYXJndi5sZW5ndGggJiYgYXJndlswXSxcblx0Y3dkLFxuXHR0YXJnZXROYW1lOiBjbGkuYXJndi5uYW1lIHx8IG51bGwsXG5cdGhhc1dvcmtzcGFjZSxcblx0d29ya3NwYWNlUHJlZml4LFxufSk7XG5cbmZzLmVuc3VyZURpclN5bmModGFyZ2V0RGlyKTtcblxubGV0IGZsYWdzID0gT2JqZWN0LmtleXMoY2xpLmFyZ3YpXG5cdC5yZWR1Y2UoZnVuY3Rpb24gKGEsIGYpXG5cdHtcblx0XHRpZiAoZiA9PT0gJ3NpbGVudCcgfHwgZiA9PT0gJ3knIHx8IGYgPT09ICd5ZXMnKVxuXHRcdHtcblxuXHRcdH1cblx0XHRlbHNlIGlmICgvXlthLXpdJC8udGVzdChmKSAmJiBjbGkuYXJndltmXSlcblx0XHR7XG5cdFx0XHRhLnB1c2goZik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGE7XG5cdH0sIFtdKVxuXHQuam9pbignJylcbjtcblxubGV0IGFyZ3MgPSBbXG5cdCdpbml0Jyxcblx0KGZsYWdzICYmICctJyArIGZsYWdzKSxcblx0Y2xpLmFyZ3YuY3JlYXRlTW9kdWxlLFxuXHRjbGkuYXJndi55ZXMgJiYgJy15Jyxcbl0uZmlsdGVyKHYgPT4gdik7XG5cbi8vY29uc29sZS5sb2coYXJncyk7XG5cbmxldCBvbGRfcGtnX25hbWU6IHN0cmluZztcblxuaWYgKGNsaS5hcmd2LnllcyAmJiAhdGFyZ2V0TmFtZSlcbntcblx0dHJ5XG5cdHtcblx0XHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0XHRvbGRfcGtnX25hbWUgPSBwa2cuZGF0YS5uYW1lXG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblxuXHR9XG59XG5cbmxldCBjcCA9IGNyb3NzU3Bhd24uc3luYyhjbGkuYXJndi5ucG1DbGllbnQsIGFyZ3MsIHtcblx0c3RkaW86ICdpbmhlcml0Jyxcblx0Y3dkOiB0YXJnZXREaXIsXG59KTtcblxuaWYgKCFjcC5lcnJvcilcbntcblx0bGV0IHBrZyA9IG5ldyBQYWNrYWdlSnNvbkxvYWRlcihwYXRoLmpvaW4odGFyZ2V0RGlyLCAncGFja2FnZS5qc29uJykpO1xuXG5cdGlmIChwa2cuZXhpc3RzKCkpXG5cdHtcblx0XHRpZiAoY2xpLmFyZ3YucCAmJiBjbGkuYXJndi5ucG1DbGllbnQgIT0gJ3lhcm4nKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnByaXZhdGUgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0YXJnZXROYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gdGFyZ2V0TmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gdGFyZ2V0TmFtZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoY2xpLmFyZ3YueWVzICYmIG9sZF9wa2dfbmFtZSAmJiBwa2cuZGF0YS5uYW1lICE9IG9sZF9wa2dfbmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gb2xkX3BrZ19uYW1lO1xuXHRcdH1cblx0XHQvLyDpmLLmraIgbm9kZS0g6KKrIG5wbSDnp7vpmaRcblx0XHRlbHNlIGlmICghY2xpLmFyZ3YueWVzICYmIG9sZF9wa2dfbmFtZSAmJiAvXm5vZGUtLy50ZXN0KG9sZF9wa2dfbmFtZSkgJiYgKCdub2RlLScgKyBwa2cuZGF0YS5uYW1lKSA9PT0gb2xkX3BrZ19uYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSBvbGRfcGtnX25hbWU7XG5cdFx0fVxuXG5cdFx0aWYgKHBrZy5kYXRhLm5hbWUgJiYgL15ALy50ZXN0KHBrZy5kYXRhLm5hbWUpICYmICFwa2cuZGF0YS5wdWJsaXNoQ29uZmlnKVxuXHRcdHtcblx0XHRcdC8vcGtnLmRhdGEucHVibGlzaENvbmZpZyA9IHt9O1xuXHRcdH1cblxuXHRcdGlmICghcGtnLmRhdGEuc2NyaXB0cylcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5zY3JpcHRzID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5ob21lcGFnZSB8fCAhcGtnLmRhdGEuYnVncyB8fCAhcGtnLmRhdGEucmVwb3NpdG9yeSlcblx0XHR7XG5cdFx0XHR0cnlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGluZm8gPSBucG1Ib3N0ZWRHaXRJbmZvKHRhcmdldERpcilcblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHBrZy5kYXRhLmhvbWVwYWdlID0gcGtnLmRhdGEuaG9tZXBhZ2UgfHwgaW5mby5ob21lcGFnZVxuXG5cdFx0XHRcdGlmIChoYXNXb3Jrc3BhY2UpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdSA9IG5ldyBVUkwocGtnLmRhdGEuaG9tZXBhZ2UgYXMgc3RyaW5nKTtcblxuXHRcdFx0XHRcdHUucGF0aG5hbWUgKz0gJy8nICsgcGtnLmRhdGEubmFtZTtcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRwa2cuZGF0YS5ob21lcGFnZSA9IHUudG9TdHJpbmcoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBrZy5kYXRhLmJ1Z3MgPSBwa2cuZGF0YS5idWdzIHx8IHtcblx0XHRcdFx0XHR1cmw6IGluZm8uYnVncyxcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBrZy5kYXRhLnJlcG9zaXRvcnkgPSBwa2cuZGF0YS5yZXBvc2l0b3J5IHx8IHtcblx0XHRcdFx0XHRcInR5cGVcIjogXCJnaXRcIixcblx0XHRcdFx0XHR1cmw6IGluZm8ucmVwb3NpdG9yeSxcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGUpXG5cdFx0XHR7XG5cblx0XHRcdH1cblx0XHR9XG5cblx0XHRPYmplY3Rcblx0XHRcdC5lbnRyaWVzKHtcblx0XHRcdFx0XCJ0ZXN0Om1vY2hhXCI6IFwibnB4IG1vY2hhIC0tcmVxdWlyZSB0cy1ub2RlL3JlZ2lzdGVyIFxcXCIhKG5vZGVfbW9kdWxlcykvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVxcXCJcIixcblx0XHRcdFx0XCJwcmVwdWJsaXNoOmxvY2tmaWxlXCI6IFwibnB4IHN5bmMtbG9ja2ZpbGUgLlwiLFxuXHRcdFx0XHRcImxpbnRcIjogXCJucHggZXNsaW50ICoqLyoudHNcIixcblx0XHRcdFx0XCJuY3VcIjogXCJucHggeWFybi10b29sIG5jdSAtdVwiLFxuXHRcdFx0XHRcIm5wbTpwdWJsaXNoXCI6IFwibnBtIHB1Ymxpc2hcIixcblx0XHRcdFx0XCJ0c2M6ZGVmYXVsdFwiOiBcInRzYyAtcCB0c2NvbmZpZy5qc29uXCIsXG5cdFx0XHRcdFwidHNjOmVzbVwiOiBcInRzYyAtcCB0c2NvbmZpZy5lc20uanNvblwiLFxuXHRcdFx0XHRcInNvcnQtcGFja2FnZS1qc29uXCI6IFwibnB4IHlhcm4tdG9vbCBzb3J0XCIsXG5cdFx0XHRcdFwicHJlcHVibGlzaE9ubHlfXCI6IFwieWFybiBydW4gbmN1ICYmIHlhcm4gcnVuIHNvcnQtcGFja2FnZS1qc29uICYmIHlhcm4gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJwb3N0cHVibGlzaF9cIjogYGdpdCBjb21taXQgLW0gXCJwdWJsaXNoIG5ldyB2ZXJzaW9uXCIgLmAsXG5cdFx0XHRcdFwiY292ZXJhZ2VcIjogXCJucHggbnljIHlhcm4gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJ0ZXN0XCI6IFwiZWNobyBcXFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXFxcIiAmJiBleGl0IDFcIixcblx0XHRcdH0pXG5cdFx0XHQuZm9yRWFjaCgoW2ssIHZdKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocGtnLmRhdGEuc2NyaXB0c1trXSA9PSBudWxsKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cGtnLmRhdGEuc2NyaXB0c1trXSA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cGtnLmF1dG9maXgoKTtcblxuXHRcdGlmIChjbGkuYXJndi5zb3J0KVxuXHRcdHtcblx0XHRcdHBrZy5zb3J0KCk7XG5cdFx0fVxuXG5cdFx0cGtnLndyaXRlT25seVdoZW5Mb2FkZWQoKTtcblxuXHRcdHRyeVxuXHRcdHtcblx0XHRcdGxldCBjb3B5T3B0aW9uczogZnMuQ29weU9wdGlvbnNTeW5jID0ge1xuXHRcdFx0XHRvdmVyd3JpdGU6IGZhbHNlLFxuXHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHRcdGVycm9yT25FeGlzdDogZmFsc2UsXG5cdFx0XHR9O1xuXG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL3N0YXRpYycpLCB0YXJnZXREaXIsIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0Y29weVN0YXRpY0ZpbGVzKGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIHtcblx0XHRcdGN3ZDogdGFyZ2V0RGlyLFxuXHRcdH0pO1xuXG5cdFx0Lypcblx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvbnBtaWdub3JlJyksIHBhdGguam9pbih0YXJnZXREaXIsICcubnBtaWdub3JlJyksIGNvcHlPcHRpb25zKTtcblxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9naXRpZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5naXRpZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbicpKSlcblx0XHR7XG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvdHNjb25maWcuanNvbi50cGwnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJ3RzY29uZmlnLmpzb24udHBsJyksIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0ICovXG5cblx0fVxufVxuZWxzZVxue1xuXHRwcm9jZXNzLmV4aXRDb2RlID0gMTtcbn1cbiJdfQ==