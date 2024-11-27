import { queryDB } from "../_services/db";

export async function POST(request) {
  const { sql, params } = await request.json();

  // Validation: Ensure the query is safe
  if (
    !sql ||
    typeof sql !== "string" ||
    !sql.trim().toLowerCase().startsWith("select")
  ) {
    return res.status(400).json({ error: "Invalid query" });
  }

  try {
    const results = await queryDB(sql, params || []);
    results.status(200).json(results.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database query failed" });
  }
}
