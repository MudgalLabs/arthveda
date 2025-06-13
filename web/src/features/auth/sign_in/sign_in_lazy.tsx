import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const SignIn = lazy(() => import("@/features/auth/sign_in/sign_in"));

const SignInLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <SignIn />
    </Suspense>
);

export default SignInLazy;
