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
            "lint": "npx eslint **/*.ts",
            "ncu": "npx yarn-tool ncu -u",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtRUFBb0U7QUFDcEUsK0JBQWdDO0FBQ2hDLGdEQUFpRDtBQUNqRCwrQkFBZ0M7QUFDaEMsNkJBQThCO0FBQzlCLHlEQUF3RTtBQUN4RSxxRUFBd0Q7QUFDeEQsa0RBQW1EO0FBQ25ELHNDQUF5QztBQUN6Qyx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBRS9DLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFakMsSUFBSSxHQUFHLEdBQUcsdUJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUU5QixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUV0Qix3QkFBd0I7QUFFeEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUV0RCxJQUFJLFlBQW9CLENBQUM7QUFFekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQ2hDO0lBQ0MsWUFBWSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzFDO0FBRUQsSUFBSSxlQUF1QixDQUFDO0FBRTVCLElBQUksWUFBWSxFQUNoQjtJQUNDLElBQUksRUFBRSxHQUFHLDRDQUF3QixDQUFDLDJCQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUUzRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNwQjtRQUNDLGVBQWUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9CO0NBQ0Q7QUFFRCxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxHQUFHLG9CQUFZLENBQUM7SUFDNUMsU0FBUyxFQUFF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Q0QsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUVuQixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFDL0I7Z0JBQ0MsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3hCO1FBQ0YsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFZCxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUNqQjtZQUNDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNYO1FBRUQsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXRCLElBQ0E7WUFDQyxJQUFJLFdBQVcsR0FBdUI7Z0JBQ3JDLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixrQkFBa0IsRUFBRSxJQUFJO2dCQUN4QixZQUFZLEVBQUUsS0FBSzthQUNuQixDQUFDO1lBRUYsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDeEU7UUFDRCxPQUFPLENBQUMsRUFDUjtTQUVDO1FBRUQsdUJBQWUsQ0FBQyw4QkFBc0IsRUFBRTtZQUN2QyxHQUFHLEVBQUUsU0FBUztTQUNkLENBQUMsQ0FBQztRQUVIOzs7Ozs7Ozs7V0FTRztLQUVIO0NBQ0Q7S0FFRDtJQUNDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0NBQ3JCIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgZmluZFlhcm5Xb3Jrc3BhY2VSb290ID0gcmVxdWlyZSgnZmluZC15YXJuLXdvcmtzcGFjZS1yb290MicpO1xuaW1wb3J0IHlhcmdzID0gcmVxdWlyZSgneWFyZ3MnKTtcbmltcG9ydCBjcm9zc1NwYXduID0gcmVxdWlyZSgnY3Jvc3Mtc3Bhd24tZXh0cmEnKTtcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBnZXRDb25maWcsIHsgcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzIH0gZnJvbSAnd29ya3NwYWNlcy1jb25maWcnO1xuaW1wb3J0IFBhY2thZ2VKc29uTG9hZGVyIGZyb20gJ25wbS1wYWNrYWdlLWpzb24tbG9hZGVyJztcbmltcG9ydCB1cGRhdGVOb3RpZmllciA9IHJlcXVpcmUoJ3VwZGF0ZS1ub3RpZmllcicpO1xuaW1wb3J0IHBrZyA9IHJlcXVpcmUoICcuL3BhY2thZ2UuanNvbicgKTtcbmltcG9ydCB7IGNvcHlTdGF0aWNGaWxlcywgZGVmYXVsdENvcHlTdGF0aWNGaWxlcywgZ2V0VGFyZ2V0RGlyIH0gZnJvbSAnLi9saWIvaW5kZXgnO1xuaW1wb3J0IHNldHVwVG9ZYXJncyBmcm9tICcuL2xpYi95YXJncy1zZXR0aW5nJztcblxudXBkYXRlTm90aWZpZXIoeyBwa2cgfSkubm90aWZ5KCk7XG5cbmxldCBjbGkgPSBzZXR1cFRvWWFyZ3MoeWFyZ3MpO1xuXG5sZXQgYXJndiA9IGNsaS5hcmd2Ll87XG5cbi8vY29uc29sZS5kaXIoY2xpLmFyZ3YpO1xuXG5sZXQgY3dkID0gcGF0aC5yZXNvbHZlKGNsaS5hcmd2LmN3ZCB8fCBwcm9jZXNzLmN3ZCgpKTtcblxubGV0IGhhc1dvcmtzcGFjZTogc3RyaW5nO1xuXG5pZiAoIWNsaS5hcmd2LnNraXBDaGVja1dvcmtzcGFjZSlcbntcblx0aGFzV29ya3NwYWNlID0gZmluZFlhcm5Xb3Jrc3BhY2VSb290KGN3ZCk7XG59XG5cbmxldCB3b3Jrc3BhY2VQcmVmaXg6IHN0cmluZztcblxuaWYgKGhhc1dvcmtzcGFjZSlcbntcblx0bGV0IHdzID0gcGFyc2VTdGF0aWNQYWNrYWdlc1BhdGhzKGdldENvbmZpZyhoYXNXb3Jrc3BhY2UpKTtcblxuXHRpZiAod3MucHJlZml4Lmxlbmd0aClcblx0e1xuXHRcdHdvcmtzcGFjZVByZWZpeCA9IHdzLnByZWZpeFswXTtcblx0fVxufVxuXG5sZXQgeyB0YXJnZXREaXIsIHRhcmdldE5hbWUgfSA9IGdldFRhcmdldERpcih7XG5cdGlucHV0TmFtZTogYXJndi5sZW5ndGggJiYgYXJndlswXSxcblx0Y3dkLFxuXHR0YXJnZXROYW1lOiBjbGkuYXJndi5uYW1lIHx8IG51bGwsXG5cdGhhc1dvcmtzcGFjZSxcblx0d29ya3NwYWNlUHJlZml4LFxufSk7XG5cbi8qXG5cbmxldCB0YXJnZXREaXI6IHN0cmluZztcbmxldCB0YXJnZXROYW1lOiBzdHJpbmcgPSBjbGkuYXJndi5uYW1lIHx8IG51bGw7XG5cbmlmIChhcmd2Lmxlbmd0aClcbntcblx0bGV0IG5hbWU6IHN0cmluZyA9IGFyZ3ZbMF07XG5cblx0aWYgKC9eKD86QChbXi9dKz8pWy9dKShbXi9dKykkL2kudGVzdChuYW1lKSlcblx0e1xuXHRcdHRhcmdldE5hbWUgPSB0YXJnZXROYW1lIHx8IG5hbWU7XG5cdFx0bmFtZSA9IG5hbWVcblx0XHRcdC5yZXBsYWNlKC9bXFwvXFxcXF0rL2csICdfJylcblx0XHRcdC5yZXBsYWNlKC9eQC9nLCAnJylcblx0XHQ7XG5cdH1cblx0ZWxzZSBpZiAoL15bXi9AXSskL2kudGVzdChuYW1lKSlcblx0e1xuXHRcdHRhcmdldE5hbWUgPSB0YXJnZXROYW1lIHx8IG51bGw7XG5cdH1cblx0ZWxzZVxuXHR7XG5cdFx0dGFyZ2V0TmFtZSA9IHRhcmdldE5hbWUgfHwgbnVsbDtcblx0fVxuXG5cdGlmIChoYXNXb3Jrc3BhY2UpXG5cdHtcblx0XHRsZXQgd3MgPSBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMoZ2V0Q29uZmlnKGhhc1dvcmtzcGFjZSkpO1xuXG5cdFx0aWYgKHdzLnByZWZpeC5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0bmFtZSA9IHBhdGguam9pbihoYXNXb3Jrc3BhY2UsIHdzLnByZWZpeFswXSwgbmFtZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgUmFuZ2VFcnJvcigpO1xuXHRcdH1cblx0fVxuXG5cdHRhcmdldERpciA9IHBhdGgucmVzb2x2ZShuYW1lKTtcbn1cbmVsc2Vcbntcblx0dGFyZ2V0RGlyID0gY3dkO1xufVxuXG4qL1xuXG4vL2NvbnNvbGUubG9nKHRhcmdldERpcik7XG5cbmZzLmVuc3VyZURpclN5bmModGFyZ2V0RGlyKTtcblxubGV0IGZsYWdzID0gT2JqZWN0LmtleXMoY2xpLmFyZ3YpXG5cdC5yZWR1Y2UoZnVuY3Rpb24gKGEsIGYpXG5cdHtcblx0XHRpZiAoZiA9PT0gJ3NpbGVudCcgfHwgZiA9PT0gJ3knIHx8IGYgPT09ICd5ZXMnKVxuXHRcdHtcblxuXHRcdH1cblx0XHRlbHNlIGlmICgvXlthLXpdJC8udGVzdChmKSAmJiBjbGkuYXJndltmXSlcblx0XHR7XG5cdFx0XHRhLnB1c2goZik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGE7XG5cdH0sIFtdKVxuXHQuam9pbignJylcbjtcblxubGV0IGFyZ3MgPSBbXG5cdCdpbml0Jyxcblx0KGZsYWdzICYmICctJyArIGZsYWdzKSxcblx0Y2xpLmFyZ3YuY3JlYXRlTW9kdWxlLFxuXHRjbGkuYXJndi55ZXMgJiYgJy15Jyxcbl0uZmlsdGVyKHYgPT4gdik7XG5cbi8vY29uc29sZS5sb2coYXJncyk7XG5cbmxldCBjcCA9IGNyb3NzU3Bhd24uc3luYyhjbGkuYXJndi5ucG1DbGllbnQsIGFyZ3MsIHtcblx0c3RkaW86ICdpbmhlcml0Jyxcblx0Y3dkOiB0YXJnZXREaXIsXG59KTtcblxuaWYgKCFjcC5lcnJvcilcbntcblx0bGV0IHBrZyA9IG5ldyBQYWNrYWdlSnNvbkxvYWRlcihwYXRoLmpvaW4odGFyZ2V0RGlyLCAncGFja2FnZS5qc29uJykpO1xuXG5cdGlmIChwa2cuZXhpc3RzKCkpXG5cdHtcblx0XHRpZiAoY2xpLmFyZ3YucCAmJiBjbGkuYXJndi5ucG1DbGllbnQgIT0gJ3lhcm4nKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnByaXZhdGUgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0YXJnZXROYW1lICYmIHBrZy5kYXRhLm5hbWUgIT0gdGFyZ2V0TmFtZSlcblx0XHR7XG5cdFx0XHRwa2cuZGF0YS5uYW1lID0gdGFyZ2V0TmFtZTtcblx0XHR9XG5cblx0XHRpZiAocGtnLmRhdGEubmFtZSAmJiAvXkAvLnRlc3QocGtnLmRhdGEubmFtZSkgJiYgIXBrZy5kYXRhLnB1Ymxpc2hDb25maWcpXG5cdFx0e1xuXHRcdFx0Ly9wa2cuZGF0YS5wdWJsaXNoQ29uZmlnID0ge307XG5cdFx0fVxuXG5cdFx0aWYgKCFwa2cuZGF0YS5zY3JpcHRzKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLnNjcmlwdHMgPSB7fTtcblx0XHR9XG5cblx0XHRPYmplY3Rcblx0XHRcdC5lbnRyaWVzKHtcblx0XHRcdFx0XCJsaW50XCI6IFwibnB4IGVzbGludCAqKi8qLnRzXCIsXG5cdFx0XHRcdFwibmN1XCI6IFwibnB4IHlhcm4tdG9vbCBuY3UgLXVcIixcblx0XHRcdFx0XCJzb3J0LXBhY2thZ2UtanNvblwiOiBcIm5weCBzb3J0LXBhY2thZ2UtanNvbiAuL3BhY2thZ2UuanNvblwiLFxuXHRcdFx0XHRcInByZXB1Ymxpc2hPbmx5XCI6IFwibnBtIHJ1biBuY3UgJiYgbnBtIHJ1biBzb3J0LXBhY2thZ2UtanNvbiAmJiBucG0gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJjb3ZlcmFnZVwiOiBcIm5weCBueWMgbnBtIHJ1biB0ZXN0XCIsXG5cdFx0XHRcdFwidGVzdFwiOiBcImVjaG8gXFxcIkVycm9yOiBubyB0ZXN0IHNwZWNpZmllZFxcXCIgJiYgZXhpdCAxXCIsXG5cdFx0XHR9KVxuXHRcdFx0LmZvckVhY2goKFtrLCB2XSkgPT5cblx0XHRcdHtcblx0XHRcdFx0aWYgKHBrZy5kYXRhLnNjcmlwdHNba10gPT0gbnVsbClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHBrZy5kYXRhLnNjcmlwdHNba10gPSB2O1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdHBrZy5hdXRvZml4KCk7XG5cblx0XHRpZiAoY2xpLmFyZ3Yuc29ydClcblx0XHR7XG5cdFx0XHRwa2cuc29ydCgpO1xuXHRcdH1cblxuXHRcdHBrZy53cml0ZVdoZW5Mb2FkZWQoKTtcblxuXHRcdHRyeVxuXHRcdHtcblx0XHRcdGxldCBjb3B5T3B0aW9uczogZnMuQ29weU9wdGlvbnNTeW5jID0ge1xuXHRcdFx0XHRvdmVyd3JpdGU6IGZhbHNlLFxuXHRcdFx0XHRwcmVzZXJ2ZVRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHRcdGVycm9yT25FeGlzdDogZmFsc2UsXG5cdFx0XHR9O1xuXG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL3N0YXRpYycpLCB0YXJnZXREaXIsIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXG5cdFx0fVxuXG5cdFx0Y29weVN0YXRpY0ZpbGVzKGRlZmF1bHRDb3B5U3RhdGljRmlsZXMsIHtcblx0XHRcdGN3ZDogdGFyZ2V0RGlyLFxuXHRcdH0pO1xuXG5cdFx0Lypcblx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvbnBtaWdub3JlJyksIHBhdGguam9pbih0YXJnZXREaXIsICcubnBtaWdub3JlJyksIGNvcHlPcHRpb25zKTtcblxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9naXRpZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5naXRpZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0aWYgKCFmcy5wYXRoRXhpc3RzU3luYyhwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbicpKSlcblx0XHR7XG5cdFx0XHRmcy5jb3B5U3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGliL2ZpbGUvdHNjb25maWcuanNvbi50cGwnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJ3RzY29uZmlnLmpzb24udHBsJyksIGNvcHlPcHRpb25zKTtcblx0XHR9XG5cdFx0ICovXG5cblx0fVxufVxuZWxzZVxue1xuXHRwcm9jZXNzLmV4aXRDb2RlID0gMTtcbn1cbiJdfQ==