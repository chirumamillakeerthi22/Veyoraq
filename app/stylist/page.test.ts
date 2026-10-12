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

  it("shows the coming-soon page, not the quiz, when the key is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const types = typesIn(StylistPage());
    expect(types).toContain(ComingSoon);
    expect(types).not.toContain(StyleQuiz);
  });

  it("treats a whitespace-only key as missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "   ");
    expect(typesIn(StylistPage())).toContain(ComingSoon);
  });

  it("shows the quiz when a key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const types = typesIn(StylistPage());
    expect(types).toContain(StyleQuiz);
    expect(types).not.toContain(ComingSoon);
  });

  it("only offers image generation when an image model is chosen", () => {
    const propsOf = (node: unknown): Record<string, unknown> | null => {
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = propsOf(child);
          if (found) return found;
        }
      } else if (node && typeof node === "object" && "props" in node) {
        const element = node as { type: unknown; props: Record<string, unknown> };
        if (element.type === StyleQuiz) return element.props;
        return propsOf(element.props.children);
      }
      return null;
    };

    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_IMAGE_MODEL", "");
    expect(propsOf(StylistPage())?.imageGenerationConfigured).toBe(false);

    vi.stubEnv("GEMINI_IMAGE_MODEL", "some-image-model");
    expect(propsOf(StylistPage())?.imageGenerationConfigured).toBe(true);
  });
});
