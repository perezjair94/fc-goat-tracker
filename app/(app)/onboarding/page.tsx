import { PageHeader } from "@/components/page-header";
import { CreatePlayerForm } from "@/components/create-player-form";

export const metadata = { title: "Crear jugador" };

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Crea tu jugador"
        description="Tu cuenta todavía no tiene jugador. Es quien firma los partidos que registres."
      />
      <CreatePlayerForm />
    </div>
  );
}
