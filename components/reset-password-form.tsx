"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { hasSession, updatePassword } from "@/lib/services/fc-service";

/**
 * Destino del enlace del correo: el cliente de Supabase canjea el `code` y
 * deja una sesión, con la que se guarda la contraseña nueva.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hasSession()
      .then((ok) => setStatus(ok ? "ready" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, []);

  if (status === "checking") return <Skeleton className="h-48 w-full rounded-2xl" />;

  if (status === "invalid") {
    return (
      <EmptyState
        icon={LinkIcon}
        title="Enlace no válido"
        description="El enlace caducó, ya se usó o se abrió en otro navegador. Pide uno nuevo."
        actionLabel="Pedir otro enlace"
        actionHref="/forgot-password"
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Contraseña actualizada");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Repite la contraseña</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full bg-goat-lime text-black hover:bg-goat-lime-2">
        {submitting ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
