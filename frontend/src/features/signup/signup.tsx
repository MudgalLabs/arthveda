import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "react-toastify";

import { Button, TextInput } from "@/s8ly";
import { apiHooks } from "@/hooks/apiHooks";

export const SignupFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }).trim(),
    password: z
        .string()
        .min(8, { message: "Be at least 8 characters long" })
        .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
        .regex(/[0-9]/, { message: "Contain at least one number." })
        .regex(/[^a-zA-Z0-9]/, {
            message: "Contain at least one special character.",
        })
        .trim(),
});

interface FormErrors {
    email: string[];
    password: string[];
}

const defaultFormErrors: FormErrors = {
    email: [],
    password: [],
};

export default function Signup() {
    const client = useQueryClient();
    const navigate = useNavigate();

    const { mutate: signup, isPending } = apiHooks.auth.useSignup({
        onSuccess: () => {
            client.invalidateQueries();
            toast.success("Account has been created");
            navigate("/signin");
        },
    });

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formErrors, setFormErrors] = useState(defaultFormErrors);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        setFormErrors(defaultFormErrors);

        const validatedFields = SignupFormSchema.safeParse({
            email,
            password,
        });

        if (!validatedFields.success) {
            const errors = validatedFields.error.flatten()
                .fieldErrors as FormErrors;
            setFormErrors(errors);
            return;
        }

        signup({
            email,
            password,
        });
    };

    return (
        <main className="flex h-screen flex-col items-center justify-center">
            <h1 className="font-poppins mb-8 text-[32px]">
                Sign up for Arthveda
            </h1>

            <form className="flex flex-col" onSubmit={handleSubmit}>
                <TextInput
                    id="email"
                    name="email"
                    placeholder="Email"
                    disabled={isPending}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {formErrors.email?.length > 0 && (
                    <p className="text-error mt-2 text-sm">
                        {formErrors.email}
                    </p>
                )}
                <div className="mb-3"></div>

                <TextInput
                    id="password"
                    name="password"
                    placeholder="Password"
                    type="password"
                    disabled={isPending}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {formErrors.password?.length > 0 && (
                    <div className="text-error mt-2 text-sm">
                        <p>Password must:</p>
                        <ul>
                            {formErrors.password.map((error) => (
                                <li key={error}>- {error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mb-8"></div>

                <Button
                    className="mb-4"
                    variant="secondary"
                    loading={isPending}
                    disabled={!email || !password}
                >
                    Sign up
                </Button>
            </form>

            <p className="text-sm">
                Already have an account? <Link to="/signin">Sign in</Link>
            </p>
        </main>
    );
}
