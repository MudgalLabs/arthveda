import { useAuthentication } from "@/context/authentication-context";

export const Dashboard = () => {
    const { userEmail } = useAuthentication();

    return (
        <>
            <h1>Dashboard</h1>
            <p>You are logged in with email: {userEmail}</p>
        </>
    );
};

export default Dashboard;
