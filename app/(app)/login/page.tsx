import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Iniciar sesión"
        description="Entra con tu cuenta del grupo para registrar partidos y sesiones."
      />
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
}
