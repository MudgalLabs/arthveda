import { toast } from "@/components/toast";
import { Button } from "@/s8ly";

export const Dashboard = () => {
    const handleClick = () => {
        toast("Hello");
        toast.info("Info");
        toast.success("Success");
        toast.error("Error");
    };

    return (
        <>
            <h1>Dashboard</h1>
            <Button onClick={handleClick}>Toast</Button>
        </>
    );
};

export default Dashboard;
