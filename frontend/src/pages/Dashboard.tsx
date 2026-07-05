import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { api } from "../lib/api";
import type { ApiResponse, DashboardStats } from "../lib/types";
import { formatVnd, STATUS_LABEL } from "../lib/types";
import { Spinner, StatusBadge } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<ApiResponse<DashboardStats>>(
          "/dashboard/stats"
        );
        setStats(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !stats) return <Spinner />;

  const totalForStatus = Object.values(stats.byStatus).reduce(
    (a, b) => a + b,
    0
  );

  const statCards = [
    { label: "Employees", value: String(stats.totalEmployees) },
    { label: "Departments", value: String(stats.totalDepartments) },
    ...(stats.totalSalary !== undefined
      ? [
          {
            label: "Monthly payroll",
            value: formatVnd(stats.totalSalary),
            mono: true,
          },
        ]
      : []),
    {
      label: "Active",
      value: String(stats.byStatus.active ?? 0),
    },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">Overview</h1>
        <p className="text-sm text-ink-soft">
          Welcome, <b className="text-ink">{user?.email}</b>
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {s.label}
            </p>
            <p
              className={`mt-1 text-2xl font-extrabold text-petrol ${
                s.mono ? "font-mono text-xl" : ""
              }`}
            >
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* By status */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-line bg-surface p-5 lg:col-span-2"
        >
          <h2 className="mb-4 font-bold">By status</h2>
          <div className="space-y-3">
            {(Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map(
              (st) => {
                const count = stats.byStatus[st] ?? 0;
                const pct = totalForStatus ? (count / totalForStatus) * 100 : 0;
                return (
                  <div key={st}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <StatusBadge status={st} />
                      <span className="font-mono text-xs text-ink-soft">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-petrol"
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </motion.section>

        {/* Recently added */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="rounded-xl border border-line bg-surface p-5 lg:col-span-3"
        >
          <h2 className="mb-4 font-bold">Recently added employees</h2>
          {stats.recentEmployees.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">
              No employees yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentEmployees.map((e, i) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <span className="mr-2 rounded bg-petrol-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-petrol">
                      {e.employeeCode}
                    </span>
                    <span className="font-medium">
                      {e.user
                        ? `${e.user.lastName} ${e.user.firstName}`
                        : e.position}
                    </span>
                    <span className="ml-2 text-ink-soft">— {e.position}</span>
                  </div>
                  <StatusBadge status={e.status} />
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
