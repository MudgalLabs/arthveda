import { redirect } from "next/navigation";

export default function Home() {
  // TODO: When we have backend for auth, we can check for user's auth
  // and redirect to /dashboard or /sign-in accordingly.
  redirect("/sign-in");
}
