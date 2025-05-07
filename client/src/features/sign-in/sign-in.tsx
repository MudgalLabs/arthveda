import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiHooks } from "@/hooks/api-hooks";
import { Button, Input, Label } from "@/s8ly";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { ContinueWithGoogle } from "@/components/continue-with-google";
import { ROUTES } from "@/routes";
import { Link } from "@/components/link";
import { Password } from "@/components/password";
import { WithLabel } from "@/components/with-label";

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
            toast.info("Welcome to Arthveda.", {
                icon: <p>🚀</p>,
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
        <div className="border-border rounded-md border-1 p-6">
            <h1 className="font-heading text-foreground mb-1 text-[24px] font-bold">
                Sign in
            </h1>
            <p className="text-foreground-muted mb-6 text-sm">
                New to Arthveda?{" "}
                <Link to={ROUTES.signUp}>Sign up for free</Link>
            </p>
            <form className="flex flex-col" onSubmit={handleSubmit}>
                <WithLabel
                    Label={<Label>Email</Label>}
                    Input={
                        <Input
                            className="mb-4"
                            placeholder="Email"
                            name="email"
                            disabled={isPending}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    }
                />

                <WithLabel
                    Label={<Label>Password</Label>}
                    Input={
                        <Password
                            className="mb-2"
                            placeholder="Password"
                            name="password"
                            type="password"
                            disabled={isPending}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    }
                />

                <Link className="mb-6" to={ROUTES.forgotPassword}>
                    Forgot password?
                </Link>

                <Button
                    className="mb-3"
                    variant="primary"
                    loading={isPending}
                    disabled={!email || !password}
                >
                    Sign in
                </Button>

                <p className="text-foreground-muted mb-3 text-center text-[12px]">
                    OR
                </p>

                <ContinueWithGoogle disabled={isPending} />
            </form>
        </div>
    );
}
