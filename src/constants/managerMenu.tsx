import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Building2,
  Sparkles,
  TicketPercent,
  Gift,
  Clock,
  FileText,
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
    path: "/manager/services",
    name: "Dịch vụ của Chi nhánh",
    icon: <Sparkles size={20} />,
  },
  {
    path: "/manager/promotions",
    name: "Khuyến mãi",
    icon: <TicketPercent size={20} />,
  },
  {
    path: "/manager/rewards",
    name: "Phần quà đổi điểm",
    icon: <Gift size={20} />,
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
  {
    path: "/manager/shifts",
    name: "Quản lý Ca",
    icon: <Clock size={20} />,
  },
  {
    path: "/manager/history",
    name: "Lịch sử Booking & Hóa đơn",
    icon: <FileText size={20} />,
  },
];
