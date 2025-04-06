import { Button, TextInput } from "../../s8ly";

export default function Signup() {
    return (
        <main className="flex h-screen flex-col items-center justify-center">
            <h1 className="font-poppins mb-8 text-[32px]">
                Sign up for Arthveda
            </h1>
            <form className="flex flex-col">
                <TextInput id="email" name="email" placeholder="Email" />
                <div className="mb-3"></div>

                <TextInput
                    id="password"
                    name="password"
                    placeholder="Password"
                    type="password"
                />
                <div className="mt-2"></div>
                <div className="mb-8"></div>

                <Button className="mb-4" variant="secondary">
                    Sign up
                </Button>
            </form>

            <p className="text-sm">
                Already have an account? <a href="/sign-in">Sign in</a>
            </p>
        </main>
    );
}
