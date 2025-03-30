import { Button, TextInput } from "@/s8ly";
import { TextLink } from "../components/TextLink/TextLink";

export default function SignIn() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-poppins mb-8 text-[32px]">Sign in to Arthveda</h1>
      <form className="flex flex-col">
        <TextInput className="mb-4" placeholder="Username" />
        <TextInput className="mb-3" placeholder="Password" />

        <TextLink className="mb-8" href="/forgot-password">
          Forgot password?
        </TextLink>

        <Button className="mb-4" variant="secondary">
          Sign In
        </Button>
      </form>

      <p className="text-sm">
        No account?{" "}
        <TextLink className="text-sm" href="/sign-up">
          Sign up
        </TextLink>{" "}
        or continue with <TextLink className="text-sm">Google</TextLink>
      </p>
    </main>
  );
}
