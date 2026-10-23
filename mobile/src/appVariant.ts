// Which app this build is. Set at build time (eas.json profiles, or the env var when running locally):
//   EXPO_PUBLIC_APP_VARIANT=admin  -> "ProovCon Admin", the owner's own app with the admin panel
//   anything else                  -> "ProovCon", the public app with no admin features at all
// The server still checks the admin code, so this only decides what the UI contains.
export const IS_ADMIN_BUILD = process.env.EXPO_PUBLIC_APP_VARIANT === 'admin';
