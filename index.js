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
            "postpublish": "git commit -m 'publish new version' .",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtRUFBb0U7QUFDcEUsK0JBQWdDO0FBQ2hDLGdEQUFpRDtBQUNqRCwrQkFBZ0M7QUFDaEMsNkJBQThCO0FBQzlCLHlEQUF3RTtBQUN4RSxxRUFBd0Q7QUFDeEQsa0RBQW1EO0FBQ25ELHNDQUF5QztBQUN6Qyx1Q0FBb0Y7QUFDcEYsdURBQStDO0FBRS9DLGNBQWMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFakMsSUFBSSxHQUFHLEdBQUcsdUJBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUU5QixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUV0Qix3QkFBd0I7QUFFeEIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUV0RCxJQUFJLFlBQW9CLENBQUM7QUFFekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQ2hDO0lBQ0MsWUFBWSxHQUFHLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzFDO0FBRUQsSUFBSSxlQUF1QixDQUFDO0FBRTVCLElBQUksWUFBWSxFQUNoQjtJQUNDLElBQUksRUFBRSxHQUFHLDRDQUF3QixDQUFDLDJCQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUUzRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUNwQjtRQUNDLGVBQWUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9CO0NBQ0Q7QUFFRCxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxHQUFHLG9CQUFZLENBQUM7SUFDNUMsU0FBUyxFQUFF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QUUsNkNBQTZDO1NBQ3JELENBQUM7YUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBRW5CLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUMvQjtnQkFDQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDeEI7UUFDRixDQUFDLENBQUMsQ0FDRjtRQUVELEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVkLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2pCO1lBQ0MsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ1g7UUFFRCxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7UUFFdEIsSUFDQTtZQUNDLElBQUksV0FBVyxHQUF1QjtnQkFDckMsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hCLFlBQVksRUFBRSxLQUFLO2FBQ25CLENBQUM7WUFFRixFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUN4RTtRQUNELE9BQU8sQ0FBQyxFQUNSO1NBRUM7UUFFRCx1QkFBZSxDQUFDLDhCQUFzQixFQUFFO1lBQ3ZDLEdBQUcsRUFBRSxTQUFTO1NBQ2QsQ0FBQyxDQUFDO1FBRUg7Ozs7Ozs7OztXQVNHO0tBRUg7Q0FDRDtLQUVEO0lBQ0MsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7Q0FDckIiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5cbmltcG9ydCBmaW5kWWFybldvcmtzcGFjZVJvb3QgPSByZXF1aXJlKCdmaW5kLXlhcm4td29ya3NwYWNlLXJvb3QyJyk7XG5pbXBvcnQgeWFyZ3MgPSByZXF1aXJlKCd5YXJncycpO1xuaW1wb3J0IGNyb3NzU3Bhd24gPSByZXF1aXJlKCdjcm9zcy1zcGF3bi1leHRyYScpO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IGdldENvbmZpZywgeyBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMgfSBmcm9tICd3b3Jrc3BhY2VzLWNvbmZpZyc7XG5pbXBvcnQgUGFja2FnZUpzb25Mb2FkZXIgZnJvbSAnbnBtLXBhY2thZ2UtanNvbi1sb2FkZXInO1xuaW1wb3J0IHVwZGF0ZU5vdGlmaWVyID0gcmVxdWlyZSgndXBkYXRlLW5vdGlmaWVyJyk7XG5pbXBvcnQgcGtnID0gcmVxdWlyZSggJy4vcGFja2FnZS5qc29uJyApO1xuaW1wb3J0IHsgY29weVN0YXRpY0ZpbGVzLCBkZWZhdWx0Q29weVN0YXRpY0ZpbGVzLCBnZXRUYXJnZXREaXIgfSBmcm9tICcuL2xpYi9pbmRleCc7XG5pbXBvcnQgc2V0dXBUb1lhcmdzIGZyb20gJy4vbGliL3lhcmdzLXNldHRpbmcnO1xuXG51cGRhdGVOb3RpZmllcih7IHBrZyB9KS5ub3RpZnkoKTtcblxubGV0IGNsaSA9IHNldHVwVG9ZYXJncyh5YXJncyk7XG5cbmxldCBhcmd2ID0gY2xpLmFyZ3YuXztcblxuLy9jb25zb2xlLmRpcihjbGkuYXJndik7XG5cbmxldCBjd2QgPSBwYXRoLnJlc29sdmUoY2xpLmFyZ3YuY3dkIHx8IHByb2Nlc3MuY3dkKCkpO1xuXG5sZXQgaGFzV29ya3NwYWNlOiBzdHJpbmc7XG5cbmlmICghY2xpLmFyZ3Yuc2tpcENoZWNrV29ya3NwYWNlKVxue1xuXHRoYXNXb3Jrc3BhY2UgPSBmaW5kWWFybldvcmtzcGFjZVJvb3QoY3dkKTtcbn1cblxubGV0IHdvcmtzcGFjZVByZWZpeDogc3RyaW5nO1xuXG5pZiAoaGFzV29ya3NwYWNlKVxue1xuXHRsZXQgd3MgPSBwYXJzZVN0YXRpY1BhY2thZ2VzUGF0aHMoZ2V0Q29uZmlnKGhhc1dvcmtzcGFjZSkpO1xuXG5cdGlmICh3cy5wcmVmaXgubGVuZ3RoKVxuXHR7XG5cdFx0d29ya3NwYWNlUHJlZml4ID0gd3MucHJlZml4WzBdO1xuXHR9XG59XG5cbmxldCB7IHRhcmdldERpciwgdGFyZ2V0TmFtZSB9ID0gZ2V0VGFyZ2V0RGlyKHtcblx0aW5wdXROYW1lOiBhcmd2Lmxlbmd0aCAmJiBhcmd2WzBdLFxuXHRjd2QsXG5cdHRhcmdldE5hbWU6IGNsaS5hcmd2Lm5hbWUgfHwgbnVsbCxcblx0aGFzV29ya3NwYWNlLFxuXHR3b3Jrc3BhY2VQcmVmaXgsXG59KTtcblxuLypcblxubGV0IHRhcmdldERpcjogc3RyaW5nO1xubGV0IHRhcmdldE5hbWU6IHN0cmluZyA9IGNsaS5hcmd2Lm5hbWUgfHwgbnVsbDtcblxuaWYgKGFyZ3YubGVuZ3RoKVxue1xuXHRsZXQgbmFtZTogc3RyaW5nID0gYXJndlswXTtcblxuXHRpZiAoL14oPzpAKFteL10rPylbL10pKFteL10rKSQvaS50ZXN0KG5hbWUpKVxuXHR7XG5cdFx0dGFyZ2V0TmFtZSA9IHRhcmdldE5hbWUgfHwgbmFtZTtcblx0XHRuYW1lID0gbmFtZVxuXHRcdFx0LnJlcGxhY2UoL1tcXC9cXFxcXSsvZywgJ18nKVxuXHRcdFx0LnJlcGxhY2UoL15AL2csICcnKVxuXHRcdDtcblx0fVxuXHRlbHNlIGlmICgvXlteL0BdKyQvaS50ZXN0KG5hbWUpKVxuXHR7XG5cdFx0dGFyZ2V0TmFtZSA9IHRhcmdldE5hbWUgfHwgbnVsbDtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHR0YXJnZXROYW1lID0gdGFyZ2V0TmFtZSB8fCBudWxsO1xuXHR9XG5cblx0aWYgKGhhc1dvcmtzcGFjZSlcblx0e1xuXHRcdGxldCB3cyA9IHBhcnNlU3RhdGljUGFja2FnZXNQYXRocyhnZXRDb25maWcoaGFzV29ya3NwYWNlKSk7XG5cblx0XHRpZiAod3MucHJlZml4Lmxlbmd0aClcblx0XHR7XG5cdFx0XHRuYW1lID0gcGF0aC5qb2luKGhhc1dvcmtzcGFjZSwgd3MucHJlZml4WzBdLCBuYW1lKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBSYW5nZUVycm9yKCk7XG5cdFx0fVxuXHR9XG5cblx0dGFyZ2V0RGlyID0gcGF0aC5yZXNvbHZlKG5hbWUpO1xufVxuZWxzZVxue1xuXHR0YXJnZXREaXIgPSBjd2Q7XG59XG5cbiovXG5cbi8vY29uc29sZS5sb2codGFyZ2V0RGlyKTtcblxuZnMuZW5zdXJlRGlyU3luYyh0YXJnZXREaXIpO1xuXG5sZXQgZmxhZ3MgPSBPYmplY3Qua2V5cyhjbGkuYXJndilcblx0LnJlZHVjZShmdW5jdGlvbiAoYSwgZilcblx0e1xuXHRcdGlmIChmID09PSAnc2lsZW50JyB8fCBmID09PSAneScgfHwgZiA9PT0gJ3llcycpXG5cdFx0e1xuXG5cdFx0fVxuXHRcdGVsc2UgaWYgKC9eW2Etel0kLy50ZXN0KGYpICYmIGNsaS5hcmd2W2ZdKVxuXHRcdHtcblx0XHRcdGEucHVzaChmKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pXG5cdC5qb2luKCcnKVxuO1xuXG5sZXQgYXJncyA9IFtcblx0J2luaXQnLFxuXHQoZmxhZ3MgJiYgJy0nICsgZmxhZ3MpLFxuXHRjbGkuYXJndi5jcmVhdGVNb2R1bGUsXG5cdGNsaS5hcmd2LnllcyAmJiAnLXknLFxuXS5maWx0ZXIodiA9PiB2KTtcblxuLy9jb25zb2xlLmxvZyhhcmdzKTtcblxubGV0IGNwID0gY3Jvc3NTcGF3bi5zeW5jKGNsaS5hcmd2Lm5wbUNsaWVudCwgYXJncywge1xuXHRzdGRpbzogJ2luaGVyaXQnLFxuXHRjd2Q6IHRhcmdldERpcixcbn0pO1xuXG5pZiAoIWNwLmVycm9yKVxue1xuXHRsZXQgcGtnID0gbmV3IFBhY2thZ2VKc29uTG9hZGVyKHBhdGguam9pbih0YXJnZXREaXIsICdwYWNrYWdlLmpzb24nKSk7XG5cblx0aWYgKHBrZy5leGlzdHMoKSlcblx0e1xuXHRcdGlmIChjbGkuYXJndi5wICYmIGNsaS5hcmd2Lm5wbUNsaWVudCAhPSAneWFybicpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEucHJpdmF0ZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKHRhcmdldE5hbWUgJiYgcGtnLmRhdGEubmFtZSAhPSB0YXJnZXROYW1lKVxuXHRcdHtcblx0XHRcdHBrZy5kYXRhLm5hbWUgPSB0YXJnZXROYW1lO1xuXHRcdH1cblxuXHRcdGlmIChwa2cuZGF0YS5uYW1lICYmIC9eQC8udGVzdChwa2cuZGF0YS5uYW1lKSAmJiAhcGtnLmRhdGEucHVibGlzaENvbmZpZylcblx0XHR7XG5cdFx0XHQvL3BrZy5kYXRhLnB1Ymxpc2hDb25maWcgPSB7fTtcblx0XHR9XG5cblx0XHRpZiAoIXBrZy5kYXRhLnNjcmlwdHMpXG5cdFx0e1xuXHRcdFx0cGtnLmRhdGEuc2NyaXB0cyA9IHt9O1xuXHRcdH1cblxuXHRcdE9iamVjdFxuXHRcdFx0LmVudHJpZXMoe1xuXHRcdFx0XHRcImxpbnRcIjogXCJucHggZXNsaW50ICoqLyoudHNcIixcblx0XHRcdFx0XCJuY3VcIjogXCJucHggeWFybi10b29sIG5jdSAtdVwiLFxuXHRcdFx0XHRcInNvcnQtcGFja2FnZS1qc29uXCI6IFwibnB4IHNvcnQtcGFja2FnZS1qc29uIC4vcGFja2FnZS5qc29uXCIsXG5cdFx0XHRcdFwicHJlcHVibGlzaE9ubHlcIjogXCJucG0gcnVuIG5jdSAmJiBucG0gcnVuIHNvcnQtcGFja2FnZS1qc29uICYmIG5wbSBydW4gdGVzdFwiLFxuXHRcdFx0XHRcInBvc3RwdWJsaXNoXCI6IFwiZ2l0IGNvbW1pdCAtbSAncHVibGlzaCBuZXcgdmVyc2lvbicgLlwiLFxuXHRcdFx0XHRcImNvdmVyYWdlXCI6IFwibnB4IG55YyBucG0gcnVuIHRlc3RcIixcblx0XHRcdFx0XCJ0ZXN0XCI6IFwiZWNobyBcXFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXFxcIiAmJiBleGl0IDFcIixcblx0XHRcdH0pXG5cdFx0XHQuZm9yRWFjaCgoW2ssIHZdKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocGtnLmRhdGEuc2NyaXB0c1trXSA9PSBudWxsKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cGtnLmRhdGEuc2NyaXB0c1trXSA9IHY7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0cGtnLmF1dG9maXgoKTtcblxuXHRcdGlmIChjbGkuYXJndi5zb3J0KVxuXHRcdHtcblx0XHRcdHBrZy5zb3J0KCk7XG5cdFx0fVxuXG5cdFx0cGtnLndyaXRlV2hlbkxvYWRlZCgpO1xuXG5cdFx0dHJ5XG5cdFx0e1xuXHRcdFx0bGV0IGNvcHlPcHRpb25zOiBmcy5Db3B5T3B0aW9uc1N5bmMgPSB7XG5cdFx0XHRcdG92ZXJ3cml0ZTogZmFsc2UsXG5cdFx0XHRcdHByZXNlcnZlVGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdFx0ZXJyb3JPbkV4aXN0OiBmYWxzZSxcblx0XHRcdH07XG5cblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvc3RhdGljJyksIHRhcmdldERpciwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHRjYXRjaCAoZSlcblx0XHR7XG5cblx0XHR9XG5cblx0XHRjb3B5U3RhdGljRmlsZXMoZGVmYXVsdENvcHlTdGF0aWNGaWxlcywge1xuXHRcdFx0Y3dkOiB0YXJnZXREaXIsXG5cdFx0fSk7XG5cblx0XHQvKlxuXHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS9ucG1pZ25vcmUnKSwgcGF0aC5qb2luKHRhcmdldERpciwgJy5ucG1pZ25vcmUnKSwgY29weU9wdGlvbnMpO1xuXG5cdFx0ZnMuY29weVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ2xpYi9maWxlL2dpdGlnbm9yZScpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAnLmdpdGlnbm9yZScpLCBjb3B5T3B0aW9ucyk7XG5cblx0XHRpZiAoIWZzLnBhdGhFeGlzdHNTeW5jKHBhdGguam9pbih0YXJnZXREaXIsICd0c2NvbmZpZy5qc29uJykpKVxuXHRcdHtcblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICdsaWIvZmlsZS90c2NvbmZpZy5qc29uLnRwbCcpLCBwYXRoLmpvaW4odGFyZ2V0RGlyLCAndHNjb25maWcuanNvbi50cGwnKSwgY29weU9wdGlvbnMpO1xuXHRcdH1cblx0XHQgKi9cblxuXHR9XG59XG5lbHNlXG57XG5cdHByb2Nlc3MuZXhpdENvZGUgPSAxO1xufVxuIl19