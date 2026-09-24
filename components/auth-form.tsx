"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentPlayerId, signIn, signUp } from "@/lib/services/fc-service";
import { cn } from "@/lib/utils";

type Mode = "signIn" | "signUp";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      toast.success(mode === "signIn" ? "Sesión iniciada" : "Cuenta creada");
      router.push(getCurrentPlayerId() ? "/" : "/claim");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1">
        {(["signIn", "signUp"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option === "signIn" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        ))}
      </div>

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          required
          minLength={mode === "signUp" ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signUp" ? (
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full bg-goat-lime text-black hover:bg-goat-lime-2">
        {submitting ? "Un momento..." : mode === "signIn" ? "Entrar" : "Crear cuenta"}
      </Button>
    </form>
  );
}
