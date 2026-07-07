import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import AttendancePage from "./pages/Attendance";
import LeaveRequestsPage from "./pages/LeaveRequests";
import { Spinner } from "./components/ui";

function Protected() {
  const { user, booting } = useAuth();
  if (booting)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function LoginRoute() {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

function ManagerRoute({ children }: { children: ReactNode }) {
  const { isManagerUp } = useAuth();
  if (!isManagerUp) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<Protected />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/employees"
                element={
                  <ManagerRoute>
                    <Employees />
                  </ManagerRoute>
                }
              />
              <Route path="/departments" element={<Departments />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
