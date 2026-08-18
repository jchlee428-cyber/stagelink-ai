import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
    if (!token) {
      return json({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401);
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return json({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, 401);
    }
    const user = authData.user;

    const payload = await req.json();
    const quoteId = payload?.quoteId;
    if (!quoteId) {
      return json({ code: "INVALID_PARAMETER", message: "견적 정보가 필요합니다." }, 400);
    }

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (quoteError || !quote) {
      return json({ code: "NOT_FOUND", message: "견적을 찾을 수 없습니다." }, 404);
    }
    if (quote.status !== "quoted") {
      return json({ code: "INVALID_STATE", message: "이미 처리된 견적입니다." }, 400);
    }
    if (!Number.isInteger(quote.proposed_fee) || quote.proposed_fee <= 0) {
      return json({ code: "INVALID_STATE", message: "출연료 정보가 없습니다." }, 400);
    }

    const feeAmount = quote.proposed_fee * 1000;
    if (!Number.isSafeInteger(feeAmount) || feeAmount <= 0) {
      return json({ code: "INVALID_STATE", message: "수수료 금액을 계산할 수 없습니다." }, 400);
    }

    const orderId = `rdy_${crypto.randomUUID().replaceAll("-", "")}`;
    const orderName = `공연 중개 수수료 - ${quote.title}`;

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        fee_amount: feeAmount,
        toss_order_id: orderId,
        payment_status: "pending_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) {
      return json({ code: "INTERNAL", message: "결제 주문 생성에 실패했습니다." }, 500);
    }

    let pathPrefix = "";
    const rawBasePath = payload?.basePath;
    if (typeof rawBasePath === "string") {
      const b = rawBasePath;
      if (b !== "" && b.startsWith("/") && !b.startsWith("//") && !b.includes("..") && !b.includes("\\")) {
        pathPrefix = b;
      }
    }
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}${pathPrefix}/payment/success`;
    const failUrl = `${origin}${pathPrefix}/payment/fail`;

    return json({
      orderId,
      orderName,
      amount: feeAmount,
      currency: "KRW",
      customerKey: null,
      successUrl,
      failUrl,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";
    return json({ code: "INTERNAL", message }, 500);
  }
});