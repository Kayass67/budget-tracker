import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AnalyzerPage } from '@/pages/AnalyzerPage';
import { ComparePage } from '@/pages/ComparePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAppStore } from '@/store';

export const App: React.FC = () => {
  const refreshExchangeRates = useAppStore((state) => state.refreshExchangeRates);

  useEffect(() => {
    // Attempt to load / refresh live exchange rates on initial application load
    refreshExchangeRates();
  }, [refreshExchangeRates]);

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analyzer" element={<AnalyzerPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
