import { ROUTES } from "@/constants";
import { Button } from "netra";
import { useNavigate } from "react-router-dom";

export function OnboardingWelcome() {
    const navigate = useNavigate();

    return (
        <div className="flex-center mt-12">
            <div className="flex-y text-center">
                <h1 className="big-heading">Welcome to Arthveda</h1>

                <h2 className="sub-heading">We want you to become and stay consistently profitable.</h2>

                <div className="h-8" />

                <Button onClick={() => navigate(`${ROUTES.onboarding}/broker`)}>Continue</Button>
            </div>
        </div>
    );
}
