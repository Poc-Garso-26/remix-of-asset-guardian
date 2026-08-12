/**
 * Cabeçalhos de segurança HTTP (defesa em profundidade).
 *
 * O CSP aqui é preventivo: a auditoria não encontrou XSS ativo, mas a política
 * reduz o impacto de uma futura injeção. Mantemos a lista de domínios externos
 * em um único lugar para facilitar a manutenção.
 */

/** Domínio do projeto Supabase (API, Auth e Storage dos QR Codes). */
const SUPABASE_ORIGIN = "https://gkieaxljrlocsuythjqw.supabase.co";
/** Consulta de endereço por CEP (src/components/cep-input.tsx). */
const VIACEP_ORIGIN = "https://viacep.com.br";
/** Google Fonts (CSS + arquivos de fonte) carregados em __root.tsx. */
const GOOGLE_FONTS_CSS = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FILES = "https://fonts.gstatic.com";

/**
 * Fase de implantação do CSP.
 * - "report-only": só reporta violações no console, não bloqueia nada.
 * - "enforce": bloqueia de fato.
 */
export type CspMode = "report-only" | "enforce";

/** Modo atual. Validado em report-only antes de ser promovido para enforce. */
export const CSP_MODE: CspMode = "report-only";

function isLovablePreviewHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".lovableproject.com") ||
    hostname.endsWith(".lovable.dev")
  );
}

/**
 * Monta a política. `frame-ancestors` é 'none' no site publicado (anti
 * clickjacking), mas permite o iframe do editor Lovable no preview — senão o
 * preview deixa de renderizar.
 */
export function buildContentSecurityPolicy(requestUrl: string): string {
  let allowsPreviewFraming = false;
  try {
    allowsPreviewFraming = isLovablePreviewHost(new URL(requestUrl).hostname);
  } catch {
    allowsPreviewFraming = false;
  }

  const frameAncestors = allowsPreviewFraming
    ? "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app https://*.lovableproject.com"
    : "frame-ancestors 'none'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // 'unsafe-inline': script inline de tema (__root.tsx) + scripts de
    // hidratação/streaming injetados pelo TanStack Start. Nonce exigiria
    // reescrever o HTML de streaming.
    "script-src 'self' 'unsafe-inline'",
    // 'unsafe-inline': Tailwind/Radix/Recharts injetam estilos inline.
    `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_CSS}`,
    `style-src-elem 'self' 'unsafe-inline' ${GOOGLE_FONTS_CSS}`,
    `font-src 'self' ${GOOGLE_FONTS_FILES} data:`,
    `img-src 'self' data: blob: ${SUPABASE_ORIGIN}`,
    `connect-src 'self' ws: wss: ${SUPABASE_ORIGIN} ${VIACEP_ORIGIN} ${GOOGLE_FONTS_CSS} ${GOOGLE_FONTS_FILES}`,
    // blob: cobre a pré-visualização/abertura dos PDFs gerados pelo jsPDF.
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    frameAncestors,
  ].join("; ");
}

/**
 * Aplica os cabeçalhos de segurança em respostas HTML (documentos). Assets e
 * respostas de API não precisam de CSP de documento.
 */
export function withSecurityHeaders(response: Response, requestUrl: string): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const headers = new Headers(response.headers);
  const cspHeader =
    CSP_MODE === "enforce" ? "content-security-policy" : "content-security-policy-report-only";

  headers.set(cspHeader, buildContentSecurityPolicy(requestUrl));
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");

  // X-Frame-Options é o equivalente legado de frame-ancestors; só aplicamos
  // quando o framing está de fato proibido (fora do preview do editor).
  if (headers.get(cspHeader)?.includes("frame-ancestors 'none'")) {
    headers.set("x-frame-options", "DENY");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
