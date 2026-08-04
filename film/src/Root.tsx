/**
 * Compositions. Phase B registers the Master film and the component review
 * stills; Hero30 / Social9x16 land in Phase C (Bible §6, §7). The Phase 1
 * proof-of-motion composition is kept for rig regression checks.
 */

import { Composition, Still } from "remotion";
import { ProofOfMotion } from "./proof/ProofOfMotion";
import { Film } from "./Film";
import { BEAT } from "./world/layout";
import { IntakeStill } from "./stills/intake";
import { ReconciliationStill } from "./stills/reconciliation";
import { SupplierStill } from "./stills/supplier";
import { ResolveStill } from "./stills/resolve";

const FRAME = { width: 1920, height: 1080 } as const;

export const Root = () => (
  <>
    <Composition
      id="Master16x9"
      component={Film}
      durationInFrames={BEAT.total}
      fps={60}
      {...FRAME}
    />
    <Composition
      id="ProofOfMotion"
      component={ProofOfMotion}
      durationInFrames={360}
      fps={60}
      {...FRAME}
    />
    <Still id="IntakeStill" component={IntakeStill} {...FRAME} />
    <Still id="ReconciliationStill" component={ReconciliationStill} {...FRAME} />
    <Still id="SupplierStill" component={SupplierStill} {...FRAME} />
    <Still id="ResolveStill" component={ResolveStill} {...FRAME} />
  </>
);
