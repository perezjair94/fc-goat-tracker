import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nueva contraseña" description="Elige la contraseña con la que vas a entrar desde ahora." />
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
