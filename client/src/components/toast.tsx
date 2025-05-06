import { Toaster, toast } from "sonner";

import { Loading } from "@/components/loading";

const ToastProvider = () => {
    return (
        <Toaster
            theme="dark"
            richColors
            visibleToasts={5}
            position="top-center"
            icons={{
                loading: <Loading size="small" color="--color-primary-300" />,
            }}
            toastOptions={{
                classNames: {
                    info: "bg-accent-muted! border-primary/30! text-foreground! font-content! text-sm!",
                },
            }}
        />
    );
};

export { toast, ToastProvider };
