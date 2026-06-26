import {
  LayoutDashboard,
  UserCog,
  Users,
  Building2,
  BarChart3,
  Users as UsersIcon,
  Crown,
  DollarSign,
} from "lucide-react";

export const adminMenu = [
  {
    path: "/admin",
    name: "Tổng quan",
    icon: <LayoutDashboard size={20} />,
  },
  {
    path: "/admin/revenue",
    name: "Doanh thu",
    icon: <DollarSign size={20} />,
  },
  {
    path: "/admin/managers",
    name: "Quản lý Manager",
    icon: <UserCog size={20} />,
  },
  {
    path: "/admin/staff",
    name: "Quản lý Staff",
    icon: <Users size={20} />,
  },
  {
    path: "/admin/branches",
    name: "Dữ liệu Chi nhánh",
    icon: <Building2 size={20} />,
  },
  {
    path: "/admin/customers",
    name: "Khách hàng",
    icon: <UsersIcon size={20} />,
  },
  {
    path: "/admin/tier-configs",
    name: "Cấu hình Hạng",
    icon: <Crown size={20} />,
  },
  {
    path: "/admin/statistics",
    name: "Thống kê toàn hệ thống",
    icon: <BarChart3 size={20} />,
  },
];