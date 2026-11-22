const app = require('./app.json');

/** Staging installs beside production. The store records use these bundle IDs. */
module.exports = () => {
  const expo = app.expo;
  if (process.env.APP_VARIANT !== 'staging') return expo;

  return {
    ...expo,
    name: 'CROSSUB Staging',
    scheme: 'crossubtenantstaging',
    ios: {
      ...expo.ios,
      bundleIdentifier: 'com.crossub.tenant.staging',
      infoPlist: {
        ...expo.ios.infoPlist,
        CFBundleDisplayName: 'CROSSUB Staging',
        CFBundleName: 'CROSSUB Staging',
      },
    },
    android: {
      ...expo.android,
      package: 'com.crossub.tenant.staging',
      label: 'CROSSUB Staging',
    },
  };
};
