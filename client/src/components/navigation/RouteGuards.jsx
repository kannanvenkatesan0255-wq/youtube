/**
 * Route Guards: ProtectedRoute & GuestRoute
 * VidTube Platform Architecture - Phase 2
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../common/Spinner';

/**
 * Guard for routes requiring an authenticated user session
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xs text-neutral-500">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Guard for guest-only pages (Login, Register, ForgotPassword)
 * Redirects already authenticated users to homepage or return target
 */
export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return children;
};

/**
 * Guard for administrator-only pages (Admin Control Center & Moderation)
 * Enforces role 'admin' or 'super_admin'
 */
export const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-xs text-neutral-500">Verifying administrator clearance...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};
