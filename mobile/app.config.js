// Two apps from one codebase. APP_VARIANT=admin builds "ProovCon Admin" with its own package id,
// so it installs next to the public "ProovCon" app. Everything else comes from app.json.
const IS_ADMIN = process.env.APP_VARIANT === 'admin';

module.exports = ({ config }) => {
  if (!IS_ADMIN) return config;
  return {
    ...config,
    name: 'ProovCon Admin',
    slug: config.slug,
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}.admin` },
    android: { ...config.android, package: `${config.android.package}.admin` },
  };
};
