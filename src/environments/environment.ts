export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // URL de votre backend Spring Boot
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
  // Nouvelles configurations pour les vraies données
  api: {
    timeout: 30000,
    retryAttempts: 3,
    pageSize: 20,
  },
  websocket: {
    url: 'ws://localhost:8080/ws',
    reconnectInterval: 5000,
  }
};
