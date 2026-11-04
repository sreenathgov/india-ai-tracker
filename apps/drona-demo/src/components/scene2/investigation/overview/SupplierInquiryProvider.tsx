"use client";
import * as React from "react";
import { INITIAL_INQUIRY, supplierInquiryReducer, type SupplierInquiryEvent, type SupplierInquiryState } from "@/lib/scene2/investigation/inquiry";
import { projectMaterialGraph, projectMaterialInvestigation } from "@/lib/scene2/investigation/materialCase";
type MaterialContext = { state: SupplierInquiryState; dispatch: React.Dispatch<SupplierInquiryEvent>; inv: ReturnType<typeof projectMaterialInvestigation>; graph: ReturnType<typeof projectMaterialGraph> };
// Isolated read-only surfaces use the same initial projection; the live application owns one session provider.
const INITIAL_CONTEXT: MaterialContext = { state: INITIAL_INQUIRY, dispatch: () => {}, inv: projectMaterialInvestigation(), graph: projectMaterialGraph() };
const Context = React.createContext<MaterialContext>(INITIAL_CONTEXT);
export function SupplierInquiryProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = React.useReducer(supplierInquiryReducer, INITIAL_INQUIRY);
  const value = React.useMemo(() => ({ state, dispatch, inv: projectMaterialInvestigation(state), graph: projectMaterialGraph(state) }), [state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useSupplierInquiry = () => React.useContext(Context);
