import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="React.js SignUp Dashboard | Atommarts Admin"
        description="This is React.js SignUp Tables Dashboard page for Atommarts Admin"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
