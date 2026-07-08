import { useCallback, useEffect, useState, type FormEvent } from "react";
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
      ) : !hasProfile ? (
        <EmptyState text="Your account isn't linked to an employee profile yet. Ask an admin to set one up." />
      ) : (
        profile && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
                Account details
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Name</dt>
                  <dd className="font-semibold">
                    {profile.user
                      ? `${profile.user.lastName} ${profile.user.firstName}`
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Email</dt>
                  <dd className="font-semibold">{user?.email}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Role</dt>
                  <dd className="font-semibold">
                    {user ? ROLE_LABEL[user.role] : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Employee code</dt>
                  <dd className="font-mono font-semibold">
                    {profile.employeeCode}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Department</dt>
                  <dd className="font-semibold">
                    {profile.department?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Position</dt>
                  <dd className="font-semibold">{profile.position}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Status</dt>
                  <dd>
                    <StatusBadge status={profile.status} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Date of birth</dt>
                  <dd className="font-semibold">
                    {formatDate(profile.dateOfBirth)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Hire date</dt>
                  <dd className="font-semibold">
                    {formatDate(profile.hireDate)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Salary</dt>
                  <dd className="font-semibold">
                    {formatVnd(profile.salary)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
                Contact information
              </h2>
              <form onSubmit={submit} className="space-y-4">
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
                  <textarea
                    className={`${inputCls} min-h-24 resize-y`}
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="Your current address"
                  />
                </Field>
                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
}
