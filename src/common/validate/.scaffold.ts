export default {
  name: '~common/validate',
  requests: [
    { match: 'package.json:dependency', value: { pkg: 'class-transformer@^0.5.1' } },
    { match: 'package.json:dependency', value: { pkg: 'class-validator@^0.14.1' } },
  ],
};
