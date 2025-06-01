import React, { lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading_screen";

const SignUp = lazy(() => import("@/features/auth/sign_up/sign_up"));

const SignUpLazy: React.FC = () => (
    <Suspense fallback={<LoadingScreen />}>
        <SignUp />
    </Suspense>
);

export default SignUpLazy;
