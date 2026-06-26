import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";

import StaffLayout from "../layouts/StaffLayout";
import StaffDashboard from "../pages/staff/StaffDashboard";

import ManagerLayout from "../layouts/ManagerLayout";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import ManagerStaffManagement from "../pages/manager/ManagerStaffManagement";
import ManagerBookings from "../pages/manager/ManagerBookings";
import ManagerStatistics from "../pages/manager/ManagerStatistics";
import ManagerBranchInfo from "../pages/manager/ManagerBranchInfo";

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminManagerManagement from "../pages/admin/AdminManagerManagement";
import AdminStaffManagement from "../pages/admin/AdminStaffManagement";
import AdminBranches from "../pages/admin/AdminBranches";
import AdminStatistics from "../pages/admin/AdminStatistics";
import AdminCustomers from "../pages/admin/AdminCustomers";
import AdminTierConfig from "../pages/admin/AdminTierConfig";
import AdminRevenue from "../pages/admin/AdminRevenue";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";

import LoginedHomePage from "../pages/customer/LoginedHomePage";
import RegisterCar from "../pages/customer/RegisterCar";
import Profile from "../pages/customer/Profile";
import MyVehicles from "../pages/customer/MyVehicles";
import Booking from "../pages/customer/Booking";
import BookingSuccess from "../pages/customer/BookingSuccess";  

import ProtectedRoute, { ManagerRoute, AdminRoute } from "./ProtectedRoute";

function getRedirectPath(role: string | null) {
  switch (role) {
    case "Admin":
      return "/admin";

    case "Manager":
      return "/manager";

    case "Staff":
      return "/staff";

    case "Customer":
      return "/home";

    default:
      return "/home";
  }
}

function getCurrentRole() {
  return localStorage.getItem("userRole");
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const role = getCurrentRole();

  if (token) {
    return <Navigate to={getRedirectPath(role)} replace />;
  }

  return children;
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang public - chỉ dành cho người chưa đăng nhập */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <HomePage />
            </PublicOnlyRoute>
          }
        />

        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />

        {/* Staff */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboard />} />
        </Route>

        {/* Manager */}
        <Route
          path="/manager"
          element={
            <ManagerRoute>
              <ManagerLayout />
            </ManagerRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="staff" element={<ManagerStaffManagement />} />
          <Route path="bookings" element={<ManagerBookings />} />
          <Route path="statistics" element={<ManagerStatistics />} />
          <Route path="branch" element={<ManagerBranchInfo />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="managers" element={<AdminManagerManagement />} />
          <Route path="staff" element={<AdminStaffManagement />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="statistics" element={<AdminStatistics />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="tier-configs" element={<AdminTierConfig />} />
          <Route path="revenue" element={<AdminRevenue />} />
        </Route>

        {/* Customer cần đăng nhập */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <LoginedHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/register-car"
          element={
            <ProtectedRoute>
              <RegisterCar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

<Route
  path="/booking-success"
  element={
    <ProtectedRoute>
      <BookingSuccess />
    </ProtectedRoute>
  }
/>

        <Route
          path="/customer/vehicles"
          element={
            <ProtectedRoute>
              <MyVehicles />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;