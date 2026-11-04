"use client";
import * as React from "react";
import type { DependencyGraph, GraphNode } from "@/lib/scene2/supplychain/types";
import { CONCERN_SURFACE, EVIDENCE_BORDER_STYLE } from "@/lib/scene2/supplychain/marks";
import { EVIDENCE_LABEL, NODE_TYPE_LABEL, TIER_LABEL } from "@/lib/scene2/supplychain/labels";
import styles from "./MaterialCriticalPath.module.css";

/** The same canonical objects in four readable groups. No supplier or source is cloned.
 * The small card beneath each party retains its material/component/route object.
 * Relevant network and All mapped retain the general pan/zoom graph. */
const GROUPS = [
  { main: "sc:dc-order", object: "sc:dc-component", relation: "Requires" },
  { main: "sc:dc-deccan", object: "sc:dc-billet", relation: "Needs usable material" },
  { main: "sc:dc-jalna", object: "sc:dc-alternate", relation: "Possible domestic cover" },
  { main: "sc:dc-varna", object: "sc:dc-route", relation: "Booked shipment" },
] as const;
export function MaterialCriticalPath({ graph, selectedId, onSelect }: { readonly graph: DependencyGraph; readonly selectedId: string | null; readonly onSelect: (id: string | null) => void }): React.ReactElement {
  return <div className={styles.canvas} data-graph-canvas data-material-critical-path>
    <div className={styles.reading}><span>Order commitment</span><span>Direct supplier · Tier 1</span><span>Dealer · Tier 2</span><span>Producer · Tier 3</span></div>
    <div className={styles.groups}>
      {GROUPS.map((group, index) => {
        const main = graph.nodes.find(n => n.id === group.main), object = graph.nodes.find(n => n.id === group.object);
        if (!main || !object) return null;
        return <section key={group.main} className={styles.group} aria-label={main.name}>
          <div className={styles.main}><PathObject node={main} selected={selectedId === main.id} onSelect={onSelect} />{index < GROUPS.length - 1 ? <span className={styles.arrow} aria-hidden="true">→</span> : null}</div>
          <div className={styles.branch}><span aria-hidden="true" className={styles.stem} /><p>{group.relation}</p><PathObject node={object} selected={selectedId === object.id} onSelect={onSelect} small /></div>
        </section>;
      })}
    </div>
    <p className={styles.note}>Read from the order towards its upstream dependencies. Select an object for its dates, evidence and reasoning.</p>
  </div>;
}
function PathObject({ node, selected, onSelect, small = false }: { readonly node: GraphNode; readonly selected: boolean; readonly onSelect: (id: string | null) => void; readonly small?: boolean }): React.ReactElement {
  const surface = CONCERN_SURFACE[node.concern];
  return <button type="button" data-graph-node={node.id} data-concern={node.concern} data-evidence={node.evidence} aria-pressed={selected} onClick={() => onSelect(selected ? null : node.id)}
    className={`${styles.object} ${small ? styles.small : ""}`} style={{ background: surface.wash ?? "var(--bg-card)", borderColor: surface.edge ?? "var(--border-card)", borderStyle: EVIDENCE_BORDER_STYLE[node.evidence] }}>
    <span className={styles.kind}>{node.type === "supplier" && node.tier ? TIER_LABEL[node.tier] : NODE_TYPE_LABEL[node.type]}</span>
    <strong>{node.name}</strong><span className={styles.detail}>{node.detail}</span>
    <span className={styles.evidence}>{EVIDENCE_LABEL[node.evidence]} relationship</span>
  </button>;
}
