import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

import { ContinueWithGoogle } from "@/components/continue_with_google";
import { Branding } from "@/components/branding";
import { IconArrowUpRight } from "@/components/icons";
import { Card, CardContent } from "@/components/card";
import { WithLabel } from "@/components/with_label";
import { Button, Input, Label } from "@/s8ly";
import { apiHooks } from "@/hooks/api_hooks";
import { SigninResponse } from "@/lib/api/auth";
import { toast } from "@/components/toast";
import { ROUTES } from "@/constants";
import { apiErrorHandler } from "@/lib/api";
import { PasswordInput } from "@/components/input/password_input";

export function SignIn() {
    const posthog = usePostHog();

    const isPasswordAuthEnabled = import.meta.env.ARTHVEDA_ENABLE_SIGN_IN === "true";
    const isGoogleOauthEnabled = import.meta.env.ARTHVEDA_ENABLE_GOOGLE_OAUTH === "true";

    const isDemo = import.meta.env.ARTHVEDA_ENABLE_DEMO === "true";
    const [emailToOpenDemo, setEmailToOpenDemo] = useState("");

    const demoErrorToast = () => {
        toast.error("Failed to start demo");
    };

    const client = useQueryClient();
    const navigate = useNavigate();

    const { mutate: signin, isPending } = apiHooks.auth.useSignin({
        onSuccess: async (res) => {
            // NOTE: await otherwise there will be a time when the toast is
            // shown as if we are signed in but we are still on sign in screen.
            await client.invalidateQueries();
            const data = res.data.data as SigninResponse;

            toast.info(`Welcome back, ${data.name}!`, {
                icon: <p>🚀</p>,
            });
            navigate(ROUTES.dashboard);
        },
        onError: isDemo ? demoErrorToast : apiErrorHandler,
    });

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmitForSignIn = (e: FormEvent) => {
        e.preventDefault();

        signin({
            email,
            password,
        });
    };

    const handleSubmitForDemo = (e: FormEvent) => {
        e.preventDefault();

        if (!emailToOpenDemo) {
            toast.error("Please enter your email to open the demo.");
            return;
        }

        posthog?.capture("Clicked Start Demo", {
            email: emailToOpenDemo,
        });

        signin({ email: "demo", password: "demo" });
    };

    const demoForm = (
        <div>
            <form className="flex justify-center gap-x-2" onSubmit={handleSubmitForDemo}>
                <Input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={emailToOpenDemo}
                    onChange={(e) => setEmailToOpenDemo(e.target.value)}
                />

                <Button loading={isPending}>Start Demo</Button>
            </form>

            <p className="text-foreground-muted mt-4 inline-block w-full text-center text-sm text-balance">
                Your email helps us learn, improve, and connect if needed.
            </p>
        </div>
    );

    return (
        <div className="flex h-dvh w-full flex-col items-center justify-between overflow-auto px-4">
            <div />

            <div className="w-full">
                <Branding className="z-1 flex justify-center" size="default" />

                <div className="h-16" />

                {isDemo ? (
                    demoForm
                ) : (
                    <Card className="mx-auto w-full bg-transparent px-6 py-4 sm:w-fit">
                        <CardContent className="flex flex-col items-center justify-center gap-y-4">
                            <h1 className="heading">Sign in to Arthveda</h1>
                            {isDemo && <p>Email is "demo" and Password is "demo"</p>}

                            {isPasswordAuthEnabled && (
                                <form className="flex w-full flex-col gap-y-4" onSubmit={handleSubmitForSignIn}>
                                    <WithLabel Label={<Label>Email</Label>}>
                                        <Input
                                            placeholder="Email"
                                            name="email"
                                            disabled={isPending}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </WithLabel>

                                    <WithLabel Label={<Label>Password</Label>}>
                                        <PasswordInput
                                            placeholder="Password"
                                            name="password"
                                            type="password"
                                            disabled={isPending}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </WithLabel>

                                    <Button
                                        className="mt-4 w-full"
                                        variant="primary"
                                        loading={isPending}
                                        disabled={!email || !password}
                                    >
                                        Sign in
                                    </Button>
                                </form>
                            )}

                            {isGoogleOauthEnabled && (
                                <>
                                    {isPasswordAuthEnabled && (
                                        <p className="text-foreground-muted text-center text-xs">OR</p>
                                    )}

                                    <ContinueWithGoogle className="w-full" />
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!isDemo && (
                    <>
                        <div className="h-4" />

                        <p className="text-muted-foreground w-full text-center text-sm text-balance">
                            By signing in, you agree to our{" "}
                            <a href="https://arthveda.app/terms" target="_blank" rel="noopener noreferrer">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="https://arthveda.app/privacy" target="_blank" rel="noopener noreferrer">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </>
                )}
            </div>

            <div className="flex-center py-6 md:py-10">
                <div className="space-y-2 text-center">
                    <p className="text-foreground inline-block text-sm sm:text-base">
                        Built with 🤍️ by{" "}
                        <a
                            href="https://github.com/MudgalLabs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm! sm:text-base!"
                        >
                            Mudgal Labs <IconArrowUpRight size={18} />
                        </a>
                    </p>

                    <p className="text-sm sm:text-base">
                        Give feedback, request a feature, report a bug or <br className="block sm:hidden" />
                        just say hi on{" "}
                        <a href="mailto:hey@arthveda.app" className="text-sm! font-bold sm:text-base!">
                            hey@arthveda.app
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
