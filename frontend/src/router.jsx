import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import WriterRoute from "@/components/layout/WriterRoute";
import GuestRoute from "@/components/layout/GuestRoute";
import VerifiedRoute from "@/components/layout/VerifiedRoute";
import AdminRoute from "@/components/layout/AdminRoute";
import { LoadingBlock } from "@/components/feedback/Spinner";

// Route-based code splitting: each page is its own chunk so the initial bundle
// stays small (Stripe, Framer Motion, etc. load only on the routes that use them).
const Landing = lazy(() => import("@/pages/Landing"));
const Register = lazy(() => import("@/pages/Register"));
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Listings = lazy(() => import("@/pages/Listings"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const ListingFormPage = lazy(() => import("@/pages/ListingFormPage"));
const Requests = lazy(() => import("@/pages/Requests"));
const RequestDetail = lazy(() => import("@/pages/RequestDetail"));
const RequestFormPage = lazy(() => import("@/pages/RequestFormPage"));
const DashboardWriter = lazy(() => import("@/pages/DashboardWriter"));
const DashboardDoctor = lazy(() => import("@/pages/DashboardDoctor"));
const OrderWorkspace = lazy(() => import("@/pages/OrderWorkspace"));
const WriterProfile = lazy(() => import("@/pages/WriterProfile"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const Conversation = lazy(() => import("@/pages/Conversation"));
const Settings = lazy(() => import("@/pages/Settings"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const PaymentStatus = lazy(() => import("@/pages/PaymentStatus"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminListings = lazy(() => import("@/pages/admin/AdminListings"));
const AdminRequests = lazy(() => import("@/pages/admin/AdminRequests"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const AdminAuditLog = lazy(() => import("@/pages/admin/AdminAuditLog"));

export default function Router() {
  return (
    <Suspense
      fallback={
        <div className="container py-16">
          <LoadingBlock />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Reachable while logged in (you're signed in right after registering). */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route
          path="/listings/new"
          element={
            <WriterRoute>
              <VerifiedRoute message="Confirmez votre adresse e-mail pour publier une annonce.">
                <ListingFormPage />
              </VerifiedRoute>
            </WriterRoute>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <WriterRoute>
              <VerifiedRoute message="Confirmez votre adresse e-mail pour publier une annonce.">
                <ListingFormPage />
              </VerifiedRoute>
            </WriterRoute>
          }
        />

        <Route path="/redacteurs/:id" element={<WriterProfile />} />

        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route
          path="/requests/new"
          element={
            <ProtectedRoute>
              <VerifiedRoute message="Confirmez votre adresse e-mail pour publier une demande.">
                <RequestFormPage />
              </VerifiedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id/edit"
          element={
            <ProtectedRoute>
              <VerifiedRoute message="Confirmez votre adresse e-mail pour publier une demande.">
                <RequestFormPage />
              </VerifiedRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/writer"
          element={
            <WriterRoute>
              <DashboardWriter />
            </WriterRoute>
          }
        />
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute>
              <DashboardDoctor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/commandes/:id"
          element={
            <ProtectedRoute>
              <OrderWorkspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <Conversation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favoris"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <WriterRoute>
              <Onboarding />
            </WriterRoute>
          }
        />

        {/* Stripe return target for any payment method (also used by in-page ones). */}
        <Route path="/paiement/statut" element={<PaymentStatus />} />

        <Route path="/mentions-legales" element={<LegalPage doc="mentions" />} />
        <Route path="/cgu" element={<LegalPage doc="cgu" />} />
        <Route path="/confidentialite" element={<LegalPage doc="confidentialite" />} />

        {/* Admin / moderation (Django staff only) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="listings" element={<AdminListings />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
