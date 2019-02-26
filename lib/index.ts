/**
 * Created by user on 2018/11/28/028.
 */

import crossSpawn = require('cross-spawn-extra');
import JSON5 = require('json5')

export function npmVersion(npmClient?: string, cwd?: string)
{
	let args = [
		'version'
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


