import { describe, expect, it } from "vitest";

import {
  INITIAL_SCENE,
  backLabel,
  closeBand,
  goBack,
  openBand,
  openCommitment,
  openComponent,
  reset,
  selectSupplier,
  switchComponent,
} from "./machine";

describe("scene machine", () => {
  it("starts at the resting world view with nothing selected", () => {
    expect(INITIAL_SCENE).toEqual({
      scene: 1,
      commitmentId: null,
      componentId: null,
      band: null,
      supplierId: null,
    });
  });

  it("never mutates the state it is given", () => {
    const before = { ...INITIAL_SCENE };
    openCommitment(INITIAL_SCENE, "c1");
    expect(INITIAL_SCENE).toEqual(before);
  });

  it("opens a commitment into Scene 2", () => {
    expect(openCommitment(INITIAL_SCENE, "c1")).toEqual({
      scene: 2,
      commitmentId: "c1",
      componentId: null,
      band: null,
      supplierId: null,
    });
  });

  it("clears a stale component when a different commitment is opened", () => {
    const inScene3 = openComponent(openCommitment(INITIAL_SCENE, "c1"), "main-shaft");
    expect(openCommitment(inScene3, "c2").componentId).toBeNull();
  });

  it("refuses to enter Scene 3 with no commitment to explain", () => {
    expect(openComponent(INITIAL_SCENE, "main-shaft")).toEqual(INITIAL_SCENE);
  });

  it("carries the open commitment into Scene 3", () => {
    const state = openComponent(openCommitment(INITIAL_SCENE, "c1"), "main-shaft");
    expect(state).toEqual({
      scene: 3,
      commitmentId: "c1",
      componentId: "main-shaft",
      band: null,
      supplierId: null,
    });
  });

  it("switches components only within Scene 3", () => {
    const scene3 = openComponent(openCommitment(INITIAL_SCENE, "c1"), "main-shaft");
    expect(switchComponent(scene3, "pitch-bearing").componentId).toBe("pitch-bearing");
    expect(switchComponent(scene3, "pitch-bearing").scene).toBe(3);

    const scene2 = openCommitment(INITIAL_SCENE, "c1");
    expect(switchComponent(scene2, "pitch-bearing")).toEqual(scene2);
  });

  it("steps back exactly one rung, keeping the commitment on the way out of Scene 3", () => {
    const scene3 = openComponent(openCommitment(INITIAL_SCENE, "c1"), "main-shaft");
    const scene2 = goBack(scene3);
    expect(scene2).toEqual({ scene: 2, commitmentId: "c1", componentId: null, band: null, supplierId: null });
    expect(goBack(scene2)).toEqual(INITIAL_SCENE);
    expect(goBack(INITIAL_SCENE)).toEqual(INITIAL_SCENE);
  });

  it("resets to the world view from anywhere", () => {
    expect(reset()).toEqual(INITIAL_SCENE);
  });

  it("offers no back affordance at the world view", () => {
    expect(backLabel(INITIAL_SCENE)).toBeNull();
    expect(backLabel(openCommitment(INITIAL_SCENE, "c1"))).toBe("Network");
  });

  describe("band drill-down — the rung between the cards and the pathway", () => {
    const scene2 = openCommitment(INITIAL_SCENE, "c1");

    it("opens a band's component list only inside Scene 2", () => {
      expect(openBand(scene2, "elevated")).toEqual({ ...scene2, band: "elevated" });
      expect(openBand(INITIAL_SCENE, "elevated")).toEqual(INITIAL_SCENE);
      const scene3 = openComponent(scene2, "main-shaft");
      expect(openBand(scene3, "low")).toEqual(scene3);
    });

    it("closes the list without leaving the commitment", () => {
      expect(closeBand(openBand(scene2, "low"))).toEqual(scene2);
    });

    it("keeps the list open across a trip into Scene 3 and back", () => {
      const listed = openBand(scene2, "critical");
      const scene3 = openComponent(listed, "main-shaft");
      expect(scene3.band).toBe("critical");
      expect(goBack(scene3)).toEqual(listed);
    });

    it("steps back out of the list before it steps out of the commitment", () => {
      const listed = openBand(scene2, "elevated");
      expect(goBack(listed)).toEqual(scene2);
      expect(goBack(goBack(listed))).toEqual(INITIAL_SCENE);
    });

    it("forgets the band when a different commitment is opened", () => {
      expect(openCommitment(openBand(scene2, "low"), "c2").band).toBeNull();
    });

    it("names the rung the back affordance returns to", () => {
      expect(backLabel(openBand(scene2, "low"))).toBe("All exposure");
    });
  });

  describe("the selected critical supplier", () => {
    const scene2 = openCommitment(INITIAL_SCENE, "c1");
    const deccan = "sup:deccan-mainshaft-forgings";

    it("starts unselected, which the view reads as the first tile", () => {
      expect(scene2.supplierId).toBeNull();
    });

    it("selects only within Scene 2", () => {
      expect(selectSupplier(scene2, deccan)).toEqual({ ...scene2, supplierId: deccan });
      expect(selectSupplier(INITIAL_SCENE, deccan)).toEqual(INITIAL_SCENE);
      const scene3 = openComponent(scene2, "cmp:main-shaft");
      expect(selectSupplier(scene3, deccan)).toEqual(scene3);
    });

    it("comes back to the same supplier after tracing its pathway", () => {
      const selected = selectSupplier(scene2, deccan);
      const scene3 = openComponent(selected, "cmp:main-shaft");
      expect(scene3.supplierId).toBe(deccan);
      expect(goBack(scene3)).toEqual(selected);
    });

    it("forgets the supplier when a different commitment is opened", () => {
      expect(openCommitment(selectSupplier(scene2, deccan), "c2").supplierId).toBeNull();
    });
  });
});
