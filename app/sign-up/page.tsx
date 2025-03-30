import { Button, TextInput } from "@/s8ly";
import { TextLink } from "../components/TextLink/TextLink";

export default function Signup() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-poppins mb-8 text-[32px]">Sign up for Arthveda</h1>
      <form className="flex flex-col">
        <TextInput className="mb-4" placeholder="Username" />
        <TextInput className="mb-3" placeholder="Email" />
        <TextInput className="mb-8" placeholder="Password" />

        <Button className="mb-4" variant="secondary">
          Sign up
        </Button>
      </form>

      <p className="text-sm">
        Already have an account?{" "}
        <TextLink className="text-sm" href="/sign-in">
          Sign in
        </TextLink>
      </p>
    </main>
  );
}
