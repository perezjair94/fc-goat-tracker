"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerPicker, isChoiceComplete } from "@/components/player-picker";
import { getAccount, getCurrentPlayerId, signIn, signUp, type PlayerChoice } from "@/lib/services/fc-service";
import { cn } from "@/lib/utils";

type Mode = "signIn" | "signUp";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [choice, setChoice] = useState<PlayerChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signUp" && !isChoiceComplete(choice)) {
      setError("Elige tu jugador o escribe tu nombre si eres nuevo.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signIn(email.trim(), password);
        toast.success("Sesión iniciada");
      } else {
        const player = await signUp(email.trim(), password, choice!);
        toast.success(`Cuenta creada. Bienvenido, ${player.name}`);
      }
      router.push(getCurrentPlayerId() ? "/" : "/claim");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo continuar.";
      // La cuenta ya se creó y hay sesión: solo falló vincular el jugador.
      if (mode === "signUp" && getAccount()) {
        toast.error(`${message} Elige tu jugador de nuevo.`);
        router.push("/claim");
        return;
      }
      setError(message);
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

      {mode === "signUp" ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">¿Quién eres?</span>
          <PlayerPicker value={choice} onChange={setChoice} disabled={submitting} />
        </div>
      ) : null}

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
