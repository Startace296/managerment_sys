import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, getApiError } from "../lib/api";
import type {
  ApiResponse,
  Department,
  Employee,
  EmployeeStatus,
  PaginatedResponse,
  Pagination,
  User,
  UserRole,
} from "../lib/types";
import { formatDate, formatVnd, ROLE_LABEL, STATUS_LABEL } from "../lib/types";
import {
  Button,
  EmptyState,
  Field,
  inputCls,
  Modal,
  Paginator,
  Spinner,
  StatusBadge,
} from "../components/ui";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  userId: "",
  employeeCode: "",
  position: "",
  salary: "",
  dateOfBirth: "",
  hireDate: "",
  phone: "",
  address: "",
  departmentId: "",
};

export default function Employees() {
  const { push } = useToast();
  const { isAdmin, isManagerUp } = useAuth();

  const [items, setItems] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const [modal, setModal] = useState<null | "create" | "edit" | "delete">(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const [roleForm, setRoleForm] = useState<UserRole>("employee");
  const [roleBusy, setRoleBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Employee>>("/employees", {
        params: {
          page,
          limit: 8,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, push]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0); // debounce while typing search
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    api
      .get<PaginatedResponse<Department>>("/departments", {
        params: { limit: 100 },
      })
      .then((res) => setDepartments(res.data.data))
      .catch(() => {});
  }, []);

  const openCreate = async () => {
    setForm(emptyForm);
    setModal("create");
    try {
      const res = await api.get<ApiResponse<User[]>>("/users/available");
      setAvailableUsers(res.data.data);
    } catch (err) {
      push("error", getApiError(err));
    }
  };

  const openEdit = (e: Employee) => {
    setSelected(e);
    setForm({
      ...emptyForm,
      position: e.position,
      salary: String(e.salary),
      phone: e.phone ?? "",
      address: e.address ?? "",
      departmentId: e.department ? String(e.department.id) : "",
    });
    setRoleForm(e.user?.role ?? "employee");
    setModal("edit");
  };

  const submitRoleChange = async () => {
    if (!selected?.user) return;
    setRoleBusy(true);
    try {
      await api.patch(`/users/${selected.user.id}/role`, { role: roleForm });
      push("success", "Account role updated");
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setRoleBusy(false);
    }
  };

  const submitCreate = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      await api.post("/employees", {
        userId: Number(form.userId),
        employeeCode: form.employeeCode,
        position: form.position,
        salary: Number(form.salary),
        dateOfBirth: form.dateOfBirth,
        hireDate: form.hireDate,
        phone: form.phone || undefined,
        address: form.address || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      });
      push("success", "Employee record created");
      setModal(null);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await api.put(`/employees/${selected.id}`, {
        position: form.position || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        status: (form as { status?: EmployeeStatus }).status ?? selected.status,
      });
      push("success", "Employee updated");
      setModal(null);
      load();
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.delete(`/employees/${selected.id}`);
      push("success", `${selected.employeeCode} deleted`);
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
          <h1 className="text-2xl font-extrabold">Employees</h1>
          <p className="text-sm text-ink-soft">
            Manage employee records across the company.
          </p>
        </div>
        {isManagerUp && <Button onClick={openCreate}>+ Add employee</Button>}
      </header>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Search by code, position…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
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
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
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
        <EmptyState text="No employees match this filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-right">Salary</th>
                <th className="px-4 py-3">Status</th>
                {isManagerUp && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {items.map((e, i) => (
                  <motion.tr
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-line/60 last:border-0 hover:bg-mist/60"
                  >
                    <td className="px-4 py-3">
                      <span className="rounded bg-petrol-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-petrol">
                        {e.employeeCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {e.user ? `${e.user.lastName} ${e.user.firstName}` : "—"}
                      <span className="block text-xs font-normal text-ink-soft">
                        {e.user?.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">{e.position}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.department?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {formatVnd(e.salary)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    {isManagerUp && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(e)}
                          className="mr-2 text-xs font-semibold text-petrol hover:underline"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelected(e);
                              setModal("delete");
                            }}
                            className="text-xs font-semibold text-danger hover:underline"
                          >
                            Delete
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

      {/* Create modal */}
      <Modal
        open={modal === "create"}
        title="Add employee"
        onClose={() => setModal(null)}
        wide
      >
        <form onSubmit={submitCreate} className="grid grid-cols-2 gap-4">
          <Field
            label="Account"
            hint={
              availableUsers.length === 0
                ? "No accounts waiting for an employee profile — register an account first."
                : undefined
            }
          >
            <select
              className={inputCls}
              value={form.userId}
              onChange={(e) => set("userId", e.target.value)}
              required
            >
              <option value="">— Select an account —</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.lastName} {u.firstName} — {u.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employee code">
            <input
              className={inputCls}
              value={form.employeeCode}
              onChange={(e) => set("employeeCode", e.target.value)}
              required
              maxLength={20}
              placeholder="EMP001"
            />
          </Field>
          <Field label="Position">
            <input
              className={inputCls}
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              required
              placeholder="Backend Developer"
            />
          </Field>
          <Field label="Salary (VND)">
            <input
              type="number"
              className={inputCls}
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              required
              min={0}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className={inputCls}
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              required
            />
          </Field>
          <Field label="Hire date">
            <input
              type="date"
              className={inputCls}
              value={form.hireDate}
              onChange={(e) => set("hireDate", e.target.value)}
              required
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={20}
            />
          </Field>
          <Field label="Department">
            <select
              className={inputCls}
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Address">
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Create record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={modal === "edit"}
        title={`Edit ${selected?.employeeCode ?? ""}`}
        onClose={() => setModal(null)}
        wide
      >
        <form onSubmit={submitEdit} className="grid grid-cols-2 gap-4">
          <Field label="Position">
            <input
              className={inputCls}
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
            />
          </Field>
          <Field label="Salary (VND)">
            <input
              type="number"
              className={inputCls}
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              min={0}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Department">
            <select
              className={inputCls}
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <option value="">— Unassign —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputCls}
              defaultValue={selected?.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }) as typeof f)
              }
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Address">
              <input
                className={inputCls}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
          {isAdmin && selected?.user && (
            <div className="col-span-2">
              <Field label="Account role">
                <div className="flex gap-2">
                  <select
                    className={inputCls}
                    value={roleForm}
                    onChange={(e) => setRoleForm(e.target.value as UserRole)}
                  >
                    {Object.entries(ROLE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={roleBusy || roleForm === selected.user.role}
                    onClick={submitRoleChange}
                  >
                    {roleBusy ? "Saving…" : "Save role"}
                  </Button>
                </div>
              </Field>
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={modal === "delete"}
        title="Delete employee?"
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-ink-soft">
          Record <b className="font-mono text-ink">{selected?.employeeCode}</b>{" "}
          — {selected?.position} will be permanently deleted. Hire date:{" "}
          {selected ? formatDate(selected.hireDate) : ""}.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submitDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
