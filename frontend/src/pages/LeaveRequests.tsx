import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import axios from "axios";
import { api, getApiError } from "../lib/api";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  PaginatedResponse,
  Pagination,
} from "../lib/types";
import {
  LEAVE_STATUS_LABEL,
  LEAVE_TYPE_LABEL,
  formatDate,
  leaveDays,
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

const emptyForm = {
  leaveType: "annual" as LeaveType,
  startDate: "",
  endDate: "",
  reason: "",
};

function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, string> = {
    pending: "bg-signal/15 text-[#9a6a17]",
    approved: "bg-ok/10 text-ok",
    rejected: "bg-danger/10 text-danger",
    cancelled: "bg-ink-soft/10 text-ink-soft",
  };
  const dot: Record<LeaveStatus, string> = {
    pending: "bg-signal",
    approved: "bg-ok",
    rejected: "bg-danger",
    cancelled: "bg-ink-soft",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {LEAVE_STATUS_LABEL[status]}
    </span>
  );
}

export default function LeaveRequestsPage() {
  const { push } = useToast();
  const { isManagerUp } = useAuth();

  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [modal, setModal] = useState<null | "create" | "cancel" | "review">(
    null
  );
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === "all" ? "/leave-requests" : "/leave-requests/me";
      const res = await api.get<PaginatedResponse<LeaveRequest>>(url, {
        params: {
          page,
          limit: 10,
          from: from || undefined,
          to: to || undefined,
          search: tab === "all" ? search || undefined : undefined,
          status: statusFilter || undefined,
          leaveType: typeFilter || undefined,
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
  }, [tab, page, from, to, search, statusFilter, typeFilter, push]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0); // debounce while typing search
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal("create");
  };

  const submitCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      await api.post("/leave-requests", form);
      push("success", "Leave request submitted");
      setModal(null);
      setTab("mine");
      setPage(1);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openCancel = (item: LeaveRequest) => {
    setSelected(item);
    setModal("cancel");
  };

  const submitCancel = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/leave-requests/${selected.id}/cancel`);
      push("success", "Leave request cancelled");
      setModal(null);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openReview = (item: LeaveRequest) => {
    setSelected(item);
    setReviewNote("");
    setModal("review");
  };

  const submitReview = async (decision: "approve" | "reject") => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.patch(`/leave-requests/${selected.id}/${decision}`, {
        note: reviewNote || undefined,
      });
      push(
        "success",
        decision === "approve" ? "Leave request approved" : "Leave request rejected"
      );
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
          <h1 className="text-2xl font-extrabold">Leave requests</h1>
          <p className="text-sm text-ink-soft">
            Submit a request and track its approval status.
          </p>
        </div>
        <Button onClick={openCreate}>+ New request</Button>
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
              {t === "mine" ? "My requests" : "All requests"}
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
          value={typeFilter}
          onChange={(e) => {
            setPage(1);
            setTypeFilter(e.target.value);
          }}
        >
          <option value="">All types</option>
          {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
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
          {Object.entries(LEAVE_STATUS_LABEL).map(([k, v]) => (
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
        <EmptyState text="No leave requests for this filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                {tab === "all" && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {items.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-line/60 last:border-0 hover:bg-mist/60"
                  >
                    {tab === "all" && (
                      <td className="px-4 py-3">
                        {r.employee?.user
                          ? `${r.employee.user.lastName} ${r.employee.user.firstName}`
                          : "—"}
                        <span className="block text-xs text-ink-soft">
                          {r.employee?.employeeCode}
                          {r.employee?.department
                            ? ` · ${r.employee.department.name}`
                            : ""}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">{LEAVE_TYPE_LABEL[r.leaveType]}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {leaveDays(r.startDate, r.endDate)}
                    </td>
                    <td className="px-4 py-3 max-w-64">
                      <span className="line-clamp-2">{r.reason}</span>
                    </td>
                    <td className="px-4 py-3">
                      <LeaveStatusBadge status={r.status} />
                      {r.status !== "pending" && r.reviewedBy && (
                        <span className="mt-1 block text-xs text-ink-soft">
                          by {r.reviewedBy.lastName} {r.reviewedBy.firstName}
                          {r.reviewNote ? ` — “${r.reviewNote}”` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tab === "mine" && r.status === "pending" && (
                        <button
                          onClick={() => openCancel(r)}
                          className="font-semibold text-danger hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                      {tab === "all" && r.status === "pending" && (
                        <button
                          onClick={() => openReview(r)}
                          className="font-semibold text-petrol hover:underline"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {pagination && <Paginator pagination={pagination} onPage={setPage} />}

      {/* Create modal */}
      <Modal open={modal === "create"} title="New leave request" onClose={() => setModal(null)}>
        <form onSubmit={submitCreate} className="space-y-4">
          <Field label="Leave type">
            <select
              className={inputCls}
              value={form.leaveType}
              onChange={(e) =>
                setForm((f) => ({ ...f, leaveType: e.target.value as LeaveType }))
              }
            >
              {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                required
              />
            </Field>
          </div>
          <Field label="Reason">
            <textarea
              className={`${inputCls} min-h-24 resize-y`}
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              required
              maxLength={500}
              placeholder="Briefly explain why you're requesting leave"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel confirm */}
      <Modal
        open={modal === "cancel"}
        title="Cancel leave request?"
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-ink-soft">
          Your {selected ? LEAVE_TYPE_LABEL[selected.leaveType].toLowerCase() : ""}{" "}
          request ({selected ? formatDate(selected.startDate) : ""} →{" "}
          {selected ? formatDate(selected.endDate) : ""}) will be cancelled.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>
            Back
          </Button>
          <Button variant="danger" onClick={submitCancel} disabled={busy}>
            {busy ? "Cancelling…" : "Cancel request"}
          </Button>
        </div>
      </Modal>

      {/* Review modal */}
      <Modal
        open={modal === "review"}
        title="Review leave request"
        onClose={() => setModal(null)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-mist/60 p-3 text-sm">
              <p className="font-semibold">
                {selected.employee?.user
                  ? `${selected.employee.user.lastName} ${selected.employee.user.firstName}`
                  : "—"}{" "}
                <span className="font-normal text-ink-soft">
                  ({LEAVE_TYPE_LABEL[selected.leaveType]})
                </span>
              </p>
              <p className="mt-1 font-mono text-xs text-ink-soft">
                {formatDate(selected.startDate)} → {formatDate(selected.endDate)} ·{" "}
                {leaveDays(selected.startDate, selected.endDate)} day(s)
              </p>
              <p className="mt-2 text-ink-soft">{selected.reason}</p>
            </div>
            <Field label="Note (optional)" hint="Shown to the employee">
              <textarea
                className={`${inputCls} min-h-20 resize-y`}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={500}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setModal(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => submitReview("reject")}
                disabled={busy}
              >
                {busy ? "Saving…" : "Reject"}
              </Button>
              <Button onClick={() => submitReview("approve")} disabled={busy}>
                {busy ? "Saving…" : "Approve"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
