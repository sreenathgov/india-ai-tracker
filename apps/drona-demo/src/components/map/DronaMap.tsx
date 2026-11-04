"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/ui/cn";
import type { DeckMapProps } from "./DeckMap";

/* The ground the map will be drawn on, shown while the WebGL chunk loads — so the
   page does not flash a hole where the map is about to be. */
function MapSkeleton(): React.ReactElement {
  return <div aria-hidden="true" className="absolute inset-0 bg-[color:var(--bg-map)]" />;
}

/* deck.gl reaches for WebGL at construction, which does not exist on the server.
   Loading it client-only keeps it out of the server render and out of the first
   page chunk; nothing on the map is content a crawler needs. */
const DeckMap = dynamic(() => import("./DeckMap"), {
  ssr: false,
  loading: MapSkeleton,
});

/**
 * The public map. Same contract page.tsx has always used; the drawing underneath is
 * deck.gl, loaded on the client.
 */
export function DronaMap({
  className,
  overlay = null,
  ...props
}: DeckMapProps & {
  readonly className?: string;
  /** HTML laid over the map's top-left — Scene 1's card title and scope. */
  readonly overlay?: React.ReactNode;
}): React.ReactElement {
  const [unavailable, setUnavailable] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      setUnavailable(!context);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { setUnavailable(true); }
    setReady(true);
  }, []);
  const fallback = <div className="absolute inset-0 flex flex-col justify-center gap-3 px-7 pb-8 pt-16" data-map-fallback="">
    <p className="micro-label text-label-tertiary">Production geography</p>
    <p className="font-display text-display-s text-label-primary">India → Denmark</p>
    <p className="max-w-measure text-body-s text-label-secondary">The map is unavailable on this device. The order, supplier evidence and guided investigation remain available.</p>
  </div>;
  return (
    <section
      aria-label="Production network map"
      data-surface="map"
      className={cn("relative overflow-hidden bg-[color:var(--bg-map)]", className)}
    >
      {ready ? unavailable ? fallback : <MapBoundary fallback={fallback}><DeckMap {...props} onUnavailable={() => setUnavailable(true)} /></MapBoundary> : <MapSkeleton />}
      {overlay}
    </section>
  );
}

class MapBoundary extends React.Component<{ readonly children: React.ReactNode; readonly fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
