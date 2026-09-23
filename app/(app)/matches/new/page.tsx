import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { MatchForm } from "@/components/match-form";

export const metadata = { title: "Registrar partido" };

export default function NewMatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registrar partido"
        description="Guarda el resultado real del partido. El ranking y las estadísticas se recalculan automáticamente."
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <MatchForm />
        </CardContent>
      </Card>
    </div>
  );
}
