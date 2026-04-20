import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('pablo_token') || sessionStorage.getItem('pablo_token');
  if (!token) return <Navigate to="/pb-admin/login" replace />;
  return <>{children}</>;
}
