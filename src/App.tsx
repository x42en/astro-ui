import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppShell } from './components/layout/AppShell';
import { RequireAdmin, RequireAuth } from './components/auth/Guards';
import { useIsAuthenticated, useAuthStore } from './store/authStore';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { SessionDetail } from './pages/SessionDetail';
import { ProfileEditor } from './pages/ProfileEditor';
import { SettingsPage } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { UserProfile } from './pages/UserProfile';
import { SessionPrep } from './pages/SessionPrep';
import { Learn } from './pages/Learn';
import { LiveSession } from './pages/LiveSession';
import { AdminGallery } from './pages/AdminGallery';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';

/**
 * `/` renders the public landing page for anonymous visitors and the
 * authenticated dashboard for signed-in users.  Keeping a single canonical
 * URL means shared links always resolve to the most useful destination.
 */
function RootRoute() {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? <Dashboard /> : <Landing />;
}

function App() {
  useEffect(() => {
    useAuthStore.getState().bootstrap().catch(() => undefined);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/welcome" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/prepare" element={<SessionPrep />} />
              <Route path="/learn" element={<Learn />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/sessions/:sessionId"
                element={
                  <RequireAuth>
                    <SessionDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/sessions/:sessionId/live"
                element={
                  <RequireAuth>
                    <LiveSession />
                  </RequireAuth>
                }
              />
              <Route
                path="/profiles"
                element={
                  <RequireAuth>
                    <ProfileEditor />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <UserProfile />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAdmin>
                    <SettingsPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/gallery"
                element={
                  <RequireAdmin>
                    <AdminGallery />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
