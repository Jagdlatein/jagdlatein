import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");

  const filename = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("jagdbuch")
    .upload(filename, file, {
      contentType: file.type
    });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const url = supabase.storage.from("jagdbuch").getPublicUrl(filename).data.publicUrl;

  return new Response(JSON.stringify({ url }), { status: 200 });
}
