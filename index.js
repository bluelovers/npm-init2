#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findYarnWorkspaceRoot = require("find-yarn-workspace-root2");
const yargs = require("yargs");
const crossSpawn = require("cross-spawn-extra");
const fs = require("fs-extra");
const path = require("path");
const workspaces_config_1 = require("workspaces-config");
const npm_package_json_loader_1 = require("npm-package-json-loader");
const updateNotifier = require("update-notifier");
const pkg = require("./package.json");
const index_1 = require("./lib/index");
const yargs_setting_1 = require("./lib/yargs-setting");
updateNotifier({ pkg }).notify();
let cli = yargs_setting_1.default(yargs);
let argv = cli.argv._;
//console.dir(cli.argv);
let cwd = path.resolve(cli.argv.cwd || process.cwd());
let hasWorkspace;
if (!cli.argv.skipCheckWorkspace) {
    hasWorkspace = findYarnWorkspaceRoot(cwd);
}
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
/*

let targetDir: string;
let targetName: string = cli.argv.name || null;

if (argv.length)
{
    let name: string = argv[0];

    if (/^(?:@([^/]+?)[/])([^/]+)$/i.test(name))
    {
        targetName = targetName || name;
        name = name
            .replace(/[\/\\]+/g, '_')
            .replace(/^@/g, '')
        ;
    }
    else if (/^[^/@]+$/i.test(name))
    {
        targetName = targetName || null;
    }
    else
    {
        targetName = targetName || null;
    }

    if (hasWorkspace)
    {
        let ws = parseStaticPackagesPaths(getConfig(hasWorkspace));

        if (ws.prefix.length)
        {
            name = path.join(hasWorkspace, ws.prefix[0], name);
        }
        else
        {
            throw new RangeError();
        }
    }

    targetDir = path.resolve(name);
}
else
{
    targetDir = cwd;
}

*/
//console.log(targetDir);
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
        if (pkg.data.name && /^@/.test(pkg.data.name) && !pkg.data.publishConfig) {
            //pkg.data.publishConfig = {};
        }
        if (!pkg.data.scripts) {
            pkg.data.scripts = {};
        }
        Object
            .entries({
            "lint": "eslint .",
            "ncu": "npx npm-check-updates -u",
            "sort-package-json": "npx sort-package-json ./package.json",
            "prepublishOnly": "npm run ncu && npm run sort-package-json && npm run test",
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
        pkg.writeWhenLoaded();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtRUFBb0U7QUFDcEUsK0JBQWdDO0FBQ2hDLGdEQUFpRDtBQUNqRCwrQkFBZ0M7QUFDaEMsNkJBQThCO0FBQzlCLHlEQUF3RTtBQUN4RSxxRUFBd0Q7QUFDeEQsa0RBQW1EO0FBQ25ELHNDQUF5QztBQUN6Qyx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBRS9DLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFakMsSUFBSSxHQUFHLEdBQUcsdUJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUU5QixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUV0Qix3QkFBd0I7QUFFeEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUV0RCxJQUFJLFlBQW9CLENBQUM7QUFFekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQ2hDO0lBQ0MsWUFBWSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzFDO0FBRUQsSUFBSSxlQUF1QixDQUFDO0FBRTVCLElBQUksWUFBWSxFQUNoQjtJQUNDLElBQUksRUFBRSxHQUFHLDRDQUF3QixDQUFDLDJCQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUUzRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNwQjtRQUNDLGVBQWUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9CO0NBQ0Q7QUFFRCxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxHQUFHLG9CQUFZLENBQUM7SUFDNUMsU0FBUyxFQUFF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LE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFFbkIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQy9CO2dCQUNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN4QjtRQUNGLENBQUMsQ0FBQyxDQUNGO1FBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWQsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFDakI7WUFDQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDWDtRQUVELEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUV0QixJQUNBO1lBQ0MsSUFBSSxXQUFXLEdBQXVCO2dCQUNyQyxTQUFTLEVBQUUsS0FBSztnQkFDaEIsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsWUFBWSxFQUFFLEtBQUs7YUFDbkIsQ0FBQztZQUVGLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3hFO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7U0FFQztRQUVELHVCQUFlLENBQUMsOEJBQXNCLEVBQUU7WUFDdkMsR0FBRyxFQUFFLFNBQVM7U0FDZCxDQUFDLENBQUM7UUFFSDs7Ozs7Ozs7O1dBU0c7S0FFSDtDQUNEO0tBRUQ7SUFDQyxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztDQUNyQiIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IGZpbmRZYXJuV29ya3NwYWNlUm9vdCA9IHJlcXVpcmUoJ2ZpbmQteWFybi13b3Jrc3BhY2Utcm9vdDInKTtcbmltcG9ydCB5YXJncyA9IHJlcXVpcmUoJ3lhcmdzJyk7XG5pbXBvcnQgY3Jvc3NTcGF3biA9IHJlcXVpcmUoJ2Nyb3NzLXNwYXduLWV4dHJhJyk7XG5pbXBvcnQgZnMgPSByZXF1aXJlKCdmcy1leHRyYScpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgZ2V0Q29uZmlnLCB7IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyB9IGZyb20gJ3dvcmtzcGFjZXMtY29uZmlnJztcbmltcG9ydCBQYWNrYWdlSnNvbkxvYWRlciBmcm9tICducG0tcGFja2FnZS1qc29uLWxvYWRlcic7XG5pbXBvcnQgdXBkYXRlTm90aWZpZXIgPSByZXF1aXJlKCd1cGRhdGUtbm90aWZpZXInKTtcbmltcG9ydCBwa2cgPSByZXF1aXJlKCAnLi9wYWNrYWdlLmpzb24nICk7XG5pbXBvcnQgeyBjb3B5U3RhdGljRmlsZXMsIGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIGdldFRhcmdldERpciB9IGZyb20gJy4vbGliL2luZGV4JztcbmltcG9ydCBzZXR1cFRvWWFyZ3MgZnJvbSAnLi9saWIveWFyZ3Mtc2V0dGluZyc7XG5cbnVwZGF0ZU5vdGlmaWVyKHsgcGtnIH0pLm5vdGlmeSgpO1xuXG5sZXQgY2xpID0gc2V0dXBUb1lhcmdzKHlhcmdzKTtcblxubGV0IGFyZ3YgPSBjbGkuYXJndi5fO1xuXG4vL2NvbnNvbGUuZGlyKGNsaS5hcmd2KTtcblxubGV0IGN3ZCA9IHBhdGgucmVzb2x2ZShjbGkuYXJndi5jd2QgfHwgcHJvY2Vzcy5jd2QoKSk7XG5cbmxldCBoYXNXb3Jrc3BhY2U6IHN0cmluZztcblxuaWYgKCFjbGkuYXJndi5za2lwQ2hlY2tXb3Jrc3BhY2UpXG57XG5cdGhhc1dvcmtzcGFjZSA9IGZpbmRZYXJuV29ya3NwYWNlUm9vdChjd2QpO1xufVxuXG5sZXQgd29ya3NwYWNlUHJlZml4OiBzdHJpbmc7XG5cbmlmIChoYXNXb3Jrc3BhY2UpXG57XG5cdGxldCB3cyA9IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyhnZXRDb25maWcoaGFzV29ya3NwYWNlKSk7XG5cblx0aWYgKHdzLnByZWZpeC5sZW5ndGgpXG5cdHtcblx0XHR3b3Jrc3BhY2VQcmVmaXggPSB3cy5wcmVmaXhbMF07XG5cdH1cbn1cblxubGV0IHsgdGFyZ2V0RGlyLCB0YXJnZXROYW1lIH0gPSBnZXRUYXJnZXREaXIoe1xuXHRpbnB1dE5hbWU6IGFyZ3YubGVuZ3RoICYmIGFyZ3ZbMF0sXG5cdGN3ZCxcblx0dGFyZ2V0TmFtZTogY2xpLmFyZ3YubmFtZSB8fCBudWxsLFxuXHRoYXNXb3Jrc3BhY2UsXG5cdHdvcmtzcGFjZVByZWZpeCxcbn0pO1xuXG4vKlxuXG5sZXQgdGFyZ2V0RGlyOiBzdHJpbmc7XG5sZXQgdGFyZ2V0TmFtZTogc3RyaW5nID0gY2xpLmFyZ3YubmFtZSB8fCBudWxsO1xuXG5pZiAoYXJndi5sZW5ndGgpXG57XG5cdGxldCBuYW1lOiBzdHJpbmcgPSBhcmd2WzBdO1xuXG5cdGlmICgvXig/OkAoW14vXSs/KVsvXSkoW14vXSspJC9pLnRlc3QobmFtZSkpXG5cdHtcblx0XHR0YXJnZXROYW1lID0gdGFyZ2V0TmFtZSB8fCBuYW1lO1xuXHRcdG5hbWUgPSBuYW1lXG5cdFx0XHQucmVwbGFjZSgvW1xcL1xcXFxdKy9nLCAnXycpXG5cdFx0XHQucmVwbGFjZSgvXkAvZywgJycpXG5cdFx0O1xuXHR9XG5cdGVsc2UgaWYgKC9eW14vQF0rJC9pLnRlc3QobmFtZSkpXG5cdHtcblx0XHR0YXJnZXROYW1lID0gdGFyZ2V0TmFtZSB8fCBudWxsO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdHRhcmdldE5hbWUgPSB0YXJnZXROYW1lIHx8IG51bGw7XG5cdH1cblxuXHRpZiAoaGFzV29ya3NwYWNlKVxuXHR7XG5cdFx0bGV0IHdzID0gcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzKGdldENvbmZpZyhoYXNXb3Jrc3BhY2UpKTtcblxuXHRcdGlmICh3cy5wcmVmaXgubGVuZ3RoKVxuXHRcdHtcblx0XHRcdG5hbWUgPSBwYXRoLmpvaW4oaGFzV29ya3NwYWNlLCB3cy5wcmVmaXhbMF0sIG5hbWUpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dGhyb3cgbmV3IFJhbmdlRXJyb3IoKTtcblx0XHR9XG5cdH1cblxuXHR0YXJnZXREaXIgPSBwYXRoLnJlc29sdmUobmFtZSk7XG59XG5lbHNlXG57XG5cdHRhcmdldERpciA9IGN3ZDtcbn1cblxuKi9cblxuLy9jb25zb2xlLmxvZyh0YXJnZXREaXIpO1xuXG5mcy5lbnN1cmVEaXJTeW5jKHRhcmdldERpcik7XG5cbmxldCBmbGFncyA9IE9iamVjdC5rZXlzKGNsaS5hcmd2KVxuXHQucmVkdWNlKGZ1bmN0aW9uIChhLCBmKVxuXHR7XG5cdFx0aWYgKGYgPT09ICdzaWxlbnQnIHx8IGYgPT09ICd5JyB8fCBmID09PSAneWVzJylcblx0XHR7XG5cblx0XHR9XG5cdFx0ZWxzZSBpZiAoL15bYS16XSQvLnRlc3QoZikgJiYgY2xpLmFyZ3ZbZl0pXG5cdFx0e1xuXHRcdFx0YS5wdXNoKGYpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhO1xuXHR9LCBbXSlcblx0LmpvaW4oJycpXG47XG5cbmxldCBhcmdzID0gW1xuXHQnaW5pdCcsXG5cdChmbGFncyAmJiAnLScgKyBmbGFncyksXG5cdGNsaS5hcmd2LmNyZWF0ZU1vZHVsZSxcblx0Y2xpLmFyZ3YueWVzICYmICcteScsXG5dLmZpbHRlcih2ID0+IHYpO1xuXG4vL2NvbnNvbGUubG9nKGFyZ3MpO1xuXG5sZXQgY3AgPSBjcm9zc1NwYXduLnN5bmMoY2xpLmFyZ3YubnBtQ2xpZW50LCBhcmdzLCB7XG5cdHN0ZGlvOiAnaW5oZXJpdCcsXG5cdGN3ZDogdGFyZ2V0RGlyLFxufSk7XG5cbmlmICghY3AuZXJyb3IpXG57XG5cdGxldCBwa2cgPSBuZXcgUGFja2FnZUpzb25Mb2FkZXIocGF0aC5qb2luKHRhcmdldERpciwgJ3BhY2thZ2UuanNvbicpKTtcblxuXHRpZiAocGtnLmV4aXN0cygpKVxuXHR7XG5cdFx0aWYgKGNsaS5hcmd2LnAgJiYgY2xpLmFyZ3YubnBtQ2xpZW50ICE9ICd5YXJuJylcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5wcml2YXRlID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodGFyZ2V0TmFtZSAmJiBwa2cuZGF0YS5uYW1lICE9IHRhcmdldE5hbWUpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEubmFtZSA9IHRhcmdldE5hbWU7XG5cdFx0fVxuXG5cdFx0aWYgKHBrZy5kYXRhLm5hbWUgJiYgL15ALy50ZXN0KHBrZy5kYXRhLm5hbWUpICYmICFwa2cuZGF0YS5wdWJsaXNoQ29uZmlnKVxuXHRcdHtcblx0XHRcdC8vcGtnLmRhdGEucHVibGlzaENvbmZpZyA9IHt9O1xuXHRcdH1cblxuXHRcdGlmICghcGtnLmRhdGEuc2NyaXB0cylcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5zY3JpcHRzID0ge307XG5cdFx0fVxuXG5cdFx0T2JqZWN0XG5cdFx0XHQuZW50cmllcyh7XG5cdFx0XHRcdFwibGludFwiOiBcImVzbGludCAuXCIsXG5cdFx0XHRcdFwibmN1XCI6IFwibnB4IG5wbS1jaGVjay11cGRhdGVzIC11XCIsXG5cdFx0XHRcdFwic29ydC1wYWNrYWdlLWpzb25cIjogXCJucHggc29ydC1wYWNrYWdlLWpzb24gLi9wYWNrYWdlLmpzb25cIixcblx0XHRcdFx0XCJwcmVwdWJsaXNoT25seVwiOiBcIm5wbSBydW4gbmN1ICYmIG5wbSBydW4gc29ydC1wYWNrYWdlLWpzb24gJiYgbnBtIHJ1biB0ZXN0XCIsXG5cdFx0XHRcdFwiY292ZXJhZ2VcIjogXCJucHggbnljIG5wbSBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInRlc3RcIjogXCJlY2hvIFxcXCJFcnJvcjogbm8gdGVzdCBzcGVjaWZpZWRcXFwiICYmIGV4aXQgMVwiLFxuXHRcdFx0fSlcblx0XHRcdC5mb3JFYWNoKChbaywgdl0pID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChwa2cuZGF0YS5zY3JpcHRzW2tdID09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRwa2cuZGF0YS5zY3JpcHRzW2tdID0gdjtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHRwa2cuYXV0b2ZpeCgpO1xuXG5cdFx0aWYgKGNsaS5hcmd2LnNvcnQpXG5cdFx0e1xuXHRcdFx0cGtnLnNvcnQoKTtcblx0XHR9XG5cblx0XHRwa2cud3JpdGVXaGVuTG9hZGVkKCk7XG5cblx0XHR0cnlcblx0XHR7XG5cdFx0XHRsZXQgY29weU9wdGlvbnM6IGZzLkNvcHlPcHRpb25zU3luYyA9IHtcblx0XHRcdFx0b3ZlcndyaXRlOiBmYWxzZSxcblx0XHRcdFx0cHJlc2VydmVUaW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0XHRlcnJvck9uRXhpc3Q6IGZhbHNlLFxuXHRcdFx0fTtcblxuXHRcdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9zdGF0aWMnKSwgdGFyZ2V0RGlyLCBjb3B5T3B0aW9ucyk7XG5cdFx0fVxuXHRcdGNhdGNoIChlKVxuXHRcdHtcblxuXHRcdH1cblxuXHRcdGNvcHlTdGF0aWNGaWxlcyhkZWZhdWx0Q29weVN0YXRpY0ZpbGVzLCB7XG5cdFx0XHRjd2Q6IHRhcmdldERpcixcblx0XHR9KTtcblxuXHRcdC8qXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL25wbWlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLm5wbWlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvZ2l0aWdub3JlJyksIHBhdGguam9pbih0YXJnZXREaXIsICcuZ2l0aWdub3JlJyksIGNvcHlPcHRpb25zKTtcblxuXHRcdGlmICghZnMucGF0aEV4aXN0c1N5bmMocGF0aC5qb2luKHRhcmdldERpciwgJ3RzY29uZmlnLmpzb24nKSkpXG5cdFx0e1xuXHRcdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL3RzY29uZmlnLmpzb24udHBsJyksIHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uLnRwbCcpLCBjb3B5T3B0aW9ucyk7XG5cdFx0fVxuXHRcdCAqL1xuXG5cdH1cbn1cbmVsc2Vcbntcblx0cHJvY2Vzcy5leGl0Q29kZSA9IDE7XG59XG4iXX0=