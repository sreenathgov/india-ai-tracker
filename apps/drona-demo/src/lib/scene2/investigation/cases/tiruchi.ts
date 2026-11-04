import { regulatoryInvestigation } from "@/lib/regulatory/investigation";
import { INITIAL_REGULATORY_STATE } from "@/lib/regulatory/state";

/** Public-first case. Private facts appear only after explicit record receipts. */
export const TIRUCHI = regulatoryInvestigation(INITIAL_REGULATORY_STATE);
