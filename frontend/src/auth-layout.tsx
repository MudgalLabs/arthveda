import { FC, PropsWithChildren } from "react";
import { Branding } from "./components/branding";
import { IconGithub } from "./components/icons";

export const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="flex h-screen flex-col items-center justify-between">
            <div />
            <div className="flex w-[85%] items-center justify-center md:justify-between lg:w-[70%] xl:w-[55%]">
                <main className="flex flex-col items-start justify-center">
                    <Branding className="mb-24 h-[48px] md:hidden" />

                    {/* Here is where we will render sign-in, sign-up, forgot-password forms. */}
                    {/* Maybe even reset-password too? */}
                    {children}
                </main>

                <Branding className="hidden h-[48px] md:inline-block" />
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
                    >
                        Open Source
                    </a>
                </p>
                <IconGithub />
            </div>
        </div>
    );
};
