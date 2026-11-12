const app = require('./app.json');

/** Staging installs beside production, matching the store records. */
module.exports = () => {
  const expo = app.expo;
  if (process.env.APP_VARIANT !== 'staging') return expo;

  return {
    ...expo,
    name: 'CROS Tenant Staging',
    scheme: 'crossubtenantstaging',
    ios: {
      ...expo.ios,
      bundleIdentifier: 'com.crossub.tenant.staging',
      infoPlist: {
        ...expo.ios.infoPlist,
        CFBundleDisplayName: 'CROS Tenant Staging',
        CFBundleName: 'CROS Tenant Staging',
      },
    },
    android: {
      ...expo.android,
      package: 'com.crossub.tenant.staging',
      label: 'CROS Tenant Staging',
    },
  };
};
