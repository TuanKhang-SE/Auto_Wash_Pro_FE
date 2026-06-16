import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import RegisterCar from "../pages/customer/RegisterCar";
import LoginedHomePage from "../pages/customer/LoginedHomePage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<LoginedHomePage />} />
        <Route path="/register-car" element={<RegisterCar />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;