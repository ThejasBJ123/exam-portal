import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { LoginForm } from "@/components/LoginForm";

export default function StudentLoginPage() {
  return (
    <>
      <PublicHeader />
      <LoginForm portal="student" />
      <PublicFooter />
    </>
  );
}
