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
    const paymentKey = payload?.paymentKey;
    const orderId = payload?.orderId;
    const amount = payload?.amount;

    if (!paymentKey || !orderId || !Number.isSafeInteger(amount) || amount <= 0) {
      return json({ code: "INVALID_PARAMETER", message: "결제 정보가 올바르지 않습니다." }, 400);
    }

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("toss_order_id", orderId)
      .eq("client_id", user.id)
      .maybeSingle();

    if (quoteError || !quote) {
      return json({ code: "NOT_FOUND", message: "결제 주문을 찾을 수 없습니다." }, 404);
    }
    if (quote.payment_status !== "pending_payment") {
      return json({ code: "INVALID_STATE", message: "이미 처리된 결제입니다." }, 400);
    }
    if (quote.fee_amount !== amount) {
      return json({ code: "AMOUNT_MISMATCH", message: "결제 금액이 일치하지 않습니다." }, 400);
    }

    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      return json({ code: "INTERNAL", message: "Toss 결제 설정이 필요합니다." }, 500);
    }

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok || tossData?.status !== "DONE") {
      const message = typeof tossData?.message === "string" ? tossData.message : "결제 승인에 실패했습니다.";
      return json({ code: "CONFIRM_FAILED", message, requestId: tossData?.code ?? undefined }, tossRes.ok ? 400 : 500);
    }

    if (
      tossData.paymentKey !== paymentKey ||
      tossData.orderId !== orderId ||
      tossData.totalAmount !== amount ||
      tossData.currency !== "KRW"
    ) {
      return json({ code: "MISMATCH", message: "결제 검증에 실패했습니다." }, 400);
    }

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        payment_status: "paid",
        toss_payment_key: paymentKey,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    if (updateError) {
      return json({ code: "INTERNAL", message: "결제 완료 처리에 실패했습니다." }, 500);
    }

    return json({ status: "paid", orderId, amount, quoteId: quote.id }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";
    return json({ code: "INTERNAL", message }, 500);
  }
});