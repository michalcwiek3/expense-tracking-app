import { NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "../../../auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const GET = auth(async function GET(req) {
  if (!req.auth?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [cats, subcats, pay, circ, src] = await Promise.all([
      pool.query(`select name from categories order by sort_val`),
      pool.query(`
        select category_name, array_agg(name order by name) as subcategories
        from subcategories
        group by category_name
        order by category_name
      `),
      pool.query(`select name from payment_types order by sort_val`),
      pool.query(`select name from circumstances order by sort_val`),
      pool.query(`select name from money_sources order by sort_val`),
    ]);

    const subcategoriesByCategory: Record<string, string[]> = {};
    for (const r of subcats.rows) {
      subcategoriesByCategory[r.category_name] = r.subcategories ?? [];
    }

    return NextResponse.json({
      categories: cats.rows.map((r) => r.name),
      subcategoriesByCategory,
      paymentTypes: pay.rows.map((r) => r.name),
      circumstances: circ.rows.map((r) => r.name),
      moneySources: src.rows.map((r) => r.name),
    });
  } catch (err) {
    console.error("GET /api/options failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});