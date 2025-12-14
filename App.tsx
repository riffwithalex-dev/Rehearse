import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { SongDetail } from './pages/SongDetail';
import { Schedule } from './pages/Schedule';
import { Tones } from './pages/Tones';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { ReactNode } from 'react';

const LayoutWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const isAuthPage = window.location.hash === '#/signin' || window.location.hash === '#/signup';
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/song/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
      <Route path="/tones" element={<ProtectedRoute><Tones /></ProtectedRoute>} />
      <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <LayoutWrapper>
            <AppRoutes />
          </LayoutWrapper>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
