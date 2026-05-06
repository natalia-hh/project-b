import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type AddMode = "quantity" | "notional";

type FormState = {
  currentQuantity: string;
  currentAveragePrice: string;
  averagingPrice: string;
  additionalQuantity: string;
  additionalNotional: string;
  leverage: string;
  addMode: AddMode;
};

type ResultItemProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "primary" | "accent";
};

const initialState: FormState = {
  currentQuantity: "78",
  currentAveragePrice: "87.51",
  averagingPrice: "91.49",
  additionalQuantity: "40",
  additionalNotional: "3660",
  leverage: "5",
  addMode: "quantity"
};

const emptyState: FormState = {
  currentQuantity: "",
  currentAveragePrice: "",
  averagingPrice: "",
  additionalQuantity: "",
  additionalNotional: "",
  leverage: "",
  addMode: "quantity"
};

const toNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value: number, maximumFractionDigits = 0) => {
  if (!Number.isFinite(value)) return "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
};

const formatMoney = (value: number) => `${formatNumber(value, 0)} USDT`;
const formatPrice = (value: number) => `${formatNumber(value, 0)} USDT`;
const formatQuantity = (value: number) => formatNumber(value, 2);
const numberInputValue = (value: number, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value) || value === 0) return "";
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
};

function App() {
  const [form, setForm] = React.useState<FormState>(initialState);

  const values = React.useMemo(() => {
    const currentQuantity = Math.max(0, toNumber(form.currentQuantity));
    const currentAveragePrice = toNumber(form.currentAveragePrice);
    const averagingPrice = toNumber(form.averagingPrice);
    const leverage = toNumber(form.leverage);
    const priceIsValid = currentAveragePrice > 0 && averagingPrice > 0;
    const leverageIsValid = leverage > 0;
    const currentNotional = currentAveragePrice > 0 ? currentQuantity * currentAveragePrice : 0;
    const currentMarketValue = averagingPrice > 0 ? currentQuantity * averagingPrice : 0;
    const hasAddInput =
      form.addMode === "quantity"
        ? form.additionalQuantity.trim() !== ""
        : form.additionalNotional.trim() !== "";

    const additionalQuantity =
      hasAddInput && averagingPrice > 0
        ? form.addMode === "quantity"
          ? Math.max(0, toNumber(form.additionalQuantity))
          : Math.max(0, toNumber(form.additionalNotional)) / averagingPrice
        : 0;

    const additionalNotional =
      hasAddInput && averagingPrice > 0
        ? form.addMode === "quantity"
          ? additionalQuantity * averagingPrice
          : Math.max(0, toNumber(form.additionalNotional))
        : 0;

    const newTotalQuantity = currentQuantity + additionalQuantity;
    const newTotalNotional = currentNotional + additionalNotional;
    const newAveragePrice =
      priceIsValid && newTotalQuantity > 0
        ? ((currentQuantity * currentAveragePrice) + (additionalQuantity * averagingPrice)) /
          newTotalQuantity
        : 0;
    const marginToAdd = leverageIsValid ? additionalNotional / leverage : 0;
    const finalMargin = leverageIsValid ? newTotalNotional / leverage : 0;
    const averageDifference = currentAveragePrice > 0 ? newAveragePrice - currentAveragePrice : 0;
    const averageChangePercent =
      currentAveragePrice > 0 ? (averageDifference / currentAveragePrice) * 100 : 0;

    return {
      currentQuantity,
      currentAveragePrice,
      averagingPrice,
      leverage,
      currentNotional,
      currentMarketValue,
      additionalQuantity,
      additionalNotional,
      newTotalQuantity,
      newTotalNotional,
      newAveragePrice,
      marginToAdd,
      finalMargin,
      averageDifference,
      averageChangePercent
    };
  }, [form]);

  const issues = [
    form.currentQuantity !== "" && toNumber(form.currentQuantity) < 0
      ? "Current quantity must be 0 or greater."
      : "",
    form.currentAveragePrice !== "" && toNumber(form.currentAveragePrice) <= 0
      ? "Current average entry price must be greater than 0."
      : "",
    form.averagingPrice !== "" && toNumber(form.averagingPrice) <= 0
      ? "Market or averaging price must be greater than 0."
      : "",
    form.leverage !== "" && toNumber(form.leverage) <= 0 ? "Leverage must be greater than 0." : "",
    form.additionalQuantity !== "" && toNumber(form.additionalQuantity) < 0
      ? "Additional quantity must be 0 or greater."
      : "",
    form.additionalNotional !== "" && toNumber(form.additionalNotional) < 0
      ? "Additional notional must be 0 or greater."
      : ""
  ].filter(Boolean);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      const price = toNumber(next.averagingPrice);

      if ((field === "additionalQuantity" || field === "averagingPrice") && next.addMode === "quantity") {
        const quantity = Math.max(0, toNumber(next.additionalQuantity));
        next.additionalNotional =
          next.additionalQuantity.trim() === "" || price <= 0 ? "" : String(quantity * price);
      }

      if ((field === "additionalNotional" || field === "averagingPrice") && next.addMode === "notional") {
        const notional = Math.max(0, toNumber(next.additionalNotional));
        next.additionalQuantity =
          next.additionalNotional.trim() === "" || price <= 0 ? "" : String(notional / price);
      }

      return next;
    });
  };

  const setMode = (mode: AddMode) => {
    setForm((current) => {
      const price = toNumber(current.averagingPrice);
      const next = { ...current, addMode: mode };

      if (mode === "quantity") {
        const quantity = Math.max(0, toNumber(current.additionalQuantity));
        next.additionalNotional =
          current.additionalQuantity.trim() === "" || price <= 0 ? "" : String(quantity * price);
      } else {
        const notional = Math.max(0, toNumber(current.additionalNotional));
        next.additionalQuantity =
          current.additionalNotional.trim() === "" || price <= 0 ? "" : String(notional / price);
      }

      return next;
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Trading position tool
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Position Average Calculator
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Estimate the impact of adding to an existing same-direction position, including
              notional, average entry, total size, and leverage-based margin.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100"
            onClick={() => setForm(emptyState)}
            type="button"
          >
            Reset
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="grid gap-6">
            <InputCard
              title="Current Position"
              description="Enter your existing size, average entry, and the price where the add-on is planned."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Current quantity"
                  value={form.currentQuantity}
                  onChange={(value) => updateField("currentQuantity", value)}
                  helper="Amount already held."
                  min={0}
                />
                <NumberField
                  label="Average entry price"
                  value={form.currentAveragePrice}
                  onChange={(value) => updateField("currentAveragePrice", value)}
                  helper="Current average before adding."
                  suffix="USDT"
                  min={0.01}
                />
                <NumberField
                  label="Market or averaging price"
                  value={form.averagingPrice}
                  onChange={(value) => updateField("averagingPrice", value)}
                  helper="Used as the add-on execution price."
                  suffix="USDT"
                  min={0.01}
                />
                <NumberField
                  label="Leverage"
                  value={form.leverage}
                  onChange={(value) => updateField("leverage", value)}
                  helper="Used for margin estimates."
                  suffix="x"
                  min={0.01}
                />
              </div>
            </InputCard>

            <InputCard
              title="Add To Position"
              description="Choose whether quantity or notional drives the add-on calculation."
            >
              <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                <ModeButton active={form.addMode === "quantity"} onClick={() => setMode("quantity")}>
                  Add by quantity
                </ModeButton>
                <ModeButton active={form.addMode === "notional"} onClick={() => setMode("notional")}>
                  Add by notional
                </ModeButton>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Additional quantity"
                  value={
                    form.addMode === "quantity"
                      ? form.additionalQuantity
                      : values.additionalQuantity
                        ? numberInputValue(values.additionalQuantity, 2)
                        : ""
                  }
                  onChange={(value) => updateField("additionalQuantity", value)}
                  helper={form.addMode === "quantity" ? "This field is the source." : "Calculated from notional."}
                  readOnly={form.addMode === "notional"}
                  min={0}
                />
                <NumberField
                  label="Additional notional"
                  value={
                    form.addMode === "notional"
                      ? form.additionalNotional
                      : values.additionalNotional
                        ? numberInputValue(values.additionalNotional, 0)
                        : ""
                  }
                  onChange={(value) => updateField("additionalNotional", value)}
                  helper={form.addMode === "notional" ? "This field is the source." : "Calculated from quantity."}
                  readOnly={form.addMode === "quantity"}
                  suffix="USDT"
                  min={0}
                />
              </div>
            </InputCard>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
              This assumes adding to the same direction position. It does not handle reducing,
              closing, flipping direction, liquidation price, fees, funding, maintenance margin,
              or exchange-specific margin rules.
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-6 lg:self-start">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Results Summary</h2>
                <p className="mt-1 text-sm text-slate-500">Live calculations from the inputs.</p>
              </div>
              <div className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white">
                {formatNumber(values.leverage, 2)}x
              </div>
            </div>

            {issues.length > 0 && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                {issues.map((issue) => (
                  <p key={issue}>{issue}</p>
                ))}
              </div>
            )}

            <div className="grid gap-3">
              <ResultItem
                label="New Average Entry Price"
                value={formatPrice(values.newAveragePrice)}
                helper={`${formatNumber(values.averageDifference, 2)} USDT change, ${formatNumber(
                  values.averageChangePercent,
                  2
                )}%`}
                tone="primary"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <ResultItem
                  label="Required Margin to Add"
                  value={formatMoney(values.marginToAdd)}
                  tone="accent"
                />
                <ResultItem
                  label="Final Required Margin"
                  value={formatMoney(values.finalMargin)}
                  tone="accent"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ResultItem label="Current Notional" value={formatMoney(values.currentNotional)} />
                <ResultItem label="Current Market Value" value={formatMoney(values.currentMarketValue)} />
                <ResultItem label="Additional Quantity" value={formatQuantity(values.additionalQuantity)} />
                <ResultItem label="Additional Notional" value={formatMoney(values.additionalNotional)} />
                <ResultItem label="New Total Quantity" value={formatQuantity(values.newTotalQuantity)} />
                <ResultItem label="New Total Notional" value={formatMoney(values.newTotalNotional)} />
                <ResultItem
                  label="Average Price Difference"
                  value={`${formatNumber(values.averageDifference, 2)} USDT`}
                />
                <ResultItem
                  label="Average Entry Change"
                  value={`${formatNumber(values.averageChangePercent, 2)}%`}
                />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InputCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  helper,
  suffix,
  readOnly,
  min
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  suffix?: string;
  readOnly?: boolean;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 pr-16 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 read-only:border-slate-200 read-only:bg-slate-100 read-only:text-slate-600"
          inputMode="decimal"
          min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          readOnly={readOnly}
          step="any"
          type="number"
          value={value}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </span>
      {helper && <span className="mt-2 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

function ModeButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`h-10 rounded-md text-sm font-semibold transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ResultItem({ label, value, helper, tone = "default" }: ResultItemProps) {
  const styles = {
    default: "border-slate-200 bg-slate-50",
    primary: "border-teal-200 bg-teal-50",
    accent: "border-blue-200 bg-blue-50"
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p
        className={`mt-2 break-words font-semibold tracking-normal ${
          tone === "primary" ? "text-3xl text-teal-900" : "text-2xl text-slate-950"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-2 text-sm text-slate-600">{helper}</p>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
