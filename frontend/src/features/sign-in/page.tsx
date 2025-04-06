import { Button, TextInput } from "../../s8ly";

export default function Signin() {
    return (
        <main className="flex h-screen flex-col items-center justify-center">
            <h1 className="font-poppins mb-8 text-[32px]">
                Sign in to Arthveda
            </h1>
            <form className="flex flex-col">
                <TextInput className="mb-4" placeholder="Username" />
                <TextInput className="mb-3" placeholder="Password" />

                <a className="mb-9" href="/forgot-password">
                    Forgot password?
                </a>

                <Button className="mb-4" variant="secondary">
                    Sign in
                </Button>
            </form>

            <p className="text-sm">
                No account? <a href="/sign-up">Sign up</a>
            </p>
        </main>
    );
}
