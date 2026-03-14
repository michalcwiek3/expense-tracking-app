import { NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const POST = auth(async function POST(req) {
  if (!req.auth?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const amount_cent = Number(body.amount_cent);
    const category = String(body.category ?? "").trim();
    const subcategory = String(body.subcategory ?? "").trim();
    const payment_type = String(body.payment_type ?? "").trim();
    const circumstance = String(body.circumstance ?? "").trim();
    const money_source = String(body.money_source ?? "").trim();
    const day_of_month = Number(body.day_of_month);
    const start_date = body.start_date ? String(body.start_date).trim() : null;
    const end_date = body.end_date ? String(body.end_date).trim() : null;

    if (
      !name ||
      !Number.isFinite(amount_cent) ||
      !category ||
      !subcategory ||
      !payment_type ||
      !circumstance ||
      !money_source ||
      !Number.isInteger(day_of_month) ||
      day_of_month < 1 ||
      day_of_month > 31
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return NextResponse.json({ error: "Invalid start_date" }, { status: 400 });
    }

    if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      return NextResponse.json({ error: "Invalid end_date" }, { status: 400 });
    }

    const result = await pool.query(
      `
      insert into subscriptions (
        name,
        amount_cent,
        category,
        subcategory,
        payment_type,
        circumstance,
        money_source,
        day_of_month,
        start_date,
        end_date
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        coalesce($9::date, current_date),
        $10::date
      )
      returning id, created_at
      `,
      [
        name,
        amount_cent,
        category,
        subcategory,
        payment_type,
        circumstance,
        money_source,
        day_of_month,
        start_date,
        end_date,
      ]
    );

    return NextResponse.json({ ok: true, ...result.rows[0] });
  } catch (err: any) {
    if (err?.code === "23503") {
      return NextResponse.json(
        { error: "Invalid option value. Update the reference tables first." },
        { status: 400 }
      );
    }

    console.error("POST /api/subscriptions failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});
