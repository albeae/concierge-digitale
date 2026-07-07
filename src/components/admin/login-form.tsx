"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login, type LoginState } from "@/app/admin/actions";
import { FieldRow, Input } from "@/components/admin/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <FieldRow label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="titolare@esempio.it"
        />
      </FieldRow>

      <FieldRow label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </FieldRow>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        size="lg"
        className="h-12 w-full rounded-2xl bg-terracotta text-base font-semibold text-primary-foreground hover:bg-terracotta-strong"
      >
        <LogIn className="size-5" aria-hidden />
        {pending ? "Accesso in corso…" : "Accedi"}
      </Button>
    </form>
  );
}
