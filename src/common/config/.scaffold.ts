export default {
  name: '~common/config',
  requests: [{ match: 'package.json:dependency', value: { pkg: 'cosmiconfig@^9.0.0' } }],
};
