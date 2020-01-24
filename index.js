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
        if (!old_pkg_name) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMs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QWUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNyRDtnQkFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQzthQUM1RDtTQUNEO1FBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWQsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFDakI7WUFDQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDWDtRQUVELEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRTFCLElBQ0E7WUFDQyxJQUFJLFdBQVcsR0FBdUI7Z0JBQ3JDLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixrQkFBa0IsRUFBRSxJQUFJO2dCQUN4QixZQUFZLEVBQUUsS0FBSzthQUNuQixDQUFDO1lBRUYsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDeEU7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsdUJBQWUsQ0FBQyw4QkFBc0IsRUFBRTtZQUN2QyxHQUFHLEVBQUUsU0FBUztTQUNkLENBQUMsQ0FBQztRQUVIOzs7Ozs7Ozs7V0FTRztLQUVIO0NBQ0Q7S0FFRDtJQUNDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0NBQ3JCIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgZmluZFlhcm5Xb3Jrc3BhY2VSb290ID0gcmVxdWlyZSgnZmluZC15YXJuLXdvcmtzcGFjZS1yb290MicpO1xuaW1wb3J0IHlhcmdzID0gcmVxdWlyZSgneWFyZ3MnKTtcbmltcG9ydCBjcm9zc1NwYXduID0gcmVxdWlyZSgnY3Jvc3Mtc3Bhd24tZXh0cmEnKTtcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBnZXRDb25maWcsIHsgcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzIH0gZnJvbSAnd29ya3NwYWNlcy1jb25maWcnO1xuaW1wb3J0IFBhY2thZ2VKc29uTG9hZGVyIGZyb20gJ25wbS1wYWNrYWdlLWpzb24tbG9hZGVyJztcbmltcG9ydCB7IHVwZGF0ZU5vdGlmaWVyIH0gZnJvbSAnQHlhcm4tdG9vbC91cGRhdGUtbm90aWZpZXInO1xuaW1wb3J0IHBrZyA9IHJlcXVpcmUoICcuL3BhY2thZ2UuanNvbicgKTtcbmltcG9ydCB7IGNvcHlTdGF0aWNGaWxlcywgZGVmYXVsdENvcHlTdGF0aWNGaWxlcywgZ2V0VGFyZ2V0RGlyIH0gZnJvbSAnLi9saWIvaW5kZXgnO1xuaW1wb3J0IHNldHVwVG9ZYXJncyBmcm9tICcuL2xpYi95YXJncy1zZXR0aW5nJztcbmltcG9ydCB7IGZpbmRSb290IH0gZnJvbSAnQHlhcm4tdG9vbC9maW5kLXJvb3QnO1xuaW1wb3J0IHsgbnBtSG9zdGVkR2l0SW5mbyB9IGZyb20gJ0B5YXJuLXRvb2wvcGtnLWdpdC1pbmZvJztcblxuLy91cGRhdGVOb3RpZmllcihfX2Rpcm5hbWUpO1xuXG5sZXQgY2xpID0gc2V0dXBUb1lhcmdzKHlhcmdzKTtcblxubGV0IGFyZ3YgPSBjbGkuYXJndi5fO1xuXG4vL2NvbnNvbGUuZGlyKGNsaS5hcmd2KTtcblxubGV0IGN3ZCA9IHBhdGgucmVzb2x2ZShjbGkuYXJndi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSk7XG5cbmxldCByb290RGF0YSA9IGZpbmRSb290KHtcblx0Y3dkLFxuXHRza2lwQ2hlY2tXb3Jrc3BhY2U6IGNsaS5hcmd2LnNraXBDaGVja1dvcmtzcGFjZSxcbn0pO1xuXG5sZXQgaGFzV29ya3NwYWNlOiBzdHJpbmcgPSByb290RGF0YS53cztcblxubGV0IHdvcmtzcGFjZVByZWZpeDogc3RyaW5nO1xuXG5pZiAoaGFzV29ya3NwYWNlKVxue1xuXHRsZXQgd3MgPSBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMoZ2V0Q29uZmlnKGhhc1dvcmtzcGFjZSkpO1xuXG5cdGlmICh3cy5wcmVmaXgubGVuZ3RoKVxuXHR7XG5cdFx0d29ya3NwYWNlUHJlZml4ID0gd3MucHJlZml4WzBdO1xuXHR9XG59XG5cbmxldCB7IHRhcmdldERpciwgdGFyZ2V0TmFtZSB9ID0gZ2V0VGFyZ2V0RGlyKHtcblx0aW5wdXROYW1lOiBhcmd2Lmxlbmd0aCAmJiBhcmd2WzBdLFxuXHRjd2QsXG5cdHRhcmdldE5hbWU6IGNsaS5hcmd2Lm5hbWUgfHwgbnVsbCxcblx0aGFzV29ya3NwYWNlLFxuXHR3b3Jrc3BhY2VQcmVmaXgsXG59KTtcblxuZnMuZW5zdXJlRGlyU3luYyh0YXJnZXREaXIpO1xuXG5sZXQgZmxhZ3MgPSBPYmplY3Qua2V5cyhjbGkuYXJndilcblx0LnJlZHVjZShmdW5jdGlvbiAoYSwgZilcblx0e1xuXHRcdGlmIChmID09PSAnc2lsZW50JyB8fCBmID09PSAneScgfHwgZiA9PT0gJ3llcycpXG5cdFx0e1xuXG5cdFx0fVxuXHRcdGVsc2UgaWYgKC9eW2Etel0kLy50ZXN0KGYpICYmIGNsaS5hcmd2W2ZdKVxuXHRcdHtcblx0XHRcdGEucHVzaChmKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pXG5cdC5qb2luKCcnKVxuO1xuXG5sZXQgYXJncyA9IFtcblx0J2luaXQnLFxuXHQoZmxhZ3MgJiYgJy0nICsgZmxhZ3MpLFxuXHRjbGkuYXJndi5jcmVhdGVNb2R1bGUsXG5cdGNsaS5hcmd2LnllcyAmJiAnLXknLFxuXS5maWx0ZXIodiA9PiB2KTtcblxuLy9jb25zb2xlLmxvZyhhcmdzKTtcblxubGV0IG9sZF9wa2dfbmFtZTogc3RyaW5nO1xuXG5pZiAoY2xpLmFyZ3YueWVzICYmICF0YXJnZXROYW1lKVxue1xuXHR0cnlcblx0e1xuXHRcdGxldCBwa2cgPSBuZXcgUGFja2FnZUpzb25Mb2FkZXIocGF0aC5qb2luKHRhcmdldERpciwgJ3BhY2thZ2UuanNvbicpKTtcblxuXHRcdG9sZF9wa2dfbmFtZSA9IHBrZy5kYXRhLm5hbWVcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXG5cdH1cbn1cblxubGV0IGNwID0gY3Jvc3NTcGF3bi5zeW5jKGNsaS5hcmd2Lm5wbUNsaWVudCwgYXJncywge1xuXHRzdGRpbzogJ2luaGVyaXQnLFxuXHRjd2Q6IHRhcmdldERpcixcbn0pO1xuXG5pZiAoIWNwLmVycm9yKVxue1xuXHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0aWYgKHBrZy5leGlzdHMoKSlcblx0e1xuXHRcdGlmIChjbGkuYXJndi5wICYmIGNsaS5hcmd2Lm5wbUNsaWVudCAhPSAneWFybicpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEucHJpdmF0ZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHRhcmdldE5hbWUgJiYgcGtnLmRhdGEubmFtZSAhPSB0YXJnZXROYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSB0YXJnZXROYW1lO1xuXHRcdH1cblx0XHRlbHNlIGlmIChjbGkuYXJndi55ZXMgJiYgb2xkX3BrZ19uYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gb2xkX3BrZ19uYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSBvbGRfcGtnX25hbWU7XG5cdFx0fVxuXHRcdC8vIOmYsuatoiBub2RlLSDooqsgbnBtIOenu+mZpFxuXHRcdGVsc2UgaWYgKCFjbGkuYXJndi55ZXMgJiYgb2xkX3BrZ19uYW1lICYmIC9ebm9kZS0vLnRlc3Qob2xkX3BrZ19uYW1lKSAmJiAoJ25vZGUtJyArIHBrZy5kYXRhLm5hbWUpID09PSBvbGRfcGtnX25hbWUpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEubmFtZSA9IG9sZF9wa2dfbmFtZTtcblx0XHR9XG5cblx0XHRpZiAocGtnLmRhdGEubmFtZSAmJiAvXkAvLnRlc3QocGtnLmRhdGEubmFtZSkgJiYgIXBrZy5kYXRhLnB1Ymxpc2hDb25maWcpXG5cdFx0e1xuXHRcdFx0Ly9wa2cuZGF0YS5wdWJsaXNoQ29uZmlnID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5zY3JpcHRzKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnNjcmlwdHMgPSB7fTtcblx0XHR9XG5cblx0XHRpZiAoIXBrZy5kYXRhLmhvbWVwYWdlIHx8ICFwa2cuZGF0YS5idWdzIHx8ICFwa2cuZGF0YS5yZXBvc2l0b3J5KVxuXHRcdHtcblx0XHRcdHRyeVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgaW5mbyA9IG5wbUhvc3RlZEdpdEluZm8odGFyZ2V0RGlyKTtcblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHBrZy5kYXRhLmhvbWVwYWdlID0gcGtnLmRhdGEuaG9tZXBhZ2UgfHwgaW5mby5ob21lcGFnZVxuXG5cdFx0XHRcdGlmIChoYXNXb3Jrc3BhY2UpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdSA9IG5ldyBVUkwocGtnLmRhdGEuaG9tZXBhZ2UgYXMgc3RyaW5nKTtcblxuXHRcdFx0XHRcdHUucGF0aG5hbWUgKz0gJy90cmVlL21hc3Rlci8nICsgcGF0aC5yZWxhdGl2ZShoYXNXb3Jrc3BhY2UsIHRhcmdldERpcik7XG5cblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0cGtnLmRhdGEuaG9tZXBhZ2UgPSB1LnRvU3RyaW5nKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwa2cuZGF0YS5idWdzID0gcGtnLmRhdGEuYnVncyB8fCB7XG5cdFx0XHRcdFx0dXJsOiBpbmZvLmJ1Z3MsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwa2cuZGF0YS5yZXBvc2l0b3J5ID0gcGtnLmRhdGEucmVwb3NpdG9yeSB8fCB7XG5cdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZ2l0XCIsXG5cdFx0XHRcdFx0dXJsOiBpbmZvLnJlcG9zaXRvcnksXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlKVxuXHRcdFx0e1xuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0T2JqZWN0XG5cdFx0XHQuZW50cmllcyh7XG5cdFx0XHRcdFwidGVzdDptb2NoYVwiOiBcIm5weCBtb2NoYSAtLXJlcXVpcmUgdHMtbm9kZS9yZWdpc3RlciBcXFwiIShub2RlX21vZHVsZXMpLyoqLyoue3Rlc3Qsc3BlY30ue3RzLHRzeH1cXFwiXCIsXG5cdFx0XHRcdFwicHJlcHVibGlzaDpsb2NrZmlsZVwiOiBcIm5weCBzeW5jLWxvY2tmaWxlIC5cIixcblx0XHRcdFx0XCJsaW50XCI6IFwibnB4IGVzbGludCAqKi8qLnRzXCIsXG5cdFx0XHRcdFwibmN1XCI6IFwibnB4IHlhcm4tdG9vbCBuY3UgLXVcIixcblx0XHRcdFx0XCJucG06cHVibGlzaFwiOiBcIm5wbSBwdWJsaXNoXCIsXG5cdFx0XHRcdFwidHNjOmRlZmF1bHRcIjogXCJ0c2MgLXAgdHNjb25maWcuanNvblwiLFxuXHRcdFx0XHRcInRzYzplc21cIjogXCJ0c2MgLXAgdHNjb25maWcuZXNtLmpzb25cIixcblx0XHRcdFx0XCJzb3J0LXBhY2thZ2UtanNvblwiOiBcIm5weCB5YXJuLXRvb2wgc29ydFwiLFxuXHRcdFx0XHRcInByZXB1Ymxpc2hPbmx5X1wiOiBcInlhcm4gcnVuIG5jdSAmJiB5YXJuIHJ1biBzb3J0LXBhY2thZ2UtanNvbiAmJiB5YXJuIHJ1biB0ZXN0XCIsXG5cdFx0XHRcdFwicG9zdHB1Ymxpc2hfXCI6IGBnaXQgY29tbWl0IC1tIFwiY2hvcmUocmVsZWFzZSk6IHB1Ymxpc2hcIiAuYCxcblx0XHRcdFx0XCJjb3ZlcmFnZVwiOiBcIm5weCBueWMgeWFybiBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInRlc3RcIjogYGVjaG8gXCJFcnJvcjogbm8gdGVzdCBzcGVjaWZpZWRcIiAmJiBleGl0IDFgLFxuXHRcdFx0fSlcblx0XHRcdC5mb3JFYWNoKChbaywgdl0pID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChwa2cuZGF0YS5zY3JpcHRzW2tdID09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwa2cuZGF0YS5zY3JpcHRzW2tdID0gdjtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRpZiAoIW9sZF9wa2dfbmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5kZXZEZXBlbmRlbmNpZXMgPSBwa2cuZGF0YS5kZXZEZXBlbmRlbmNpZXMgfHwge307XG5cblx0XHRcdGlmICghcGtnLmRhdGEuZGV2RGVwZW5kZW5jaWVzWydAYmx1ZWxvdmVycy90c2NvbmZpZyddKVxuXHRcdFx0e1xuXHRcdFx0XHRwa2cuZGF0YS5kZXZEZXBlbmRlbmNpZXNbJ0BibHVlbG92ZXJzL3RzY29uZmlnJ10gPSBcImxhdGVzdFwiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHBrZy5hdXRvZml4KCk7XG5cblx0XHRpZiAoY2xpLmFyZ3Yuc29ydClcblx0XHR7XG5cdFx0XHRwa2cuc29ydCgpO1xuXHRcdH1cblxuXHRcdHBrZy53cml0ZU9ubHlXaGVuTG9hZGVkKCk7XG5cblx0XHR0cnlcblx0XHR7XG5cdFx0XHRsZXQgY29weU9wdGlvbnM6IGZzLkNvcHlPcHRpb25zU3luYyA9IHtcblx0XHRcdFx0b3ZlcndyaXRlOiBmYWxzZSxcblx0XHRcdFx0cHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0XHRlcnJvck9uRXhpc3Q6IGZhbHNlLFxuXHRcdFx0fTtcblxuXHRcdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9zdGF0aWMnKSwgdGFyZ2V0RGlyLCBjb3B5T3B0aW9ucyk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblxuXHRcdGNvcHlTdGF0aWNGaWxlcyhkZWZhdWx0Q29weVN0YXRpY0ZpbGVzLCB7XG5cdFx0XHRjd2Q6IHRhcmdldERpcixcblx0XHR9KTtcblxuXHRcdC8qXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL25wbWlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLm5wbWlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvZ2l0aWdub3JlJyksIHBhdGguam9pbih0YXJnZXREaXIsICcuZ2l0aWdub3JlJyksIGNvcHlPcHRpb25zKTtcblxuXHRcdGlmICghZnMucGF0aEV4aXN0c1N5bmMocGF0aC5qb2luKHRhcmdldERpciwgJ3RzY29uZmlnLmpzb24nKSkpXG5cdFx0e1xuXHRcdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL3RzY29uZmlnLmpzb24udHBsJyksIHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uLnRwbCcpLCBjb3B5T3B0aW9ucyk7XG5cdFx0fVxuXHRcdCAqL1xuXG5cdH1cbn1cbmVsc2Vcbntcblx0cHJvY2Vzcy5leGl0Q29kZSA9IDE7XG59XG4iXX0=