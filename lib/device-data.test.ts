import { describe, expect, it } from "vitest";
import { clearVeyoraqStorage } from "./device-data";

function fakeStorage(entries: Record<string, string>) {
  const data = { ...entries };
  return {
    data,
    get length() {
      return Object.keys(data).length;
    },
    key: (index: number) => Object.keys(data)[index] ?? null,
    removeItem: (key: string) => {
      delete data[key];
    },
  };
}

describe("clearVeyoraqStorage", () => {
  it("removes only VEYORAQ keys", () => {
    const storage = fakeStorage({
      "veyoraq:audience": "x",
      "veyoraq:draft:style-quiz": "y",
      "other-site-key": "keep",
    });
    expect(clearVeyoraqStorage(storage)).toBe(2);
    expect(storage.data).toEqual({ "other-site-key": "keep" });
  });

  it("is fine with nothing to remove", () => {
    expect(clearVeyoraqStorage(fakeStorage({}))).toBe(0);
  });
});
