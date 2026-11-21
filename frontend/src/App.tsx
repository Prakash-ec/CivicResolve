import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router/index.js';
import { AuthProvider } from './features/auth/AuthContext.js';
import { LocationProvider } from './contexts/LocationContext.js';
import './i18n/i18n.js';

export function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <RouterProvider router={router} />
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
