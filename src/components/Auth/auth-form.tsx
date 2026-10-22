"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { useAuth } from "@/providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiResult, SessionUser } from "@/types/project.types";
import { z } from "zod";

const authSchema = z.object({
  name: z.string().trim().min(2, "Please enter at least 2 characters.").max(100).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Please enter your password.").max(128),
});

export function AuthForm({ mode, expired = false }: { mode: "login" | "register"; expired?: boolean }) {
  const registering = mode === "register";
  const router = useRouter();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(expired ? "Your session has ended. Sign in to pick up where you left off." : "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    const form = new FormData(event.currentTarget);
    const parsed = authSchema.safeParse({
      ...(registering ? { name: form.get("name") } : {}),
      email: form.get("email"), password: form.get("password"),
    });
    const fieldErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    } else if (registering && parsed.data.password.length < 8) {
      fieldErrors.password = "Use at least 8 characters for your password.";
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length || !parsed.success) return;

    setPending(true);
    try {
      // Auth goes directly to Express so its per-IP rate limit sees the student's IP.
      const apiUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
      const response = await fetch(apiUrl + (registering ? "/auth/register" : "/auth/login"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15000),
      });
      const result: ApiResult<{ user: SessionUser; accessToken: string }> = await response.json();
      if (!response.ok) {
        setErrors(Object.fromEntries((result.errorSources || []).map(issue => [issue.path, issue.message])));
        const retry = response.headers.get("retry-after");
        setMessage(response.status === 429
          ? "A few too many attempts. Please try again" + (retry ? " in " + Math.ceil(Number(retry) / 60) + " minutes." : " shortly.")
          : result.message || "Couldn't sign you in. Please try again.");
        return;
      }
      // Store the token in an HttpOnly cookie; never persist it to localStorage.
      const session = await fetch("/api/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: result.data.accessToken }),
      });
      if (!session.ok) {
        setMessage("Your account is ready, but we couldn't start a session. Please sign in again.");
        return;
      }
      queryClient.clear();
      setUser({ ...result.data.user, name: result.data.user.name || undefined });
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally { setPending(false); }
  };

  return <>
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {message && <div className="error-banner" role="alert"><AlertCircle size={17} /><span>{message}</span></div>}
      {registering && <div className="form-field">
        <label htmlFor="name">Your name</label>
        <div className="input-wrap"><UserRound size={17} /><Input id="name" name="name" placeholder="What should we call you?" autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} disabled={pending} /></div>
        <FormError id="name-error" message={errors.name} />
      </div>}
      <div className="form-field">
        <label htmlFor="email">Email address</label>
        <div className="input-wrap"><Mail size={17} /><Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} disabled={pending} /></div>
        <FormError id="email-error" message={errors.email} />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="input-wrap"><LockKeyhole size={17} />
          <Input id="password" name="password" type={visible ? "text" : "password"} placeholder={registering ? "At least 8 characters" : "Enter your password"} autoComplete={registering ? "new-password" : "current-password"} maxLength={128} className="pr-12" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} disabled={pending} />
          <button type="button" className="password-toggle" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </div>
        <FormError id="password-error" message={errors.password} />
      </div>
      {registering && <p className="form-helper">This is a student account. Mentors use their provided sign-in details.</p>}
      <Button className="primary-button auth-submit" type="submit" disabled={pending}>
        {pending ? <><LoaderCircle className="animate-spin" />{registering ? "Creating your space…" : "Signing you in…"}</> : <>{registering ? "Create your account" : "Sign in to your workspace"}<ArrowRight size={17} /></>}
      </Button>
    </form>
    <div className="auth-switch">{registering ? "Already have an account?" : "New around here?"} <Link href={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"}<ArrowUpRightSmall /></Link></div>
    <div className="auth-trust"><LockKeyhole size={13} /><span>Your work. Your space. Securely kept.</span></div>
  </>;
}

function ArrowUpRightSmall() { return <ArrowRight size={13} className="-rotate-45" />; }
