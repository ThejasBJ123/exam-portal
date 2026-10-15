import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { LoginForm } from "@/components/LoginForm";

export default function StaffLoginPage() {
  return (
    <>
      <PublicHeader />
      <LoginForm portal="staff" defaultRole="STAFF" />
      <PublicFooter />
    </>
  );
}
