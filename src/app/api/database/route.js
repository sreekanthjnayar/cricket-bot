import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  // Perform querying using sql variable
  // Reference : https://github.com/neondatabase/serverless
}
