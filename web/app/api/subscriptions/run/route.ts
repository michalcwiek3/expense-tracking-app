import { NextResponse } from "next/server";
import { Pool } from "pg";
import { auth } from "@/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function isAuthorizedByCronSecret(request: Request) {
  const authHeader = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export const POST = auth(async function POST(req) {
  const loggedIn = !!req.auth?.user?.email;
  const cronAuthorized = isAuthorizedByCronSecret(req);

  if (!loggedIn && !cronAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pool.query(`
      with due as (
        select *
        from subscriptions
        where active = true
          and start_date <= current_date
          and (end_date is null or end_date >= current_date)
          and (
            last_generated_month is null
            or date_trunc('month', last_generated_month) < date_trunc('month', current_date)
          )
          and extract(day from current_date) >= day_of_month
      ),
      inserted as (
        insert into transactions (
          occurred_at,
          amount_cent,
          category,
          subcategory,
          payment_type,
          circumstance,
          money_source,
          comment,
          source
        )
        select
          make_date(
            extract(year from current_date)::int,
            extract(month from current_date)::int,
            least(
              day_of_month,
              extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int
            )
          ),
          amount_cent,
          category,
          subcategory,
          payment_type,
          circumstance,
          money_source,
          name,
          'subscription'
        from due
        returning id
      )
      select count(*)::int as generated from inserted;
    `);

    await pool.query(`
      update subscriptions
      set last_generated_month = date_trunc('month', current_date)
      where active = true
        and start_date <= current_date
        and (end_date is null or end_date >= current_date)
        and (
          last_generated_month is null
          or date_trunc('month', last_generated_month) < date_trunc('month', current_date)
        )
        and extract(day from current_date) >= day_of_month;
    `);

    return NextResponse.json({
      ok: true,
      generated: result.rows[0]?.generated ?? 0,
    });
  } catch (err) {
    console.error("subscription run failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
});