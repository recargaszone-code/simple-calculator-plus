
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Calculator,
  History,
  Coins,
  Scale,
  Palette,
  Keyboard,
  RotateCcw,
  X,
  Copy,
  Check,
  Trash2,
  ArrowRightLeft,
  Atom,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculadora Plus — Rápida, Científica & Conversores" },
      {
        name: "description",
        content:
          "Calculadora completa com modos padrão e científico, histórico de cálculos, conversor de moedas e unidades, além de múltiplos temas visuais.",
      },
      { property: "og:title", content: "Calculadora Plus — Rápida, Científica & Conversores" },
      {
        property: "og:description",
        content:
          "Calculadora completa com modos padrão e científico, histórico de cálculos, conversor de moedas e unidades.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type Operator = "+" | "−" | "×" | "÷" | "^";
type AppTab = "calc" | "currency" | "units";
type ThemeType = "candy" | "dark" | "sapphire" | "emerald";

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

const MAX_DIGITS = 12;

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "Erro";
  const str = value.toString();
  if (str.length > MAX_DIGITS) {
    return value.toPrecision(MAX_DIGITS - 1);
  }
  return str;
}

// Currency exchange rates (base USD)
const EXCHANGE_RATES: Record<string, { name: string; symbol: string; rate: number }> = {
  BRL: { name: "Real Brasileiro", symbol: "R$", rate: 5.75 },
  USD: { name: "Dólar Americano", symbol: "$", rate: 1.0 },
  EUR: { name: "Euro", symbol: "€", rate: 0.92 },
  GBP: { name: "Libra Esterlina", symbol: "£", rate: 0.78 },
  JPY: { name: "Iene Japonês", symbol: "¥", rate: 154.2 },
  CAD: { name: "Dólar Canadense", symbol: "C$", rate: 1.39 },
  ARS: { name: "Peso Argentino", symbol: "$", rate: 1060.0 },
  BTC: { name: "Bitcoin", symbol: "₿", rate: 0.000011 },
};

// Unit conversion definitions
type UnitCategory = "length" | "weight" | "temperature" | "speed" | "area";

interface UnitDef {
  label: string;
  ratio: number; // to base unit
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
}

const UNIT_DATA: Record<
  UnitCategory,
  { name: string; base: string; units: Record<string, UnitDef> }
