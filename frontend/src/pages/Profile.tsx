import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import axios from "axios";
import { api, getApiError } from "../lib/api";
import type { ApiResponse, Employee } from "../lib/types";
import { formatDate, formatVnd, ROLE_LABEL } from "../lib/types";
import {
  Button,
  EmptyState,
  Field,
  inputCls,
  Spinner,
  StatusBadge,
} from "../components/ui";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { push } = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Employee | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "" });

  const [pwBusy, setPwBusy] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Employee>>("/employees/me");
      setProfile(res.data.data);
      setForm({
        phone: res.data.data.phone ?? "",
        address: res.data.data.address ?? "",
      });
      setHasProfile(true);
    } catch (err) {
      // A user without an employee profile has nothing to show — not an error.
      const isNoProfile =
        axios.isAxiosError(err) && err.response?.status === 404;
      if (isNoProfile) {
        setHasProfile(false);
      } else {
        push("error", getApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await api.put<ApiResponse<Employee>>("/employees/me", {
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      setProfile(res.data.data);
      push("success", "Profile updated");
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordChange = async (ev: FormEvent) => {
    ev.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      push("error", "New password and confirmation don't match");
      return;
    }
    setPwBusy(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      push("success", "Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      push("error", getApiError(err));
    } finally {
      setPwBusy(false);
    }
  };

  const displayName = profile?.user
    ? `${profile.user.lastName} ${profile.user.firstName}`
    : user?.email ?? "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .reduce(
      (acc, word, i, words) =>
        i === 0 || i === words.length - 1 ? acc + word[0] : acc,
      ""
    )
    .toUpperCase();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">My profile</h1>
        <p className="text-sm text-ink-soft">
          View your employee details and keep your contact info up to date.
        </p>
      </header>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {!hasProfile ? (
            <EmptyState text="Your account isn't linked to an employee profile yet. Ask an admin to set one up." />
          ) : (
            profile && (
              <div className="space-y-5">
                {/* Identity summary */}
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-petrol text-lg font-bold text-white">
                    {initials || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold">
                      {displayName}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {user?.email}
                      {profile.employeeCode && ` · ${profile.employeeCode}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && (
                      <span className="rounded-full bg-petrol-soft px-2.5 py-1 text-xs font-semibold text-petrol">
                        {ROLE_LABEL[user.role]}
                      </span>
                    )}
                    <StatusBadge status={profile.status} />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={<path d="M4 21V7l8-4 8 4v14h-6v-5h-4v5H4zm5-9h2V9H9v3zm4 0h2V9h-2v3z" />}
                    label="Department"
                    value={profile.department?.name ?? "—"}
                  />
                  <StatTile
                    icon={
                      <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2h4a2 2 0 012 2v3H3V8a2 2 0 012-2h4zm2-2v2h2V4h-2zM3 13h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" />
                    }
                    label="Position"
                    value={profile.position}
                  />
                  <StatTile
                    icon={
                      <path d="M7 2v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zM5 10h14v10H5V10z" />
                    }
                    label="Hire date"
                    value={formatDate(profile.hireDate)}
                  />
                  <StatTile
                    icon={
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1.13 15.36V19h-2v-1.62c-1.15-.22-2.13-.9-2.66-1.98l1.65-.96c.3.58.9.98 1.68.98.85 0 1.4-.4 1.4-.98 0-.62-.58-.87-1.77-1.2C9.2 12.72 8 12.1 8 10.5c0-1.28.94-2.22 2.13-2.47V6.5h2v1.5c1.02.21 1.78.82 2.16 1.63l-1.6.86c-.22-.4-.65-.68-1.19-.68-.68 0-1.13.32-1.13.82 0 .56.5.78 1.65 1.1C13.7 12.28 15 12.9 15 14.5c0 1.35-.98 2.37-2.37 2.62z" />
                    }
                    label="Salary"
                    value={formatVnd(profile.salary)}
                  />
                </div>

                {/* Contact */}
                <div className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
                    Contact information
                  </h2>
                  <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone">
                      <input
                        className={inputCls}
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        maxLength={20}
                        placeholder="e.g. 0912345678"
                      />
                    </Field>
                    <Field label="Address">
                      <input
                        className={inputCls}
                        value={form.address}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, address: e.target.value }))
                        }
                        placeholder="Your current address"
                      />
                    </Field>
                    <div className="sm:col-span-2 flex justify-end pt-1">
                      <Button type="submit" disabled={busy}>
                        {busy ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )
          )}

          {/* Security — always available, even without a linked employee profile */}
          <div className="mt-5 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
              Security
            </h2>
            <form
              onSubmit={submitPasswordChange}
              className="grid gap-4 sm:grid-cols-3"
            >
              <Field label="Current password">
                <input
                  type="password"
                  className={inputCls}
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="••••••••"
                />
              </Field>
              <Field label="New password" hint="Min. 6 characters">
                <input
                  type="password"
                  className={inputCls}
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Confirm">
                <input
                  type="password"
                  className={inputCls}
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </Field>
              <div className="sm:col-span-3 flex justify-end pt-1">
                <Button type="submit" disabled={pwBusy}>
                  {pwBusy ? "Updating…" : "Change password"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          {icon}
        </svg>
        {label}
      </div>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  );
}
