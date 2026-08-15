/**
 * cn() — merge de classes Tailwind.
 */
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("resolve classes conflitantes mantendo a última", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-base")).toBe("text-base");
  });

  it("ignora valores falsos e aceita condicionais", () => {
    expect(cn("rounded", false && "hidden", undefined, null, "border")).toBe("rounded border");
    expect(cn("p-2", { "opacity-50": true, "opacity-100": false })).toBe("p-2 opacity-50");
  });
});