> = {
  length: {
    name: "Comprimento",
    base: "m",
    units: {
      m: { label: "Metros (m)", ratio: 1 },
      km: { label: "Quilômetros (km)", ratio: 1000 },
      cm: { label: "Centímetros (cm)", ratio: 0.01 },
      mm: { label: "Milímetros (mm)", ratio: 0.001 },
      mi: { label: "Milhas (mi)", ratio: 1609.34 },
      ft: { label: "Pés (ft)", ratio: 0.3048 },
      in: { label: "Polegadas (in)", ratio: 0.0254 },
    },
  },
  weight: {
    name: "Peso & Massa",
    base: "kg",
    units: {
      kg: { label: "Quilogramas (kg)", ratio: 1 },
      g: { label: "Gramas (g)", ratio: 0.001 },
      mg: { label: "Miligramas (mg)", ratio: 0.000001 },
      ton: { label: "Toneladas (t)", ratio: 1000 },
      lb: { label: "Libras (lb)", ratio: 0.453592 },
      oz: { label: "Onças (oz)", ratio: 0.0283495 },
    },
  },
  temperature: {
    name: "Temperatura",
    base: "C",
    units: {
      C: {
        label: "Celsius (°C)",
        ratio: 1,
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      F: {
        label: "Fahrenheit (°F)",
        ratio: 1,
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      K: {
        label: "Kelvin (K)",
        ratio: 1,
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    },
  },
  speed: {
    name: "Velocidade",
    base: "kmh",
    units: {
      kmh: { label: "Quilômetros por hora (km/h)", ratio: 1 },
      ms: { label: "Metros por segundo (m/s)", ratio: 3.6 },
      mph: { label: "Milhas por hora (mph)", ratio: 1.60934 },
      knots: { label: "Nós (kn)", ratio: 1.852 },
    },
  },
  area: {
    name: "Área",
    base: "m2",
    units: {
      m2: { label: "Metros quadrados (m²)", ratio: 1 },
      km2: { label: "Quilômetros quadrados (km²)", ratio: 1000000 },
      ha: { label: "Hectares (ha)", ratio: 10000 },
      ac: { label: "Acres (ac)", ratio: 4046.86 },
      ft2: { label: "Pés quadrados (ft²)", ratio: 0.092903 },
    },
  },
};

function Index() {
  // App navigation state
  const [activeTab, setActiveTab] = useState<AppTab>("calc");
  const [scientificMode, setScientificMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeType>("candy");
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);

  // Calculator State
  const [display, setDisplay] = useState<string>("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [history, setHistory] = useState<string>("");
  const [freshResult, setFreshResult] = useState<boolean>(false);
  const [popKey, setPopKey] = useState<number>(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [calculationHistory, setCalculationHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Currency Converter State
  const [currAmount, setCurrAmount] = useState<string>("100");
  const [fromCurr, setFromCurr] = useState<string>("USD");
  const [toCurr, setToCurr] = useState<string>("BRL");

  // Unit Converter State
  const [unitCat, setUnitCat] = useState<UnitCategory>("length");
  const [unitAmount, setUnitAmount] = useState<string>("10");
  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("km");

  // Apply Theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  // Load history from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem("calc_history_plus");
      if (saved) {
        setCalculationHistory(JSON.parse(saved));
      }
    } catch {
      // safe fallback
    }
  }, []);

  const saveHistoryItem = useCallback((expr: string, res: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      expression: expr,
      result: res,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setCalculationHistory((prev) => {
      const updated = [newItem, ...prev.slice(0, 49)];
      try {
        localStorage.setItem("calc_history_plus", JSON.stringify(updated));
      } catch {
        // safe fallback
      }
      return updated;
    });
  }, []);

  const clearCalculationHistory = useCallback(() => {
    setCalculationHistory([]);
    try {
      localStorage.removeItem("calc_history_plus");
    } catch {
      // safe fallback
    }
  }, []);

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
      if (prev.length === 1 || (prev.startsWith("-") && prev.length === 2)) return "0";
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
      const res = formatNumber(value / 100);
      saveHistoryItem(`${prev}%`, res);
      return res;
    });
    setFreshResult(true);
    triggerPop();
  }, [saveHistoryItem, triggerPop]);

  // Scientific Single Value Functions
  const applyScientificFunction = useCallback(
    (fnName: string) => {
      const val = parseFloat(display);
      if (Number.isNaN(val)) return;

      let result = 0;
      let expr = "";

      switch (fnName) {
        case "sqrt":
          if (val < 0) {
            setDisplay("Erro");
            setFreshResult(true);
            return;
          }
          result = Math.sqrt(val);
          expr = `√(${display})`;
          break;
        case "sqr":
          result = Math.pow(val, 2);
          expr = `(${display})²`;
          break;
        case "cube":
          result = Math.pow(val, 3);
          expr = `(${display})³`;
          break;
        case "sin":
          result = Math.sin((val * Math.PI) / 180);
          expr = `sin(${display}°)`;
          break;
        case "cos":
          result = Math.cos((val * Math.PI) / 180);
          expr = `cos(${display}°)`;
          break;
        case "tan":
          result = Math.tan((val * Math.PI) / 180);
          expr = `tan(${display}°)`;
          break;
        case "ln":
          if (val <= 0) {
            setDisplay("Erro");
            setFreshResult(true);
            return;
          }
          result = Math.log(val);
          expr = `ln(${display})`;
          break;
        case "log":
          if (val <= 0) {
            setDisplay("Erro");
            setFreshResult(true);
            return;
          }
          result = Math.log10(val);
          expr = `log₁₀(${display})`;
          break;
        case "inv":
          if (val === 0) {
            setDisplay("Erro");
            setFreshResult(true);
            return;
          }
          result = 1 / val;
          expr = `1/(${display})`;
          break;
        case "pi":
          result = Math.PI;
          expr = "π";
          break;
        case "e":
          result = Math.E;
          expr = "e";
          break;
        default:
          return;
      }

      const formatted = formatNumber(result);
      setDisplay(formatted);
      setHistory(expr);
      saveHistoryItem(expr, formatted);
      setFreshResult(true);
      triggerPop();
    },
    [display, saveHistoryItem, triggerPop]
  );

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
        case "^":
          return Math.pow(left, right);
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
    const formatted = formatNumber(result);
    const expr = `${previous} ${operator} ${display}`;
    setHistory(`${expr} =`);
    setDisplay(formatted);
    saveHistoryItem(expr, formatted);
    setPrevious(null);
    setOperator(null);
    setFreshResult(true);
    triggerPop();
  }, [display, previous, operator, calculate, saveHistoryItem, triggerPop]);

  const handleKey = useCallback(
    (key: string) => {
      if (activeTab !== "calc") return;

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
      } else if (key === "^") {
        applyOperator("^");
        triggerPress("^");
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
      activeTab,
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
    span: number = 1,
    customAction?: () => void
  ) => (
    <button
      key={label}
      onClick={() => {
        if (customAction) {
          customAction();
          triggerPress(label);
        } else {
          handleKey(value);
        }
      }}
      className={[
        "calc-key h-12 sm:h-14 rounded-2xl text-xl sm:text-2xl font-[family-name:var(--font-fredoka)] font-medium select-none flex items-center justify-center cursor-pointer shadow-sm",
        span === 2 ? "col-span-2" : "",
        className,
        pressedKey === label ? "pressed" : "",
      ].join(" ")}
      aria-label={label}
    >
      {label}
    </button>
  );

  // Currency Converter calculation
  const calculateCurrency = () => {
    const num = parseFloat(currAmount) || 0;
    const fromRate = EXCHANGE_RATES[fromCurr]?.rate || 1;
    const toRate = EXCHANGE_RATES[toCurr]?.rate || 1;
    const inUSD = num / fromRate;
    const converted = inUSD * toRate;
    return converted.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  // Unit Converter calculation
  const calculateUnit = () => {
    const num = parseFloat(unitAmount) || 0;
    const cat = UNIT_DATA[unitCat];
    const uFrom = cat.units[fromUnit];
    const uTo = cat.units[toUnit];
    if (!uFrom || !uTo) return "0";

    let baseVal = 0;
    if (uFrom.toBase) {
      baseVal = uFrom.toBase(num);
    } else {
      baseVal = num * uFrom.ratio;
    }

    let finalVal = 0;
    if (uTo.fromBase) {
      finalVal = uTo.fromBase(baseVal);
    } else {
      finalVal = baseVal / uTo.ratio;
    }

    return finalVal.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col justify-between text-ink relative transition-colors duration-300">
      {/* Tactile Modern Navbar */}
      <header className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 z-20 calc-fade-up">
        <nav className="w-full rounded-3xl bg-sand/90 backdrop-blur-md ring-1 ring-ink/5 px-3 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_10px_35px_rgb(0,0,0,0.05)]">
          {/* Logo Brand */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-rose grid place-items-center text-white text-base font-[family-name:var(--font-fredoka)] font-bold ring-1 ring-white/40 shadow-sm">
                +
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink leading-none">
                    Calculadora
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-rose/20 text-rose-deep px-1.5 py-0.5 rounded-md leading-none">
                    Plus
                  </span>
                </div>
                <p className="text-[10px] font-medium text-ink-soft leading-none mt-1">
                  Rápida & Inteligente
                </p>
              </div>
            </div>

            {/* Mobile Tab Icons */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="size-8 rounded-xl bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink cursor-pointer"
                title="Trocar tema"
              >
                <Palette className="size-4 text-rose" />
              </button>
              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="size-8 rounded-xl bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink cursor-pointer relative"
                title="Histórico de cálculos"
              >
                <History className="size-4 text-rose" />
                {calculationHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-3.5 bg-rose text-white text-[9px] font-bold rounded-full grid place-items-center">
                    {calculationHistory.length > 9 ? "9+" : calculationHistory.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center bg-display p-1 rounded-2xl ring-1 ring-ink/5 w-full sm:w-auto justify-center gap-1">
            <button
              onClick={() => setActiveTab("calc")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all",
                activeTab === "calc"
                  ? "bg-rose text-white shadow-sm ring-1 ring-white/30"
                  : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              <Calculator className="size-3.5" />
              <span>Calculadora</span>
            </button>

            <button
              onClick={() => setActiveTab("currency")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all",
                activeTab === "currency"
                  ? "bg-rose text-white shadow-sm ring-1 ring-white/30"
                  : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              <Coins className="size-3.5" />
              <span>Moedas</span>
            </button>

            <button
              onClick={() => setActiveTab("units")}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all",
                activeTab === "units"
                  ? "bg-rose text-white shadow-sm ring-1 ring-white/30"
                  : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              <Scale className="size-3.5" />
              <span>Unidades</span>
            </button>
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="calc-key flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-display ring-1 ring-ink/5 text-ink hover:bg-white text-xs font-semibold select-none cursor-pointer relative"
              title="Ver histórico de cálculos"
            >
              <History className="size-3.5 text-rose-deep" />
              <span>Histórico</span>
              {calculationHistory.length > 0 && (
                <span className="size-4 bg-rose text-white text-[9px] font-bold rounded-full grid place-items-center ml-0.5">
                  {calculationHistory.length > 9 ? "9+" : calculationHistory.length}
                </span>
              )}
            </button>

            {/* Theme Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="calc-key flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-display ring-1 ring-ink/5 text-ink hover:bg-white text-xs font-semibold select-none cursor-pointer"
                title="Mudar tema de cores"
              >
                <Palette className="size-3.5 text-rose-deep" />
                <span className="capitalize">{theme}</span>
              </button>

              {/* Theme Dropdown */}
              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 w-36 rounded-2xl bg-sand p-1.5 ring-1 ring-ink/10 shadow-xl z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setShowThemeMenu(false)}
                >
                  <button
                    onClick={() => setTheme("candy")}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ink hover:bg-display"
                  >
                    <span>Candy (Pastel)</span>
                    <span className="size-3 rounded-full bg-[#f29f9f]" />
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ink hover:bg-display"
                  >
                    <span>Dark Velvet</span>
                    <span className="size-3 rounded-full bg-[#302b3d]" />
                  </button>
                  <button
                    onClick={() => setTheme("sapphire")}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ink hover:bg-display"
                  >
                    <span>Azul Safira</span>
                    <span className="size-3 rounded-full bg-[#3b82f6]" />
                  </button>
                  <button
                    onClick={() => setTheme("emerald")}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-ink hover:bg-display"
                  >
                    <span>Esmeralda Zen</span>
                    <span className="size-3 rounded-full bg-[#10b981]" />
                  </button>
                </div>
              )}
            </div>

            {/* Shortcuts button */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="calc-key p-2 rounded-xl bg-display ring-1 ring-ink/5 text-ink hover:bg-white text-xs font-semibold select-none cursor-pointer"
              title="Atalhos do teclado"
            >
              <Keyboard className="size-3.5 text-rose-deep" />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        {/* VIEW 1: CALCULATOR (Standard & Scientific) */}
        {activeTab === "calc" && (
          <div
            className={[
              "calc-fade-up w-full rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-4 sm:p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)] transition-all duration-300",
              scientificMode ? "max-w-[440px]" : "max-w-[360px]",
            ].join(" ")}
          >
            {/* Scientific Toggle & Display Header */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <button
                onClick={() => setScientificMode(!scientificMode)}
                className={[
                  "calc-key flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ring-1 ring-ink/5 cursor-pointer select-none",
                  scientificMode
                    ? "bg-rose text-white ring-white/30"
                    : "bg-display text-ink hover:bg-white",
                ].join(" ")}
                title="Alternar modo científico"
              >
                <Atom className="size-3.5" />
                <span>Científica</span>
              </button>

              <button
                onClick={clearAll}
                className="calc-key flex items-center gap-1 px-2.5 py-1 rounded-xl bg-display text-ink-soft hover:text-ink text-xs font-medium ring-1 ring-ink/5 cursor-pointer"
                title="Limpar visor"
              >
                <RotateCcw className="size-3" />
                <span>Limpar</span>
              </button>
            </div>

            {/* Display Box */}
            <div className="rounded-[min(4vw,22px)] bg-display ring-1 ring-ink/5 px-5 pt-4 pb-4 h-[142px] flex flex-col items-end justify-end overflow-hidden shadow-inner">
              {/* History preview */}
              <div className="w-full flex items-center justify-end gap-2 h-6 text-ink-soft">
                <span className="text-base sm:text-lg font-medium font-[family-name:var(--font-quicksand)] truncate">
                  {history}
                </span>
              </div>
              {/* Main Number Display */}
              <div className="w-full text-right mt-1">
                <span
                  key={popKey}
                  className="calc-pop inline-block text-[44px] sm:text-[50px] leading-none font-[family-name:var(--font-fredoka)] font-medium tracking-tight text-ink tabular-nums break-all"
                >
                  {display}
                </span>
              </div>
              <div className="w-full flex items-center justify-between gap-1.5 mt-2 text-[10px] font-medium text-ink-soft uppercase tracking-[0.16em]">
                <span>{scientificMode ? "Modo Científico" : "Padrão"}</span>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rose animate-ping"></span>
                  <span>pronto</span>
                </div>
              </div>
            </div>

            {/* Scientific Function Panel (Expanded) */}
            {scientificMode && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-4 gap-2 animate-in fade-in duration-200">
                {renderKey("√", "sqrt", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("sqrt")
                )}
                {renderKey("x²", "sqr", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("sqr")
                )}
                {renderKey("xʸ", "^", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyOperator("^")
                )}
                {renderKey("1/x", "inv", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("inv")
                )}
                {renderKey("sin", "sin", "bg-display text-ink text-xs sm:text-sm ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("sin")
                )}
                {renderKey("cos", "cos", "bg-display text-ink text-xs sm:text-sm ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("cos")
                )}
                {renderKey("tan", "tan", "bg-display text-ink text-xs sm:text-sm ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("tan")
                )}
                {renderKey("ln", "ln", "bg-display text-ink text-xs sm:text-sm ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("ln")
                )}
                {renderKey("log", "log", "bg-display text-ink text-xs sm:text-sm ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("log")
                )}
                {renderKey("π", "pi", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("pi")
                )}
                {renderKey("e", "e", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("e")
                )}
                {renderKey("x³", "cube", "bg-display text-ink text-sm sm:text-base ring-1 ring-ink/5", 1, () =>
                  applyScientificFunction("cube")
                )}
              </div>
            )}

            {/* Standard Keypad Grid */}
            <div className="mt-3.5 grid grid-cols-4 gap-2 sm:gap-2.5">
              {renderKey("AC", "Escape", "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep")}
              {renderKey("±", "±", "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep", 1, toggleSign)}
              {renderKey("%", "%", "bg-rose text-white ring-1 ring-white/30 active:bg-rose-deep", 1, percentage)}
              {renderKey("÷", "/", "bg-rose text-white text-2xl sm:text-3xl ring-1 ring-white/30 active:bg-rose-deep")}

              {renderKey("7", "7", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("8", "8", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("9", "9", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("×", "*", "bg-rose text-white text-2xl sm:text-3xl ring-1 ring-white/30 active:bg-rose-deep")}

              {renderKey("4", "4", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("5", "5", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("6", "6", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("−", "-", "bg-rose text-white text-2xl sm:text-3xl ring-1 ring-white/30 active:bg-rose-deep")}

              {renderKey("1", "1", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("2", "2", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("3", "3", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("+", "+", "bg-rose text-white text-2xl sm:text-3xl ring-1 ring-white/30 active:bg-rose-deep")}

              {renderKey("0", "0", "bg-display ring-1 ring-ink/5 active:bg-sand", 2)}
              {renderKey(".", ".", "bg-display ring-1 ring-ink/5 active:bg-sand")}
              {renderKey("=", "Enter", "bg-mint text-ink text-2xl sm:text-3xl font-semibold ring-1 ring-white/40 active:brightness-95")}
            </div>
          </div>
        )}

        {/* VIEW 2: CURRENCY CONVERTER */}
        {activeTab === "currency" && (
          <div className="calc-fade-up w-full max-w-[420px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-5 sm:p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                <Coins className="size-4" />
              </div>
              <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-xl text-ink">
                Conversor de Moedas
              </h2>
            </div>

            {/* Input Value */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                  Valor a converter
                </label>
                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-3 flex items-center shadow-inner">
                  <span className="font-semibold text-lg text-ink-soft mr-2">
                    {EXCHANGE_RATES[fromCurr]?.symbol}
                  </span>
                  <input
                    type="number"
                    value={currAmount}
                    onChange={(e) => setCurrAmount(e.target.value)}
                    className="w-full bg-transparent font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-ink outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Currency Selectors */}
              <div className="grid grid-cols-2 gap-3 items-center relative">
                {/* From Currency */}
                <div>
                  <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                    De
                  </label>
                  <select
                    value={fromCurr}
                    onChange={(e) => setFromCurr(e.target.value)}
                    className="w-full rounded-2xl bg-display ring-1 ring-ink/5 p-3 text-sm font-semibold text-ink outline-none cursor-pointer"
                  >
                    {Object.entries(EXCHANGE_RATES).map(([code, item]) => (
                      <option key={code} value={code}>
                        {code} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap Button */}
                <div className="absolute left-1/2 -translate-x-1/2 top-7 z-10">
                  <button
                    onClick={() => {
                      const temp = fromCurr;
                      setFromCurr(toCurr);
                      setToCurr(temp);
                    }}
                    className="calc-key size-9 rounded-full bg-rose text-white grid place-items-center shadow-md ring-2 ring-sand hover:scale-105 cursor-pointer"
                    title="Inverter moedas"
                  >
                    <ArrowRightLeft className="size-4" />
                  </button>
                </div>

                {/* To Currency */}
                <div>
                  <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                    Para
                  </label>
                  <select
                    value={toCurr}
                    onChange={(e) => setToCurr(e.target.value)}
                    className="w-full rounded-2xl bg-display ring-1 ring-ink/5 p-3 text-sm font-semibold text-ink outline-none cursor-pointer"
                  >
                    {Object.entries(EXCHANGE_RATES).map(([code, item]) => (
                      <option key={code} value={code}>
                        {code} — {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Converted Result Card */}
              <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-5 text-center shadow-inner mt-2">
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wider">
                  Resultado Convertido
                </p>
                <div className="mt-2 flex items-baseline justify-center gap-2">
                  <span className="text-sm font-bold text-rose-deep">
                    {EXCHANGE_RATES[toCurr]?.symbol}
                  </span>
                  <span className="text-4xl font-bold font-[family-name:var(--font-fredoka)] text-ink">
                    {calculateCurrency()}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-2">
                  1 {fromCurr} ≈ {(EXCHANGE_RATES[toCurr]?.rate / EXCHANGE_RATES[fromCurr]?.rate).toFixed(4)} {toCurr}
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 justify-center pt-1">
                {["50", "100", "500", "1000"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCurrAmount(preset)}
                    className="calc-key px-3 py-1.5 rounded-xl bg-display ring-1 ring-ink/5 text-xs font-semibold text-ink hover:bg-white cursor-pointer"
                  >
                    {EXCHANGE_RATES[fromCurr]?.symbol} {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: UNIT CONVERTER */}
        {activeTab === "units" && (
          <div className="calc-fade-up w-full max-w-[440px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-5 sm:p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                <Scale className="size-4" />
              </div>
              <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-xl text-ink">
                Conversor de Medidas
              </h2>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(Object.keys(UNIT_DATA) as UnitCategory[]).map((catKey) => (
                <button
                  key={catKey}
                  onClick={() => {
                    setUnitCat(catKey);
                    const units = Object.keys(UNIT_DATA[catKey].units);
                    setFromUnit(units[0]);
                    setToUnit(units[1] || units[0]);
                  }}
                  className={[
                    "calc-key px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    unitCat === catKey
                      ? "bg-rose text-white ring-1 ring-white/30"
                      : "bg-display text-ink-soft hover:text-ink ring-1 ring-ink/5",
                  ].join(" ")}
                >
                  {UNIT_DATA[catKey].name}
                </button>
              ))}
            </div>

            {/* Inputs & Units Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                  Valor
                </label>
                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-3 shadow-inner">
                  <input
                    type="number"
                    value={unitAmount}
                    onChange={(e) => setUnitAmount(e.target.value)}
                    className="w-full bg-transparent font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-ink outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center relative">
                <div>
                  <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                    De
                  </label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full rounded-2xl bg-display ring-1 ring-ink/5 p-3 text-sm font-semibold text-ink outline-none cursor-pointer"
                  >
                    {Object.entries(UNIT_DATA[unitCat].units).map(([key, u]) => (
                      <option key={key} value={key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-7 z-10">
                  <button
                    onClick={() => {
                      const temp = fromUnit;
                      setFromUnit(toUnit);
                      setToUnit(temp);
                    }}
                    className="calc-key size-9 rounded-full bg-rose text-white grid place-items-center shadow-md ring-2 ring-sand hover:scale-105 cursor-pointer"
                    title="Inverter unidades"
                  >
                    <ArrowRightLeft className="size-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block mb-1.5">
                    Para
                  </label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full rounded-2xl bg-display ring-1 ring-ink/5 p-3 text-sm font-semibold text-ink outline-none cursor-pointer"
                  >
                    {Object.entries(UNIT_DATA[unitCat].units).map(([key, u]) => (
                      <option key={key} value={key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-5 text-center shadow-inner mt-2">
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wider">
                  Valor Convertido
                </p>
                <div className="mt-2 text-3xl font-bold font-[family-name:var(--font-fredoka)] text-ink break-words">
                  {calculateUnit()}
                </div>
                <p className="text-xs font-semibold text-rose-deep mt-1">
                  {UNIT_DATA[unitCat].units[toUnit]?.label}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footnote */}
      <footer className="w-full pb-6 px-4 text-center calc-fade-up">
        <p className="text-sm font-medium text-ink-soft">
          Maxwell Você é o Melhro
        </p>
      </footer>

      {/* HISTORY DRAWER / MODAL */}
      {showHistoryDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-end animate-in fade-in"
          onClick={() => setShowHistoryDrawer(false)}
        >
          <div
            className="w-full max-w-sm h-full bg-sand p-5 sm:p-6 ring-1 ring-ink/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-ink/10">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                    <History className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink">
                      Histórico
                    </h3>
                    <p className="text-[11px] text-ink-soft">Últimos cálculos salvos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {calculationHistory.length > 0 && (
                    <button
                      onClick={clearCalculationHistory}
                      className="size-8 rounded-xl bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-rose-deep cursor-pointer"
                      title="Limpar histórico"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className="size-8 rounded-xl bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* History Items List */}
              <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-160px)] pr-1 custom-scrollbar">
                {calculationHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="size-10 text-ink-soft/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-ink-soft">
                      Nenhum cálculo registrado ainda.
                    </p>
                    <p className="text-xs text-ink-soft/70 mt-1">
                      Faça uma operação na calculadora para ver aqui.
                    </p>
                  </div>
                ) : (
                  calculationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-display ring-1 ring-ink/5 hover:ring-rose/40 transition-all flex items-center justify-between group"
                    >
                      <button
                        onClick={() => {
                          setDisplay(item.result);
                          setFreshResult(true);
                          setActiveTab("calc");
                          setShowHistoryDrawer(false);
                          triggerPop();
                        }}
                        className="text-left flex-1 cursor-pointer pr-2"
                        title="Usar este resultado na calculadora"
                      >
                        <p className="text-xs text-ink-soft truncate font-medium">
                          {item.expression}
                        </p>
                        <p className="text-lg font-bold font-[family-name:var(--font-fredoka)] text-ink">
                          = {item.result}
                        </p>
                        <span className="text-[10px] text-ink-soft/60">{item.timestamp}</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(item.result, item.id)}
                        className="size-8 rounded-xl bg-sand/60 hover:bg-sand ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer transition-all"
                        title="Copiar resultado"
                      >
                        {copiedId === item.id ? (
                          <Check className="size-4 text-mint" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="calc-key mt-4 w-full py-2.5 rounded-2xl bg-mint text-ink font-[family-name:var(--font-fredoka)] font-semibold text-center cursor-pointer shadow-sm"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
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
                  + - * / ^
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
  