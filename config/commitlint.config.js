module.exports = {
	extends: ['@commitlint/config-conventional'],
	ignores: [(commit) => commit.includes('[tag]')],
	rules: {
		'header-max-length': [2, 'always', 2000],
		'body-max-line-length': [2, 'always', 2000],
		'footer-max-line-length': [2, 'always', 2000],
	},
};
