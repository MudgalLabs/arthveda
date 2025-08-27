import { Bodhveda } from "@/bodhveda/core/bodhveda";
import { BodhvedaContext } from "@/bodhveda/react/context";

export interface BodhvedaProviderProps {
    children: React.ReactNode;
    bodhveda: Bodhveda;
    recipientID: string;
}

export function BodhvedaProvider({ children, bodhveda, recipientID }: BodhvedaProviderProps) {
    return <BodhvedaContext.Provider value={{ bodhveda, recipientID }}>{children}</BodhvedaContext.Provider>;
}
