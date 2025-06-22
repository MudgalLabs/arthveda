import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePostHog } from "posthog-js/react";

export function PageViewTracker() {
    const posthog = usePostHog();
    const location = useLocation();

    useEffect(() => {
        posthog?.capture("$pageview");
    }, [location]);

    return null;
}
