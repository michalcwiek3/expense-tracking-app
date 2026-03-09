import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const { rows } = await pool.query(
      `
      select
        id,
        created_at,
        occurred_at,
        amount_cent,
        category,
        subcategory,
        payment_type,
        circumstance,
        money_source,
        comment
      from transactions
      order by occurred_at desc, id desc
      limit 20
      `
    );

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("GET /api/transactions failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amount_cent = Number(body.amount_cent);
    const category = String(body.category ?? "").trim();
    const subcategory = String(body.subcategory ?? "").trim();
    const payment_type = String(body.payment_type ?? "").trim();
    const circumstance = String(body.circumstance ?? "").trim();
    const money_source = String(body.money_source ?? "").trim();
    const comment = body.comment ? String(body.comment).trim() : null;
    const occurred_at = body.occurred_at ? String(body.occurred_at).trim() : null;

    if (
      !Number.isFinite(amount_cent) ||
      !category ||
      !subcategory ||
      !payment_type ||
      !circumstance ||
      !money_source
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (occurred_at && !/^\d{4}-\d{2}-\d{2}$/.test(occurred_at)) {
      return NextResponse.json({ error: "Invalid occurred_at date" }, { status: 400 });
    }

    let result;

    if (occurred_at) {
      result = await pool.query(
        `
        insert into transactions
          (occurred_at, amount_cent, category, subcategory, payment_type, circumstance, money_source, comment)
        values
          (($1::date + time '12:00'), $2, $3, $4, $5, $6, $7, $8)
        returning id, created_at, occurred_at
        `,
        [
          occurred_at,
          amount_cent,
          category,
          subcategory,
          payment_type,
          circumstance,
          money_source,
          comment,
        ]
      );
    } else {
      result = await pool.query(
        `
        insert into transactions
          (amount_cent, category, subcategory, payment_type, circumstance, money_source, comment)
        values
          ($1, $2, $3, $4, $5, $6, $7)
        returning id, created_at, occurred_at
        `,
        [
          amount_cent,
          category,
          subcategory,
          payment_type,
          circumstance,
          money_source,
          comment,
        ]
      );
    }

    return NextResponse.json({ ok: true, ...result.rows[0] });
  } catch (err: any) {
    if (err?.code === "23503") {
      return NextResponse.json(
        { error: "Invalid option value. Update the reference tables first." },
        { status: 400 }
      );
    }

    console.error("POST /api/transactions failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}