
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Keyboard, RotateCcw, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculadora Plus — Rápida & Precisa" },
      {
        name: "description",
        content:
          "Uma calculadora simples, moderna e bonita para o seu dia a dia. Some, subtraia, multiplique e divida com facilidade.",
      },
      { property: "og:title", content: "Calculadora Plus — Rápida & Precisa" },
      {
        property: "og:description",
        content:
          "Uma calculadora simples, moderna e bonita para o seu dia a dia. Some, subtraia, multiplique e divida com facilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Calculadora Plus — Rápida & Precisa",
      },
      {
        name: "twitter:description",
        content:
          "Uma calculadora simples, moderna e bonita para o seu dia a dia. Some, subtraia, multiplique e divida com facilidade.",
      },
    ],
  }),
  component: Index,
});

type Operator = "+" | "−" | "×" | "÷";

const MAX_DIGITS = 12;

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "Erro";
  const str = value.toString();
  if (str.length > MAX_DIGITS) {
    return value.toPrecision(MAX_DIGITS - 1);
  }
  return str;
}

function Index() {
  const [display, setDisplay] = useState<string>("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [history, setHistory] = useState<string>("");
  const [freshResult, setFreshResult] = useState<boolean>(false);
  const [popKey, setPopKey] = useState<number>(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPop = useCallback(() => {
    setPopKey((k) => k + 1);
  }, []);

  const triggerPress = useCallback((label: string) => {
    if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
    setPressedKey(label);
    pressedTimeoutRef.current = setTimeout(() => setPressedKey(null), 120);
  }, []);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setHistory("");
    setFreshResult(false);
    triggerPop();
  }, [triggerPop]);

  const deleteLast = useCallback(() => {
    if (freshResult) {
      clearAll();
      return;
    }
    setDisplay((prev) => {
      if (prev.length === 1) return "0";
      return prev.slice(0, -1) || "0";
    });
    triggerPop();
  }, [freshResult, clearAll, triggerPop]);

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (freshResult) {
          setFreshResult(false);
          return digit;
        }
        if (prev.replace("-", "").length >= MAX_DIGITS) return prev;
        if (prev === "0") return digit;
        return prev + digit;
      });
      triggerPop();
    },
    [freshResult, triggerPop]
  );

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (freshResult) {
        setFreshResult(false);
        return "0.";
      }
      if (prev.includes(".")) return prev;
      return prev + ".";
    });
    triggerPop();
  }, [freshResult, triggerPop]);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => {
      if (prev === "0") return prev;
      return prev.startsWith("-") ? prev.slice(1) : "-" + prev;
    });
    triggerPop();
  }, [triggerPop]);

  const percentage = useCallback(() => {
    setDisplay((prev) => {
      const value = parseFloat(prev);
      if (Number.isNaN(value)) return prev;
      return formatNumber(value / 100);
    });
    setFreshResult(true);
    triggerPop();
  }, [triggerPop]);

  const calculate = useCallback(
    (left: number, right: number, op: Operator): number => {
      switch (op) {
        case "+":
          return left + right;
        case "−":
          return left - right;
        case "×":
          return left * right;
        case "÷":
          return right === 0 ? NaN : left / right;
        default:
          return right;
      }
    },
    []
  );

  const applyOperator = useCallback(
    (nextOperator: Operator) => {
      const currentValue = parseFloat(display);
      if (Number.isNaN(currentValue)) return;

      if (previous !== null && operator && !freshResult) {
        const result = calculate(previous, currentValue, operator);
        const formatted = formatNumber(result);
        setDisplay(formatted);
        setPrevious(result);
        setHistory(`${formatted} ${nextOperator}`);
      } else {
        setPrevious(currentValue);
        setHistory(`${display} ${nextOperator}`);
      }

      setOperator(nextOperator);
      setFreshResult(true);
      triggerPop();
    },
    [display, previous, operator, freshResult, calculate, triggerPop]
  );

  const equals = useCallback(() => {
    if (previous === null || operator === null) return;
    const currentValue = parseFloat(display);
    if (Number.isNaN(currentValue)) return;

    const result = calculate(previous, currentValue, operator);
    setHistory(`${previous} ${operator} ${display} =`);
    setDisplay(formatNumber(result));
    setPrevious(null);
    setOperator(null);
    setFreshResult(true);
    triggerPop();
  }, [display, previous, operator, calculate, triggerPop]);

  const handleKey = useCallback(
    (key: string) => {
      if (/^[0-9]$/.test(key)) {
        inputDigit(key);
        triggerPress(key);
      } else if (key === "." || key === ",") {
        inputDecimal();
        triggerPress(".");
      } else if (key === "+") {
        applyOperator("+");
        triggerPress("+");
      } else if (key === "-") {
        applyOperator("−");
        triggerPress("−");
      } else if (key === "*") {
        applyOperator("×");
        triggerPress("×");
      } else if (key === "/") {
        applyOperator("÷");
        triggerPress("÷");
      } else if (key === "Enter" || key === "=") {
        equals();
        triggerPress("=");
      } else if (key === "Escape") {
        clearAll();
        triggerPress("AC");
      } else if (key === "Backspace") {
        deleteLast();
        triggerPress("⌫");
      }
    },
    [
      inputDigit,
      inputDecimal,
      applyOperator,
      equals,
      clearAll,
      deleteLast,
      triggerPress,
    ]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleKey(event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const renderKey = (
    label: string,
    value: string,
    className: string,
    span: number = 1
  ) => (
    <button
      key={label}
      onClick={() => handleKey(value)}
      className={[
        "calc-key h-14 sm:h-16 rounded-2xl text-2xl font-[family-name:var(--font-fredoka)] font-medium select-none flex items-center justify-center",
        span === 2 ? "col-span-2" : "",
        className,
        pressedKey === label ? "pressed" : "",
      ].join(" ")}
      aria-label={label}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col justify-between text-ink relative">
      {/* Tactile Navbar */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 z-20 calc-fade-up">
        <nav className="w-full rounded-2xl bg-sand/85 backdrop-blur-md ring-1 ring-ink/5 px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-rose grid place-items-center text-white text-base font-[family-name:var(--font-fredoka)] font-bold ring-1 ring-white/40 shadow-sm">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink leading-none">
                  Calculadora
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-rose/15 text-rose-deep px-1.5 py-0.5 rounded-md leading-none">
                  Plus
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink-soft leading-none mt-1">
                Rápida & Precisa
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shortcuts button */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="calc-key flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-display ring-1 ring-ink/5 text-ink hover:bg-white text-xs font-semibold select-none cursor-pointer"
              title="Ver atalhos do teclado"
            >
              <Keyboard className="size-3.5 text-rose-deep" />
              <span className="hidden sm:inline">Atalhos</span>
            </button>

            {/* Quick Clear button */}
            <button
              onClick={clearAll}
              className="calc-key flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose text-white ring-1 ring-white/30 text-xs font-semibold select-none hover:bg-rose-deep cursor-pointer"
              title="Limpar calculadora (Esc)"
            >
              <RotateCcw className="size-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content / Calculator */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-10">
        <div className="calc-fade-up w-full max-w-[360px] rounded-[min(5vw,30px)] bg-sand ring-1 ring-ink/5 p-4 sm:p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)]">
          {/* Display */}
          <div className="rounded-[min(4vw,20px)] bg-display ring-1 ring-ink/5 px-5 pt-5 pb-4 h-[148px] flex flex-col items-end justify-end overflow-hidden shadow-inner">
            {/* History preview */}
            <div className="w-full flex items-center justify-end gap-2 h-6 text-ink-soft">
              <span className="text-lg font-medium font-[family-name:var(--font-quicksand)] truncate">
                {history}
              </span>
            </div>
            {/* Current result */}
            <div className="w-full text-right mt-1">
              <span
                key={popKey}
                className="calc-pop inline-block text-[52px] leading-none font-[family-name:var(--font-fredoka)] font-medium tracking-tight text-ink tabular-nums break-all"
              >
                {display}
              </span>
            </div>
            <div className="w-full flex items-center justify-end gap-1.5 mt-2">
              <span className="size-1.5 rounded-full bg-rose"></span>
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                pronto
              </span>
            </div>
          </div>

          {/* Key grid */}
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-3">
            {renderKey(
              "AC",
              "Escape",
              "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep"
            )}
            {renderKey(
              "±",
              "±",
              "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep"
            )}
            {renderKey(
              "%",
              "%",
              "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep"
            )}
            {renderKey(
              "÷",
              "/",
              "bg-rose text-white text-3xl ring-1 ring-white/30 active:bg-rose-deep"
            )}

            {renderKey("7", "7", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("8", "8", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("9", "9", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey(
              "×",
              "*",
              "bg-rose text-white text-3xl ring-1 ring-white/30 active:bg-rose-deep"
            )}

            {renderKey("4", "4", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("5", "5", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("6", "6", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey(
              "−",
              "-",
              "bg-rose text-white text-3xl ring-1 ring-white/30 active:bg-rose-deep"
            )}

            {renderKey("1", "1", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("2", "2", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey("3", "3", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey(
              "+",
              "+",
              "bg-rose text-white text-3xl ring-1 ring-white/30 active:bg-rose-deep"
            )}

            {renderKey(
              "0",
              "0",
              "bg-display ring-1 ring-ink/5 active:bg-sand",
              2
            )}
            {renderKey(".", ".", "bg-display ring-1 ring-ink/5 active:bg-sand")}
            {renderKey(
              "=",
              "Enter",
              "bg-mint text-ink text-3xl font-semibold ring-1 ring-white/40 active:brightness-95"
            )}
          </div>
        </div>
      </main>

      {/* Footnote */}
      <footer className="w-full pb-6 px-4 text-center calc-fade-up">
        <p className="text-sm font-medium text-ink-soft">
          Maxwell Você é o Melhro
        </p>
      </footer>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-sand p-6 ring-1 ring-ink/5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                  <Keyboard className="size-4" />
                </div>
                <h3 className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink">
                  Atalhos do Teclado
                </h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="size-8 rounded-full bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between p-2 rounded-xl bg-display ring-1 ring-ink/5">
                <span className="text-ink-soft">Números</span>
                <kbd className="px-2 py-1 rounded-lg bg-sand font-mono text-xs font-bold text-ink ring-1 ring-ink/5">
                  0 – 9
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-display ring-1 ring-ink/5">
                <span className="text-ink-soft">Operações</span>
                <kbd className="px-2 py-1 rounded-lg bg-sand font-mono text-xs font-bold text-ink ring-1 ring-ink/5">
                  + - * /
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-display ring-1 ring-ink/5">
                <span className="text-ink-soft">Calcular resultado</span>
                <kbd className="px-2 py-1 rounded-lg bg-sand font-mono text-xs font-bold text-ink ring-1 ring-ink/5">
                  Enter ou =
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-display ring-1 ring-ink/5">
                <span className="text-ink-soft">Limpar tudo</span>
                <kbd className="px-2 py-1 rounded-lg bg-sand font-mono text-xs font-bold text-ink ring-1 ring-ink/5">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-display ring-1 ring-ink/5">
                <span className="text-ink-soft">Apagar dígito</span>
                <kbd className="px-2 py-1 rounded-lg bg-sand font-mono text-xs font-bold text-ink ring-1 ring-ink/5">
                  Backspace
                </kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="calc-key mt-5 w-full py-2.5 rounded-xl bg-mint text-ink font-[family-name:var(--font-fredoka)] font-semibold text-center cursor-pointer shadow-sm"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
  