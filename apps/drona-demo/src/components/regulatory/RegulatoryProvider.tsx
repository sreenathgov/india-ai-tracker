"use client";
import * as React from "react";
import { INITIAL_REGULATORY_STATE, regulatoryReducer, type RegulatoryEvent, type RegulatoryState } from "@/lib/regulatory/state";
import { regulatoryInvestigation } from "@/lib/regulatory/investigation";
import { regulatoryGraph } from "@/lib/regulatory/graph";

const project = (state: RegulatoryState, dispatch: React.Dispatch<RegulatoryEvent>) => ({ state, dispatch, inv: regulatoryInvestigation(state), graph: regulatoryGraph(state) });
const RegulatoryContext = React.createContext(project(INITIAL_REGULATORY_STATE, () => {}));
/** One session record and projection, shared across scenes; Restart explicitly resets it. */
export function RegulatoryProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = React.useReducer(regulatoryReducer, INITIAL_REGULATORY_STATE);
  const value = React.useMemo(() => project(state, dispatch), [state]);
  return <RegulatoryContext.Provider value={value}>{children}</RegulatoryContext.Provider>;
}
export const useRegulatoryCase = () => React.useContext(RegulatoryContext);
