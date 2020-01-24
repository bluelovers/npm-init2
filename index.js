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
let oldExists = fs.existsSync(path.join(targetDir, 'package.json'));
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
                    u.pathname += '/tree/master/' + path.relative(hasWorkspace, targetDir);
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
            "postpublish_": `git commit -m "chore(release): publish" .`,
            "coverage": "npx nyc yarn run test",
            "test": `echo "Error: no test specified" && exit 1`,
        })
            .forEach(([k, v]) => {
            if (pkg.data.scripts[k] == null) {
                pkg.data.scripts[k] = v;
            }
        });
        if (!oldExists) {
            pkg.data.devDependencies = pkg.data.devDependencies || {};
            if (!pkg.data.devDependencies['@bluelovers/tsconfig']) {
                pkg.data.devDependencies['@bluelovers/tsconfig'] = "latest";
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMs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QyxlQUFlLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksRUFBRSxDQUFDO1lBRTFELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNyRDtnQkFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQzthQUM1RDtTQUNEO1FBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWQsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFDakI7WUFDQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDWDtRQUVELEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRTFCLElBQ0E7WUFDQyxJQUFJLFdBQVcsR0FBdUI7Z0JBQ3JDLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixrQkFBa0IsRUFBRSxJQUFJO2dCQUN4QixZQUFZLEVBQUUsS0FBSzthQUNuQixDQUFDO1lBRUYsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDeEU7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsdUJBQWUsQ0FBQyw4QkFBc0IsRUFBRTtZQUN2QyxHQUFHLEVBQUUsU0FBUztTQUNkLENBQUMsQ0FBQztRQUVIOzs7Ozs7Ozs7V0FTRztLQUVIO0NBQ0Q7S0FFRDtJQUNDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0NBQ3JCIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgZmluZFlhcm5Xb3Jrc3BhY2VSb290ID0gcmVxdWlyZSgnZmluZC15YXJuLXdvcmtzcGFjZS1yb290MicpO1xuaW1wb3J0IHlhcmdzID0gcmVxdWlyZSgneWFyZ3MnKTtcbmltcG9ydCBjcm9zc1NwYXduID0gcmVxdWlyZSgnY3Jvc3Mtc3Bhd24tZXh0cmEnKTtcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBnZXRDb25maWcsIHsgcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzIH0gZnJvbSAnd29ya3NwYWNlcy1jb25maWcnO1xuaW1wb3J0IFBhY2thZ2VKc29uTG9hZGVyIGZyb20gJ25wbS1wYWNrYWdlLWpzb24tbG9hZGVyJztcbmltcG9ydCB7IHVwZGF0ZU5vdGlmaWVyIH0gZnJvbSAnQHlhcm4tdG9vbC91cGRhdGUtbm90aWZpZXInO1xuaW1wb3J0IHBrZyA9IHJlcXVpcmUoICcuL3BhY2thZ2UuanNvbicgKTtcbmltcG9ydCB7IGNvcHlTdGF0aWNGaWxlcywgZGVmYXVsdENvcHlTdGF0aWNGaWxlcywgZ2V0VGFyZ2V0RGlyIH0gZnJvbSAnLi9saWIvaW5kZXgnO1xuaW1wb3J0IHNldHVwVG9ZYXJncyBmcm9tICcuL2xpYi95YXJncy1zZXR0aW5nJztcbmltcG9ydCB7IGZpbmRSb290IH0gZnJvbSAnQHlhcm4tdG9vbC9maW5kLXJvb3QnO1xuaW1wb3J0IHsgbnBtSG9zdGVkR2l0SW5mbyB9IGZyb20gJ0B5YXJuLXRvb2wvcGtnLWdpdC1pbmZvJztcblxuLy91cGRhdGVOb3RpZmllcihfX2Rpcm5hbWUpO1xuXG5sZXQgY2xpID0gc2V0dXBUb1lhcmdzKHlhcmdzKTtcblxubGV0IGFyZ3YgPSBjbGkuYXJndi5fO1xuXG4vL2NvbnNvbGUuZGlyKGNsaS5hcmd2KTtcblxubGV0IGN3ZCA9IHBhdGgucmVzb2x2ZShjbGkuYXJndi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSk7XG5cbmxldCByb290RGF0YSA9IGZpbmRSb290KHtcblx0Y3dkLFxuXHRza2lwQ2hlY2tXb3Jrc3BhY2U6IGNsaS5hcmd2LnNraXBDaGVja1dvcmtzcGFjZSxcbn0pO1xuXG5sZXQgaGFzV29ya3NwYWNlOiBzdHJpbmcgPSByb290RGF0YS53cztcblxubGV0IHdvcmtzcGFjZVByZWZpeDogc3RyaW5nO1xuXG5pZiAoaGFzV29ya3NwYWNlKVxue1xuXHRsZXQgd3MgPSBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMoZ2V0Q29uZmlnKGhhc1dvcmtzcGFjZSkpO1xuXG5cdGlmICh3cy5wcmVmaXgubGVuZ3RoKVxuXHR7XG5cdFx0d29ya3NwYWNlUHJlZml4ID0gd3MucHJlZml4WzBdO1xuXHR9XG59XG5cbmxldCB7IHRhcmdldERpciwgdGFyZ2V0TmFtZSB9ID0gZ2V0VGFyZ2V0RGlyKHtcblx0aW5wdXROYW1lOiBhcmd2Lmxlbmd0aCAmJiBhcmd2WzBdLFxuXHRjd2QsXG5cdHRhcmdldE5hbWU6IGNsaS5hcmd2Lm5hbWUgfHwgbnVsbCxcblx0aGFzV29ya3NwYWNlLFxuXHR3b3Jrc3BhY2VQcmVmaXgsXG59KTtcblxuZnMuZW5zdXJlRGlyU3luYyh0YXJnZXREaXIpO1xuXG5sZXQgZmxhZ3MgPSBPYmplY3Qua2V5cyhjbGkuYXJndilcblx0LnJlZHVjZShmdW5jdGlvbiAoYSwgZilcblx0e1xuXHRcdGlmIChmID09PSAnc2lsZW50JyB8fCBmID09PSAneScgfHwgZiA9PT0gJ3llcycpXG5cdFx0e1xuXG5cdFx0fVxuXHRcdGVsc2UgaWYgKC9eW2Etel0kLy50ZXN0KGYpICYmIGNsaS5hcmd2W2ZdKVxuXHRcdHtcblx0XHRcdGEucHVzaChmKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pXG5cdC5qb2luKCcnKVxuO1xuXG5sZXQgYXJncyA9IFtcblx0J2luaXQnLFxuXHQoZmxhZ3MgJiYgJy0nICsgZmxhZ3MpLFxuXHRjbGkuYXJndi5jcmVhdGVNb2R1bGUsXG5cdGNsaS5hcmd2LnllcyAmJiAnLXknLFxuXS5maWx0ZXIodiA9PiB2KTtcblxuLy9jb25zb2xlLmxvZyhhcmdzKTtcblxubGV0IG9sZF9wa2dfbmFtZTogc3RyaW5nO1xubGV0IG9sZEV4aXN0cyA9IGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHRhcmdldERpciwgJ3BhY2thZ2UuanNvbicpKTtcblxuaWYgKGNsaS5hcmd2LnllcyAmJiAhdGFyZ2V0TmFtZSlcbntcblx0dHJ5XG5cdHtcblx0XHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0XHRvbGRfcGtnX25hbWUgPSBwa2cuZGF0YS5uYW1lXG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblxuXHR9XG59XG5cbmxldCBjcCA9IGNyb3NzU3Bhd24uc3luYyhjbGkuYXJndi5ucG1DbGllbnQsIGFyZ3MsIHtcblx0c3RkaW86ICdpbmhlcml0Jyxcblx0Y3dkOiB0YXJnZXREaXIsXG59KTtcblxuaWYgKCFjcC5lcnJvcilcbntcblx0bGV0IHBrZyA9IG5ldyBQYWNrYWdlSnNvbkxvYWRlcihwYXRoLmpvaW4odGFyZ2V0RGlyLCAncGFja2FnZS5qc29uJykpO1xuXG5cdGlmIChwa2cuZXhpc3RzKCkpXG5cdHtcblx0XHRpZiAoY2xpLmFyZ3YucCAmJiBjbGkuYXJndi5ucG1DbGllbnQgIT0gJ3lhcm4nKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnByaXZhdGUgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0YXJnZXROYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gdGFyZ2V0TmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gdGFyZ2V0TmFtZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoY2xpLmFyZ3YueWVzICYmIG9sZF9wa2dfbmFtZSAmJiBwa2cuZGF0YS5uYW1lICE9IG9sZF9wa2dfbmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gb2xkX3BrZ19uYW1lO1xuXHRcdH1cblx0XHQvLyDpmLLmraIgbm9kZS0g6KKrIG5wbSDnp7vpmaRcblx0XHRlbHNlIGlmICghY2xpLmFyZ3YueWVzICYmIG9sZF9wa2dfbmFtZSAmJiAvXm5vZGUtLy50ZXN0KG9sZF9wa2dfbmFtZSkgJiYgKCdub2RlLScgKyBwa2cuZGF0YS5uYW1lKSA9PT0gb2xkX3BrZ19uYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSBvbGRfcGtnX25hbWU7XG5cdFx0fVxuXG5cdFx0aWYgKHBrZy5kYXRhLm5hbWUgJiYgL15ALy50ZXN0KHBrZy5kYXRhLm5hbWUpICYmICFwa2cuZGF0YS5wdWJsaXNoQ29uZmlnKVxuXHRcdHtcblx0XHRcdC8vcGtnLmRhdGEucHVibGlzaENvbmZpZyA9IHt9O1xuXHRcdH1cblxuXHRcdGlmICghcGtnLmRhdGEuc2NyaXB0cylcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5zY3JpcHRzID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5ob21lcGFnZSB8fCAhcGtnLmRhdGEuYnVncyB8fCAhcGtnLmRhdGEucmVwb3NpdG9yeSlcblx0XHR7XG5cdFx0XHR0cnlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGluZm8gPSBucG1Ib3N0ZWRHaXRJbmZvKHRhcmdldERpcik7XG5cblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRwa2cuZGF0YS5ob21lcGFnZSA9IHBrZy5kYXRhLmhvbWVwYWdlIHx8IGluZm8uaG9tZXBhZ2VcblxuXHRcdFx0XHRpZiAoaGFzV29ya3NwYWNlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IHUgPSBuZXcgVVJMKHBrZy5kYXRhLmhvbWVwYWdlIGFzIHN0cmluZyk7XG5cblx0XHRcdFx0XHR1LnBhdGhuYW1lICs9ICcvdHJlZS9tYXN0ZXIvJyArIHBhdGgucmVsYXRpdmUoaGFzV29ya3NwYWNlLCB0YXJnZXREaXIpO1xuXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdHBrZy5kYXRhLmhvbWVwYWdlID0gdS50b1N0cmluZygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGtnLmRhdGEuYnVncyA9IHBrZy5kYXRhLmJ1Z3MgfHwge1xuXHRcdFx0XHRcdHVybDogaW5mby5idWdzLFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGtnLmRhdGEucmVwb3NpdG9yeSA9IHBrZy5kYXRhLnJlcG9zaXRvcnkgfHwge1xuXHRcdFx0XHRcdFwidHlwZVwiOiBcImdpdFwiLFxuXHRcdFx0XHRcdHVybDogaW5mby5yZXBvc2l0b3J5LFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjYXRjaCAoZSlcblx0XHRcdHtcblxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdE9iamVjdFxuXHRcdFx0LmVudHJpZXMoe1xuXHRcdFx0XHRcInRlc3Q6bW9jaGFcIjogXCJucHggbW9jaGEgLS1yZXF1aXJlIHRzLW5vZGUvcmVnaXN0ZXIgXFxcIiEobm9kZV9tb2R1bGVzKS8qKi8qLnt0ZXN0LHNwZWN9Lnt0cyx0c3h9XFxcIlwiLFxuXHRcdFx0XHRcInByZXB1Ymxpc2g6bG9ja2ZpbGVcIjogXCJucHggc3luYy1sb2NrZmlsZSAuXCIsXG5cdFx0XHRcdFwibGludFwiOiBcIm5weCBlc2xpbnQgKiovKi50c1wiLFxuXHRcdFx0XHRcIm5jdVwiOiBcIm5weCB5YXJuLXRvb2wgbmN1IC11XCIsXG5cdFx0XHRcdFwibnBtOnB1Ymxpc2hcIjogXCJucG0gcHVibGlzaFwiLFxuXHRcdFx0XHRcInRzYzpkZWZhdWx0XCI6IFwidHNjIC1wIHRzY29uZmlnLmpzb25cIixcblx0XHRcdFx0XCJ0c2M6ZXNtXCI6IFwidHNjIC1wIHRzY29uZmlnLmVzbS5qc29uXCIsXG5cdFx0XHRcdFwic29ydC1wYWNrYWdlLWpzb25cIjogXCJucHggeWFybi10b29sIHNvcnRcIixcblx0XHRcdFx0XCJwcmVwdWJsaXNoT25seV9cIjogXCJ5YXJuIHJ1biBuY3UgJiYgeWFybiBydW4gc29ydC1wYWNrYWdlLWpzb24gJiYgeWFybiBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInBvc3RwdWJsaXNoX1wiOiBgZ2l0IGNvbW1pdCAtbSBcImNob3JlKHJlbGVhc2UpOiBwdWJsaXNoXCIgLmAsXG5cdFx0XHRcdFwiY292ZXJhZ2VcIjogXCJucHggbnljIHlhcm4gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJ0ZXN0XCI6IGBlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxYCxcblx0XHRcdH0pXG5cdFx0XHQuZm9yRWFjaCgoW2ssIHZdKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocGtnLmRhdGEuc2NyaXB0c1trXSA9PSBudWxsKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cGtnLmRhdGEuc2NyaXB0c1trXSA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0aWYgKCFvbGRFeGlzdHMpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEuZGV2RGVwZW5kZW5jaWVzID0gcGtnLmRhdGEuZGV2RGVwZW5kZW5jaWVzIHx8IHt9O1xuXG5cdFx0XHRpZiAoIXBrZy5kYXRhLmRldkRlcGVuZGVuY2llc1snQGJsdWVsb3ZlcnMvdHNjb25maWcnXSlcblx0XHRcdHtcblx0XHRcdFx0cGtnLmRhdGEuZGV2RGVwZW5kZW5jaWVzWydAYmx1ZWxvdmVycy90c2NvbmZpZyddID0gXCJsYXRlc3RcIjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRwa2cuYXV0b2ZpeCgpO1xuXG5cdFx0aWYgKGNsaS5hcmd2LnNvcnQpXG5cdFx0e1xuXHRcdFx0cGtnLnNvcnQoKTtcblx0XHR9XG5cblx0XHRwa2cud3JpdGVPbmx5V2hlbkxvYWRlZCgpO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0bGV0IGNvcHlPcHRpb25zOiBmcy5Db3B5T3B0aW9uc1N5bmMgPSB7XG5cdFx0XHRcdG92ZXJ3cml0ZTogZmFsc2UsXG5cdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdFx0ZXJyb3JPbkV4aXN0OiBmYWxzZSxcblx0XHRcdH07XG5cblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvc3RhdGljJyksIHRhcmdldERpciwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cblx0XHRjb3B5U3RhdGljRmlsZXMoZGVmYXVsdENvcHlTdGF0aWNGaWxlcywge1xuXHRcdFx0Y3dkOiB0YXJnZXREaXIsXG5cdFx0fSk7XG5cblx0XHQvKlxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9ucG1pZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5ucG1pZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL2dpdGlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLmdpdGlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uJykpKVxuXHRcdHtcblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS90c2NvbmZpZy5qc29uLnRwbCcpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbi50cGwnKSwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHQgKi9cblxuXHR9XG59XG5lbHNlXG57XG5cdHByb2Nlc3MuZXhpdENvZGUgPSAxO1xufVxuIl19