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
            const cpkg = require('./package.json');
            const findVersion = (name) => {
                return cpkg.dependencies[name] || cpkg.devDependencies[name] || cpkg.peerDependencies[name] || "latest";
            };
            pkg.data.devDependencies = pkg.data.devDependencies || {};
            pkg.data.devDependencies['@bluelovers/tsconfig'] = findVersion('@bluelovers/tsconfig');
            pkg.data.devDependencies['@types/node'] = findVersion('@types/node');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwrQkFBZ0M7QUFDaEMsZ0RBQWlEO0FBQ2pELCtCQUFnQztBQUNoQyw2QkFBOEI7QUFDOUIseURBQXdFO0FBQ3hFLHFFQUF3RDtBQUd4RCx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBQy9DLG9EQUFnRDtBQUNoRCwwREFBMkQ7QUFFM0QsNEJBQTRCO0FBRTVCLElBQUksR0FBRyxHQUFHLHVCQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFdEIsd0JBQXdCO0FBRXhCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFFdEQsSUFBSSxRQUFRLEdBQUcsb0JBQVEsQ0FBQztJQUN2QixHQUFHO0lBQ0gsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0I7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsSUFBSSxZQUFZLEdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUV2QyxJQUFJLGVBQXVCLENBQUM7QUFFNUIsSUFBSSxZQUFZLEVBQ2hCO0lBQ0MsSUFBSSxFQUFFLEdBQUcsNENBQXdCLENBQUMsMkJBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBRTNELElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQ3BCO1FBQ0MsZUFBZSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7Q0FDRDtBQUVELElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsb0JBQVksQ0FBQztJQUM1QyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMs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QVNHO0tBRUg7Q0FDRDtLQUVEO0lBQ0MsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7Q0FDckIiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbmltcG9ydCBmaW5kWWFybldvcmtzcGFjZVJvb3QgPSByZXF1aXJlKCdmaW5kLXlhcm4td29ya3NwYWNlLXJvb3QyJyk7XG5pbXBvcnQgeWFyZ3MgPSByZXF1aXJlKCd5YXJncycpO1xuaW1wb3J0IGNyb3NzU3Bhd24gPSByZXF1aXJlKCdjcm9zcy1zcGF3bi1leHRyYScpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IGdldENvbmZpZywgeyBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMgfSBmcm9tICd3b3Jrc3BhY2VzLWNvbmZpZyc7XG5pbXBvcnQgUGFja2FnZUpzb25Mb2FkZXIgZnJvbSAnbnBtLXBhY2thZ2UtanNvbi1sb2FkZXInO1xuaW1wb3J0IHsgdXBkYXRlTm90aWZpZXIgfSBmcm9tICdAeWFybi10b29sL3VwZGF0ZS1ub3RpZmllcic7XG5pbXBvcnQgcGtnID0gcmVxdWlyZSggJy4vcGFja2FnZS5qc29uJyApO1xuaW1wb3J0IHsgY29weVN0YXRpY0ZpbGVzLCBkZWZhdWx0Q29weVN0YXRpY0ZpbGVzLCBnZXRUYXJnZXREaXIgfSBmcm9tICcuL2xpYi9pbmRleCc7XG5pbXBvcnQgc2V0dXBUb1lhcmdzIGZyb20gJy4vbGliL3lhcmdzLXNldHRpbmcnO1xuaW1wb3J0IHsgZmluZFJvb3QgfSBmcm9tICdAeWFybi10b29sL2ZpbmQtcm9vdCc7XG5pbXBvcnQgeyBucG1Ib3N0ZWRHaXRJbmZvIH0gZnJvbSAnQHlhcm4tdG9vbC9wa2ctZ2l0LWluZm8nO1xuXG4vL3VwZGF0ZU5vdGlmaWVyKF9fZGlybmFtZSk7XG5cbmxldCBjbGkgPSBzZXR1cFRvWWFyZ3MoeWFyZ3MpO1xuXG5sZXQgYXJndiA9IGNsaS5hcmd2Ll87XG5cbi8vY29uc29sZS5kaXIoY2xpLmFyZ3YpO1xuXG5sZXQgY3dkID0gcGF0aC5yZXNvbHZlKGNsaS5hcmd2LmN3ZCB8fCBwcm9jZXNzLmN3ZCgpKTtcblxubGV0IHJvb3REYXRhID0gZmluZFJvb3Qoe1xuXHRjd2QsXG5cdHNraXBDaGVja1dvcmtzcGFjZTogY2xpLmFyZ3Yuc2tpcENoZWNrV29ya3NwYWNlLFxufSk7XG5cbmxldCBoYXNXb3Jrc3BhY2U6IHN0cmluZyA9IHJvb3REYXRhLndzO1xuXG5sZXQgd29ya3NwYWNlUHJlZml4OiBzdHJpbmc7XG5cbmlmIChoYXNXb3Jrc3BhY2UpXG57XG5cdGxldCB3cyA9IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyhnZXRDb25maWcoaGFzV29ya3NwYWNlKSk7XG5cblx0aWYgKHdzLnByZWZpeC5sZW5ndGgpXG5cdHtcblx0XHR3b3Jrc3BhY2VQcmVmaXggPSB3cy5wcmVmaXhbMF07XG5cdH1cbn1cblxubGV0IHsgdGFyZ2V0RGlyLCB0YXJnZXROYW1lIH0gPSBnZXRUYXJnZXREaXIoe1xuXHRpbnB1dE5hbWU6IGFyZ3YubGVuZ3RoICYmIGFyZ3ZbMF0sXG5cdGN3ZCxcblx0dGFyZ2V0TmFtZTogY2xpLmFyZ3YubmFtZSB8fCBudWxsLFxuXHRoYXNXb3Jrc3BhY2UsXG5cdHdvcmtzcGFjZVByZWZpeCxcbn0pO1xuXG5mcy5lbnN1cmVEaXJTeW5jKHRhcmdldERpcik7XG5cbmxldCBmbGFncyA9IE9iamVjdC5rZXlzKGNsaS5hcmd2KVxuXHQucmVkdWNlKGZ1bmN0aW9uIChhLCBmKVxuXHR7XG5cdFx0aWYgKGYgPT09ICdzaWxlbnQnIHx8IGYgPT09ICd5JyB8fCBmID09PSAneWVzJylcblx0XHR7XG5cblx0XHR9XG5cdFx0ZWxzZSBpZiAoL15bYS16XSQvLnRlc3QoZikgJiYgY2xpLmFyZ3ZbZl0pXG5cdFx0e1xuXHRcdFx0YS5wdXNoKGYpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhO1xuXHR9LCBbXSlcblx0LmpvaW4oJycpXG47XG5cbmxldCBhcmdzID0gW1xuXHQnaW5pdCcsXG5cdChmbGFncyAmJiAnLScgKyBmbGFncyksXG5cdGNsaS5hcmd2LmNyZWF0ZU1vZHVsZSxcblx0Y2xpLmFyZ3YueWVzICYmICcteScsXG5dLmZpbHRlcih2ID0+IHYpO1xuXG4vL2NvbnNvbGUubG9nKGFyZ3MpO1xuXG5sZXQgb2xkX3BrZ19uYW1lOiBzdHJpbmc7XG5sZXQgb2xkRXhpc3RzID0gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4odGFyZ2V0RGlyLCAncGFja2FnZS5qc29uJykpO1xuXG5pZiAoY2xpLmFyZ3YueWVzICYmICF0YXJnZXROYW1lKVxue1xuXHR0cnlcblx0e1xuXHRcdGxldCBwa2cgPSBuZXcgUGFja2FnZUpzb25Mb2FkZXIocGF0aC5qb2luKHRhcmdldERpciwgJ3BhY2thZ2UuanNvbicpKTtcblxuXHRcdG9sZF9wa2dfbmFtZSA9IHBrZy5kYXRhLm5hbWVcblx0fVxuXHRjYXRjaCAoZSlcblx0e1xuXG5cdH1cbn1cblxubGV0IGNwID0gY3Jvc3NTcGF3bi5zeW5jKGNsaS5hcmd2Lm5wbUNsaWVudCwgYXJncywge1xuXHRzdGRpbzogJ2luaGVyaXQnLFxuXHRjd2Q6IHRhcmdldERpcixcbn0pO1xuXG5pZiAoIWNwLmVycm9yKVxue1xuXHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0aWYgKHBrZy5leGlzdHMoKSlcblx0e1xuXHRcdGlmIChjbGkuYXJndi5wICYmIGNsaS5hcmd2Lm5wbUNsaWVudCAhPSAneWFybicpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEucHJpdmF0ZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHRhcmdldE5hbWUgJiYgcGtnLmRhdGEubmFtZSAhPSB0YXJnZXROYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSB0YXJnZXROYW1lO1xuXHRcdH1cblx0XHRlbHNlIGlmIChjbGkuYXJndi55ZXMgJiYgb2xkX3BrZ19uYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gb2xkX3BrZ19uYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSBvbGRfcGtnX25hbWU7XG5cdFx0fVxuXHRcdC8vIOmYsuatoiBub2RlLSDooqsgbnBtIOenu+mZpFxuXHRcdGVsc2UgaWYgKCFjbGkuYXJndi55ZXMgJiYgb2xkX3BrZ19uYW1lICYmIC9ebm9kZS0vLnRlc3Qob2xkX3BrZ19uYW1lKSAmJiAoJ25vZGUtJyArIHBrZy5kYXRhLm5hbWUpID09PSBvbGRfcGtnX25hbWUpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEubmFtZSA9IG9sZF9wa2dfbmFtZTtcblx0XHR9XG5cblx0XHRpZiAocGtnLmRhdGEubmFtZSAmJiAvXkAvLnRlc3QocGtnLmRhdGEubmFtZSkgJiYgIXBrZy5kYXRhLnB1Ymxpc2hDb25maWcpXG5cdFx0e1xuXHRcdFx0Ly9wa2cuZGF0YS5wdWJsaXNoQ29uZmlnID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5zY3JpcHRzKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnNjcmlwdHMgPSB7fTtcblx0XHR9XG5cblx0XHRpZiAoIXBrZy5kYXRhLmhvbWVwYWdlIHx8ICFwa2cuZGF0YS5idWdzIHx8ICFwa2cuZGF0YS5yZXBvc2l0b3J5KVxuXHRcdHtcblx0XHRcdHRyeVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgaW5mbyA9IG5wbUhvc3RlZEdpdEluZm8odGFyZ2V0RGlyKTtcblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHBrZy5kYXRhLmhvbWVwYWdlID0gcGtnLmRhdGEuaG9tZXBhZ2UgfHwgaW5mby5ob21lcGFnZVxuXG5cdFx0XHRcdGlmIChoYXNXb3Jrc3BhY2UpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgdSA9IG5ldyBVUkwocGtnLmRhdGEuaG9tZXBhZ2UgYXMgc3RyaW5nKTtcblxuXHRcdFx0XHRcdHUucGF0aG5hbWUgKz0gJy90cmVlL21hc3Rlci8nICsgcGF0aC5yZWxhdGl2ZShoYXNXb3Jrc3BhY2UsIHRhcmdldERpcik7XG5cblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0cGtnLmRhdGEuaG9tZXBhZ2UgPSB1LnRvU3RyaW5nKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwa2cuZGF0YS5idWdzID0gcGtnLmRhdGEuYnVncyB8fCB7XG5cdFx0XHRcdFx0dXJsOiBpbmZvLmJ1Z3MsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwa2cuZGF0YS5yZXBvc2l0b3J5ID0gcGtnLmRhdGEucmVwb3NpdG9yeSB8fCB7XG5cdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZ2l0XCIsXG5cdFx0XHRcdFx0dXJsOiBpbmZvLnJlcG9zaXRvcnksXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlKVxuXHRcdFx0e1xuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0T2JqZWN0XG5cdFx0XHQuZW50cmllcyh7XG5cdFx0XHRcdFwidGVzdDptb2NoYVwiOiBcIm5weCBtb2NoYSAtLXJlcXVpcmUgdHMtbm9kZS9yZWdpc3RlciBcXFwiIShub2RlX21vZHVsZXMpLyoqLyoue3Rlc3Qsc3BlY30ue3RzLHRzeH1cXFwiXCIsXG5cdFx0XHRcdFwicHJlcHVibGlzaDpsb2NrZmlsZVwiOiBcIm5weCBzeW5jLWxvY2tmaWxlIC5cIixcblx0XHRcdFx0XCJsaW50XCI6IFwibnB4IGVzbGludCAqKi8qLnRzXCIsXG5cdFx0XHRcdFwibmN1XCI6IFwibnB4IHlhcm4tdG9vbCBuY3UgLXVcIixcblx0XHRcdFx0XCJucG06cHVibGlzaFwiOiBcIm5wbSBwdWJsaXNoXCIsXG5cdFx0XHRcdFwidHNjOmRlZmF1bHRcIjogXCJ0c2MgLXAgdHNjb25maWcuanNvblwiLFxuXHRcdFx0XHRcInRzYzplc21cIjogXCJ0c2MgLXAgdHNjb25maWcuZXNtLmpzb25cIixcblx0XHRcdFx0XCJzb3J0LXBhY2thZ2UtanNvblwiOiBcIm5weCB5YXJuLXRvb2wgc29ydFwiLFxuXHRcdFx0XHRcInByZXB1Ymxpc2hPbmx5X1wiOiBcInlhcm4gcnVuIG5jdSAmJiB5YXJuIHJ1biBzb3J0LXBhY2thZ2UtanNvbiAmJiB5YXJuIHJ1biB0ZXN0XCIsXG5cdFx0XHRcdFwicG9zdHB1Ymxpc2hfXCI6IGBnaXQgY29tbWl0IC1tIFwiY2hvcmUocmVsZWFzZSk6IHB1Ymxpc2hcIiAuYCxcblx0XHRcdFx0XCJjb3ZlcmFnZVwiOiBcIm5weCBueWMgeWFybiBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInRlc3RcIjogYGVjaG8gXCJFcnJvcjogbm8gdGVzdCBzcGVjaWZpZWRcIiAmJiBleGl0IDFgLFxuXHRcdFx0fSlcblx0XHRcdC5mb3JFYWNoKChbaywgdl0pID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChwa2cuZGF0YS5zY3JpcHRzW2tdID09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwa2cuZGF0YS5zY3JpcHRzW2tdID0gdjtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRpZiAoIW9sZEV4aXN0cylcblx0XHR7XG5cdFx0XHRjb25zdCBjcGtnID0gcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKTtcblxuXHRcdFx0Y29uc3QgZmluZFZlcnNpb24gPSAobmFtZTogc3RyaW5nKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gY3BrZy5kZXBlbmRlbmNpZXNbbmFtZV0gfHwgY3BrZy5kZXZEZXBlbmRlbmNpZXNbbmFtZV0gfHwgY3BrZy5wZWVyRGVwZW5kZW5jaWVzW25hbWVdIHx8IFwibGF0ZXN0XCJcblx0XHRcdH07XG5cblx0XHRcdHBrZy5kYXRhLmRldkRlcGVuZGVuY2llcyA9IHBrZy5kYXRhLmRldkRlcGVuZGVuY2llcyB8fCB7fTtcblxuXHRcdFx0cGtnLmRhdGEuZGV2RGVwZW5kZW5jaWVzWydAYmx1ZWxvdmVycy90c2NvbmZpZyddID0gZmluZFZlcnNpb24oJ0BibHVlbG92ZXJzL3RzY29uZmlnJyk7XG5cdFx0XHRwa2cuZGF0YS5kZXZEZXBlbmRlbmNpZXNbJ0B0eXBlcy9ub2RlJ10gPSBmaW5kVmVyc2lvbignQHR5cGVzL25vZGUnKTtcblx0XHR9XG5cblx0XHRwa2cuYXV0b2ZpeCgpO1xuXG5cdFx0aWYgKGNsaS5hcmd2LnNvcnQpXG5cdFx0e1xuXHRcdFx0cGtnLnNvcnQoKTtcblx0XHR9XG5cblx0XHRwa2cud3JpdGVPbmx5V2hlbkxvYWRlZCgpO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0bGV0IGNvcHlPcHRpb25zOiBmcy5Db3B5T3B0aW9uc1N5bmMgPSB7XG5cdFx0XHRcdG92ZXJ3cml0ZTogZmFsc2UsXG5cdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdFx0ZXJyb3JPbkV4aXN0OiBmYWxzZSxcblx0XHRcdH07XG5cblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvc3RhdGljJyksIHRhcmdldERpciwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cblx0XHRjb3B5U3RhdGljRmlsZXMoZGVmYXVsdENvcHlTdGF0aWNGaWxlcywge1xuXHRcdFx0Y3dkOiB0YXJnZXREaXIsXG5cdFx0fSk7XG5cblx0XHQvKlxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9ucG1pZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5ucG1pZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL2dpdGlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLmdpdGlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uJykpKVxuXHRcdHtcblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS90c2NvbmZpZy5qc29uLnRwbCcpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbi50cGwnKSwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHQgKi9cblxuXHR9XG59XG5lbHNlXG57XG5cdHByb2Nlc3MuZXhpdENvZGUgPSAxO1xufVxuIl19