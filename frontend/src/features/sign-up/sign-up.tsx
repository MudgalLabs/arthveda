import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { toast } from "@/components/toast";
import { Button, TextInput } from "@/s8ly";
import { apiHooks } from "@/hooks/api-hooks";
import { ROUTES } from "@/routes";
import { ContinueWithGoogle } from "@/components/continue-with-google";
import { Link } from "@/components/link";

export const SignupFormSchema = z
    .object({
        email: z
            .string()
            .email({ message: "Please enter a valid email." })
            .trim(),
        password: z
            .string()
            .min(8, { message: "Be at least 8 characters long" })
            .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
            .regex(/[0-9]/, { message: "Contain at least one number." })
            .regex(/[^a-zA-Z0-9]/, {
                message: "Contain at least one special character.",
            })
            .trim(),
        confirmPassword: z.string().trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords does not match",
    });

interface FormErrors {
    email: string[];
    password: string[];
    confirmPassword: string[];
}

const defaultFormErrors: FormErrors = {
    email: [],
    password: [],
    confirmPassword: [],
};

export default function SignUp() {
    const navigate = useNavigate();

    const { mutate: signup, isPending } = apiHooks.auth.useSignup({
        onSuccess: () => {
            navigate(ROUTES.signIn);
            toast.success("Account Created", {
                description: "Sign in to start using Arthveda",
            });
        },
        onError: (error) => {
            const errorMsg = error.response.data.message;
            toast.error(errorMsg);
        },
    });

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [formErrors, setFormErrors] = useState(defaultFormErrors);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        setFormErrors(defaultFormErrors);

        const validatedFields = SignupFormSchema.safeParse({
            email,
            password,
            confirmPassword,
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
        <div>
            <h1 className="font-poppins text-foreground-1 mb-1 text-[24px] font-bold">
                Sign up
            </h1>
            <p className="text-foreground-2 mb-6 text-sm">
                Already have an account? <Link to={ROUTES.signIn}>Sign in</Link>
            </p>

            <form className="flex flex-col" onSubmit={handleSubmit}>
                <TextInput
                    id="email"
                    name="email"
                    placeholder="Email"
                    disabled={isPending}
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {formErrors.email?.length > 0 && (
                    <p className="text-error mt-2 text-sm">
                        {formErrors.email}
                    </p>
                )}
                <div className="mb-4"></div>

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

                <div className="mb-4"></div>

                <TextInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    type="password"
                    disabled={isPending}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {formErrors.confirmPassword?.length > 0 && (
                    <p className="text-error mt-2 text-sm">
                        {formErrors.confirmPassword}
                    </p>
                )}
                <div className="mb-8"></div>

                <Button
                    className="mb-3"
                    variant="secondary"
                    loading={isPending}
                    disabled={!email || !password || !confirmPassword}
                >
                    Sign up
                </Button>

                <p className="text-foreground-3 mb-3 text-center text-[12px]">
                    OR
                </p>

                <ContinueWithGoogle disabled={isPending} />
            </form>
        </div>
    );
}
