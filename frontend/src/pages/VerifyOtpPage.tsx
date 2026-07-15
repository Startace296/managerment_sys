import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Button, Field, inputCls } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getApiError } from "../lib/api";

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const { push } = useToast();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email, otp);
      push("success", "Email verified — please sign in");
      navigate("/login");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      await resendOtp(email);
      push("success", "A new code has been sent to your email");
      setCooldown(60);
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
        <h1 className="mb-2 text-xl font-extrabold">Verify your email</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Enter the 6-digit code we sent to your email to activate your
          account.
        </p>

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
          <Field
            label="Verification code"
            hint="6-digit code, expires in 10 minutes"
          >
            <input
              className={`${inputCls} text-center text-lg tracking-[0.5em]`}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full py-2.5"
          >
            {busy ? "Verifying…" : "Verify email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy || cooldown > 0 || !email}
            onClick={resend}
            className="w-full py-2.5"
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
          </Button>
          <Link
            to="/login"
            className="block text-center text-sm font-semibold text-petrol hover:underline"
          >
            ← Back to sign in
          </Link>
        </form>
      </motion.div>
    </div>
  );
}
