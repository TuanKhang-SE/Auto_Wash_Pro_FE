import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Car, LogOut, Menu, User, X } from "lucide-react";

type UserInfo = {
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  Role?: string;
  role?: string;
};

function getUserFromStorage(): UserInfo | null {
  try {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.log(error);
  }

  return null;
}

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUser = getUserFromStorage();
    setUser(storedUser);
  }, []);

  const token = localStorage.getItem("token");

  const displayName =
    user?.FullName || user?.fullName || user?.Email || user?.email || "Guest";

  const role = user?.Role || user?.role || localStorage.getItem("userRole");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-semibold transition ${
      isActive ? "text-sky-600" : "text-slate-700 hover:text-sky-600"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <Link to={token ? "/home" : "/"} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/30">
            <Car size={24} />
          </div>

          <span className="text-2xl font-black text-sky-600">
            Auto Wash Pro
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <NavLink to="/home" className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/about" className={navLinkClass}>
            About Auto Wash Pro
          </NavLink>

          <NavLink to="/booking" className={navLinkClass}>
            Booking
          </NavLink>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {token ? (
            <>
              <Link
                to="/customer/profile"
                className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 transition hover:bg-sky-100"
              >
                <p className="font-bold text-slate-800">{displayName}</p>
                <p className="text-xs font-semibold text-sky-600">
                  Rank: {role === "Customer" ? "Member" : role || "Member"}
                </p>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-sky-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-700"
            >
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-xl border border-slate-200 p-3 text-slate-700 md:hidden"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-4">
            <NavLink
              to="/home"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Home
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              About Auto Wash Pro
            </NavLink>

            <NavLink
              to="/booking"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Booking
            </NavLink>

            {token ? (
              <>
                <NavLink
                  to="/customer/profile"
                  onClick={() => setIsOpen(false)}
                  className={navLinkClass}
                >
                  Profile
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-500"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-sky-600 px-5 py-3 text-center font-bold text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;