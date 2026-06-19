import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";

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

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import LoginedHomePage from "../pages/customer/LoginedHomePage";
import RegisterCar from "../pages/customer/RegisterCar";
import ProtectedRoute, { ManagerRoute, AdminRoute } from "./ProtectedRoute";

// DEV MODE - Xem trực tiếp các trang
const DEV_MODE = true;

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Staff */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
        </Route>

        {/* Manager - Protected Route */}
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

        {/* Admin - Protected Route */}
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
        </Route>

        {/* Trang cần đăng nhập */}
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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;