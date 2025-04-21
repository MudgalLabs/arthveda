import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiHooks } from "@/hooks/api-hooks";
import { Button, TextInput } from "@/s8ly";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { ContinueWithGoogle } from "@/components/continue-with-google";
import { ROUTES } from "@/routes";
import { Link } from "@/components/link";

export default function SignIn() {
    const client = useQueryClient();
    const navigate = useNavigate();
    const [search] = useSearchParams();

    const { mutate: signin, isPending } = apiHooks.auth.useSignin({
        onSuccess: async () => {
            // NOTE: await otherwise there will be a time when the toast is
            // shown as if we are signed in but we are still on sign in screen.
            await client.invalidateQueries();
            navigate(search.get("from") || ROUTES.dashboard);
            toast("Welcome back to Arthveda.", {
                icon: <p>😎</p>,
            });
        },
        onError: (error) => {
            const errorMsg = error.response.data.message;
            toast.error(errorMsg);
        },
    });

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        signin({
            email,
            password,
        });
    };

    return (
        <div>
            <h1 className="font-poppins text-foreground-1 mb-1 text-[24px] font-bold">
                Sign in
            </h1>
            <p className="text-foreground-2 mb-6 text-sm">
                New to Arthveda?{" "}
                <Link to={ROUTES.signUp}>Sign up for free</Link>
            </p>
            <form className="flex flex-col" onSubmit={handleSubmit}>
                <TextInput
                    className="mb-4"
                    placeholder="Email"
                    name="email"
                    disabled={isPending}
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                    className="mb-2"
                    placeholder="Password"
                    name="password"
                    type="password"
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Link className="mb-6" to={ROUTES.forgotPassword}>
                    Forgot password?
                </Link>

                <Button
                    className="mb-3"
                    variant="secondary"
                    loading={isPending}
                    disabled={!email || !password}
                >
                    Sign in
                </Button>

                <p className="text-foreground-3 mb-3 text-center text-[12px]">
                    OR
                </p>

                <ContinueWithGoogle disabled={isPending} />
            </form>
        </div>
    );
}
