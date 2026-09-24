import { PageHeader } from "@/components/page-header";
import { ClaimPlayer } from "@/components/claim-player";

export const metadata = { title: "Elegir jugador" };

export default function ClaimPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="¿Quién eres?"
        description="Elige tu jugador. Queda vinculado a tu cuenta y es quien firma los partidos que registres."
      />
      <ClaimPlayer />
    </div>
  );
}
