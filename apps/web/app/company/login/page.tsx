import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { LoginForm } from "@/components/LoginForm";

export default function CompanyLoginPage() {
  return (
    <>
      <PublicHeader />
      <LoginForm portal="company" />
      <PublicFooter />
    </>
  );
}
