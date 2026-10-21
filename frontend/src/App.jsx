import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchCurrentUser = async () => {
    try {
      const data = await api.getMe();
      if (data && data.authenticated) {
        setCurrentUser(data);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      showToast('Signed out successfully.', 'info');
    } catch (err) {
      setCurrentUser(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Connecting to 3NF Database Core...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLoginModal={() => setCurrentUser(null)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginPage onLoginSuccess={fetchCurrentUser} showToast={showToast} />
        ) : currentUser.role === 'student' ? (
          <StudentDashboard currentUser={currentUser} showToast={showToast} />
        ) : currentUser.role === 'instructor' ? (
          <InstructorDashboard currentUser={currentUser} showToast={showToast} />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard currentUser={currentUser} showToast={showToast} />
        ) : (
          <div className="text-center py-20 text-slate-400">
            Unknown user role. Please sign out and sign in again.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Apex University • Database Systems (DBS) Laboratory Mini-Project</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Strict 3NF Schema</span>
            <span>•</span>
            <span>ACID Concurrency Locks</span>
            <span>•</span>
            <span>Dual Python/Java Core</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
