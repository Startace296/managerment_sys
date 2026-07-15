import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Button, Field, inputCls } from "../components/ui";
import Logo from "../components/Logo";
import { getApiError } from "../lib/api";
import { ROLE_LABEL } from "../lib/types";

type Mode = "login" | "register";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        push("success", "Signed in successfully");
        navigate("/");
      } else {
        const user = await register({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
        });
        push(
          "success",
          `Account #${user.id} created (${user.email}) — role: ${ROLE_LABEL[user.role]}. Check your email for a verification code.`
        );
        navigate(`/verify-otp?email=${encodeURIComponent(user.email)}`);
      }
    } catch (err) {
      if (mode === "login" && axios.isAxiosError(err) && err.response?.status === 403) {
        push("error", getApiError(err));
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        push("error", getApiError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-petrol-deep p-4">
      {/* Ambient background */}
      <motion.div
        className="pointer-events-none fixed -left-40 -top-40 size-[480px] rounded-full bg-petrol blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none fixed -bottom-48 -right-32 size-[420px] rounded-full bg-signal/20 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md rounded-2xl bg-surface p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <Logo className="size-10 shrink-0" />
          <div>
            <h1 className="text-xl font-extrabold leading-tight">
              HR Management
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-mist p-1 text-sm font-semibold">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative z-10 rounded-lg py-2 transition-colors ${
                mode === m ? "text-petrol" : "text-ink-soft"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {m === "login" ? "Sign in" : "Register"}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <AnimatePresence initial={false}>
            {mode === "register" && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Last name">
                    <input
                      className={inputCls}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      required
                      placeholder="Smith"
                    />
                  </Field>
                  <Field label="First name">
                    <input
                      className={inputCls}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      required
                      placeholder="John"
                    />
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              placeholder="admin@company.com"
            />
          </Field>
          <Field label="Password" hint={mode === "register" ? "At least 6 characters" : undefined}>
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={mode === "register" ? 6 : 1}
              placeholder="••••••••"
            />
          </Field>

          {mode === "login" && (
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-petrol hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full py-2.5">
            {busy
              ? "Processing…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
