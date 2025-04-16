import { FC, PropsWithChildren } from "react";
import { FaGithub } from "react-icons/fa";

export const PublicRouteLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="flex h-screen flex-col items-center justify-between">
            <div />
            {children}
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
                <FaGithub />
            </div>
        </div>
    );
};
