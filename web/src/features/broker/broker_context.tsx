import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";

import { BrokerName, Broker } from "@/lib/api/broker";
import { apiHooks } from "@/hooks/api_hooks";

// Broker logos
import ZerodhaLogo from "@/assets/brokers/zerodha.svg";
import GrowwLogo from "@/assets/brokers/groww.svg";
import UpstoxLogo from "@/assets/brokers/upstox.svg";

const getBrokerLogoByName = (name: BrokerName) => {
    switch (name) {
        case "Groww":
            return GrowwLogo;
        case "Upstox":
            return UpstoxLogo;
        case "Zerodha":
            return ZerodhaLogo;
        default:
            return "";
    }
};

interface BrokerContextType {
    isLoading: boolean;
    getBrokerById: (brokerId: string) => Broker | null;
    getBrokerNameById: (brokerId: string) => BrokerName | "";
    getBrokerLogoByName: (brokerName: BrokerName) => string;
    getBrokerLogoById: (brokerId: string) => string;
}

const BrokerContext = createContext<BrokerContextType>({} as BrokerContextType);

export const BrokerProvider: FC<PropsWithChildren> = ({ children }) => {
    const { data, isLoading } = apiHooks.broker.useList();

    const brokers = useMemo(() => data?.data || [], [data]);

    const getBrokerById = useCallback(
        (brokerId: string): Broker | null => {
            const broker = brokers.find((b) => b.id === brokerId);
            return broker ? broker : null;
        },
        [brokers]
    );

    const getBrokerNameById = useCallback(
        (brokerId: string): BrokerName | "" => {
            const broker = brokers.find((b) => b.id === brokerId);
            return broker ? (broker.name as BrokerName) : "";
        },
        [brokers]
    );

    const getBrokerLogoById = useCallback(
        (brokerId: string): string => {
            const brokerName = getBrokerNameById(brokerId);
            return getBrokerLogoByName(brokerName as BrokerName);
        },
        [getBrokerNameById]
    );

    const value: BrokerContextType = useMemo(() => {
        return {
            isLoading,
            getBrokerById,
            getBrokerNameById,
            getBrokerLogoById,
            getBrokerLogoByName,
        };
    }, [isLoading, getBrokerNameById, getBrokerLogoById]);

    return <BrokerContext.Provider value={value}>{children}</BrokerContext.Provider>;
};

export function useBroker(): BrokerContextType {
    const context = useContext(BrokerContext);

    if (!context) {
        throw new Error("useBrokerContext must be used within a BrokerProvider");
    }

    return context;
}
