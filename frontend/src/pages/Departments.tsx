import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, getApiError } from "../lib/api";
import type { Department, PaginatedResponse, Pagination } from "../lib/types";
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

const emptyForm = { name: "", description: "", location: "", isActive: true };

export default function Departments() {
  const { push } = useToast();
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<null | "create" | "edit" | "delete">(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Department>>("/departments", {
        params: { page, limit: 9, search: search || undefined },
      });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, push]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal("create");
  };
  const openEdit = (d: Department) => {
    setSelected(d);
    setForm({
      name: d.name,
      description: d.description ?? "",
      location: d.location ?? "",
      isActive: d.isActive,
    });
    setModal("edit");
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        location: form.location || undefined,
      };
      if (modal === "create") {
        await api.post("/departments", payload);
        push("success", "Department created");
      } else if (selected) {
        await api.put(`/departments/${selected.id}`, {
          ...payload,
          isActive: form.isActive,
        });
        push("success", "Department updated");
      }
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
      await api.delete(`/departments/${selected.id}`);
      push("success", `Department ${selected.name} deleted`);
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
          <h1 className="text-2xl font-extrabold">Departments</h1>
          <p className="text-sm text-ink-soft">
            Only <b>admins</b> can add, edit or delete departments.
          </p>
        </div>
        {isAdmin && <Button onClick={openCreate}>+ New department</Button>}
      </header>

      <input
        className={`${inputCls} mb-4 max-w-xs`}
        placeholder="Search departments…"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState text="No departments yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((d, i) => (
              <motion.article
                key={d.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                whileHover={{ y: -3 }}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-bold">{d.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      d.isActive
                        ? "bg-ok/10 text-ok"
                        : "bg-ink-soft/10 text-ink-soft"
                    }`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink-soft">
                  {d.description || "No description."}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-soft">
                  <span className="font-mono">
                    📍 {d.location || "—"} · #{d.id}
                  </span>
                  {isAdmin && (
                    <span>
                      <button
                        onClick={() => openEdit(d)}
                        className="mr-2 font-semibold text-petrol hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelected(d);
                          setModal("delete");
                        }}
                        className="font-semibold text-danger hover:underline"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {pagination && <Paginator pagination={pagination} onPage={setPage} />}

      {/* Create / Edit modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        title={modal === "create" ? "New department" : `Edit ${selected?.name ?? ""}`}
        onClose={() => setModal(null)}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Department name">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={100}
              placeholder="Engineering"
            />
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </Field>
          <Field label="Location">
            <input
              className={inputCls}
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              maxLength={100}
              placeholder="3rd floor, HQ"
            />
          </Field>
          {modal === "edit" && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="size-4 accent-petrol"
              />
              Active
            </label>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : modal === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={modal === "delete"}
        title="Delete department?"
        onClose={() => setModal(null)}
      >
        <p className="text-sm text-ink-soft">
          Department <b className="text-ink">{selected?.name}</b> will be
          deleted. Employees in this department will be unassigned (backend
          sets <span className="font-mono">SET NULL</span>).
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submitDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
