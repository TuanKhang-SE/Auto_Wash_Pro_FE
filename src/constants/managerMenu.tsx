import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Building2,
  UserCircle,
} from "lucide-react";

export const managerMenu = [
  {
    path: "/manager",
    name: "Tổng quan",
    icon: <LayoutDashboard size={20} />,
  },
  {
    path: "/manager/staff",
    name: "Quản lý Nhân viên",
    icon: <Users size={20} />,
  },
  {
    path: "/manager/bookings",
    name: "Quản lý Đặt lịch",
    icon: <CalendarCheck size={20} />,
  },
  {
    path: "/manager/statistics",
    name: "Thống kê",
    icon: <BarChart3 size={20} />,
  },
  {
    path: "/manager/branch",
    name: "Thông tin Chi nhánh",
    icon: <Building2 size={20} />,
  },
];
