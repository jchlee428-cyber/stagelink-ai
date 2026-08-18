import { Resend } from "npm:resend@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromDomain = Deno.env.get("RESEND_FROM_DOMAIN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey || !fromDomain) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY and RESEND_FROM_DOMAIN must be set in Edge Function Secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not available" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let notificationId: string | null = null;
  try {
    const payload = await req.json();
    notificationId = payload?.notification_id ?? null;
  } catch {
    notificationId = null;
  }

  if (!notificationId) {
    return new Response(
      JSON.stringify({ error: "notification_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: notif } = await sb
    .from("notifications")
    .select("id, user_id, title, message, email_sent")
    .eq("id", notificationId)
    .maybeSingle();

  if (!notif) {
    return new Response(JSON.stringify({ error: "notification not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (notif.email_sent) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userData, error: userError } = await sb.auth.admin.getUserById(notif.user_id);
  const email = userData?.user?.email;

  if (userError || !email) {
    return new Response(JSON.stringify({ error: "user email not found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `StageLink <noreply@${fromDomain}>`,
    to: [email],
    subject: `[StageLink] ${notif.title}`,
    text: notif.message ?? notif.title,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await sb.from("notifications").update({ email_sent: true }).eq("id", notificationId);

  return new Response(JSON.stringify({ ok: true, id: notificationId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
