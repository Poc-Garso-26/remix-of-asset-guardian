/**
 * Content-Security-Policy — verifica as diretivas essenciais da política.
 */
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security-headers";

describe("buildContentSecurityPolicy", () => {
  const csp = buildContentSecurityPolicy("https://exemplo.com/login");

  it("restringe a origem padrão", () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("libera Supabase e ViaCEP em connect-src", () => {
    const connect = csp.split("; ").find((d) => d.startsWith("connect-src"))!;
    expect(connect).toMatch(/supabase/);
    expect(connect).toMatch(/viacep/);
  });

  it("libera imagens do Supabase e blobs de PDF", () => {
    const img = csp.split("; ").find((d) => d.startsWith("img-src"))!;
    expect(img).toMatch(/supabase/);
    expect(img).toContain("blob:");
  });

  it("bloqueia framing em domínio publicado e libera no preview Lovable", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    const preview = buildContentSecurityPolicy("https://app.lovable.app/login");
    expect(preview).toContain("frame-ancestors 'self'");
    expect(preview).toMatch(/lovable\.dev/);
  });

  it("não quebra com URL inválida", () => {
    expect(buildContentSecurityPolicy("nao-e-url")).toContain("frame-ancestors 'none'");
  });
});
