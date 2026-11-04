import { describe, expect, it } from "vitest";

import { chainPositions } from "./chainModel";
import { CHROME_INSETS, boundsOf, frameBounds } from "./framing";
import { toWorldPixels, type LonLat } from "./mercator";
import { hasBom } from "@/lib/network/bom";
import { dependencyChain, tracedComponents } from "@/lib/network/dependencies";
import {
  COMMITMENTS,
  DESTINATIONS,
  PLANT,
  SUPPLIERS,
  suppliersForCommitment,
} from "@/lib/network/gazetteer";

/* The size the map is left with beside the scene panels at a 1100px window — the
   tightest the demo runs at. Short and wide, which is what makes the chrome bite. */
const WIDTH = 1036;
const HEIGHT = 463;

const at = (c: { readonly lon: number; readonly lat: number }): LonLat => [c.lon, c.lat];

/** Where each position lands on screen once the scene's framing is applied. */
function onScreen(positions: readonly LonLat[]): readonly (readonly [number, number])[] {
  const { longitude, latitude, zoom } = frameBounds(
    boundsOf(positions)!,
    WIDTH,
    HEIGHT,
    CHROME_INSETS
  );
  const centre = toWorldPixels([longitude, latitude], zoom);
  return positions.map((p) => {
    const [x, y] = toWorldPixels(p, zoom);
    return [x - centre[0] + WIDTH / 2, y - centre[1] + HEIGHT / 2] as const;
  });
}

function expectClearOfChrome(positions: readonly LonLat[]): void {
  for (const [x, y] of onScreen(positions)) {
    expect(x).toBeGreaterThanOrEqual(CHROME_INSETS.left - 1e-6);
    expect(x).toBeLessThanOrEqual(WIDTH - CHROME_INSETS.right + 1e-6);
    expect(y).toBeGreaterThanOrEqual(CHROME_INSETS.top - 1e-6);
    expect(y).toBeLessThanOrEqual(HEIGHT - CHROME_INSETS.bottom + 1e-6);
  }
}

describe("scene framing keeps every mark clear of the map's chrome", () => {
  it("Scene 1 — the whole network", () => {
    expectClearOfChrome([
      at(PLANT.coordinate),
      ...SUPPLIERS.map((s) => at(s.coordinate)),
      ...DESTINATIONS.map((d) => at(d.coordinate)),
    ]);
  });

  it.each(COMMITMENTS.map((c) => [c.id]))("Scene 2 — commitment %s", (id) => {
    expectClearOfChrome([
      at(PLANT.coordinate),
      ...suppliersForCommitment(id).map((s) => at(s.coordinate)),
      ...DESTINATIONS.filter((d) => d.commitmentId === id).map((d) => at(d.coordinate)),
    ]);
  });

  /* Scene 3 opens only from an order Drona has a bill of materials for. */
  const chains = COMMITMENTS.filter((c) => hasBom(c.id)).flatMap((c) =>
    tracedComponents(c.id).map((component) => [component.id] as const)
  );

  it("has at least one Scene 3 chain to check", () => {
    expect(chains.length).toBeGreaterThan(0);
  });

  it.each(chains)("Scene 3 — the upstream chain behind %s", (componentId) => {
    const chain = dependencyChain(componentId);
    expect(chain).toBeDefined();
    expectClearOfChrome(chainPositions(chain!));
  });
});
