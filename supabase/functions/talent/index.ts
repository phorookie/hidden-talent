// 隐藏天赋实验室 · Supabase Edge Function（Deno）
// 替代原 server.js：密码校验限次 + 商家管理，数据存 Supabase Postgres
// 部署：supabase functions deploy talent
// 前端调用地址：https://<项目ref>.functions.supabase.co/talent  （POST，body 带 route 字段）
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(o: any, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  // CORS 预检
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders });
  }

  // 用 service_role 密钥（Supabase 部署后自动注入环境变量，跳过 RLS，仅函数内部可用）
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const route = body.route;

  // 健康检查
  if (route === "health") return json({ ok: true });

  // ===== 密码校验 / 限次 =====
  if (route === "unlock") {
    const pw = String(body.password || "");
    const consume = !!body.consume;
    const { data, error } = await supabase
      .from("passwords")
      .select("*")
      .eq("code", pw)
      .single();
    if (error || !data) return json({ ok: false, reason: "invalid" });
    if ((data.remaining || 0) <= 0) return json({ ok: false, reason: "exhausted" });
    if (consume) {
      const remaining = (data.remaining || 0) - 1;
      await supabase.from("passwords").update({ remaining }).eq("code", pw);
      return json({ ok: true, remaining });
    }
    return json({ ok: true, remaining: data.remaining });
  }

  // ===== 商家密码管理（需校验 master） =====
  if (route === "admin") {
    const master = String(body.master || "");
    const { data: meta } = await supabase
      .from("meta")
      .select("value")
      .eq("key", "master")
      .single();
    const realMaster = meta?.value || "CHANGE_ME_ADMIN";
    if (master !== realMaster) return json({ ok: false, reason: "forbidden" });

    const action = body.action;

    if (action === "list") {
      const { data } = await supabase
        .from("passwords")
        .select("code,remaining,max,note")
        .order("code");
      return json({ ok: true, rows: data || [] });
    }

    if (action === "add") {
      const code = String(body.code || "").trim();
      const max = parseInt(body.max, 10) || 3;
      const note = String(body.note || "");
      if (!code) return json({ ok: false, reason: "empty" });
      if (/[^A-Za-z0-9_-]/.test(code)) return json({ ok: false, reason: "badcode" });
      await supabase.from("passwords").upsert({ code, remaining: max, max, note });
      return json({ ok: true });
    }

    if (action === "reset") {
      const code = String(body.code || "");
      const { data } = await supabase
        .from("passwords")
        .select("max")
        .eq("code", code)
        .single();
      if (!data) return json({ ok: false, reason: "notfound" });
      await supabase.from("passwords").update({ remaining: data.max }).eq("code", code);
      return json({ ok: true });
    }

    if (action === "setmaster") {
      const newm = String(body.newm || "");
      if (!newm) return json({ ok: false, reason: "empty" });
      await supabase.from("meta").upsert({ key: "master", value: newm });
      return json({ ok: true });
    }

    return json({ ok: false, reason: "badaction" });
  }

  return json({ ok: false, reason: "badroute" });
});
