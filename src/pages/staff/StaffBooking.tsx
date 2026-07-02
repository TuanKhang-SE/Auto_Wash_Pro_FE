  BranchID: number;
  BookingDate: string;
  StartTime: string;
  Status: string;
  Customers?: {
    Users?: {
      FullName: string;
      Phone: string;
    };
  };
  BookingItems?: BookingItem[];
};
function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }

  const text = String(value);

  if (text.includes("T")) {
    return text.substring(11, 16);
  }

  return text.substring(0, 5);
}
const StaffBookings = () => {
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState({
    waiting: 0,
    washing: 0,
    completed: 0,
    total: 0,
  });

  async function fetchBookings() {
    try {
      setIsLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập bằng tài khoản staff");
        return;
      }

      const res = await axiosClient.get("/api/staff-operations/today-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });