import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.js';
import { LandingPage } from '../../pages/public/LandingPage.js';
import { PublicTrackerPage } from '../../pages/public/PublicTrackerPage.js';
import { PublicMapExplorerPage } from '../../pages/public/PublicMapExplorerPage.js';
import { CivicNewsPage } from '../../pages/public/CivicNewsPage.js';
import { PublicAccountabilityPage } from '../../pages/public/PublicAccountabilityPage.js';
import { NotFoundPage } from '../../pages/public/NotFoundPage.js';
import { LoginPage } from '../../pages/auth/LoginPage.js';
import { CitizenLoginPage } from '../../pages/auth/CitizenLoginPage.js';
import { AdminLoginPage } from '../../pages/auth/AdminLoginPage.js';
import { RegisterPage } from '../../pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage.js';
import { CitizenDashboard } from '../../pages/citizen/CitizenDashboard.js';
import { ReportIssuePage } from '../../pages/citizen/ReportIssuePage.js';
import { MyComplaintsPage } from '../../pages/citizen/MyComplaintsPage.js';
import { NotificationsPage } from '../../pages/citizen/NotificationsPage.js';
import { UserProfilePage } from '../../pages/citizen/UserProfilePage.js';
import { CommunityIssuesPage } from '../../pages/citizen/CommunityIssuesPage.js';
import { AdminDashboard } from '../../pages/admin/AdminDashboard.js';
import { AdminComplaintManagementPage } from '../../pages/admin/AdminComplaintManagementPage.js';
import { AdminReviewPage } from '../../pages/admin/AdminReviewPage.js';
import { AdminAnalyticsPage } from '../../pages/admin/AdminAnalyticsPage.js';
import { CivicIntelligencePage } from '../../pages/admin/CivicIntelligencePage.js';
import { AdminImageReviewPage } from '../../pages/admin/AdminImageReviewPage.js';
import { ProtectedRoute } from '../../features/auth/ProtectedRoute.js';
import { AdminRoute } from '../../features/auth/AdminRoute.js';
import { RouteErrorBoundary } from '../../components/shared/RouteErrorBoundary.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      // Public Auth routes
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'citizen/login',
        element: <CitizenLoginPage />,
      },
      {
        path: 'admin/login',
        element: <AdminLoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      // Public Grievance Transparency Routes
      {
        path: 'track',
        element: <PublicTrackerPage />,
      },
      {
        path: 'map',
        element: <PublicMapExplorerPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'news',
        element: <CivicNewsPage />,
      },
      {
        path: 'accountability',
        element: <PublicAccountabilityPage />,
      },
      {
        path: 'transparency',
        element: <PublicAccountabilityPage />,
      },
      {
        path: 'community/issues',
        element: <CommunityIssuesPage />,
      },
      // Protected Citizen Routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <CitizenDashboard />,
          },
          {
            path: 'citizen/dashboard',
            element: <CitizenDashboard />,
          },
          {
            path: 'report',
            element: <ReportIssuePage />,
          },
          {
            path: 'citizen/report',
            element: <ReportIssuePage />,
          },
          {
            path: 'my-complaints',
            element: <MyComplaintsPage />,
          },
          {
            path: 'citizen/my-complaints',
            element: <MyComplaintsPage />,
          },
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },
          {
            path: 'profile',
            element: <UserProfilePage />,
          },
          {
            path: 'citizen/profile',
            element: <UserProfilePage />,
          },
        ],
      },
      // Protected Municipal Admin Routes
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminDashboard />,
          },
          {
            path: 'admin/dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'admin/complaints',
            element: <AdminComplaintManagementPage />,
          },
          {
            path: 'admin/review/:id',
            element: <AdminReviewPage />,
          },
          {
            path: 'admin/analytics',
            element: <AdminAnalyticsPage />,
          },
          {
            path: 'admin/intelligence',
            element: <CivicIntelligencePage />,
          },
          {
            path: 'admin/image-evidence',
            element: <AdminImageReviewPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
