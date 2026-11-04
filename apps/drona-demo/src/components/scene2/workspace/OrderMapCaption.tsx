import * as React from "react";

/**
 * The order map's own labels, laid over the map where Scene 1 puts its card header.
 * The title says what the map is: the order's planned network from the demo
 * snapshot. The note, set beside the key, says what the marker colour is not:
 * the markers still carry each supplier's network-wide concern, which is not this
 * order's assessment.
 */
export function OrderMapCaption(): React.ReactElement {
  return (
    <>
      <div className="pointer-events-none absolute left-4 top-4 z-20">
        <h2 className="text-body-s font-medium text-label-primary">Order network</h2>
        <p className="text-caption text-label-tertiary">Plant · Tier-1 · destination · demo snapshot</p>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-[92px] z-10 whitespace-nowrap rounded-chip border border-separator bg-[color:var(--bg-map-popover)] px-2.5 py-1 text-caption text-label-tertiary backdrop-blur-sm">
        <span aria-hidden="true">Colour: network concern, not this order</span>
        <span className="sr-only">
          Marker colour is each supplier&rsquo;s network-wide concern, not this order&rsquo;s assessment
        </span>
      </p>
    </>
  );
}
