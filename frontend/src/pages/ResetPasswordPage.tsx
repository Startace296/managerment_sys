import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Button, Field, inputCls } from "../components/ui";
import { api, getApiError } from "../lib/api";
import { useToast } from "../components/Toast";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { push } = useToast();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation don't match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });
      push("success", "Password reset successfully — please sign in");
      navigate("/login");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-petrol-deep p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md rounded-2xl bg-surface p-8 shadow-2xl"
      >
        <h1 className="mb-2 text-xl font-extrabold">Reset password</h1>

        {!token ? (
          <div className="space-y-4">
            <p className="text-sm text-danger">
              This reset link is missing or invalid.
            </p>
            <Link
              to="/forgot-password"
              className="block text-center text-sm font-semibold text-petrol hover:underline"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-ink-soft">
              Choose a new password for your account.
            </p>
            <Field label="New password" hint="At least 6 characters">
              <input
                type="password"
                className={inputCls}
                value={form.newPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                required
                minLength={6}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className={inputCls}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                required
                minLength={6}
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full py-2.5">
              {busy ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
