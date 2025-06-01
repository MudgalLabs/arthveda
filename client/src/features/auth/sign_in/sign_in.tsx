import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiHooks } from "@/hooks/api_hooks";
import { Button, Input, Label } from "@/s8ly";
import { useQueryClient } from "@tanstack/react-query";
import { ContinueWithGoogle } from "@/components/continue_with_google";
import { Link } from "@/components/link";
import { PasswordInput } from "@/components/input/password_input";
import { WithLabel } from "@/components/with_label";
import { apiErrorHandler } from "@/lib/api";
import { toast } from "@/components/toast";
import { SigninResponse } from "@/lib/api/auth";
import { ROUTES } from "@/routes_constants";

export default function SignIn() {
    const client = useQueryClient();
    const navigate = useNavigate();

    const { mutate: signin, isPending } = apiHooks.auth.useSignin({
        onSuccess: async (res) => {
            // NOTE: await otherwise there will be a time when the toast is
            // shown as if we are signed in but we are still on sign in screen.
            await client.invalidateQueries();
            const data = res.data.data as SigninResponse;
            toast.info(`Good to see you ${data.display_name}!`, {
                icon: <p>🚀</p>,
            });
            navigate(ROUTES.dashboard);
        },
        onError: apiErrorHandler,
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
            <h1 className="font-heading text-foreground heading mb-1 text-[24px]">
                Sign in
            </h1>
            <p className="text-foreground-muted mb-6 text-sm">
                New to Arthveda?{" "}
                <Link to={ROUTES.signUp}>Sign up for free</Link>
            </p>
            <form className="flex w-[300px] flex-col" onSubmit={handleSubmit}>
                <WithLabel Label={<Label>Email</Label>}>
                    <Input
                        className="mb-4"
                        placeholder="Email"
                        name="email"
                        disabled={isPending}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </WithLabel>

                <WithLabel Label={<Label>Password</Label>}>
                    <PasswordInput
                        className="mb-2"
                        placeholder="Password"
                        name="password"
                        type="password"
                        disabled={isPending}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </WithLabel>

                <Link className="mb-6" to={ROUTES.forgotPassword}>
                    Forgot password?
                </Link>

                <Button
                    className="mb-3 w-full!"
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
