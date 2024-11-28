import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  const data = await sql`select count(1) from public.deliveries`;
  return new Response(
    JSON.stringify({ success: true, deliveriesTableSize: data }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
