import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import axios from "axios";
import { api, getApiError } from "../lib/api";
import type {
  ApiResponse,
  Payroll,
  PayrollStatus,
  PaginatedResponse,
  Pagination,
} from "../lib/types";
import {
  MONTH_LABEL,
  PAYROLL_STATUS_LABEL,
  formatMinutes,
  formatVnd,
} from "../lib/types";
import {
  Button,
  EmptyState,
  Field,
  inputCls,
  Modal,
  Paginator,
  Spinner,
} from "../components/ui";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const map: Record<PayrollStatus, string> = {
    draft: "bg-ink-soft/10 text-ink-soft",
    approved: "bg-signal/15 text-[#9a6a17]",
    paid: "bg-ok/10 text-ok",
  };
  const dot: Record<PayrollStatus, string> = {
    draft: "bg-ink-soft",
    approved: "bg-signal",
    paid: "bg-ok",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {PAYROLL_STATUS_LABEL[status]}
    </span>
  );
}

export default function PayrollPage() {
  const { push } = useToast();
  const { isManagerUp } = useAuth();

  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [items, setItems] = useState<Payroll[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modal, setModal] = useState<null | "generate" | "approve" | "pay">(
    null
  );
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(CURRENT_YEAR);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === "all" ? "/payroll" : "/payroll/me";
      const res = await api.get<PaginatedResponse<Payroll>>(url, {
        params: {
          page,
          limit: 10,
          month: monthFilter || undefined,
          year: yearFilter || undefined,
          status: statusFilter || undefined,
        },
      });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      // A user without an employee profile has no payslips — treat as empty.
      setItems([]);
      setPagination(null);
      const isNoProfile =
        axios.isAxiosError(err) && err.response?.status === 404;
      if (!isNoProfile) push("error", getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page, monthFilter, yearFilter, statusFilter, push]);

  useEffect(() => {
    load();
  }, [load]);

  const openGenerate = () => {
    setGenMonth(now.getMonth() + 1);
    setGenYear(CURRENT_YEAR);
    setModal("generate");
  };

  const submitGenerate = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await api.post<ApiResponse<Payroll[]>>("/payroll/generate", {
        month: genMonth,
        year: genYear,
      });
      push("success", res.data.message);
      setModal(null);
      setTab("all");
      setMonthFilter(String(genMonth));
      setYearFilter(String(genYear));
      setPage(1);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openApprove = (item: Payroll) => {
    setSelected(item);
    setModal("approve");
  };

  const submitApprove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/payroll/${selected.id}/approve`);
      push("success", "Payroll approved");
      setModal(null);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openPay = (item: Payroll) => {
    setSelected(item);
    setModal("pay");
  };

  const submitPay = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/payroll/${selected.id}/pay`);
      push("success", "Payroll marked as paid");
      setModal(null);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Payroll</h1>
          <p className="text-sm text-ink-soft">
            Monthly pay calculated from attendance and approved leave.
          </p>
        </div>
        {isManagerUp && (
          <Button onClick={openGenerate}>+ Generate payroll</Button>
        )}
      </header>

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
              {t === "mine" ? "My payslips" : "All employees"}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className={`${inputCls} max-w-44`}
          value={monthFilter}
          onChange={(e) => {
            setPage(1);
            setMonthFilter(e.target.value);
          }}
        >
          <option value="">All months</option>
          {MONTH_LABEL.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-32`}
          value={yearFilter}
          onChange={(e) => {
            setPage(1);
            setYearFilter(e.target.value);
          }}
        >
          <option value="">All years</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-44`}
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(PAYROLL_STATUS_LABEL).map(([k, v]) => (
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
        <EmptyState text="No payroll records for this filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                {tab === "all" && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Work days</th>
                <th className="px-4 py-3">Leave (paid/unpaid)</th>
                <th className="px-4 py-3">Overtime</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net salary</th>
                <th className="px-4 py-3">Status</th>
                {tab === "all" && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {items.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-line/60 last:border-0 hover:bg-mist/60"
                  >
                    {tab === "all" && (
                      <td className="px-4 py-3">
                        {p.employee?.user
                          ? `${p.employee.user.lastName} ${p.employee.user.firstName}`
                          : "—"}
                        <span className="block text-xs text-ink-soft">
                          {p.employee?.employeeCode}
                          {p.employee?.department
                            ? ` · ${p.employee.department.name}`
                            : ""}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs">
                      {String(p.month).padStart(2, "0")}/{p.year}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.actualWorkDays}/{p.standardWorkDays}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className="text-ok">{p.paidLeaveDays}</span>
                      {" / "}
                      <span className="text-danger">{p.unpaidLeaveDays}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">
                        {formatMinutes(p.overtimeMinutes)}
                      </p>
                      {Number(p.overtimePay) > 0 && (
                        <p className="text-xs text-ok">
                          +{formatVnd(p.overtimePay)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {Number(p.deductions) > 0 ? (
                        <span className="text-danger">
                          -{formatVnd(p.deductions)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatVnd(p.netSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <PayrollStatusBadge status={p.status} />
                    </td>
                    {tab === "all" && (
                      <td className="px-4 py-3 text-right">
                        {p.status === "draft" && (
                          <button
                            onClick={() => openApprove(p)}
                            className="font-semibold text-petrol hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        {p.status === "approved" && (
                          <button
                            onClick={() => openPay(p)}
                            className="font-semibold text-ok hover:underline"
                          >
                            Mark paid
                          </button>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {pagination && <Paginator pagination={pagination} onPage={setPage} />}

      {/* Generate modal */}
      <Modal
        open={modal === "generate"}
        title="Generate payroll"
        onClose={() => setModal(null)}
      >
        <form onSubmit={submitGenerate} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Calculates a draft payslip for every active employee for the
            selected month. Employees whose payroll is already approved or
            paid for that month are left untouched.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Month">
              <select
                className={inputCls}
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
              >
                {MONTH_LABEL.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <select
                className={inputCls}
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Generating…" : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve confirm */}
      <Modal
        open={modal === "approve"}
        title="Approve payroll?"
        onClose={() => setModal(null)}
      >
        {selected && (
          <>
            <p className="text-sm text-ink-soft">
              {selected.employee?.user
                ? `${selected.employee.user.lastName} ${selected.employee.user.firstName}`
                : "This employee"}
              's payroll for{" "}
              {MONTH_LABEL[selected.month - 1]} {selected.year} (
              {formatVnd(selected.netSalary)}) will be locked from further
              recalculation.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModal(null)}>
                Back
              </Button>
              <Button onClick={submitApprove} disabled={busy}>
                {busy ? "Approving…" : "Approve"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Mark paid confirm */}
      <Modal
        open={modal === "pay"}
        title="Mark payroll as paid?"
        onClose={() => setModal(null)}
      >
        {selected && (
          <>
            <p className="text-sm text-ink-soft">
              Confirms {formatVnd(selected.netSalary)} was paid to{" "}
              {selected.employee?.user
                ? `${selected.employee.user.lastName} ${selected.employee.user.firstName}`
                : "this employee"}{" "}
              for {MONTH_LABEL[selected.month - 1]} {selected.year}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModal(null)}>
                Back
              </Button>
              <Button onClick={submitPay} disabled={busy}>
                {busy ? "Saving…" : "Mark as paid"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
