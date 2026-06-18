import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";

import StaffLayout from "../layouts/StaffLayout";
import StaffDashboard from "../pages/staff/StaffDashboard";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import LoginedHomePage from "../pages/customer/LoginedHomePage";
import RegisterCar from "../pages/customer/RegisterCar";
import ProtectedRoute from "./ProtectedRoute";

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