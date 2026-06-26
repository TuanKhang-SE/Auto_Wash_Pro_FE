import {
  LayoutDashboard,
  CalendarCheck,
  Cpu,
  History,
} from "lucide-react";

export const staffMenu = [
  {
    path: "/staff",
    name: "Tổng quan",
    icon: <LayoutDashboard size={20} />,
  },
  {
    path: "/staff/bookings",
    name: "Quản lý Đặt lịch",
    icon: <CalendarCheck size={20} />,
  },
  {
    path: "/staff/bays",
    name: "Trạm Rửa Xe",
    icon: <Cpu size={20} />,
  },
  {
    path: "/staff/history",
    name: "Lịch sử Ca Rửa",
    icon: <History size={20} />,
  },
];