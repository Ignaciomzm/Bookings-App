// C:\dev\client-scheduler\mobile\app.config.js
export default ({ config }) => ({
  // Keep anything Expo already resolves for you
  ...config,

  // Identity (keep your current name/slug)
  name: 'Salon',
  slug: 'salon',

  // Must match your in-app APP_SCHEME = 'triosalon'
  scheme: 'triosalon',

  // Keep your existing values
  version: '1.0.0',
  orientation: 'portrait',
  owner: 'ignacio.mzm',
  platforms: ['ios', 'android'],

  // Your plugins (preserve as-is)
  plugins: [
    'expo-notifications',
    'expo-localization',
    'expo-sqlite',
  ],

  // ✅ Final Android package id
  android: {
    ...(config.android || {}),
    package: 'com.triobookings.app',
  },

  // Keep your EAS project id
  extra: {
    ...(config.extra || {}),
    eas: {
      ...(config.extra?.eas || {}),
      projectId: '36a0991e-fbd8-4d23-9111-6ec2b5158f2d',
    },
  },
});
