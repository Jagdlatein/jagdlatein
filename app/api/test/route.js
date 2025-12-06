export async function GET() {
  console.log("TEST API HIT");
  return new Response("OK", { status: 200 });
}
