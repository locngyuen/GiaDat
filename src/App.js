import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/Dashboard';
import DataManagement from './pages/admin/DataManagement';
import UserManagement from './pages/admin/UserManagement';

// Context
import { AuthProvider } from './context/AuthContext';

import './App.css';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <PrivateRoute roles={['admin', 'editor']}>
                      <AdminDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/data" 
                  element={
                    <PrivateRoute roles={['admin', 'editor']}>
                      <DataManagement />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <PrivateRoute roles={['admin']}>
                      <UserManagement />
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App; 