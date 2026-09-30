// Phase 25. Standard fixed-rate amortization. Pure function so the maths is
// testable apart from the calculator UI.
export type MortgageInput = {
  price: number;
  downPaymentPct: number; // 0-100
  years: number;
  annualRatePct: number; // 0-100
};

export type MortgageResult = {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPaid: number; // sum of all monthly payments (excludes down payment)
  totalInterest: number;
};

export function calculateMortgage({
  price,
  downPaymentPct,
  years,
  annualRatePct,
}: MortgageInput): MortgageResult {
  const pct = Math.min(Math.max(downPaymentPct, 0), 100);
  const downPayment = price * (pct / 100);
  const loanAmount = Math.max(price - downPayment, 0);
  const n = Math.max(Math.round(years * 12), 1);
  const r = Math.max(annualRatePct, 0) / 100 / 12;

  const monthlyPayment =
    loanAmount === 0
      ? 0
      : r === 0
        ? loanAmount / n
        : (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const totalPaid = monthlyPayment * n;
  return {
    downPayment,
    loanAmount,
    monthlyPayment,
    totalPaid,
    totalInterest: Math.max(totalPaid - loanAmount, 0),
  };
}
