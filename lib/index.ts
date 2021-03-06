/**
 * Created by user on 2018/11/28/028.
 */

import crossSpawn from 'cross-spawn-extra';
import JSON5 from 'json5';

import _validateNpmPackageName from 'validate-npm-package-name';
import { pathExistsSync } from 'fs-extra';
import { join, resolve } from 'path';

import _copyStaticFiles, { defaultCopyStaticFiles } from '@yarn-tool/static-file';
import { parseStaticPackagesPaths } from 'workspaces-config';
import searchWorkspacePrefixByName from './searchWorkspacePrefixByName';

export function npmVersion(npmClient?: string, cwd?: string)
{
	let args = [
		'version',
	];

	npmClient = npmClient || 'npm';

	if (npmClient === 'yarn')
	{
		args = [
			'versions',
		]
	}

	let cp = crossSpawn.sync(npmClient, args, {
		cwd,
		stripAnsi: true,
	});

	if (cp.error)
	{
		throw cp.error
	}

	let output = cp.stdout.toString()
		.replace(/^yarn versions [^\n]+$/gm, '')
		.replace(/^Done in [^\n]+$/gm, '')
		.replace(/^\s+|\s+$/g, '')
	;

	let json = JSON5.parse(output);

	return json
}

export function getTargetDir(options: {
	inputName: string,
	cwd: string,

	targetName?: string,
	hasWorkspace?: string,
	workspacePrefix?: string,
	workspacesConfig?: ReturnType<typeof parseStaticPackagesPaths>
})
{
	let targetDir: string;
	let targetName: string = options.targetName || null;
	let { inputName, cwd, hasWorkspace, workspacePrefix, workspacesConfig } = options;

	if (hasWorkspace && !workspacesConfig?.prefix?.length)
	{
		throw new RangeError(`can't found workspace prefix`);
	}

	if (targetName)
	{
		validateNpmPackageName(targetName, true);
	}

	if (inputName)
	{
		targetName = targetName || inputName;

		let ret = validateNpmPackageName(inputName, true);
		let name = inputName;

		let basePath: string;

		if (hasWorkspace)
		{
			const workspacePrefix = searchWorkspacePrefixByName({
				inputName,
				workspacesConfig,
			})

			basePath = join(hasWorkspace, workspacePrefix);
		}
		else
		{
			basePath = cwd;
		}

		if (ret.scopedPackagePattern)
		{
			name = name
				.replace(/[\/\\]+/g, '_')
				.replace(/^@/g, '')
			;

			if (!pathExistsSync(join(basePath, ret.subname)))
			{
				name = ret.subname;
			}
		}

		targetDir = resolve(basePath, name);

	}
	else
	{
		targetDir = cwd;
	}

	return {
		targetDir,
		targetName,
		cwd,
	}
}

const scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$');

export function validateNpmPackageName(name: string, throwErr?: boolean)
{
	let ret: {
		validForNewPackages: boolean,
		validForOldPackages: boolean,
		scopedPackagePattern: boolean,
		warnings?: string[],
		errors?: string[],

		name: string,
		user?: string,
		subname?: string,

	} = _validateNpmPackageName(name) as any;

	ret.name = name;

	if (!ret.errors || !ret.errors.length)
	{
		const nameMatch = name.match(scopedPackagePattern);

		if (nameMatch)
		{
			ret.scopedPackagePattern = true;

			ret.user = nameMatch[1];
			ret.subname = nameMatch[2];
		}
		else
		{
			ret.scopedPackagePattern = false;
		}
	}
	else if (throwErr)
	{
		throw new RangeError(ret.errors.concat(ret.warnings || []).join(' ; '));
	}

	return ret;
}

export { defaultCopyStaticFiles }

export function copyStaticFiles(file_map: Record<string, string> | [string, string, string?][], options: {
	cwd: string,
	staticRoot?: string,
	overwrite?: boolean,
})
{
	return _copyStaticFiles({
		...options,
		file_map,
	});
}
