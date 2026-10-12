import { afterEach, describe, expect, it, vi } from "vitest";
import { ComingSoon } from "@/components/coming-soon";
import { StyleQuiz } from "@/components/stylist/style-quiz";
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

  it("always shows the quiz, even when the AI key is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const types = typesIn(StylistPage());
    expect(types).toContain(StyleQuiz);
    expect(types).not.toContain(ComingSoon);
  });

  it("shows the quiz when a key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const types = typesIn(StylistPage());
    expect(types).toContain(StyleQuiz);
    expect(types).not.toContain(ComingSoon);
  });
});
