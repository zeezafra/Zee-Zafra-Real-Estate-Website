"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { calculateMortgage } from "@/lib/mortgage";
import InquireButton from "./InquireButton";

const TERMS = [5, 10, 15, 20, 25, 30];

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

// Phase 25. Estimate only — rates/terms are the bank's or Pag-IBIG's to
// decide, so every input is editable and the footnote says so. Default
// rate is a neutral starting point, not a quoted offer.
export default function MortgageCalculator({
  price,
  propertyId,
  propertyTitle,
}: {
  price: number;
  propertyId: string;
  propertyTitle: string;
}) {
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState("7");

  const result = useMemo(
    () =>
      calculateMortgage({
        price,
        downPaymentPct: downPct,
        years,
        annualRatePct: Number(rate) || 0,
      }),
    [price, downPct, years, rate]
  );

  const fieldClass =
    "mt-1 w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold dark:border-offwhite/20 dark:bg-navy-light dark:text-offwhite";
  const labelClass = "block text-sm font-medium text-navy dark:text-offwhite";

  return (
    <section
      aria-labelledby="mortgage-heading"
      className="mt-8 rounded-2xl border border-navy/10 p-6 dark:border-offwhite/10"
    >
      <h2
        id="mortgage-heading"
        className="flex items-center gap-2 text-lg font-semibold text-navy dark:text-offwhite"
      >
        <Calculator size={18} className="text-gold" />
        Monthly Payment Estimate
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          <span className="flex justify-between">
            <span>Down payment</span>
            <span className="text-gold">
              {downPct}% · {peso(result.downPayment)}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="mt-2 w-full accent-gold"
          />
        </label>

        <label className={labelClass}>
          Loan term
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className={fieldClass}
          >
            {TERMS.map((t) => (
              <option key={t} value={t}>
                {t} years
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Interest rate (% per year)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={30}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-navy/5 p-5 dark:bg-white/5" aria-live="polite">
        <p className="text-sm text-navy/60 dark:text-offwhite/60">Estimated monthly payment</p>
        <p className="text-3xl font-bold text-navy dark:text-gold">
          {peso(result.monthlyPayment)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-navy/50 dark:text-offwhite/50">Loan amount</dt>
            <dd className="font-semibold text-navy dark:text-offwhite">{peso(result.loanAmount)}</dd>
          </div>
          <div>
            <dt className="text-navy/50 dark:text-offwhite/50">Total interest</dt>
            <dd className="font-semibold text-navy dark:text-offwhite">
              {peso(result.totalInterest)}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-xs text-navy/50 dark:text-offwhite/50">
        Estimate only, based on a fixed rate for the whole term. It excludes fees, insurance and
        closing costs. Actual rates and terms depend on your bank or Pag-IBIG approval.
      </p>

      <InquireButton
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        source="PROPERTY_PAGE"
        className="mt-4 text-sm font-semibold text-gold underline-offset-4 hover:underline"
      >
        Ask me about financing options →
      </InquireButton>
    </section>
  );
}
