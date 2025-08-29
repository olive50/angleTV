export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
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
