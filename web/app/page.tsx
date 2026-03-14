"use client";

import { useEffect, useMemo, useState } from "react";

type Options = {
  categories: string[];
  subcategoriesByCategory: Record<string, string[]>;
  paymentTypes: string[];
  circumstances: string[];
  moneySources: string[];
};

type Mode = "home" | "expense" | "subscription";

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

function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="px-4 py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("home");
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Expense flow state
  const [expenseAmountNok, setExpenseAmountNok] = useState("");
  const [useDifferentDate, setUseDifferentDate] = useState<boolean | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseSubcategory, setExpenseSubcategory] = useState("");
  const [expensePaymentType, setExpensePaymentType] = useState("");
  const [expenseCircumstance, setExpenseCircumstance] = useState("");
  const [expenseMoneySource, setExpenseMoneySource] = useState("");
  const [expenseComment, setExpenseComment] = useState("");

  // Subscription flow state
  const [subscriptionName, setSubscriptionName] = useState("");
  const [subscriptionAmountNok, setSubscriptionAmountNok] = useState("");
  const [subscriptionDayOfMonth, setSubscriptionDayOfMonth] = useState("");
  const [subscriptionCategory, setSubscriptionCategory] = useState("");
  const [subscriptionSubcategory, setSubscriptionSubcategory] = useState("");
  const [subscriptionPaymentType, setSubscriptionPaymentType] = useState("");
  const [subscriptionCircumstance, setSubscriptionCircumstance] = useState("");
  const [subscriptionMoneySource, setSubscriptionMoneySource] = useState("");

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
    if (!expenseCategory) return;
    const valid = (options.subcategoriesByCategory[expenseCategory] ?? []).includes(
      expenseSubcategory
    );
    if (!valid) setExpenseSubcategory("");
  }, [expenseCategory, options.subcategoriesByCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subscriptionCategory) return;
    const valid = (options.subcategoriesByCategory[subscriptionCategory] ?? []).includes(
      subscriptionSubcategory
    );
    if (!valid) setSubscriptionSubcategory("");
  }, [subscriptionCategory, options.subcategoriesByCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const expenseSubcategoryOptions = useMemo(
    () => (expenseCategory ? options.subcategoriesByCategory[expenseCategory] ?? [] : []),
    [expenseCategory, options.subcategoriesByCategory]
  );

  const subscriptionSubcategoryOptions = useMemo(
    () =>
      subscriptionCategory ? options.subcategoriesByCategory[subscriptionCategory] ?? [] : [],
    [subscriptionCategory, options.subcategoriesByCategory]
  );

  function resetExpenseFlow() {
    setExpenseAmountNok("");
    setUseDifferentDate(null);
    setCustomDate("");
    setExpenseCategory("");
    setExpenseSubcategory("");
    setExpensePaymentType("");
    setExpenseCircumstance("");
    setExpenseMoneySource("");
    setExpenseComment("");
    setStep(0);
  }

  function resetSubscriptionFlow() {
    setSubscriptionName("");
    setSubscriptionAmountNok("");
    setSubscriptionDayOfMonth("");
    setSubscriptionCategory("");
    setSubscriptionSubcategory("");
    setSubscriptionPaymentType("");
    setSubscriptionCircumstance("");
    setSubscriptionMoneySource("");
    setStep(0);
  }

  function goHome() {
    setMsg(null);
    setSaving(false);
    setMode("home");
    setStep(0);
  }

  function startExpenseFlow() {
    setMsg(null);
    resetExpenseFlow();
    setMode("expense");
  }

  function startSubscriptionFlow() {
    setMsg(null);
    resetSubscriptionFlow();
    setMode("subscription");
  }

  function canProceedExpenseAmount() {
    const nok = Number(expenseAmountNok);
    return expenseAmountNok.trim() !== "" && Number.isFinite(nok) && nok > 0;
  }

  function canProceedExpenseDate() {
    return /^\d{4}-\d{2}-\d{2}$/.test(customDate);
  }

  function canProceedSubscriptionName() {
    return subscriptionName.trim() !== "";
  }

  function canProceedSubscriptionAmount() {
    const nok = Number(subscriptionAmountNok);
    return subscriptionAmountNok.trim() !== "" && Number.isFinite(nok) && nok > 0;
  }

  function canProceedSubscriptionDay() {
    const day = Number(subscriptionDayOfMonth);
    return Number.isInteger(day) && day >= 1 && day <= 31;
  }

  function expenseSummaryLine() {
    const parts = [
      expenseAmountNok ? `${expenseAmountNok} NOK` : null,
      useDifferentDate && customDate ? customDate : null,
      expenseCategory || null,
      expenseSubcategory || null,
      expensePaymentType || null,
      expenseCircumstance || null,
      expenseMoneySource || null,
    ].filter(Boolean);
    return parts.join(" • ");
  }

  function subscriptionSummaryLine() {
    const parts = [
      subscriptionName || null,
      subscriptionAmountNok ? `${subscriptionAmountNok} NOK` : null,
      subscriptionDayOfMonth ? `day ${subscriptionDayOfMonth}` : null,
      subscriptionCategory || null,
      subscriptionSubcategory || null,
      subscriptionPaymentType || null,
      subscriptionCircumstance || null,
      subscriptionMoneySource || null,
    ].filter(Boolean);
    return parts.join(" • ");
  }

  function expenseBack() {
    setMsg(null);

    if (step === 3 && useDifferentDate === false) {
      setStep(1);
      return;
    }

    if (step === 0) {
      goHome();
      return;
    }

    setStep((s) => Math.max(s - 1, 0));
  }

  function subscriptionBack() {
    setMsg(null);

    if (step === 0) {
      goHome();
      return;
    }

    setStep((s) => Math.max(s - 1, 0));
  }

  async function saveExpense(withNote: boolean) {
    setSaving(true);
    setMsg(null);

    try {
      if (!canProceedExpenseAmount()) throw new Error("Amount is invalid.");
      if (
        !expenseCategory ||
        !expenseSubcategory ||
        !expensePaymentType ||
        !expenseCircumstance ||
        !expenseMoneySource
      ) {
        throw new Error("Missing required fields.");
      }

      if (useDifferentDate === true && !canProceedExpenseDate()) {
        throw new Error("Custom date is invalid.");
      }

      const nok = Number(expenseAmountNok);
      const amount_cent = Math.abs(Math.round(nok * 100));

      const payload = {
        amount_cent,
        occurred_at: useDifferentDate ? customDate : null,
        category: expenseCategory,
        subcategory: expenseSubcategory,
        payment_type: expensePaymentType,
        circumstance: expenseCircumstance,
        money_source: expenseMoneySource,
        comment: withNote && expenseComment.trim() ? expenseComment.trim() : null,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");

      setMsg(`Expense saved (id=${data.id}).`);
      resetExpenseFlow();
      setMode("home");
    } catch (e: any) {
      setMsg(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveSubscription() {
    setSaving(true);
    setMsg(null);

    try {
      if (!canProceedSubscriptionName()) throw new Error("Name is required.");
      if (!canProceedSubscriptionAmount()) throw new Error("Amount is invalid.");
      if (!canProceedSubscriptionDay()) throw new Error("Day of month is invalid.");
      if (
        !subscriptionCategory ||
        !subscriptionSubcategory ||
        !subscriptionPaymentType ||
        !subscriptionCircumstance ||
        !subscriptionMoneySource
      ) {
        throw new Error("Missing required fields.");
      }

      const nok = Number(subscriptionAmountNok);
      const amount_cent = Math.abs(Math.round(nok * 100));

      const payload = {
        name: subscriptionName.trim(),
        amount_cent,
        category: subscriptionCategory,
        subcategory: subscriptionSubcategory,
        payment_type: subscriptionPaymentType,
        circumstance: subscriptionCircumstance,
        money_source: subscriptionMoneySource,
        day_of_month: Number(subscriptionDayOfMonth),
      };

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");

      setMsg(`Subscription saved (id=${data.id}).`);
      resetSubscriptionFlow();
      setMode("home");
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
        {mode === "home" && (
          <div>
            <div className="text-lg font-semibold mb-4">What do you want to add?</div>
            <div className="flex gap-3 flex-wrap">
              <PrimaryButton label="Add expense" onClick={startExpenseFlow} />
              <PrimaryButton label="Add subscription" onClick={startSubscriptionFlow} />
            </div>
          </div>
        )}

        {mode === "expense" && (
          <div>
            <div className="text-sm text-gray-500">Expense step {step + 1} / 9</div>
            <div className="text-xs text-gray-400 mt-1">{expenseSummaryLine() || "—"}</div>

            <div className="mt-4">
              {step === 0 && (
                <div>
                  <div className="text-lg font-semibold mb-2">Amount (NOK)</div>
                  <input
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="e.g. 129.90"
                    value={expenseAmountNok}
                    onChange={(e) => setExpenseAmountNok(e.target.value)}
                    inputMode="decimal"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedExpenseAmount()) setStep(1);
                    }}
                  />
                  <div className="mt-3">
                    <PrimaryButton
                      label="Next"
                      onClick={() => setStep(1)}
                      disabled={!canProceedExpenseAmount()}
                    />
                  </div>
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
                  <div className="mt-3">
                    <PrimaryButton
                      label="Next"
                      onClick={() => setStep(3)}
                      disabled={!canProceedExpenseDate()}
                    />
                  </div>
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
                          setExpenseCategory(c);
                          setExpenseSubcategory("");
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
                  {!expenseCategory ? (
                    <div className="text-gray-600">Pick a category first.</div>
                  ) : expenseSubcategoryOptions.length ? (
                    <div className="flex gap-2 flex-wrap">
                      {expenseSubcategoryOptions.map((sc) => (
                        <Chip
                          key={sc}
                          label={sc}
                          onClick={() => {
                            setExpenseSubcategory(sc);
                            setStep(5);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">No subcategories for {expenseCategory}.</div>
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
                          setExpensePaymentType(p);
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
                          setExpenseCircumstance(c);
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
                          setExpenseMoneySource(m);
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
                    value={expenseComment}
                    onChange={(e) => setExpenseComment(e.target.value)}
                    rows={4}
                  />

                  <div className="mt-3 flex gap-2">
                    <PrimaryButton
                      label={saving ? "Saving..." : "Save"}
                      onClick={() => saveExpense(true)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="px-4 py-3 rounded-lg border font-semibold disabled:opacity-60"
                      onClick={() => saveExpense(false)}
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
                onClick={expenseBack}
                disabled={saving}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                type="button"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {mode === "subscription" && (
          <div>
            <div className="text-sm text-gray-500">Subscription step {step + 1} / 8</div>
            <div className="text-xs text-gray-400 mt-1">
              {subscriptionSummaryLine() || "—"}
            </div>

            <div className="mt-4">
              {step === 0 && (
                <div>
                  <div className="text-lg font-semibold mb-2">Subscription name</div>
                  <input
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="e.g. Spotify"
                    value={subscriptionName}
                    onChange={(e) => setSubscriptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedSubscriptionName()) setStep(1);
                    }}
                  />
                  <div className="mt-3">
                    <PrimaryButton
                      label="Next"
                      onClick={() => setStep(1)}
                      disabled={!canProceedSubscriptionName()}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="text-lg font-semibold mb-2">Amount (NOK)</div>
                  <input
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="e.g. 129.00"
                    value={subscriptionAmountNok}
                    onChange={(e) => setSubscriptionAmountNok(e.target.value)}
                    inputMode="decimal"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedSubscriptionAmount()) setStep(2);
                    }}
                  />
                  <div className="mt-3">
                    <PrimaryButton
                      label="Next"
                      onClick={() => setStep(2)}
                      disabled={!canProceedSubscriptionAmount()}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="text-lg font-semibold mb-2">Day of month</div>
                  <input
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="e.g. 15"
                    value={subscriptionDayOfMonth}
                    onChange={(e) => setSubscriptionDayOfMonth(e.target.value)}
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedSubscriptionDay()) setStep(3);
                    }}
                  />
                  <div className="mt-3">
                    <PrimaryButton
                      label="Next"
                      onClick={() => setStep(3)}
                      disabled={!canProceedSubscriptionDay()}
                    />
                  </div>
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
                          setSubscriptionCategory(c);
                          setSubscriptionSubcategory("");
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
                  {!subscriptionCategory ? (
                    <div className="text-gray-600">Pick a category first.</div>
                  ) : subscriptionSubcategoryOptions.length ? (
                    <div className="flex gap-2 flex-wrap">
                      {subscriptionSubcategoryOptions.map((sc) => (
                        <Chip
                          key={sc}
                          label={sc}
                          onClick={() => {
                            setSubscriptionSubcategory(sc);
                            setStep(5);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      No subcategories for {subscriptionCategory}.
                    </div>
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
                          setSubscriptionPaymentType(p);
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
                          setSubscriptionCircumstance(c);
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
                        onClick={() => setSubscriptionMoneySource(m)}
                      />
                    ))}
                  </div>

                  <div className="mt-3">
                    <PrimaryButton
                      label={saving ? "Saving..." : "Save subscription"}
                      onClick={saveSubscription}
                      disabled={saving || !subscriptionMoneySource}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={subscriptionBack}
                disabled={saving}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                type="button"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {msg && <div className="mt-4 text-sm">{msg}</div>}
      </div>
    </main>
  );
}