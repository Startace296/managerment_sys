import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button, Field, inputCls } from "../components/ui";
import { api, getApiError } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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
        <h1 className="mb-2 text-xl font-extrabold">Forgot password</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Enter your account email and we'll send you a link to reset your
          password.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-ok/10 p-4 text-sm text-ok">
              If an account exists for <b>{email}</b>, a reset link has been
              sent. Check your inbox (and spam folder).
            </div>
            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-petrol hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full py-2.5">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <Link
              to="/login"
              className="block text-center text-sm font-semibold text-petrol hover:underline"
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
