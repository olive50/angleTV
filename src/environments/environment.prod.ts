export const environment = {
  production: true,
  apiUrl: 'https://api.yourhotel.com/api',
  appName: 'Hotel IPTV Management',
  version: '1.0.0',
  features: {
    notifications: true,
    analytics: true,
    multiLanguage: true,
    darkMode: true,
  },
  jwt: {
    tokenKey: 'jwt_token',
    userKey: 'current_user',
    refreshTokenKey: 'refresh_token',
  },
};
