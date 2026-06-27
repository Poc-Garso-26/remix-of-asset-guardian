// Edge Function: generate-asset-qrcode
// Gera QR Code para um ativo, salva no bucket asset-qrcodes e atualiza a tabela.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 ano

async function fingerprint(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join("|"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractVersion(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("v");
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Valida JWT do chamador
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se o usuário possui papel admin ou gerente
    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    const { data: isGerente } = await authClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "gerente",
    });
    if (!isAdmin && !isGerente) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as { assetId?: string };
    const assetId = body.assetId;
    if (!assetId) {
      return new Response(JSON.stringify({ error: "assetId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: asset, error: assetErr } = await admin
      .from("assets")
      .select("id, patrimony, serial_number, qr_code_url")
      .eq("id", assetId)
      .maybeSingle();

    if (assetErr || !asset) {
      console.error("[qrcode] ativo não encontrado", { assetId, assetErr });
      return new Response(JSON.stringify({ error: "Ativo não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fp = await fingerprint([asset.id, asset.patrimony ?? "", asset.serial_number ?? ""]);
    const existingVersion = extractVersion(asset.qr_code_url);

    if (existingVersion === fp && asset.qr_code_url) {
      return new Response(
        JSON.stringify({ url: asset.qr_code_url, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = JSON.stringify({
      assetId: asset.id,
      assetCode: asset.patrimony,
      serialNumber: asset.serial_number,
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;

    const qrResp = await fetch(qrUrl);
    if (!qrResp.ok) {
      console.error("[qrcode] falha ao gerar QR", { status: qrResp.status });
      return new Response(JSON.stringify({ error: "Falha ao gerar QR Code" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imageBytes = new Uint8Array(await qrResp.arrayBuffer());

    const filePath = `${asset.id}.png`;
    const { error: uploadErr } = await admin.storage
      .from("asset-qrcodes")
      .upload(filePath, imageBytes, { contentType: "image/png", upsert: true });
    if (uploadErr) {
      console.error("[qrcode] falha no upload", uploadErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar QR Code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("asset-qrcodes")
      .createSignedUrl(filePath, SIGNED_URL_TTL);
    if (signErr || !signed?.signedUrl) {
      console.error("[qrcode] falha ao assinar URL", signErr);
      return new Response(JSON.stringify({ error: "Falha ao gerar URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalUrl = `${signed.signedUrl}${signed.signedUrl.includes("?") ? "&" : "?"}v=${fp}`;

    const { error: updErr } = await admin
      .from("assets")
      .update({ qr_code_url: finalUrl, qr_code_generated_at: new Date().toISOString() })
      .eq("id", asset.id);
    if (updErr) {
      console.error("[qrcode] falha ao atualizar ativo", updErr);
      return new Response(JSON.stringify({ error: "Falha ao atualizar ativo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: finalUrl, skipped: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[qrcode] erro inesperado", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
