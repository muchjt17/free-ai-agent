const H = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (x, s=200) => new Response(JSON.stringify(x), {status:s, headers:H});
function uuid(x) {
  return typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}
async function db(env,path,options={}) {
  const r=await fetch(`${env.SUPABASE_URL.replace(/\/$/,"")}/rest/v1/${path}`,{
    ...options, headers:{
      "apikey":env.SUPABASE_SECRET_KEY,
      "Authorization":`Bearer ${env.SUPABASE_SECRET_KEY}`,
      "Content-Type":"application/json",
      ...(options.headers||{})
    }
  });
  const t=await r.text(); let d=null; try{d=t?JSON.parse(t):null}catch{}
  if(!r.ok) throw new Error(d?.message||d?.error||t||`Database error ${r.status}`);
  return d;
}
export async function onRequestGet(context) {
  try {
    const p=new URL(context.request.url).searchParams;
    const id=p.get("conversation_id"), user=p.get("user_id");
    if(!uuid(id)||!uuid(user)) return json({error:"Invalid id."},400);
    const rows=await db(context.env,
      `messages?conversation_id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(user)}&select=id,role,content,created_at&order=created_at.asc&limit=200`,
      {method:"GET"});
    return json({messages:rows||[]});
  } catch(e){return json({error:e.message},500);}
}
