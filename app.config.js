// Extends app.json. On EAS, the Firebase config arrives as the GOOGLE_SERVICES_JSON file
// variable (a path to the file); locally it falls back to ./google-services.json.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
  },
});
