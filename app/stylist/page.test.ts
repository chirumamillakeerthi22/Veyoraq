import { afterEach, describe, expect, it, vi } from "vitest";
import { ComingSoon } from "@/components/coming-soon";
import { StylistFlow } from "@/components/stylist/stylist-flow";
import StylistPage from "./page";

// Collects the component types used anywhere in a returned React element tree.
function typesIn(node: unknown, found: unknown[] = []): unknown[] {
  if (Array.isArray(node)) {
    node.forEach((child) => typesIn(child, found));
  } else if (node && typeof node === "object" && "props" in node) {
    const element = node as { type: unknown; props: { children?: unknown } };
    found.push(element.type);
    typesIn(element.props.children, found);
  }
  return found;
}

describe("/stylist page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("shows the coming-soon page, not the form, when the key is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const types = typesIn(StylistPage());
    expect(types).toContain(ComingSoon);
    expect(types).not.toContain(StylistFlow);
  });

  it("treats a whitespace-only key as missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "   ");
    expect(typesIn(StylistPage())).toContain(ComingSoon);
  });

  it("shows the form when a key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const types = typesIn(StylistPage());
    expect(types).toContain(StylistFlow);
    expect(types).not.toContain(ComingSoon);
  });
});
