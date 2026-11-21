import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Footer } from './Footer.js';
import { LocationPermissionDialog } from '../../components/location/LocationPermissionDialog.js';
import { useLocationContext } from '../../contexts/LocationContext.js';
import { LanguageSynchronizer } from '../../i18n/universalTranslator.js';
import { OfflineDraftBanner } from '../../components/forms/OfflineDraftBanner.js';
import { AICivicAssistantModal } from '../../components/ai/AICivicAssistantModal.js';

export const MainLayout: React.FC = () => {
  const { isPermissionDialogOpen, closePermissionDialog } = useLocationContext();

  return (
    <div className="flex flex-col min-h-screen bg-surface-subtle">
      {/* WCAG 2.4.1 Accessible Skip Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <LanguageSynchronizer />
      <OfflineDraftBanner />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AICivicAssistantModal />
      <LocationPermissionDialog
        isOpen={isPermissionDialogOpen}
        onClose={closePermissionDialog}
      />
    </div>
  );
};
