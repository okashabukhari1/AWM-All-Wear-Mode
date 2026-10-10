import { createContext, useContext } from "react";
export const WebsiteReadiness = createContext(true);
export const useWebsiteReady = () => useContext(WebsiteReadiness);
