import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { LoginForm } from "@/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <>
      <PublicHeader />
      <LoginForm portal="admin" defaultRole="MASTER_ADMIN" />
      <PublicFooter />
    </>
  );
}
