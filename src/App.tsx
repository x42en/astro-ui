import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppShell } from './components/layout/AppShell';
import { RequireAdmin, RequireAuth } from './components/auth/Guards';
import { useIsAuthenticated } from './store/authStore';
import { Dashboard } from './pages/Dashboard';
import { Gallery } from './pages/Gallery';
import { SessionDetail } from './pages/SessionDetail';
import { ProfileEditor } from './pages/ProfileEditor';
import { SettingsPage } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { UserProfile } from './pages/UserProfile';
import { SessionPrep } from './pages/SessionPrep';
import { Learn } from './pages/Learn';

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
