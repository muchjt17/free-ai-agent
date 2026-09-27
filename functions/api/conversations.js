const H = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (x, s=200) => new Response(JSON.stringify(x), {status:s, headers:H});

function uuid(x) {
  return typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}
async function db(env, path, options={}) {
  const r = await fetch(`${env.SUPABASE_URL.replace(/\/$/,"")}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": env.SUPABASE_SECRET_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {})
    }
  });
  const t = await r.text();
  let d=null; try { d=t ? JSON.parse(t):null; } catch {}
  if (!r.ok) throw new Error(d?.message || d?.error || t || `Database error ${r.status}`);
  return d;
}

export async function onRequestGet(context) {
  try {
    const userId = new URL(context.request.url).searchParams.get("user_id");
    if (!uuid(userId)) return json({error:"Invalid user id."},400);
    const conversations = await db(context.env,
      `conversations?user_id=eq.${encodeURIComponent(userId)}&select=id,title,created_at&order=created_at.desc&limit=100`,
      {method:"GET"});
    return json({conversations: conversations || []});
  } catch(e) { return json({error:e.message},500); }
}

export async function onRequestDelete(context) {
  try {
    const body = await context.request.json();
    if (!uuid(body.user_id) || !uuid(body.id)) return json({error:"Invalid id."},400);
    await db(context.env,
      `conversations?id=eq.${encodeURIComponent(body.id)}&user_id=eq.${encodeURIComponent(body.user_id)}`,
      {method:"DELETE", prefer:"return=minimal"});
    return json({ok:true});
  } catch(e) { return json({error:e.message},500); }
}
