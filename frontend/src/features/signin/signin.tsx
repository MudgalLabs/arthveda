import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { apiHooks } from "@/hooks/api-hooks";
import { Button, TextInput } from "@/s8ly";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { Branding } from "@/components/branding";
import { Google } from "@/components/google";
import { ContinueWithGoogle } from "@/components/continue-with-google";

export default function Signin() {
    const client = useQueryClient();
    const navigate = useNavigate();
    const [search] = useSearchParams();

    const { mutate: signin, isPending } = apiHooks.auth.useSignin({
        onSuccess: () => {
            client.invalidateQueries();
            navigate(search.get("from") || "/dashboard");
            toast("Welcome back!", { autoClose: 2000, hideProgressBar: true });
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
        <div className="flex w-[85%] items-center justify-center md:justify-between lg:w-[70%] xl:w-[55%]">
            <main className="flex flex-col items-start justify-center">
                <Branding className="mb-12 h-[64px] md:hidden" />

                <h1 className="font-poppins text-foreground-1 mb-1 text-[24px] font-bold">
                    Sign in
                </h1>
                <p className="text-foreground-2 mb-6 text-sm">
                    New to Arthveda? <Link to="/signup">Sign up for free</Link>
                </p>
                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <TextInput
                        className="mb-4"
                        placeholder="Email"
                        name="email"
                        disabled={isPending}
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

                    <Link className="mb-6" to="/forgot-password">
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
                        or with
                    </p>

                    <ContinueWithGoogle disabled={isPending} />
                </form>
            </main>

            <Branding className="hidden h-[64px] md:inline-block" />
        </div>
    );
}
