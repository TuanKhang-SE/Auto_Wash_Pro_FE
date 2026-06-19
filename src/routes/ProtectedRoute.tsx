import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protected route cho Manager - chỉ cho phép Manager truy cập
export function ManagerRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role !== "Manager") {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protected route cho Admin - chỉ cho phép Admin truy cập
export function AdminRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role !== "Admin") {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Logout - xóa toàn bộ data đăng nhập
export function devLogout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
}

export default ProtectedRoute;