/**
 * The demo is one route holding three scenes, not three routes.
 *
 * That is a deliberate constraint rather than a shortcut. The whole argument the
 * demo makes is that resolution *increases* — world → order → component → cause —
 * on a surface that never resets. Separate routes would unmount and remount the
 * map at every step, and the continuity is the thing being sold. So the map mounts
 * once and re-frames; only the zones beneath it swap, and this file is the record
 * of where we are.
 *
 * Every transition returns a new state. Nothing here mutates.
 */
import type { Concern } from "@/lib/network/types";

export type SceneId = 1 | 2 | 3;

export interface SceneState {
  readonly scene: SceneId;
  /** Set from Scene 2 onward: the production commitment being opened. */
  readonly commitmentId: string | null;
  /** Set in Scene 3: the critical component whose causal pathway is on screen. */
  readonly componentId: string | null;
  /**
   * Scene 2's drill-down: which band's assemblies are listed in place of the cards.
   * A rung, not a scene — the map does not re-frame for it, because nothing about
   * the order's geography changes when you read its bill of materials by band.
   * Carried into Scene 3 so that stepping back returns to the list it came from.
   */
  readonly band: Concern | null;
  /**
   * Scene 2's selected critical Tier-1, whose sub-tier network is on the map and
   * whose risk view is open. `null` means "the first tile", which the view resolves
   * — the machine does not know the order's suppliers and should not guess them.
   * Carried into Scene 3 so that stepping back returns to the same supplier.
   */
  readonly supplierId: string | null;
}

export const INITIAL_SCENE: SceneState = {
  scene: 1,
  commitmentId: null,
  componentId: null,
  band: null,
  supplierId: null,
};

/**
 * Scene 1 → 2. Opening a commitment clears any component selection: a component
 * belongs to a commitment, so carrying one across would leave the two disagreeing.
 */
export function openCommitment(
  state: SceneState,
  commitmentId: string
): SceneState {
  return { scene: 2, commitmentId, componentId: null, band: null, supplierId: null };
}

/** Scene 2: read one band's assemblies in place of the three cards. */
export function openBand(state: SceneState, band: Concern): SceneState {
  if (state.scene !== 2) return state;
  return { ...state, band };
}

/** Scene 2: back from a band's list to the three cards. */
export function closeBand(state: SceneState): SceneState {
  if (state.scene !== 2) return state;
  return { ...state, band: null };
}

/** Scene 2: bring one critical Tier-1 and its sub-tier network into view. */
export function selectSupplier(state: SceneState, supplierId: string): SceneState {
  if (state.scene !== 2) return state;
  return { ...state, supplierId };
}

/**
 * Scene 2 → 3. Requires a commitment to already be open; entering the causal
 * pathway without one would put Scene 3 on screen with nothing to explain, and a
 * surface that claims to explain everything must not be able to reach that state.
 */
export function openComponent(
  state: SceneState,
  componentId: string
): SceneState {
  if (!state.commitmentId) return state;
  return { ...state, scene: 3, componentId };
}

/** Scene 3's quiet switcher. Stays in Scene 3; swaps which problem is on screen. */
export function switchComponent(
  state: SceneState,
  componentId: string
): SceneState {
  if (state.scene !== 3) return state;
  return { ...state, componentId };
}

/**
 * One step back up the resolution ladder, so the narrative can be replayed on stage
 * without a reload.
 */
export function goBack(state: SceneState): SceneState {
  if (state.scene === 3) {
    return { ...state, scene: 2, componentId: null };
  }
  if (state.scene === 2 && state.band) return closeBand(state);
  if (state.scene === 2) return INITIAL_SCENE;
  return state;
}

/** Back to the resting world view. */
export function reset(): SceneState {
  return INITIAL_SCENE;
}

/** What the back affordance should say, or null when there is nowhere to go. */
export function backLabel(state: SceneState): string | null {
  if (state.scene === 3) return "Production commitment";
  if (state.scene === 2 && state.band) return "All exposure";
  if (state.scene === 2) return "Network";
  return null;
}
