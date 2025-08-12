import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserLayout from './layouts/UserLayout';
import FacilityOwnerLayout from './layouts/FacilityOwnerLayout';
import AdminLayout from './layouts/AdminLayout';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 shimmer"></div>
          <p className="mt-4 text-gray-600 font-medium fade-in">Loading QuickCourt...</p>
        </div>
      </div>
    );
  }

  // If no user, just render children without layout (for public routes)
  if (!user) {
    return <>{children}</>;
  }

  // Apply role-based layout for authenticated users
  switch (user.role) {
    case 'user':
    case 'customer':
      return <UserLayout>{children}</UserLayout>;
    case 'facility_owner':
      return <FacilityOwnerLayout>{children}</FacilityOwnerLayout>;
    case 'admin':
      return <AdminLayout>{children}</AdminLayout>;
    default:
      return <>{children}</>;
  }
}