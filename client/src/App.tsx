import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import HomePage from './pages/user/HomePage';
import VenuesPage from './pages/user/VenuesPage';
import VenueDetailsPage from './pages/user/VenueDetailsPage';
import CustomerDashboard from './pages/user/CustomerDashboard';
import SimpleTestDashboard from './pages/user/SimpleTestDashboard';
import SimpleCustomerDashboard from './pages/user/SimpleCustomerDashboard';
import AboutUsPage from './pages/AboutUsPage';
import AICoachPage from './pages/AICoachPage';

// Placeholder components for other pages
import BookingPage from './pages/user/BookingPage';
import MyBookingsPage from './pages/user/MyBookingsPage';

// Import profile pages
import ProfilePage from './pages/user/ProfilePage';
import OwnerProfilePage from './pages/owner/OwnerProfilePage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Import admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFacilities from './pages/admin/AdminFacilities';
import AdminReports from './pages/admin/AdminReports';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import PostFacilityPage from './pages/owner/PostFacilityPage';
import OwnerFacilitiesPage from './pages/owner/OwnerFacilitiesPage';
import OwnerTimeSlotsPage from './pages/owner/OwnerTimeSlotsPage';
import OwnerBookingsPage from './pages/owner/OwnerBookingsPage';
import OwnerDebugPage from './pages/owner/OwnerDebugPage';

// User Pages
import BookFacilityPage from './pages/user/BookFacilityPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User Routes */}
            <Route path="/home" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/venues" element={
              <ProtectedRoute requiredRole="user">
                <VenuesPage />
              </ProtectedRoute>
            } />
            <Route path="/venues/:id" element={
              <ProtectedRoute requiredRole="user">
                <VenueDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/book/:facilityId/:courtId" element={
              <ProtectedRoute requiredRole="user">
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute requiredRole="customer">
                <MyBookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requiredRole="user">
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/ai-coach" element={<AICoachPage />} />

            {/* Facility Owner Routes */}
            <Route path="/owner/dashboard" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/owner/post-property" element={
              <ProtectedRoute requiredRole="facility_owner">
                <PostFacilityPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/post-facility" element={
              <ProtectedRoute requiredRole="facility_owner">
                <PostFacilityPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/edit-facility/:id" element={
              <ProtectedRoute requiredRole="facility_owner">
                <PostFacilityPage />
              </ProtectedRoute>
            } />
            <Route path="/facility/:id" element={
              <ProtectedRoute requiredRole="customer">
                <VenueDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/book-facility/:facilityId" element={
              <ProtectedRoute requiredRole="customer">
                <BookFacilityPage />
              </ProtectedRoute>
            } />
            <Route path="/my-bookings" element={
              <ProtectedRoute requiredRole="customer">
                <MyBookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/facilities" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerFacilitiesPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/timeslots" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerTimeSlotsPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/bookings" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerBookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/debug" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerDebugPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/profile" element={
              <ProtectedRoute requiredRole="facility_owner">
                <OwnerProfilePage />
              </ProtectedRoute>
            } />

      
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/facilities" element={
              <ProtectedRoute requiredRole="admin">
                <AdminFacilities />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute requiredRole="admin">
                <AdminProfilePage />
              </ProtectedRoute>
            } />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;