import React, {useEffect} from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthSync } from "./hooks/useAuthSync";
import { useAuth } from "@clerk/clerk-react";
import { setupInterceptor } from "./hooks/axios";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLoader from './components/GlobalLoader';
import AuthCallback from "./components/AuthCallback";

// AUTH PAGES
import Login from "./pages/Login";
import SignUpPage from "./pages/SignUp";

// CLIENT PAGES
import Home from "./pages/Home";
import AllServices from "./pages/AllServices";
import ServiceDetails from "./pages/ServiceDetails";
import AITripPlanner from "./pages/AITripPlanner";
import ItineraryDetail from "./pages/ItineraryDetail";
import BecomePartner from "./pages/BecomePartner";
import PaymentResult from './pages/PaymentResult';

// OWNER PAGES
import Layout from "./pages/owner/Layout";
import Dashboard from "./pages/owner/Dashboard";
import ListService from "./pages/owner/ListService";
import AddService from "./pages/owner/AddService";
import Inventory from "./pages/owner/Inventory";
import Bookings from "./pages/owner/Bookings";
import SaaSManagement from './pages/owner/SaaSManagement';
import Settings from "./pages/owner/Settings";
import SubscriptionResult from "./pages/owner/SubscriptionResult";

// ADMIN PAGES
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/Users";
import Owners from "./pages/admin/Owners";
import ServiceApprovals from "./pages/admin/Services";
import Packages from "./pages/admin/Packages";
import Finance from "./pages/admin/Finance";
import AccountDashboard from "./pages/AccountDashboard";

const App = () => {
  const location = useLocation();
  const { dbUser, isLoading } = useAuthSync();
  const { getToken } = useAuth();
  useEffect(() => {
    setupInterceptor(getToken);
  }, [getToken]);
  const isAuthPath =
    location.pathname === "/login" || location.pathname === "/sign-up";
  const isOwnerPath = location.pathname.startsWith("/owner");
  const isAdminPath = location.pathname.startsWith("/admin");

  if (isLoading) return <GlobalLoader />;
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
          <Route path="/auth-callback" element={<AuthCallback />} />

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home dbUser={dbUser} />} />
          <Route path="/services" element={<AllServices />} />
          <Route path="/services/:id" element={<ServiceDetails />} />

          {/* PROTECTED USER ROUTES */}
          <Route
            path="/payment/:status/:bookingId"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <PaymentResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-planner"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <AITripPlanner />
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
            path="/become-partner"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <BecomePartner dbUser={dbUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={["USER", "OWNER", "ADMIN"]}>
                <AccountDashboard dbUser={dbUser} />
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
            <Route path="subscription" element={<SaaSManagement />} />
            <Route path="subscription/result" element={<SubscriptionResult />} />
            <Route path="settings" element={<Settings />} />
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