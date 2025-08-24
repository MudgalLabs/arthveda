import { useEffect, useRef } from "react";

type UseDocumentTitleOptions = {
    /** Whether to keep the title after unmounting the component (default is `true`). */
    preserveTitleOnUnmount?: boolean;
};

export function useDocumentTitle(title: string, options: UseDocumentTitleOptions = {}) {
    const { preserveTitleOnUnmount = true } = options;
    const defaultTitle = useRef<string | null>(null);

    useEffect(() => {
        defaultTitle.current = window.document.title;
    }, []);

    useEffect(() => {
        window.document.title = title;
    }, [title]);

    useEffect(() => {
        return () => {
            if (!preserveTitleOnUnmount && defaultTitle.current) {
                window.document.title = defaultTitle.current;
            }
        };
    }, [preserveTitleOnUnmount]);
}
