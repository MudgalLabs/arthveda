import { Toaster, toast } from "sonner";

import { Loading } from "@/components/loading";

const ToastProvider = () => {
    return (
        <Toaster
            theme="dark"
            richColors
            visibleToasts={3}
            expand
            position="top-center"
            icons={{
                loading: <Loading size={16} color="var(--color-foreground)" />,
            }}
            toastOptions={{
                classNames: {
                    info: "bg-surface-3! border-border-subtle! text-text-primary! font-content! text-sm!",
                    loading: "bg-surface-bg! border-surface-border! text-foreground! font-content! text-sm!",
                    error: "bg-error-bg! border-error-border! text-error-foreground! font-content! text-sm!",
                    success: "bg-success-bg! border-success-border! text-success-foreground! font-content! text-sm!",
                },
            }}
        />
    );
};

export { toast, ToastProvider };
