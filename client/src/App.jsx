import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthSync } from "./hooks/useAuthSync";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// AUTH PAGES
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUp";

// CLIENT PAGES
import Home from "./pages/Home";
import AllServices from "./pages/AllServices";
import ServiceDetails from "./pages/ServiceDetails";
import AITripPlanner from "./pages/AITripPlanner";
import MyItineraries from "./pages/MyItineraries";
import ItineraryDetail from "./pages/ItineraryDetail";
import MyBookings from "./pages/MyBookings";
import BecomePartner from "./pages/BecomePartner";

// OWNER PAGES
import Layout from "./pages/owner/Layout";
import Dashboard from "./pages/owner/Dashboard";
import ListService from "./pages/owner/ListService";
import AddService from "./pages/owner/AddService";
import Inventory from "./pages/owner/Inventory";
import Bookings from "./pages/owner/Bookings";
import Subscription from "./pages/owner/Subscription";
import Settings from "./pages/owner/Settings";
import Invoices from "./pages/owner/Invoices";

// ADMIN PAGES
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/Users";
import Owners from "./pages/admin/Owners";
import ServiceApprovals from "./pages/admin/Services";
import Packages from "./pages/admin/Packages";
import Finance from "./pages/admin/Finance";

const App = () => {
  const location = useLocation();
  const { dbUser, isLoading } = useAuthSync();
  const isAuthPath =
    location.pathname === "/login" || location.pathname === "/sign-up";
  const isOwnerPath = location.pathname.startsWith("/owner");
  const isAdminPath = location.pathname.startsWith("/admin");

  if (isLoading) return <div className="h-screen flex items-center justify-center">Đang tải cấu hình...</div>;
  return (
    <div className="flex flex-col min-h-screen">
      {!isOwnerPath && !isAdminPath && !isAuthPath && <Navbar user={dbUser} />}

      <main
        className={
          isOwnerPath || isAdminPath || isAuthPath ? "h-screen" : "flex-1"
        }
      >
        <Routes>
          {/* AUTH ROUTES */}
          <Route path="/login" element={<Login dbUser={dbUser} />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home dbUser={dbUser} />} />
          <Route path="/services" element={<AllServices />} />
          <Route path="/services/:id" element={<ServiceDetails />} />

          {/* PROTECTED USER ROUTES */}
          <Route
            path="/ai-planner"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <AITripPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-itineraries"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <MyItineraries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary/:id"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <ItineraryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-partner"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <BecomePartner dbUser={dbUser} />
              </ProtectedRoute>
            }
          />

          {/* OWNER ROUTES */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="list-service" element={<ListService />} />
            <Route path="add-service" element={<AddService />} />
            <Route path="edit-service/:id" element={<AddService />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<Settings />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="owners" element={<Owners />} />
            <Route path="services" element={<ServiceApprovals />} />
            <Route path="packages" element={<Packages />} />
            <Route path="finance" element={<Finance />} />
          </Route>
        </Routes>
      </main>

      {!isOwnerPath && !isAdminPath && !isAuthPath && <Footer />}
    </div>
  );
};

export default App;