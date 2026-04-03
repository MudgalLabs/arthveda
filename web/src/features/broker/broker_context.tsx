import { createContext, FC, PropsWithChildren, useCallback, useContext, useMemo } from "react";

import { BrokerName, Broker } from "@/lib/api/broker";
import { apiHooks } from "@/hooks/api_hooks";
import { useTheme } from "@/features/settings/theme/theme_context";

import AngelOneLogo from "@/assets/brokers/angel_one.svg";
import Fyers from "@/assets/brokers/fyers.svg";
import GrowwLogo from "@/assets/brokers/groww.svg";
import INDmoney from "@/assets/brokers/indmoney.svg";
import KotakSecuritiesLogo from "@/assets/brokers/kotak_securities.svg";
import UpstoxLogoLight from "@/assets/brokers/upstox_light_theme.svg";
import UpstoxLogoDark from "@/assets/brokers/upstox_dark_theme.svg";
import ZerodhaLogo from "@/assets/brokers/zerodha.svg";
import OtherLogo from "@/assets/brokers/other.svg";

interface BrokerContextType {
    isLoading: boolean;
    getBrokerById: (brokerId: string) => Broker | null;
    getBrokerNameById: (brokerId: string) => BrokerName | "";
    getBrokerLogoByName: (brokerName: BrokerName) => string;
    getBrokerLogoById: (brokerId: string) => string;
}

const BrokerContext = createContext<BrokerContextType>({} as BrokerContextType);

export const BrokerProvider: FC<PropsWithChildren> = ({ children }) => {
    const { isDarkTheme } = useTheme();
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

    const getBrokerLogoByName = useCallback(
        (name: BrokerName) => {
            switch (name) {
                case "Angel One":
                    return AngelOneLogo;
                case "Fyers":
                    return Fyers;
                case "Groww":
                    return GrowwLogo;
                case "INDmoney":
                    return INDmoney;
                case "Kotak Securities":
                    return KotakSecuritiesLogo;
                case "Upstox":
                    return isDarkTheme ? UpstoxLogoDark : UpstoxLogoLight;
                case "Zerodha":
                    return ZerodhaLogo;
                case "Other":
                    return OtherLogo;
                default:
                    return "";
            }
        },
        [isDarkTheme]
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
    }, [isLoading, getBrokerById, getBrokerNameById, getBrokerLogoById, getBrokerLogoByName]);

    return <BrokerContext.Provider value={value}>{children}</BrokerContext.Provider>;
};

export function useBroker(): BrokerContextType {
    const context = useContext(BrokerContext);

    if (!context) {
        throw new Error("useBrokerContext must be used within a BrokerProvider");
    }

    return context;
}
