module.exports = {
	'src/**/*.ts': (filenames) =>
		`npx eslint ${filenames.join(' ')} --fix && npx prettier --write ${filenames.join(' ')}`,
	'test/**/*.ts': (filenames) =>
		`npx eslint ${filenames.join(' ')} --fix && npx prettier --write ${filenames.join(' ')}`,
	'scripts/**/*.ts': (filenames) =>
		`npx eslint ${filenames.join(' ')} --fix && npx prettier --write ${filenames.join(' ')}`,
	'seeds/**/*.ts': (filenames) =>
		`npx eslint ${filenames.join(' ')} --fix && npx prettier --write ${filenames.join(' ')}`,
};
