import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recuperar contraseña"
        description="Te enviamos un enlace al correo de tu cuenta para crear una contraseña nueva."
      />
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
