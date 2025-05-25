import { Toaster, toast } from "sonner";

import { Loading } from "@/components/loading";

const ToastProvider = () => {
    return (
        <Toaster
            expand
            theme="dark"
            richColors
            visibleToasts={5}
            position="top-center"
            icons={{
                loading: <Loading size="small" color="--color-primary-300" />,
            }}
            toastOptions={{
                classNames: {
                    info: "bg-surface-bg! border-surface-border! text-surface-foreground! font-content! text-sm!",
                    error: "bg-error-bg! border-error-border! text-error-foreground! font-content! text-sm!",
                    success:
                        "bg-success-bg! border-success-border! text-success-foreground! font-content! text-sm!",
                },
            }}
        />
    );
};

export { toast, ToastProvider };
