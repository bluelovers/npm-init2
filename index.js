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
            "lint": "npx eslint **/*.ts",
            "ncu": "npx yarn-tool ncu -u",
            "sort-package-json": "npx sort-package-json ./package.json",
            "prepublishOnly": "npm run ncu && npm run sort-package-json && npm run test",
            "postpublish": `git commit -m "publish new version" .`,
            "coverage": "npx nyc npm run test",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMs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RSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBRW5CLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUMvQjtnQkFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDeEI7UUFDRixDQUFDLENBQUMsQ0FDRjtRQUVELEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVkLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2pCO1lBQ0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ1g7UUFFRCxHQUFHLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUUxQixJQUNBO1lBQ0MsSUFBSSxXQUFXLEdBQXVCO2dCQUNyQyxTQUFTLEVBQUUsS0FBSztnQkFDaEIsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FBQztZQUVGLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztRQUVELHVCQUFlLENBQUMsOEJBQXNCLEVBQUU7WUFDdkMsR0FBRyxFQUFFLFNBQVM7U0FDZCxDQUFDLENBQUM7UUFFSDs7Ozs7Ozs7O1dBU0c7S0FFSDtDQUNEO0tBRUQ7SUFDQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztDQUNyQiIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IGZpbmRZYXJuV29ya3NwYWNlUm9vdCA9IHJlcXVpcmUoJ2ZpbmQteWFybi13b3Jrc3BhY2Utcm9vdDInKTtcbmltcG9ydCB5YXJncyA9IHJlcXVpcmUoJ3lhcmdzJyk7XG5pbXBvcnQgY3Jvc3NTcGF3biA9IHJlcXVpcmUoJ2Nyb3NzLXNwYXduLWV4dHJhJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgZ2V0Q29uZmlnLCB7IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyB9IGZyb20gJ3dvcmtzcGFjZXMtY29uZmlnJztcbmltcG9ydCBQYWNrYWdlSnNvbkxvYWRlciBmcm9tICducG0tcGFja2FnZS1qc29uLWxvYWRlcic7XG5pbXBvcnQgeyB1cGRhdGVOb3RpZmllciB9IGZyb20gJ0B5YXJuLXRvb2wvdXBkYXRlLW5vdGlmaWVyJztcbmltcG9ydCBwa2cgPSByZXF1aXJlKCAnLi9wYWNrYWdlLmpzb24nICk7XG5pbXBvcnQgeyBjb3B5U3RhdGljRmlsZXMsIGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIGdldFRhcmdldERpciB9IGZyb20gJy4vbGliL2luZGV4JztcbmltcG9ydCBzZXR1cFRvWWFyZ3MgZnJvbSAnLi9saWIveWFyZ3Mtc2V0dGluZyc7XG5pbXBvcnQgeyBmaW5kUm9vdCB9IGZyb20gJ0B5YXJuLXRvb2wvZmluZC1yb290JztcbmltcG9ydCB7IG5wbUhvc3RlZEdpdEluZm8gfSBmcm9tICdAeWFybi10b29sL3BrZy1naXQtaW5mbyc7XG5cbi8vdXBkYXRlTm90aWZpZXIoX19kaXJuYW1lKTtcblxubGV0IGNsaSA9IHNldHVwVG9ZYXJncyh5YXJncyk7XG5cbmxldCBhcmd2ID0gY2xpLmFyZ3YuXztcblxuLy9jb25zb2xlLmRpcihjbGkuYXJndik7XG5cbmxldCBjd2QgPSBwYXRoLnJlc29sdmUoY2xpLmFyZ3YuY3dkIHx8IHByb2Nlc3MuY3dkKCkpO1xuXG5sZXQgcm9vdERhdGEgPSBmaW5kUm9vdCh7XG5cdGN3ZCxcblx0c2tpcENoZWNrV29ya3NwYWNlOiBjbGkuYXJndi5za2lwQ2hlY2tXb3Jrc3BhY2UsXG59KTtcblxubGV0IGhhc1dvcmtzcGFjZTogc3RyaW5nID0gcm9vdERhdGEud3M7XG5cbmxldCB3b3Jrc3BhY2VQcmVmaXg6IHN0cmluZztcblxuaWYgKGhhc1dvcmtzcGFjZSlcbntcblx0bGV0IHdzID0gcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzKGdldENvbmZpZyhoYXNXb3Jrc3BhY2UpKTtcblxuXHRpZiAod3MucHJlZml4Lmxlbmd0aClcblx0e1xuXHRcdHdvcmtzcGFjZVByZWZpeCA9IHdzLnByZWZpeFswXTtcblx0fVxufVxuXG5sZXQgeyB0YXJnZXREaXIsIHRhcmdldE5hbWUgfSA9IGdldFRhcmdldERpcih7XG5cdGlucHV0TmFtZTogYXJndi5sZW5ndGggJiYgYXJndlswXSxcblx0Y3dkLFxuXHR0YXJnZXROYW1lOiBjbGkuYXJndi5uYW1lIHx8IG51bGwsXG5cdGhhc1dvcmtzcGFjZSxcblx0d29ya3NwYWNlUHJlZml4LFxufSk7XG5cbmZzLmVuc3VyZURpclN5bmModGFyZ2V0RGlyKTtcblxubGV0IGZsYWdzID0gT2JqZWN0LmtleXMoY2xpLmFyZ3YpXG5cdC5yZWR1Y2UoZnVuY3Rpb24gKGEsIGYpXG5cdHtcblx0XHRpZiAoZiA9PT0gJ3NpbGVudCcgfHwgZiA9PT0gJ3knIHx8IGYgPT09ICd5ZXMnKVxuXHRcdHtcblxuXHRcdH1cblx0XHRlbHNlIGlmICgvXlthLXpdJC8udGVzdChmKSAmJiBjbGkuYXJndltmXSlcblx0XHR7XG5cdFx0XHRhLnB1c2goZik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGE7XG5cdH0sIFtdKVxuXHQuam9pbignJylcbjtcblxubGV0IGFyZ3MgPSBbXG5cdCdpbml0Jyxcblx0KGZsYWdzICYmICctJyArIGZsYWdzKSxcblx0Y2xpLmFyZ3YuY3JlYXRlTW9kdWxlLFxuXHRjbGkuYXJndi55ZXMgJiYgJy15Jyxcbl0uZmlsdGVyKHYgPT4gdik7XG5cbi8vY29uc29sZS5sb2coYXJncyk7XG5cbmxldCBvbGRfcGtnX25hbWU6IHN0cmluZztcblxuaWYgKGNsaS5hcmd2LnllcyAmJiAhdGFyZ2V0TmFtZSlcbntcblx0dHJ5XG5cdHtcblx0XHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0XHRvbGRfcGtnX25hbWUgPSBwa2cuZGF0YS5uYW1lXG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblxuXHR9XG59XG5cbmxldCBjcCA9IGNyb3NzU3Bhd24uc3luYyhjbGkuYXJndi5ucG1DbGllbnQsIGFyZ3MsIHtcblx0c3RkaW86ICdpbmhlcml0Jyxcblx0Y3dkOiB0YXJnZXREaXIsXG59KTtcblxuaWYgKCFjcC5lcnJvcilcbntcblx0bGV0IHBrZyA9IG5ldyBQYWNrYWdlSnNvbkxvYWRlcihwYXRoLmpvaW4odGFyZ2V0RGlyLCAncGFja2FnZS5qc29uJykpO1xuXG5cdGlmIChwa2cuZXhpc3RzKCkpXG5cdHtcblx0XHRpZiAoY2xpLmFyZ3YucCAmJiBjbGkuYXJndi5ucG1DbGllbnQgIT0gJ3lhcm4nKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnByaXZhdGUgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0YXJnZXROYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gdGFyZ2V0TmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gdGFyZ2V0TmFtZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoY2xpLmFyZ3YueWVzICYmIG9sZF9wa2dfbmFtZSAmJiBwa2cuZGF0YS5uYW1lICE9IG9sZF9wa2dfbmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gb2xkX3BrZ19uYW1lO1xuXHRcdH1cblxuXHRcdGlmIChwa2cuZGF0YS5uYW1lICYmIC9eQC8udGVzdChwa2cuZGF0YS5uYW1lKSAmJiAhcGtnLmRhdGEucHVibGlzaENvbmZpZylcblx0XHR7XG5cdFx0XHQvL3BrZy5kYXRhLnB1Ymxpc2hDb25maWcgPSB7fTtcblx0XHR9XG5cblx0XHRpZiAoIXBrZy5kYXRhLnNjcmlwdHMpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEuc2NyaXB0cyA9IHt9O1xuXHRcdH1cblxuXHRcdGlmICghcGtnLmRhdGEuaG9tZXBhZ2UgfHwgIXBrZy5kYXRhLmJ1Z3MgfHwgIXBrZy5kYXRhLnJlcG9zaXRvcnkpXG5cdFx0e1xuXHRcdFx0dHJ5XG5cdFx0XHR7XG5cdFx0XHRcdGxldCBpbmZvID0gbnBtSG9zdGVkR2l0SW5mbyh0YXJnZXREaXIpXG5cblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRwa2cuZGF0YS5ob21lcGFnZSA9IHBrZy5kYXRhLmhvbWVwYWdlIHx8IGluZm8uaG9tZXBhZ2VcblxuXHRcdFx0XHRwa2cuZGF0YS5idWdzID0gcGtnLmRhdGEuYnVncyB8fCB7XG5cdFx0XHRcdFx0dXJsOiBpbmZvLmJ1Z3MsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwa2cuZGF0YS5yZXBvc2l0b3J5ID0gcGtnLmRhdGEucmVwb3NpdG9yeSB8fCB7XG5cdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZ2l0XCIsXG5cdFx0XHRcdFx0dXJsOiBpbmZvLnJlcG9zaXRvcnksXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlKVxuXHRcdFx0e1xuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0T2JqZWN0XG5cdFx0XHQuZW50cmllcyh7XG5cdFx0XHRcdFwibGludFwiOiBcIm5weCBlc2xpbnQgKiovKi50c1wiLFxuXHRcdFx0XHRcIm5jdVwiOiBcIm5weCB5YXJuLXRvb2wgbmN1IC11XCIsXG5cdFx0XHRcdFwic29ydC1wYWNrYWdlLWpzb25cIjogXCJucHggc29ydC1wYWNrYWdlLWpzb24gLi9wYWNrYWdlLmpzb25cIixcblx0XHRcdFx0XCJwcmVwdWJsaXNoT25seVwiOiBcIm5wbSBydW4gbmN1ICYmIG5wbSBydW4gc29ydC1wYWNrYWdlLWpzb24gJiYgbnBtIHJ1biB0ZXN0XCIsXG5cdFx0XHRcdFwicG9zdHB1Ymxpc2hcIjogYGdpdCBjb21taXQgLW0gXCJwdWJsaXNoIG5ldyB2ZXJzaW9uXCIgLmAsXG5cdFx0XHRcdFwiY292ZXJhZ2VcIjogXCJucHggbnljIG5wbSBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInRlc3RcIjogXCJlY2hvIFxcXCJFcnJvcjogbm8gdGVzdCBzcGVjaWZpZWRcXFwiICYmIGV4aXQgMVwiLFxuXHRcdFx0fSlcblx0XHRcdC5mb3JFYWNoKChbaywgdl0pID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChwa2cuZGF0YS5zY3JpcHRzW2tdID09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwa2cuZGF0YS5zY3JpcHRzW2tdID0gdjtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRwa2cuYXV0b2ZpeCgpO1xuXG5cdFx0aWYgKGNsaS5hcmd2LnNvcnQpXG5cdFx0e1xuXHRcdFx0cGtnLnNvcnQoKTtcblx0XHR9XG5cblx0XHRwa2cud3JpdGVPbmx5V2hlbkxvYWRlZCgpO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0bGV0IGNvcHlPcHRpb25zOiBmcy5Db3B5T3B0aW9uc1N5bmMgPSB7XG5cdFx0XHRcdG92ZXJ3cml0ZTogZmFsc2UsXG5cdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdFx0ZXJyb3JPbkV4aXN0OiBmYWxzZSxcblx0XHRcdH07XG5cblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvc3RhdGljJyksIHRhcmdldERpciwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cblx0XHRjb3B5U3RhdGljRmlsZXMoZGVmYXVsdENvcHlTdGF0aWNGaWxlcywge1xuXHRcdFx0Y3dkOiB0YXJnZXREaXIsXG5cdFx0fSk7XG5cblx0XHQvKlxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9ucG1pZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5ucG1pZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL2dpdGlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLmdpdGlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uJykpKVxuXHRcdHtcblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS90c2NvbmZpZy5qc29uLnRwbCcpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbi50cGwnKSwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHQgKi9cblxuXHR9XG59XG5lbHNlXG57XG5cdHByb2Nlc3MuZXhpdENvZGUgPSAxO1xufVxuIl19