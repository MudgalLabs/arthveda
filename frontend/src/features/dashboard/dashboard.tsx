import { useAuthentication } from "@/context/authentication-context";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { apiHooks } from "@/hooks/api-hooks";
import { toast } from "@/components/toast";
import { Button } from "@/s8ly";

export const Dashboard = () => {
    const { userEmail } = useAuthentication();

    const client = useQueryClient();
    const navigate = useNavigate();

    const { mutate: signout, isPending } = apiHooks.auth.useSignout({
        onSuccess: async () => {
            // NOTE: Make sure to await otherwise the screen will flicker.
            await client.invalidateQueries();
            navigate("/");
            toast("Good bye 👋. We will miss you.", {
                autoClose: 2000,
                hideProgressBar: true,
            });
        },
    });

    return (
        <>
            <h1>Dashboard</h1>
            <p className="mb-10">You are logged in with email: {userEmail}</p>
            <Button onClick={() => signout()} loading={isPending}>
                Signout
            </Button>
        </>
    );
};

export default Dashboard;
