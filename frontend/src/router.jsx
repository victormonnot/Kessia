import { Routes, Route } from "react-router-dom";

import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import ListingFormPage from "@/pages/ListingFormPage";
import Requests from "@/pages/Requests";
import RequestDetail from "@/pages/RequestDetail";
import RequestFormPage from "@/pages/RequestFormPage";
import DashboardWriter from "@/pages/DashboardWriter";
import DashboardDoctor from "@/pages/DashboardDoctor";
import WriterProfile from "@/pages/WriterProfile";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import WriterRoute from "@/components/layout/WriterRoute";

export default function Router() {
  return (
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
