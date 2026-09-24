import { PageHeader } from "@/components/page-header";
import { ClaimPlayer } from "@/components/claim-player";

export const metadata = { title: "Elegir jugador" };

export default function ClaimPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="¿Quién eres?"
        description="Elige tu jugador o crea uno nuevo si no estás en la lista. Queda vinculado a tu cuenta y firma los partidos que registres."
      />
      <ClaimPlayer />
    </div>
  );
}
