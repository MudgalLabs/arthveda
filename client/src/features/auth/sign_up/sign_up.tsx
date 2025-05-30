import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { toast } from "@/components/toast";
import { Button, Input, Label } from "@/s8ly";
import { apiHooks } from "@/hooks/api_hooks";
import { ROUTES } from "@/routes";
import { ContinueWithGoogle } from "@/components/continue_with_google";
import { Link } from "@/components/link";
import { PasswordInput } from "@/components/input/password_input";
import { WithLabel } from "@/components/with_label";
import { apiErrorHandler } from "@/lib/api";

export const SignupFormSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(3, { message: "Name must be longer than 3 letters" }),
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
    name: string[];
    email: string[];
    password: string[];
    confirmPassword: string[];
}

const defaultFormErrors: FormErrors = {
    name: [],
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
        onError: apiErrorHandler,
    });

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [formErrors, setFormErrors] = useState(defaultFormErrors);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        setFormErrors(defaultFormErrors);

        const validatedFields = SignupFormSchema.safeParse({
            name,
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
            name,
            email,
            password,
        });
    };

    return (
        <div className="border-border rounded-md border-1 p-6">
            <h1 className="font-heading text-foreground heading mb-1 text-[24px]">
                Sign up
            </h1>
            <p className="text-foreground-muted mb-6 text-sm">
                Already have an account? <Link to={ROUTES.signIn}>Sign in</Link>
            </p>

            <form className="w-[300px]flex flex-col" onSubmit={handleSubmit}>
                <WithLabel Label={<Label>Name</Label>}>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Sigma Male"
                        disabled={isPending}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        variant={
                            formErrors.name?.length > 0 ? "error" : undefined
                        }
                    />
                </WithLabel>

                {formErrors.name?.length > 0 && (
                    <p className="text-foreground-red mt-2 text-sm">
                        {formErrors.name}
                    </p>
                )}
                <div className="mb-4"></div>

                <WithLabel Label={<Label>Email</Label>}>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="name@arthveda.io"
                        disabled={isPending}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        variant={
                            formErrors.email?.length > 0 ? "error" : undefined
                        }
                    />
                </WithLabel>

                {formErrors.email?.length > 0 && (
                    <p className="text-foreground-red mt-2 text-sm">
                        {formErrors.email}
                    </p>
                )}
                <div className="mb-4"></div>

                <WithLabel Label={<Label>Password</Label>}>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Password"
                        type="password"
                        disabled={isPending}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        variant={
                            formErrors.password?.length > 0
                                ? "error"
                                : undefined
                        }
                    />
                </WithLabel>

                {formErrors.password?.length > 0 && (
                    <div className="text-foreground-red mt-2 text-sm">
                        <p>Password must:</p>
                        <ul>
                            {formErrors.password.map((error) => (
                                <li key={error}>- {error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mb-4"></div>

                <WithLabel Label={<Label>Confirm Password</Label>}>
                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Password"
                        type="password"
                        disabled={isPending}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        variant={
                            formErrors.confirmPassword?.length > 0
                                ? "error"
                                : undefined
                        }
                    />
                </WithLabel>

                {formErrors.confirmPassword?.length > 0 && (
                    <p className="text-foreground-red mt-2 text-sm">
                        {formErrors.confirmPassword}
                    </p>
                )}
                <div className="mb-8"></div>

                <Button
                    className="mb-3"
                    loading={isPending}
                    disabled={!email || !password || !confirmPassword}
                >
                    Sign up
                </Button>

                <p className="text-foreground-muted mb-3 text-center text-[12px]">
                    OR
                </p>

                <ContinueWithGoogle disabled={isPending} />
            </form>
        </div>
    );
}
