import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import WriterRoute from "@/components/layout/WriterRoute";
import { LoadingBlock } from "@/components/feedback/Spinner";

// Route-based code splitting: each page is its own chunk so the initial bundle
// stays small (Stripe, Framer Motion, etc. load only on the routes that use them).
const Landing = lazy(() => import("@/pages/Landing"));
const Register = lazy(() => import("@/pages/Register"));
const Login = lazy(() => import("@/pages/Login"));
const Listings = lazy(() => import("@/pages/Listings"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const ListingFormPage = lazy(() => import("@/pages/ListingFormPage"));
const Requests = lazy(() => import("@/pages/Requests"));
const RequestDetail = lazy(() => import("@/pages/RequestDetail"));
const RequestFormPage = lazy(() => import("@/pages/RequestFormPage"));
const DashboardWriter = lazy(() => import("@/pages/DashboardWriter"));
const DashboardDoctor = lazy(() => import("@/pages/DashboardDoctor"));
const WriterProfile = lazy(() => import("@/pages/WriterProfile"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const Conversation = lazy(() => import("@/pages/Conversation"));
const Settings = lazy(() => import("@/pages/Settings"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route
          path="/listings/new"
          element={
            <WriterRoute>
              <ListingFormPage />
            </WriterRoute>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <WriterRoute>
              <ListingFormPage />
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
              <RequestFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id/edit"
          element={
            <ProtectedRoute>
              <RequestFormPage />
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
          path="/onboarding"
          element={
            <WriterRoute>
              <Onboarding />
            </WriterRoute>
          }
        />

        <Route path="/mentions-legales" element={<LegalPage doc="mentions" />} />
        <Route path="/cgu" element={<LegalPage doc="cgu" />} />
        <Route path="/confidentialite" element={<LegalPage doc="confidentialite" />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
