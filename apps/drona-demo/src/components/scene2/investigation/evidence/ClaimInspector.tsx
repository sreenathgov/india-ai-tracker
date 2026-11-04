import * as React from "react";

import { Icon } from "@/components/ui/Icon";
import { explainClaim, forecastQualifier, type SupplierInvestigation } from "@/lib/scene2/investigation";
import { actionNodeId, claimNodeId, dependencyNodeId } from "@/lib/scene2/investigation/reasoning";
import { CLAIM_TYPE_LABEL, CONFIDENCE_LABEL, SOURCE_TYPE_LABEL } from "../labels";

/**
 * The full audit trail behind one claim, read straight off `explainClaim` so
 * nothing here can disagree with what the register or the overview already say.
 *
 * Eight fixed sections, always in the same order, so a reviewer learns the shape
 * once and can then scan: what the claim says, how firmly Drona holds it, why,
 * what argues against it, what would change it, why it matters to the finding,
 * and when it holds. A claim never overclaims past what `explainClaim` resolves —
 * an empty section says so rather than being skipped, since a skipped section
 * reads as "not asked" and an honest empty one reads as "asked, and empty."
 */
export function ClaimInspector({
  inv,
  claimId,
  onSelectNode,
  onSelectEvidence,
  onShowInSupplyChain,
  onClose,
}: {
  readonly inv: SupplierInvestigation;
  readonly claimId: string;
  readonly onSelectNode: (nodeId: string) => void;
  readonly onSelectEvidence: (evidenceId: string) => void;
  readonly onShowInSupplyChain?: (claimId: string) => void;
  readonly onClose: () => void;
}): React.ReactElement | null {
  const trail = explainClaim(inv, claimId);
  if (!trail) return null;

  const { claim } = trail;
  const qualifier = forecastQualifier(claim);
  const crossRefs = trail.dependencies.length > 0 || trail.actions.length > 0;

  return (
    <aside
      data-claim-inspector={claim.id}
      className="flex h-full w-[336px] shrink-0 flex-col overflow-y-auto rounded-card border border-card-edge bg-card"
    >
      <header className="relative border-b border-separator px-4 pb-3.5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <p className="micro-label pt-1 text-label-quaternary">{CLAIM_TYPE_LABEL[claim.claimType]}</p>
          <button
            type="button"
            aria-label="Close the claim inspector"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-pill p-1 text-label-quaternary transition-colors hover:bg-hover hover:text-label-secondary"
          >
            <Icon name="close" />
          </button>
        </div>
        <h3 className="mt-1.5 text-title-m leading-tight text-label-primary">{claim.claim}</h3>
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        <Section label="Status">
          <p className="text-body-s font-medium leading-[1.5] text-label-primary">
            {CONFIDENCE_LABEL[claim.confidence]} confidence
          </p>
          {qualifier ? (
            <p className="mt-1 text-caption leading-[1.5] text-label-secondary">
              {qualifier.magnitude ? `${qualifier.magnitude}, ` : ""}
              {qualifier.horizon}
            </p>
          ) : null}
        </Section>

        <Section label="Why Drona holds this">
          {trail.evidence.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {trail.evidence.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvidence(item.id)}
                    className="w-full rounded-chip px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-hover"
                  >
                    <p className="text-body-s leading-[1.4] text-label-primary">{item.sourceName}</p>
                    <p className="mt-0.5 text-caption text-label-tertiary">
                      {SOURCE_TYPE_LABEL[item.sourceType]} · {item.sourceDateKind === "reviewed" ? "reviewed " : ""}{item.sourceDate} · {item.synthetic ? "Authored demo record" : "Real public authority"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No held evidence is cited for this claim." />
          )}
        </Section>

        {claim.supportingClaimIds?.length ? <Section label="Reasoning inputs"><ul className="space-y-2">{claim.supportingClaimIds.map(id => { const input = inv.claims.find(c => c.id === id); return input ? <li key={id}><button type="button" className="text-left text-[13px] leading-relaxed text-label-secondary underline underline-offset-4" onClick={() => onSelectNode(claimNodeId(id))}>{input.title ?? input.claim}</button></li> : null; })}</ul></Section> : null}
        {claim.contextClaimIds?.length ? <Section label="Context, not proof"><ul className="space-y-2">{claim.contextClaimIds.map(id => { const context = inv.claims.find(c => c.id === id); return context ? <li key={id}><button type="button" className="text-left text-[13px] leading-relaxed text-label-secondary underline underline-offset-4" onClick={() => onSelectNode(claimNodeId(id))}>{context.title ?? context.claim}</button></li> : null; })}</ul></Section> : null}
        <Section label="What challenges it">
          {trail.contradictions.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {trail.contradictions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvidence(item.id)}
                    className="w-full rounded-chip px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-hover"
                  >
                    <p className="text-body-s leading-[1.4] text-concern-elevated">{item.sourceName}</p>
                    <p className="mt-0.5 text-caption text-label-tertiary">
                      {SOURCE_TYPE_LABEL[item.sourceType]} · {item.sourceDateKind === "reviewed" ? "reviewed " : ""}{item.sourceDate} · {item.synthetic ? "Authored demo record" : "Real public authority"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No held evidence contradicts this claim." />
          )}
          {claim.competingExplanation ? (
            <p className="mt-2.5 text-body-s leading-[1.5] text-label-secondary">{claim.competingExplanation}</p>
          ) : null}
        </Section>

        <Section label="What would change this">
          {trail.falsifiers.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {trail.falsifiers.map((falsifier) => (
                <li key={falsifier} className="relative pl-4 text-body-s leading-[1.5] text-label-secondary">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[7px] h-[5px] w-[5px] rounded-full border border-label-quaternary"
                  />
                  {falsifier}
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No falsifier is named for this claim." />
          )}
        </Section>

        <Section label="Why it matters">
          <p className="text-body-s leading-[1.5] text-label-secondary">{trail.whyItMatters}</p>
        </Section>

        <Section label="Time">
          <dl className="flex flex-col gap-2">
            {claim.observedAt ? <TimeRow label="Observed" value={claim.observedAt} /> : null}
            {claim.validFrom ? <TimeRow label="Holds from" value={claim.validFrom} /> : null}
            {trail.futureAssumption ? <TimeRow label="Assumes" value={trail.futureAssumption} /> : null}
          </dl>
          <details className="mt-2.5">
            <summary className="cursor-pointer text-caption text-label-quaternary hover:text-label-tertiary">
              Investigation clock
            </summary>
            <dl className="mt-2 flex flex-col gap-2">
              <TimeRow label="Observed" value={inv.temporal.observedAt} />
              <TimeRow label="Assessed" value={inv.temporal.assessedAt} />
              {inv.temporal.publishedAt ? <TimeRow label="Published" value={inv.temporal.publishedAt} /> : null}
              {inv.temporal.eventAt ? <TimeRow label="Event" value={inv.temporal.eventAt} /> : null}
            </dl>
          </details>
        </Section>

        {crossRefs ? (
          <Section label="Points to">
            <ul className="flex flex-col gap-2.5">
              {trail.dependencies.map((dep) => (
                <li key={dep.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(dependencyNodeId(dep.id))}
                    className="w-full rounded-chip px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-hover"
                  >
                    <p className="text-body-s leading-[1.4] text-label-primary">{dep.label}</p>
                    <p className="mt-0.5 text-caption text-label-tertiary">Dependency</p>
                  </button>
                </li>
              ))}
              {trail.actions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(actionNodeId(action.id))}
                    className="w-full rounded-chip px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-hover"
                  >
                    <p className="text-body-s leading-[1.4] text-label-primary">{action.label}</p>
                    <p className="mt-0.5 text-caption text-label-tertiary">Action</p>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {onShowInSupplyChain ? (
          <button
            type="button"
            onClick={() => onShowInSupplyChain(claim.id)}
            className="mt-1 w-full rounded-chip border border-separator px-3 py-2 text-center text-body-s font-medium text-label-secondary transition-colors hover:bg-hover hover:text-label-primary"
          >
            Show in supply chain
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function TimeRow({ label, value }: { readonly label: string; readonly value: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-caption text-label-quaternary">{label}</dt>
      <dd className="mt-0.5 text-body-s leading-[1.5] text-label-primary">{value}</dd>
    </div>
  );
}

function Empty({ text }: { readonly text: string }): React.ReactElement {
  return <p className="text-caption leading-[1.5] text-label-quaternary">{text}</p>;
}

function Section({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <section>
      <h4 className="micro-label mb-2 text-label-quaternary">{label}</h4>
      {children}
    </section>
  );
}
