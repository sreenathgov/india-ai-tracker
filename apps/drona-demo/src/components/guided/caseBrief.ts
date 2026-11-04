import { DEMO_NOW } from "@/lib/demo/clock";
import { bomCommitment, bomFor } from "@/lib/network/bom";
import { destinationById, PLANT, supplierById } from "@/lib/network/gazetteer";
import { productionWindow } from "@/lib/network/programme";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { TOUR_ORDER, TOUR_SUPPLIER } from "./model";

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

/** Read-only cover projection. It cannot change the case or its assessment. */
export function coverCaseBrief() {
  const order = bomCommitment(TOUR_ORDER);
  const destination = destinationById(order.destinationId);
  const supplier = supplierById(MATERIAL_CASE.supplierId);
  const bom = bomFor(order.id);
  const component = bom.find(row => row.id === "cmp:main-shaft-forging");
  if (!destination || !supplier || !component || component.supplierId !== supplier.id || MATERIAL_CASE.orderId !== order.id) {
    throw new Error("The guided case brief must resolve to its actual order, supplier and component.");
  }
  return {
    company: order.buyer,
    units: order.units,
    route: `${PLANT.country} → ${destination.country}`,
    requiredBy: date.format(new Date(`${order.requiredBy}T00:00:00Z`)),
    // This is a component procurement duration, not a complete order timeline.
    longestComponentLeadDays: productionWindow(order, bom).longestLeadDays,
    supplier: supplier.name,
    componentId: component.id,
    componentLabel: "Main-shaft forging lot",
    reference: order.reference,
    scenarioDate: date.format(DEMO_NOW),
  } as const;
}
