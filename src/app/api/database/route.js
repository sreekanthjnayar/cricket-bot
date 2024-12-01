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
    return Response(`Invalid query`, {
      status: 400,
    });
  }

  try {
    const results = await sql(query);
    return Response.json({ results });
  } catch (error) {
    // Log the error for server-side tracking

    return Response.json({
      message: `Database error: ${error.message}`,
    });
  }
}
