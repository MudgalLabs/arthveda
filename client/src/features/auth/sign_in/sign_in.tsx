import { ContinueWithGoogle } from "@/components/continue_with_google";
import { toast } from "@/components/toast";
import { useURLState } from "@/hooks/use_url_state";
import { useEffectOnce } from "@/hooks/use_effect_once";
import { Branding } from "@/components/branding";
import { IconGithub } from "@/components/icons";
import { Card, CardContent } from "@/components/card";

export function SignIn() {
    const [isOAuthError] = useURLState("oauth_error", false);

    useEffectOnce(
        (deps) => {
            if (deps.isOAuthError) {
                toast.error("Something went wrong with Google sign in");
            }
        },
        { isOAuthError },
        (deps) => !!deps.isOAuthError
    );

    return (
        <div className="flex h-dvh w-full flex-col items-center justify-between overflow-auto px-4">
            <div />

            <div className="w-full space-y-10 sm:max-w-[420px]">
                <Branding
                    className="flex justify-center pt-20"
                    size="default"
                />

                <Card className="bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center gap-y-4">
                        <h1 className="sub-heading">
                            Sign in to start using Arthveda
                        </h1>
                        <ContinueWithGoogle />
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <div className="small text-foreground-muted w-full space-y-2">
                    <p className="sub-heading">Arthveda is in Beta !!</p>

                    <p>
                        That means things might occasionally act weird. Very
                        rarely, some data might get lost/reset.
                    </p>

                    <p>
                        You can report issues, give feedback or request features
                        by creating an issue on our{" "}
                        <a
                            href="https://github.com/MudgalLabs/arthveda"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub repository
                        </a>
                        .
                    </p>

                    <p>
                        Thanks for using Arthveda and helping us make it better.
                    </p>
                </div>

                <div className="mb-3 flex w-full flex-row items-center justify-center gap-x-1 text-sm">
                    <p className="text-sm">
                        Dreamed at{" "}
                        <a
                            href="https://github.com/MudgalLabs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Mudgal Labs
                        </a>{" "}
                        in India and is{" "}
                        <a
                            href="https://github.com/MudgalLabs/arthveda"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-x-1"
                        >
                            Open Source
                            <IconGithub />
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
