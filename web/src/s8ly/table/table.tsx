import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
    return (
        <div className="border-border-subtle relative w-full overflow-hidden overflow-x-auto rounded-md border-1">
            <table className={cn("w-full caption-bottom bg-transparent text-sm", className)} {...props} />
            {/* <table className={cn("bg-surface-bg w-full caption-bottom text-sm", className)} {...props} /> */}
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
    return (
        <thead
            className={cn("[&_tr]:border-b-border-subtle [&_tr]:border-b-1 [&_tr]:bg-transparent!", className)}
            {...props}
        />
    );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
    return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
    return (
        <tfoot
            className={cn(
                "border-t-border-subtle border-t-1 bg-transparent font-medium [&>tr]:last:border-b-0",
                className
            )}
            {...props}
        />
    );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
    return (
        <tr
            className={cn(
                "hover:bg-hover-subtle data-[state=selected]:bg-hover-subtle border-b-border-subtle/50 border-b-1 transition-colors",
                className
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
    return (
        <th
            className={cn(
                "text-foreground-muted h-10 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
    return (
        <td
            className={cn(
                "px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
                className
            )}
            {...props}
        />
    );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
    return <caption className={cn("text-foreground-muted mb-4 caption-top text-sm", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
