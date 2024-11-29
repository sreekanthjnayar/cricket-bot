import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  const { query } = await request.json();

  // Validation: Ensure the query is safe
  if (
    !query ||
    typeof query !== "string" ||
    !query.trim().toLowerCase().startsWith("select")
  ) {
    return new Response(`Invalid query`, {
      status: 400,
    });
  }

  try {
    const results = await sql(query);
    return Response.json({ results });
  } catch (error) {
    return new Response(`database error: ${error.message}`, {
      status: 400,
    });
  }
}
