/**
 * Compositions. Phase 1 registers only the throwaway proof-of-motion
 * composition; Master16x9 / Hero30 / Social9x16 land in later phases
 * (Bible §6, §7).
 */

import { Composition } from "remotion";
import { ProofOfMotion } from "./proof/ProofOfMotion";

export const Root = () => (
  <Composition
    id="ProofOfMotion"
    component={ProofOfMotion}
    durationInFrames={360}
    fps={60}
    width={1920}
    height={1080}
  />
);
