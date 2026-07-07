import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import axios from "axios";
import { api, getApiError } from "../lib/api";
import type {
  ApiResponse,
  Attendance,
  AttendanceStatus,
  PaginatedResponse,
  Pagination,
  TodayAttendance,
} from "../lib/types";
import {
  ATTENDANCE_LABEL,
  formatDate,
  formatMinutes,
  formatTime,
} from "../lib/types";
import {
  Button,
  EmptyState,
  inputCls,
  Paginator,
  Spinner,
} from "../components/ui";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, string> = {
    present: "bg-ok/10 text-ok",
    late: "bg-signal/15 text-[#9a6a17]",
  };
  const dot: Record<AttendanceStatus, string> = {
    present: "bg-ok",
    late: "bg-signal",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {ATTENDANCE_LABEL[status]}
    </span>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <p className="font-mono text-3xl font-bold tabular-nums">
        {now.toLocaleTimeString("en-GB")}
      </p>
      <p className="text-xs text-ink-soft">
        {now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

export default function AttendancePage() {
  const { push } = useToast();
  const { isManagerUp } = useAuth();

  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [items, setItems] = useState<Attendance[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadToday = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<TodayAttendance>>(
        "/attendance/me/today"
      );
      setToday(res.data.data);
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setTodayLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === "all" ? "/attendance" : "/attendance/me";
      const res = await api.get<PaginatedResponse<Attendance>>(url, {
        params: {
          page,
          limit: 10,
          from: from || undefined,
          to: to || undefined,
          search: tab === "all" ? search || undefined : undefined,
          status: statusFilter || undefined,
        },
      });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      // A user without an employee profile has no history — treat as empty.
      setItems([]);
      setPagination(null);
      const isNoProfile =
        axios.isAxiosError(err) && err.response?.status === 404;
      if (!isNoProfile) push("error", getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page, from, to, search, statusFilter, push]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0); // debounce while typing search
    return () => clearTimeout(t);
  }, [load, search]);

  const doCheckIn = async () => {
    setBusy(true);
    try {
      await api.post("/attendance/check-in");
      push("success", "Checked in — have a good day!");
      await loadToday();
      await load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doCheckOut = async () => {
    setBusy(true);
    try {
      await api.post("/attendance/check-out");
      push("success", "Checked out — see you tomorrow!");
      await loadToday();
      await load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const record = today?.record ?? null;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">Attendance</h1>
        <p className="text-sm text-ink-soft">
          Check in when you start and check out when you leave.
        </p>
      </header>

      {/* Today card */}
      <div className="mb-6 rounded-xl border border-line bg-surface p-5">
        {todayLoading ? (
          <Spinner />
        ) : today && !today.hasProfile ? (
          <p className="text-sm text-ink-soft">
            Your account is not linked to an employee profile yet, so you
            can't check in. Ask an admin to create your employee record.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LiveClock />

            <div className="flex items-center gap-6">
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Check-in
                </p>
                <p className="font-mono font-semibold">
                  {record ? formatTime(record.checkIn) : "—"}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Check-out
                </p>
                <p className="font-mono font-semibold">
                  {record?.checkOut ? formatTime(record.checkOut) : "—"}
                </p>
              </div>
              {record && (
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Status
                  </p>
                  <AttendanceBadge status={record.status} />
                </div>
              )}
              {record?.workedMinutes != null && (
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Worked
                  </p>
                  <p className="font-mono font-semibold">
                    {formatMinutes(record.workedMinutes)}
                  </p>
                </div>
              )}
            </div>

            {!record ? (
              <Button onClick={doCheckIn} disabled={busy}>
                Check in
              </Button>
            ) : !record.checkOut ? (
              <Button variant="danger" onClick={doCheckOut} disabled={busy}>
                Check out
              </Button>
            ) : (
              <p className="text-sm font-semibold text-ok">Done for today ✓</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs (manager and up can see everyone) */}
      {isManagerUp && (
        <div className="mb-4 flex gap-1 rounded-lg bg-mist p-1 w-fit">
          {(["mine", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t === "mine" ? "My history" : "All employees"}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        {tab === "all" && (
          <input
            className={`${inputCls} max-w-xs`}
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        )}
        <input
          type="date"
          className={`${inputCls} max-w-44`}
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
        />
        <input
          type="date"
          className={`${inputCls} max-w-44`}
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
        />
        <select
          className={`${inputCls} max-w-44`}
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(ATTENDANCE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState text="No attendance records for this filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3">Date</th>
                {tab === "all" && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Worked</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {items.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-line/60 last:border-0 hover:bg-mist/60"
                  >
                    <td className="px-4 py-3 font-medium">
                      {formatDate(a.workDate)}
                    </td>
                    {tab === "all" && (
                      <td className="px-4 py-3">
                        {a.employee?.user
                          ? `${a.employee.user.lastName} ${a.employee.user.firstName}`
                          : "—"}
                        <span className="block text-xs text-ink-soft">
                          {a.employee?.employeeCode}
                          {a.employee?.department
                            ? ` · ${a.employee.department.name}`
                            : ""}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatTime(a.checkIn)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {a.checkOut ? formatTime(a.checkOut) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {a.workedMinutes != null
                        ? formatMinutes(a.workedMinutes)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={a.status} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {pagination && <Paginator pagination={pagination} onPage={setPage} />}
    </div>
  );
}
