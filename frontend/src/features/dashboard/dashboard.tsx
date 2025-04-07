import { useAuthentication } from "@/context/authentication-context";
import { useQueryClient } from "@tanstack/react-query";

import { apiHooks } from "@/hooks/apiHooks";
import { Button } from "@/s8ly";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
    const { userEmail } = useAuthentication();

    const client = useQueryClient();
    const navigate = useNavigate();

    const { mutate: signout, isPending } = apiHooks.auth.useSignout({
        onSuccess: () => {
            client.invalidateQueries();
            navigate("/");
        },
    });

    return (
        <>
            <h1>Dashboard</h1>
            <p className="mb-10">You are logged in with email: {userEmail}</p>
            <Button
                variant="secondary"
                onClick={() => signout(undefined)}
                loading={isPending}
            >
                Signout
            </Button>
        </>
    );
};

export default Dashboard;
