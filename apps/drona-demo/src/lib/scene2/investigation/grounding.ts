/** External-demo provenance. The original authoring references remain in the source repository. */
export interface GroundingSource { readonly id: string; readonly title: string; readonly path?: string; readonly located: boolean; }
export const GROUNDING_SOURCES: Readonly<Record<string, GroundingSource>> = {
  DEMO: { id: "DEMO", title: "Fictional case authoring for this demonstration", located: true },
};
export const unlocatedSources = (): readonly GroundingSource[] => Object.values(GROUNDING_SOURCES).filter(source => !source.located);
