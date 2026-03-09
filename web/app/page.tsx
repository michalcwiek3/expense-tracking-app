"use client";

import { useEffect, useMemo, useState } from "react";

type Options = {
  categories: string[];
  subcategoriesByCategory: Record<string, string[]>;
  paymentTypes: string[];
  circumstances: string[];
  moneySources: string[];
};

const EMPTY_OPTIONS: Options = {
  categories: [],
  subcategoriesByCategory: {},
  paymentTypes: [],
  circumstances: [],
  moneySources: [],
};

function Chip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-full border text-sm bg-white text-black border-gray-300"
      type="button"
    >
      {label}
    </button>
  );
}

export default function Home() {
  // Steps:
  // 0 amount
  // 1 different date?
  // 2 pick date (only if yes)
  // 3 category
  // 4 subcategory
  // 5 payment
  // 6 circumstance
  // 7 money source
  // 8 note
  const [step, setStep] = useState(0);

  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);

  const [amountNok, setAmountNok] = useState("");
  const [useDifferentDate, setUseDifferentDate] = useState<boolean | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [circumstance, setCircumstance] = useState("");
  const [moneySource, setMoneySource] = useState("");
  const [comment, setComment] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadOptions() {
    setMsg(null);
    try {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load options");
      setOptions(data);
    } catch (e: any) {
      setMsg(e.message ?? "Failed to load options");
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (!category) return;
    const valid = (options.subcategoriesByCategory[category] ?? []).includes(subcategory);
    if (!valid) setSubcategory("");
  }, [category, options.subcategoriesByCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const subcategoryOptions = useMemo(
    () => (category ? options.subcategoriesByCategory[category] ?? [] : []),
    [category, options.subcategoriesByCategory]
  );

  function canProceedAmount() {
    const nok = Number(amountNok);
    return amountNok.trim() !== "" && Number.isFinite(nok) && nok > 0;
  }

  function canProceedDate() {
    return /^\d{4}-\d{2}-\d{2}$/.test(customDate);
  }

  function goBack() {
    setMsg(null);

    // If we skipped the date-picker screen, going back from Category should return to "different date?"
    if (step === 3 && useDifferentDate === false) {
      setStep(1);
      return;
    }

    setStep((s) => Math.max(s - 1, 0));
  }

  function summaryLine() {
    const parts = [
      amountNok ? `${amountNok} NOK` : null,
      useDifferentDate && customDate ? customDate : null,
      category || null,
      subcategory || null,
      paymentType || null,
      circumstance || null,
      moneySource || null,
    ].filter(Boolean);
    return parts.join(" • ");
  }

  async function save(withNote: boolean) {
    setSaving(true);
    setMsg(null);

    try {
      if (!canProceedAmount()) throw new Error("Amount is invalid.");
      if (!category || !subcategory || !paymentType || !circumstance || !moneySource) {
        throw new Error("Missing required fields.");
      }

      if (useDifferentDate === true && !canProceedDate()) {
        throw new Error("Custom date is invalid.");
      }

      const nok = Number(amountNok);
      const amount_cent = -Math.abs(Math.round(nok * 100));

      const payload = {
        amount_cent,
        occurred_at: useDifferentDate ? customDate : null,
        category,
        subcategory,
        payment_type: paymentType,
        circumstance,
        money_source: moneySource,
        comment: withNote && comment.trim() ? comment.trim() : null,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");

      setMsg(`Saved (id=${data.id}).`);
      setAmountNok("");
      setUseDifferentDate(null);
      setCustomDate("");
      setComment("");
      setStep(0);
    } catch (e: any) {
      setMsg(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4 mt-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <button
          type="button"
          className="text-sm underline"
          onClick={loadOptions}
          title="Reload options from DB"
        >
          Refresh options
        </button>
      </div>

      <div className="mt-4 p-4 border rounded-xl">
        <div className="text-sm text-gray-500">Step {step + 1} / 9</div>
        <div className="text-xs text-gray-400 mt-1">{summaryLine() || "—"}</div>

        <div className="mt-4">
          {step === 0 && (
            <div>
              <div className="text-lg font-semibold mb-2">Amount (NOK)</div>
              <input
                className="w-full p-3 border rounded-lg text-lg"
                placeholder="e.g. 129.90"
                value={amountNok}
                onChange={(e) => setAmountNok(e.target.value)}
                inputMode="decimal"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceedAmount()) setStep(1);
                }}
              />
              <button
                type="button"
                className="mt-3 px-4 py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
                onClick={() => setStep(1)}
                disabled={!canProceedAmount()}
              >
                Next
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-lg font-semibold mb-2">Different date?</div>
              <div className="flex gap-2 flex-wrap">
                <Chip
                  label="No"
                  onClick={() => {
                    setUseDifferentDate(false);
                    setCustomDate("");
                    setStep(3);
                  }}
                />
                <Chip
                  label="Yes"
                  onClick={() => {
                    setUseDifferentDate(true);
                    setStep(2);
                  }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-lg font-semibold mb-2">Pick date</div>
              <input
                type="date"
                className="w-full p-3 border rounded-lg text-lg"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
              <button
                type="button"
                className="mt-3 px-4 py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
                onClick={() => setStep(3)}
                disabled={!canProceedDate()}
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-lg font-semibold mb-2">Category</div>
              <div className="flex gap-2 flex-wrap">
                {options.categories.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    onClick={() => {
                      setCategory(c);
                      setSubcategory("");
                      setStep(4);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="text-lg font-semibold mb-2">Subcategory</div>
              {!category ? (
                <div className="text-gray-600">Pick a category first.</div>
              ) : subcategoryOptions.length ? (
                <div className="flex gap-2 flex-wrap">
                  {subcategoryOptions.map((sc) => (
                    <Chip
                      key={sc}
                      label={sc}
                      onClick={() => {
                        setSubcategory(sc);
                        setStep(5);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-gray-600">No subcategories for {category}.</div>
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="text-lg font-semibold mb-2">Payment type</div>
              <div className="flex gap-2 flex-wrap">
                {options.paymentTypes.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    onClick={() => {
                      setPaymentType(p);
                      setStep(6);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <div className="text-lg font-semibold mb-2">Circumstance</div>
              <div className="flex gap-2 flex-wrap">
                {options.circumstances.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    onClick={() => {
                      setCircumstance(c);
                      setStep(7);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <div className="text-lg font-semibold mb-2">Money source</div>
              <div className="flex gap-2 flex-wrap">
                {options.moneySources.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    onClick={() => {
                      setMoneySource(m);
                      setStep(8);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <div className="text-lg font-semibold mb-2">Notes (optional)</div>
              <textarea
                className="w-full p-3 border rounded-lg"
                placeholder="Optional note…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="px-4 py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
                  onClick={() => save(true)}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  type="button"
                  className="px-4 py-3 rounded-lg border font-semibold disabled:opacity-60"
                  onClick={() => save(false)}
                  disabled={saving}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          <button
            onClick={goBack}
            disabled={step === 0 || saving}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
            type="button"
          >
            Back
          </button>
        </div>

        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>
    </main>
  );
}