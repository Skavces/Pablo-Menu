import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/pb-admin/login" element={<LoginPage />} />
        <Route
          path="/pb-admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
