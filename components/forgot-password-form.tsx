"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/services/fc-service";

/** Pide el correo con el enlace para crear una contraseña nueva. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el correo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-goat-lime/15 text-goat-lime">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm">
          Si existe una cuenta con <span className="font-medium">{sentTo}</span>, te llegará un correo con un
          enlace para crear una contraseña nueva.
        </p>
        <p className="text-xs text-muted-foreground">Ábrelo en este mismo navegador. Revisa también el spam.</p>
        <Button variant="ghost" size="sm" onClick={() => setSentTo(null)}>
          Usar otro email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full bg-goat-lime text-black hover:bg-goat-lime-2">
        {submitting ? "Enviando..." : "Enviar enlace"}
      </Button>

      <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-foreground">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
