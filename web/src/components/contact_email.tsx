import { cn } from "netra";

interface ContactEmailProps {
    className?: string;
}

export function ContactEmail({ className }: ContactEmailProps) {
    return (
        <a className={cn("text-xs!", className)} href="mailto:hey@arthveda.app">
            hey@arthveda.app
        </a>
    );
}
