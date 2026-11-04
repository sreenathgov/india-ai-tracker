import { describe, expect, it } from "vitest";

import { ACTIVITY_KINDS, activityFeed, addComment } from "./activity";
import { dronaBriefing, nordvindAttention } from "./attention";
import { CAPITAL_SNAPSHOT } from "./commercial";

const feed = activityFeed();

describe("activityFeed", () => {
  it("uses registered event kinds without inventing a supplier response", () => {
    const kinds = new Set(feed.map((e) => e.kind));
    for (const kind of kinds) expect(ACTIVITY_KINDS).toContain(kind);
    expect(kinds.has("supplier_update")).toBe(false);
    expect(kinds.has("evidence_requested")).toBe(true);
  });

  it("is ordered newest first", () => {
    const ages = feed.map((e) => e.minutesAgo);
    expect([...ages].sort((a, b) => a - b)).toEqual(ages);
  });

  it("tells the same story as Drona's change log", () => {
    const changes = dronaBriefing({ weekCents: CAPITAL_SNAPSHOT.thisWeek.cents, pathways: CAPITAL_SNAPSHOT.thisWeek.pathways }).changes;
    const texts = feed.map((e) => e.text).join(" ");
    expect(changes[0]!.text).toContain("applicability check");
    expect(texts).toContain("applicability under review");
    expect(texts).toContain("No message sent");
  });

  it("carries Wind Energy's figures from the attention record", () => {
    const a = nordvindAttention();
    const drona = feed.find((e) => e.kind === "drona")!;
    expect(drona.text).toContain(`${a.unitsExposed} of ${a.unitsTotal}`);
  });

  it("never claims finance resolved a dependency", () => {
    const finance = feed.filter((e) => e.kind === "finance").map((e) => e.text.toLowerCase());
    for (const text of finance) expect(text).not.toMatch(/resolv|fixed|eliminat/);
  });
});

describe("addComment", () => {
  it("prepends a comment without touching the original feed", () => {
    const before = [...feed];
    const next = addComment(feed, "  Checking with Deccan today.  ");
    expect(next).not.toBe(feed);
    expect(feed).toEqual(before);
    expect(next[0]).toMatchObject({ kind: "comment", actor: "You", text: "Checking with Deccan today.", minutesAgo: 0 });
    expect(next.length).toBe(feed.length + 1);
  });

  it("ignores an empty comment", () => {
    expect(addComment(feed, "   ")).toBe(feed);
  });

  it("gives each comment a unique id", () => {
    const once = addComment(feed, "One");
    const twice = addComment(once, "Two");
    expect(new Set(twice.map((e) => e.id)).size).toBe(twice.length);
  });
});
