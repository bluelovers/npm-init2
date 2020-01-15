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
            "sort-package-json": "npx sort-package-json ./package.json",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMs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UjtTQUVDO1FBRUQsdUJBQWUsQ0FBQyw4QkFBc0IsRUFBRTtZQUN2QyxHQUFHLEVBQUUsU0FBUztTQUNkLENBQUMsQ0FBQztRQUVIOzs7Ozs7Ozs7V0FTRztLQUVIO0NBQ0Q7S0FFRDtJQUNDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0NBQ3JCIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgZmluZFlhcm5Xb3Jrc3BhY2VSb290ID0gcmVxdWlyZSgnZmluZC15YXJuLXdvcmtzcGFjZS1yb290MicpO1xuaW1wb3J0IHlhcmdzID0gcmVxdWlyZSgneWFyZ3MnKTtcbmltcG9ydCBjcm9zc1NwYXduID0gcmVxdWlyZSgnY3Jvc3Mtc3Bhd24tZXh0cmEnKTtcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBnZXRDb25maWcsIHsgcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzIH0gZnJvbSAnd29ya3NwYWNlcy1jb25maWcnO1xuaW1wb3J0IFBhY2thZ2VKc29uTG9hZGVyIGZyb20gJ25wbS1wYWNrYWdlLWpzb24tbG9hZGVyJztcbmltcG9ydCB7IHVwZGF0ZU5vdGlmaWVyIH0gZnJvbSAnQHlhcm4tdG9vbC91cGRhdGUtbm90aWZpZXInO1xuaW1wb3J0IHBrZyA9IHJlcXVpcmUoICcuL3BhY2thZ2UuanNvbicgKTtcbmltcG9ydCB7IGNvcHlTdGF0aWNGaWxlcywgZGVmYXVsdENvcHlTdGF0aWNGaWxlcywgZ2V0VGFyZ2V0RGlyIH0gZnJvbSAnLi9saWIvaW5kZXgnO1xuaW1wb3J0IHNldHVwVG9ZYXJncyBmcm9tICcuL2xpYi95YXJncy1zZXR0aW5nJztcbmltcG9ydCB7IGZpbmRSb290IH0gZnJvbSAnQHlhcm4tdG9vbC9maW5kLXJvb3QnO1xuaW1wb3J0IHsgbnBtSG9zdGVkR2l0SW5mbyB9IGZyb20gJ0B5YXJuLXRvb2wvcGtnLWdpdC1pbmZvJztcblxuLy91cGRhdGVOb3RpZmllcihfX2Rpcm5hbWUpO1xuXG5sZXQgY2xpID0gc2V0dXBUb1lhcmdzKHlhcmdzKTtcblxubGV0IGFyZ3YgPSBjbGkuYXJndi5fO1xuXG4vL2NvbnNvbGUuZGlyKGNsaS5hcmd2KTtcblxubGV0IGN3ZCA9IHBhdGgucmVzb2x2ZShjbGkuYXJndi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSk7XG5cbmxldCByb290RGF0YSA9IGZpbmRSb290KHtcblx0Y3dkLFxuXHRza2lwQ2hlY2tXb3Jrc3BhY2U6IGNsaS5hcmd2LnNraXBDaGVja1dvcmtzcGFjZSxcbn0pO1xuXG5sZXQgaGFzV29ya3NwYWNlOiBzdHJpbmcgPSByb290RGF0YS53cztcblxubGV0IHdvcmtzcGFjZVByZWZpeDogc3RyaW5nO1xuXG5pZiAoaGFzV29ya3NwYWNlKVxue1xuXHRsZXQgd3MgPSBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMoZ2V0Q29uZmlnKGhhc1dvcmtzcGFjZSkpO1xuXG5cdGlmICh3cy5wcmVmaXgubGVuZ3RoKVxuXHR7XG5cdFx0d29ya3NwYWNlUHJlZml4ID0gd3MucHJlZml4WzBdO1xuXHR9XG59XG5cbmxldCB7IHRhcmdldERpciwgdGFyZ2V0TmFtZSB9ID0gZ2V0VGFyZ2V0RGlyKHtcblx0aW5wdXROYW1lOiBhcmd2Lmxlbmd0aCAmJiBhcmd2WzBdLFxuXHRjd2QsXG5cdHRhcmdldE5hbWU6IGNsaS5hcmd2Lm5hbWUgfHwgbnVsbCxcblx0aGFzV29ya3NwYWNlLFxuXHR3b3Jrc3BhY2VQcmVmaXgsXG59KTtcblxuZnMuZW5zdXJlRGlyU3luYyh0YXJnZXREaXIpO1xuXG5sZXQgZmxhZ3MgPSBPYmplY3Qua2V5cyhjbGkuYXJndilcblx0LnJlZHVjZShmdW5jdGlvbiAoYSwgZilcblx0e1xuXHRcdGlmIChmID09PSAnc2lsZW50JyB8fCBmID09PSAneScgfHwgZiA9PT0gJ3llcycpXG5cdFx0e1xuXG5cdFx0fVxuXHRcdGVsc2UgaWYgKC9eW2Etel0kLy50ZXN0KGYpICYmIGNsaS5hcmd2W2ZdKVxuXHRcdHtcblx0XHRcdGEucHVzaChmKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pXG5cdC5qb2luKCcnKVxuO1xuXG5sZXQgYXJncyA9IFtcblx0J2luaXQnLFxuXHQoZmxhZ3MgJiYgJy0nICsgZmxhZ3MpLFxuXHRjbGkuYXJndi5jcmVhdGVNb2R1bGUsXG5cdGNsaS5hcmd2LnllcyAmJiAnLXknLFxuXS5maWx0ZXIodiA9PiB2KTtcblxuLy9jb25zb2xlLmxvZyhhcmdzKTtcblxubGV0IG9sZF9wa2dfbmFtZTogc3RyaW5nO1xuXG5pZiAoY2xpLmFyZ3YueWVzICYmICF0YXJnZXROYW1lKVxue1xuXHR0cnlcblx0e1xuXHRcdGxldCBwa2cgPSBuZXcgUGFja2FnZUpzb25Mb2FkZXIocGF0aC5qb2luKHRhcmdldERpciwgJ3BhY2thZ2UuanNvbicpKTtcblxuXHRcdG9sZF9wa2dfbmFtZSA9IHBrZy5kYXRhLm5hbWVcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXG5cdH1cbn1cblxubGV0IGNwID0gY3Jvc3NTcGF3bi5zeW5jKGNsaS5hcmd2Lm5wbUNsaWVudCwgYXJncywge1xuXHRzdGRpbzogJ2luaGVyaXQnLFxuXHRjd2Q6IHRhcmdldERpcixcbn0pO1xuXG5pZiAoIWNwLmVycm9yKVxue1xuXHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0aWYgKHBrZy5leGlzdHMoKSlcblx0e1xuXHRcdGlmIChjbGkuYXJndi5wICYmIGNsaS5hcmd2Lm5wbUNsaWVudCAhPSAneWFybicpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEucHJpdmF0ZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHRhcmdldE5hbWUgJiYgcGtnLmRhdGEubmFtZSAhPSB0YXJnZXROYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSB0YXJnZXROYW1lO1xuXHRcdH1cblx0XHRlbHNlIGlmIChjbGkuYXJndi55ZXMgJiYgb2xkX3BrZ19uYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gb2xkX3BrZ19uYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSBvbGRfcGtnX25hbWU7XG5cdFx0fVxuXG5cdFx0aWYgKHBrZy5kYXRhLm5hbWUgJiYgL15ALy50ZXN0KHBrZy5kYXRhLm5hbWUpICYmICFwa2cuZGF0YS5wdWJsaXNoQ29uZmlnKVxuXHRcdHtcblx0XHRcdC8vcGtnLmRhdGEucHVibGlzaENvbmZpZyA9IHt9O1xuXHRcdH1cblxuXHRcdGlmICghcGtnLmRhdGEuc2NyaXB0cylcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5zY3JpcHRzID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5ob21lcGFnZSB8fCAhcGtnLmRhdGEuYnVncyB8fCAhcGtnLmRhdGEucmVwb3NpdG9yeSlcblx0XHR7XG5cdFx0XHR0cnlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGluZm8gPSBucG1Ib3N0ZWRHaXRJbmZvKHRhcmdldERpcilcblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHBrZy5kYXRhLmhvbWVwYWdlID0gcGtnLmRhdGEuaG9tZXBhZ2UgfHwgaW5mby5ob21lcGFnZVxuXG5cdFx0XHRcdGlmIChoYXNXb3Jrc3BhY2UpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdSA9IG5ldyBVUkwocGtnLmRhdGEuaG9tZXBhZ2UgYXMgc3RyaW5nKTtcblxuXHRcdFx0XHRcdHUucGF0aG5hbWUgKz0gJy8nICsgcGtnLmRhdGEubmFtZTtcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRwa2cuZGF0YS5ob21lcGFnZSA9IHUudG9TdHJpbmcoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBrZy5kYXRhLmJ1Z3MgPSBwa2cuZGF0YS5idWdzIHx8IHtcblx0XHRcdFx0XHR1cmw6IGluZm8uYnVncyxcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBrZy5kYXRhLnJlcG9zaXRvcnkgPSBwa2cuZGF0YS5yZXBvc2l0b3J5IHx8IHtcblx0XHRcdFx0XHRcInR5cGVcIjogXCJnaXRcIixcblx0XHRcdFx0XHR1cmw6IGluZm8ucmVwb3NpdG9yeSxcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y2F0Y2ggKGUpXG5cdFx0XHR7XG5cblx0XHRcdH1cblx0XHR9XG5cblx0XHRPYmplY3Rcblx0XHRcdC5lbnRyaWVzKHtcblx0XHRcdFx0XCJ0ZXN0Om1vY2hhXCI6IFwibnB4IG1vY2hhIC0tcmVxdWlyZSB0cy1ub2RlL3JlZ2lzdGVyIFxcXCIhKG5vZGVfbW9kdWxlcykvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVxcXCJcIixcblx0XHRcdFx0XCJwcmVwdWJsaXNoOmxvY2tmaWxlXCI6IFwibnB4IHN5bmMtbG9ja2ZpbGUgLlwiLFxuXHRcdFx0XHRcImxpbnRcIjogXCJucHggZXNsaW50ICoqLyoudHNcIixcblx0XHRcdFx0XCJuY3VcIjogXCJucHggeWFybi10b29sIG5jdSAtdVwiLFxuXHRcdFx0XHRcIm5wbTpwdWJsaXNoXCI6IFwibnBtIHB1Ymxpc2hcIixcblx0XHRcdFx0XCJ0c2M6ZGVmYXVsdFwiOiBcInRzYyAtcCB0c2NvbmZpZy5qc29uXCIsXG5cdFx0XHRcdFwidHNjOmVzbVwiOiBcInRzYyAtcCB0c2NvbmZpZy5lc20uanNvblwiLFxuXHRcdFx0XHRcInNvcnQtcGFja2FnZS1qc29uXCI6IFwibnB4IHNvcnQtcGFja2FnZS1qc29uIC4vcGFja2FnZS5qc29uXCIsXG5cdFx0XHRcdFwicHJlcHVibGlzaE9ubHlfXCI6IFwieWFybiBydW4gbmN1ICYmIHlhcm4gcnVuIHNvcnQtcGFja2FnZS1qc29uICYmIHlhcm4gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJwb3N0cHVibGlzaF9cIjogYGdpdCBjb21taXQgLW0gXCJwdWJsaXNoIG5ldyB2ZXJzaW9uXCIgLmAsXG5cdFx0XHRcdFwiY292ZXJhZ2VcIjogXCJucHggbnljIHlhcm4gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJ0ZXN0XCI6IFwiZWNobyBcXFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXFxcIiAmJiBleGl0IDFcIixcblx0XHRcdH0pXG5cdFx0XHQuZm9yRWFjaCgoW2ssIHZdKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocGtnLmRhdGEuc2NyaXB0c1trXSA9PSBudWxsKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cGtnLmRhdGEuc2NyaXB0c1trXSA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cGtnLmF1dG9maXgoKTtcblxuXHRcdGlmIChjbGkuYXJndi5zb3J0KVxuXHRcdHtcblx0XHRcdHBrZy5zb3J0KCk7XG5cdFx0fVxuXG5cdFx0cGtnLndyaXRlT25seVdoZW5Mb2FkZWQoKTtcblxuXHRcdHRyeVxuXHRcdHtcblx0XHRcdGxldCBjb3B5T3B0aW9uczogZnMuQ29weU9wdGlvbnNTeW5jID0ge1xuXHRcdFx0XHRvdmVyd3JpdGU6IGZhbHNlLFxuXHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHRcdGVycm9yT25FeGlzdDogZmFsc2UsXG5cdFx0XHR9O1xuXG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL3N0YXRpYycpLCB0YXJnZXREaXIsIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0Y29weVN0YXRpY0ZpbGVzKGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIHtcblx0XHRcdGN3ZDogdGFyZ2V0RGlyLFxuXHRcdH0pO1xuXG5cdFx0Lypcblx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvbnBtaWdub3JlJyksIHBhdGguam9pbih0YXJnZXREaXIsICcubnBtaWdub3JlJyksIGNvcHlPcHRpb25zKTtcblxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9naXRpZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5naXRpZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbicpKSlcblx0XHR7XG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvdHNjb25maWcuanNvbi50cGwnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJ3RzY29uZmlnLmpzb24udHBsJyksIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0ICovXG5cblx0fVxufVxuZWxzZVxue1xuXHRwcm9jZXNzLmV4aXRDb2RlID0gMTtcbn1cbiJdfQ==