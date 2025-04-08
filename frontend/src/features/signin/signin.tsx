import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { apiHooks } from "@/hooks/api-hooks";
import { Button, TextInput } from "@/s8ly";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";

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
        <main className="flex h-screen flex-col items-center justify-center">
            <h1 className="font-poppins mb-8 text-[32px]">
                Sign in to Arthveda
            </h1>
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
                    className="mb-3"
                    placeholder="Password"
                    name="password"
                    type="password"
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Link className="mb-9" to="/forgot-password">
                    Forgot password?
                </Link>

                <Button
                    className="mb-4"
                    variant="secondary"
                    loading={isPending}
                    disabled={!email || !password}
                >
                    Sign in
                </Button>
            </form>

            <p className="text-sm">
                No account? <Link to="/signup">Sign up</Link>
            </p>
        </main>
    );
}
