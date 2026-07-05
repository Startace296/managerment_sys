import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL } from "../lib/types";

const NAV = [
  {
    to: "/",
    label: "Overview",
    icon: (
      <path d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-5H4v5zm10-16v5h6V4h-6z" />
    ),
  },
  {
    to: "/employees",
    label: "Employees",
    icon: (
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
    ),
    managerUp: true,
  },
  {
    to: "/departments",
    label: "Departments",
    icon: <path d="M4 21V7l8-4 8 4v14h-6v-5h-4v5H4zm5-9h2V9H9v3zm4 0h2V9h-2v3z" />,
  },
];

export default function Layout() {
  const { user, logout, isManagerUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nav = NAV.filter((item) => !item.managerUp || isManagerUp);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col bg-petrol-deep text-white">
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-signal font-mono text-sm font-bold text-petrol-deep">
            HR
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">HR Management</p>
            <p className="text-[10px] text-white/50">Internal system</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-petrol"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <svg
                    className="relative z-10 size-4.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {item.icon}
                  </svg>
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs font-semibold">{user?.email}</p>
          <p className="mb-3 mt-0.5 inline-block rounded bg-signal/20 px-1.5 py-0.5 font-mono text-[10px] text-signal">
            {user ? ROLE_LABEL[user.role] : ""}
          </p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-white/15 py-2 text-xs font-semibold text-white/70 transition hover:border-danger hover:bg-danger hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-56 flex-1 px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
