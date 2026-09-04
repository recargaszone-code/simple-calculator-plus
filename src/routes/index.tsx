import { createFileRoute, Link } from "@tanstack/react-router";
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
  LogIn,
  Sparkles,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Calendar,
  Download,
  Share2,
  FileSpreadsheet,
  FileText,
  Clock,
  Percent,
  DollarSign,
  Users,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculadora Plus — Rápida, Científica, Financeira & 16 Temas" },
      {
        name: "description",
        content:
          "Calculadora completa com modos padrão e científico, financeiro, cálculo de datas, histórico com exportação CSV/WhatsApp, conversor de moedas e unidades com 16 temas visuais.",
      },
      { property: "og:title", content: "Calculadora Plus — Rápida, Científica, Financeira & 16 Temas" },
      {
        property: "og:description",
        content:
          "Calculadora multifunções com modos padrão, científico, financeiro, conversor de datas, moedas e unidades com 16 temas.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type Operator = "+" | "−" | "×" | "÷" | "^";
type AppTab = "calc" | "finance" | "dates" | "currency" | "units";
type FinanceSubTab = "compound" | "loan" | "discount";
type DateSubTab = "diff" | "add_sub" | "work_hours";

export type ThemeType =
  | "candy"
  | "dark"
  | "sapphire"
  | "emerald"
  | "sunset"
  | "lavender"
  | "cyberpunk"
  | "nordic"
  | "midnight"
  | "matcha"
  | "crimson"
  | "retro"
  | "autumn"
  | "galaxy"
  | "solar"
  | "bubblegum";

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

interface UserSession {
  name: string;
  email: string;
}

interface ScientificConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: "math" | "physics";
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

// Scientific & Mathematical Constants
const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  { symbol: "π", name: "Pi (Arquimedes)", value: 3.141592653589793, unit: "rad", category: "math" },
  { symbol: "e", name: "Número de Euler", value: 2.718281828459045, unit: "const", category: "math" },
  { symbol: "Φ", name: "Proporção Áurea (Phi)", value: 1.618033988749895, unit: "ratio", category: "math" },
  { symbol: "√2", name: "Raiz de 2 (Pitágoras)", value: 1.414213562373095, unit: "const", category: "math" },
  { symbol: "g", name: "Gravidade Padrão Terra", value: 9.80665, unit: "m/s²", category: "physics" },
  { symbol: "c", name: "Velocidade da Luz no Vácuo", value: 299792458, unit: "m/s", category: "physics" },
  { symbol: "G", name: "Constante Gravitacional", value: 6.6743e-11, unit: "N·m²/kg²", category: "physics" },
  { symbol: "h", name: "Constante de Planck", value: 6.62607015e-34, unit: "J·s", category: "physics" },
  { symbol: "qₑ", name: "Carga Elementar do Elétron", value: 1.602176634e-19, unit: "C", category: "physics" },
  { symbol: "R", name: "Constante Universal dos Gases", value: 8.314462618, unit: "J/(mol·K)", category: "physics" },
  { symbol: "Nₐ", name: "Número de Avogadro", value: 6.02214076e23, unit: "mol⁻¹", category: "physics" },
  { symbol: "k_B", name: "Constante de Boltzmann", value: 1.380649e-23, unit: "J/K", category: "physics" },
];

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
  ratio: number;
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

// 16 TEMAS VISUAIS COMPLETOS
const THEMES: { id: ThemeType; label: string; tag: string; color: string; ring: string }[] = [
  { id: "candy", label: "Candy Pastel", tag: "Claro", color: "bg-[#f29f9f]", ring: "ring-[#f29f9f]" },
  { id: "dark", label: "Dark Velvet", tag: "Escuro", color: "bg-[#a855f7]", ring: "ring-[#a855f7]" },
  { id: "sapphire", label: "Azul Safira", tag: "Oceano", color: "bg-[#2563eb]", ring: "ring-[#2563eb]" },
  { id: "emerald", label: "Esmeralda Zen", tag: "Natureza", color: "bg-[#059669]", ring: "ring-[#059669]" },
  { id: "sunset", label: "Pôr do Sol", tag: "Quente", color: "bg-[#ea580c]", ring: "ring-[#ea580c]" },
  { id: "lavender", label: "Lavanda Dream", tag: "Floral", color: "bg-[#9333ea]", ring: "ring-[#9333ea]" },
  { id: "cyberpunk", label: "Cyberpunk", tag: "Neon", color: "bg-[#eab308]", ring: "ring-[#eab308]" },
  { id: "nordic", label: "Nórdico Minimal", tag: "Clean", color: "bg-[#475569]", ring: "ring-[#475569]" },
  { id: "midnight", label: "Meia-Noite OLED", tag: "Preto", color: "bg-[#0ea5e9]", ring: "ring-[#0ea5e9]" },
  { id: "matcha", label: "Matcha Latte", tag: "Pastel", color: "bg-[#606c38]", ring: "ring-[#606c38]" },
  { id: "crimson", label: "Rubi Carmesim", tag: "Elegante", color: "bg-[#e11d48]", ring: "ring-[#e11d48]" },
  { id: "retro", label: "Retrô 90s", tag: "Vaporwave", color: "bg-[#db2777]", ring: "ring-[#db2777]" },
  { id: "autumn", label: "Outono Dourado", tag: "Terroso", color: "bg-[#d97706]", ring: "ring-[#d97706]" },
  { id: "galaxy", label: "Galáxia Cósmica", tag: "Cósmico", color: "bg-[#8b5cf6]", ring: "ring-[#8b5cf6]" },
  { id: "solar", label: "Solar Amistoso", tag: "Alegre", color: "bg-[#ca8a04]", ring: "ring-[#ca8a04]" },
  { id: "bubblegum", label: "Bubblegum Pop", tag: "Vibrante", color: "bg-[#f43f5e]", ring: "ring-[#f43f5e]" },
];

const DARK_THEME_IDS: ThemeType[] = ["dark", "cyberpunk", "midnight", "crimson", "galaxy"];

function Index() {
  // App navigation state
  const [activeTab, setActiveTab] = useState<AppTab>("calc");
  const [showModeMenu, setShowModeMenu] = useState<boolean>(false);
  const [scientificMode, setScientificMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeType>("candy");
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);
  const themeDropdownRef = useRef<HTMLDivElement | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Calculator State & Memory
  const [display, setDisplay] = useState<string>("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [history, setHistory] = useState<string>("");
  const [freshResult, setFreshResult] = useState<boolean>(false);
  const [popKey, setPopKey] = useState<number>(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showConstantsModal, setShowConstantsModal] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [calculationHistory, setCalculationHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [memoryValue, setMemoryValue] = useState<number | null>(null);
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Financial Calculator State
  const [financeTab, setFinanceTab] = useState<FinanceSubTab>("compound");
  // Compound interest
  const [initialCapital, setInitialCapital] = useState<string>("1000");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("200");
  const [interestRate, setInterestRate] = useState<string>("10");
  const [interestPeriodYears, setInterestPeriodYears] = useState<string>("5");
  // Loan / Installments
  const [loanAmount, setLoanAmount] = useState<string>("5000");
  const [loanInstallments, setLoanInstallments] = useState<string>("12");
  const [loanMonthlyRate, setLoanMonthlyRate] = useState<string>("2.5");
  // Discount & Tip Split
  const [billAmount, setBillAmount] = useState<string>("180");
  const [discountPercent, setDiscountPercent] = useState<string>("10");
  const [tipPercent, setTipPercent] = useState<string>("10");
  const [splitPeople, setSplitPeople] = useState<string>("3");

  // Dates & Time Calculator State
  const [dateTab, setDateTab] = useState<DateSubTab>("diff");
  // Date Difference
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  // Add / Subtract Days
  const [baseDate, setBaseDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [daysDelta, setDaysDelta] = useState<string>("45");
  const [deltaMode, setDeltaMode] = useState<"add" | "sub">("add");
  const [skipWeekends, setSkipWeekends] = useState<boolean>(false);
  // Work Hours
  const [workEntry, setWorkEntry] = useState<string>("08:00");
  const [lunchOut, setLunchOut] = useState<string>("12:00");
  const [lunchIn, setLunchIn] = useState<string>("13:00");
  const [workExit, setWorkExit] = useState<string>("17:00");
  const [contractHours, setContractHours] = useState<string>("8");

  // Currency Converter State
  const [currAmount, setCurrAmount] = useState<string>("100");
  const [fromCurr, setFromCurr] = useState<string>("USD");
  const [toCurr, setToCurr] = useState<string>("BRL");

  // Unit Converter State
  const [unitCat, setUnitCat] = useState<UnitCategory>("length");
  const [unitAmount, setUnitAmount] = useState<string>("10");
  const [fromUnit, setFromUnit] = useState<string>("m");
  const [toUnit, setToUnit] = useState<string>("km");

  // Load saved theme from localStorage on initial render
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("calc_theme_selection") as ThemeType;
      if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
        setTheme(savedTheme);
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Apply Theme to document root
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      if (DARK_THEME_IDS.includes(theme)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem("calc_theme_selection", theme);
      } catch {
        // safe fallback
      }
    }
  }, [theme]);

  // Click outside to close mode & theme dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) {
        setShowThemeMenu(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(target)) {
        setShowModeMenu(false);
      }
    }
    if (showThemeMenu || showModeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showThemeMenu, showModeMenu]);

  // Load session & history & memory from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("calc_user_session");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedHist = localStorage.getItem("calc_history_plus");
      if (savedHist) {
        setCalculationHistory(JSON.parse(savedHist));
      }
      const savedMem = localStorage.getItem("calc_memory_val");
      if (savedMem) {
        setMemoryValue(parseFloat(savedMem));
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

  // Memory Functions (MC, MR, M+, M-, MS)
  const memoryClear = useCallback(() => {
    setMemoryValue(null);
    try {
      localStorage.removeItem("calc_memory_val");
    } catch {
      // safe fallback
    }
  }, []);

  const memoryRecall = useCallback(() => {
    if (memoryValue !== null) {
      setDisplay(formatNumber(memoryValue));
      setFreshResult(true);
      triggerPop();
    }
  }, [memoryValue, triggerPop]);

  const memoryStore = useCallback(() => {
    const val = parseFloat(display);
    if (!Number.isNaN(val)) {
      setMemoryValue(val);
      try {
        localStorage.setItem("calc_memory_val", val.toString());
      } catch {
        // safe fallback
      }
    }
  }, [display]);

  const memoryAdd = useCallback(() => {
    const val = parseFloat(display);
    if (!Number.isNaN(val)) {
      const currentMem = memoryValue || 0;
      const updated = currentMem + val;
      setMemoryValue(updated);
      try {
        localStorage.setItem("calc_memory_val", updated.toString());
      } catch {
        // safe fallback
      }
    }
  }, [display, memoryValue]);

  const memorySubtract = useCallback(() => {
    const val = parseFloat(display);
    if (!Number.isNaN(val)) {
      const currentMem = memoryValue || 0;
      const updated = currentMem - val;
      setMemoryValue(updated);
      try {
        localStorage.setItem("calc_memory_val", updated.toString());
      } catch {
        // safe fallback
      }
    }
  }, [display, memoryValue]);

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

  // Insert Constant into display
  const insertConstant = useCallback(
    (constObj: ScientificConstant) => {
      const formatted = formatNumber(constObj.value);
      setDisplay(formatted);
      setHistory(`Constante ${constObj.symbol}`);
      saveHistoryItem(`Constante ${constObj.symbol} (${constObj.name})`, formatted);
      setFreshResult(true);
      setShowConstantsModal(false);
      triggerPop();
    },
    [saveHistoryItem, triggerPop]
  );

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

  // ================= FINANCIAL CALCULATIONS ================= //
  const calculateCompoundInterest = () => {
    const p = parseFloat(initialCapital) || 0;
    const pmt = parseFloat(monthlyContribution) || 0;
    const rAnnual = (parseFloat(interestRate) || 0) / 100;
    const rMonthly = rAnnual / 12;
    const years = parseFloat(interestPeriodYears) || 0;
    const totalMonths = Math.round(years * 12);

    if (totalMonths <= 0) return { totalInvested: p, totalInterest: 0, totalAmount: p };

    let totalAmount = p;
    let totalInvested = p;

    for (let i = 0; i < totalMonths; i++) {
      totalAmount = totalAmount * (1 + rMonthly) + pmt;
      totalInvested += pmt;
    }

    const totalInterest = Math.max(0, totalAmount - totalInvested);

    return {
      totalInvested,
      totalInterest,
      totalAmount,
    };
  };

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount) || 0;
    const n = parseInt(loanInstallments) || 1;
    const r = (parseFloat(loanMonthlyRate) || 0) / 100;

    if (n <= 0) return { monthlyPayment: 0, totalPaid: 0, totalInterest: 0 };
    if (r === 0) {
      const pmt = principal / n;
      return { monthlyPayment: pmt, totalPaid: principal, totalInterest: 0 };
    }

    // Formula Price: PMT = P * [r * (1 + r)^n] / [(1 + r)^n - 1]
    const factor = Math.pow(1 + r, n);
    const monthlyPayment = (principal * (r * factor)) / (factor - 1);
    const totalPaid = monthlyPayment * n;
    const totalInterest = totalPaid - principal;

    return {
      monthlyPayment,
      totalPaid,
      totalInterest,
    };
  };

  const calculateDiscountAndTip = () => {
    const rawBill = parseFloat(billAmount) || 0;
    const discP = (parseFloat(discountPercent) || 0) / 100;
    const tipP = (parseFloat(tipPercent) || 0) / 100;
    const people = Math.max(1, parseInt(splitPeople) || 1);

    const discountValue = rawBill * discP;
    const discountedTotal = Math.max(0, rawBill - discountValue);
    const tipValue = discountedTotal * tipP;
    const finalTotal = discountedTotal + tipValue;
    const perPerson = finalTotal / people;

    return {
      discountValue,
      discountedTotal,
      tipValue,
      finalTotal,
      perPerson,
    };
  };

  // ================= DATES & TIME CALCULATIONS ================= //
  const calculateDateDiff = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const isFuture = diffDays >= 0;
    const absDays = Math.abs(diffDays);

    // Calculate business days & weekends
    let workdays = 0;
    let weekends = 0;
    const cur = new Date(Math.min(start.getTime(), end.getTime()));
    const maxDate = new Date(Math.max(start.getTime(), end.getTime()));

    while (cur < maxDate) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day === 0 || day === 6) {
        weekends++;
      } else {
        workdays++;
      }
    }

    const weeks = (absDays / 7).toFixed(1);
    const months = (absDays / 30.4375).toFixed(1);

    return {
      totalDays: diffDays,
      absDays,
      workdays,
      weekends,
      weeks,
      months,
      isFuture,
    };
  };

  const calculateAddSubDays = () => {
    if (!baseDate) return "";
    const base = new Date(baseDate + "T00:00:00");
    if (Number.isNaN(base.getTime())) return "";

    const delta = parseInt(daysDelta) || 0;
    const multiplier = deltaMode === "add" ? 1 : -1;

    if (skipWeekends) {
      let added = 0;
      const target = new Date(base);
      while (added < Math.abs(delta)) {
        target.setDate(target.getDate() + multiplier);
        const day = target.getDay();
        if (day !== 0 && day !== 6) {
          added++;
        }
      }
      return target.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      base.setDate(base.getDate() + delta * multiplier);
      return base.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const calculateWorkHours = () => {
    const parseMins = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const tEntry = parseMins(workEntry);
    const tLunchOut = parseMins(lunchOut);
    const tLunchIn = parseMins(lunchIn);
    const tExit = parseMins(workExit);

    const morningMins = Math.max(0, tLunchOut - tEntry);
    const afternoonMins = Math.max(0, tExit - tLunchIn);
    const totalMins = morningMins + afternoonMins;

    const contractMins = (parseFloat(contractHours) || 8) * 60;
    const balanceMins = totalMins - contractMins;

    const formatHoursMins = (mins: number) => {
      const sign = mins < 0 ? "-" : "+";
      const abs = Math.abs(mins);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      return `${sign}${h}h ${m.toString().padStart(2, "0")}m`;
    };

    const totalHoursFormatted = `${Math.floor(totalMins / 60)}h ${(totalMins % 60).toString().padStart(2, "0")}m`;

    return {
      totalHoursFormatted,
      balanceFormatted: formatHoursMins(balanceMins),
      isOvertime: balanceMins >= 0,
      balanceMins,
    };
  };

  // ================= EXPORT & SHARE FUNCTIONS ================= //
  const exportHistoryAsCSV = () => {
    if (calculationHistory.length === 0) return;
    const header = "Data/Hora,Expressão,Resultado\n";
    const rows = calculationHistory
      .map((item) => `"${item.timestamp}","${item.expression}","${item.result}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `calculadora_historico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback("CSV exportado com sucesso!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const exportHistoryAsTXT = () => {
    if (calculationHistory.length === 0) return;
    const title = "=== HISTÓRICO DE CÁLCULOS — CALCULADORA PLUS ===\n";
    const dateStr = `Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n`;
    const rows = calculationHistory
      .map((item, idx) => `[${idx + 1}] (${item.timestamp}) ${item.expression} = ${item.result}`)
      .join("\n");
    const blob = new Blob([title + dateStr + rows], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `calculadora_historico_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback("TXT baixado com sucesso!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const copyForWhatsApp = () => {
    if (calculationHistory.length === 0) return;
    const header = "📊 *Histórico de Cálculos — Calculadora Plus*\n\n";
    const body = calculationHistory
      .slice(0, 15)
      .map((item) => `• \`${item.expression}\` = *${item.result}*`)
      .join("\n");
    const footer = "\n\n_Gerado via Calculadora Plus_";

    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(header + body + footer);
      setShareFeedback("Copiado para o WhatsApp!");
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // Modes metadata for minimalist dropdown selector
  const MODE_ITEMS: {
    id: AppTab;
    label: string;
    category: "Cálculos" | "Conversores";
    desc: string;
    icon: typeof Calculator;
  }[] = [
    {
      id: "calc",
      label: "Calculadora",
      category: "Cálculos",
      desc: "Padrão, Científica e Constantes",
      icon: Calculator,
    },
    {
      id: "finance",
      label: "Financeiro",
      category: "Cálculos",
      desc: "Juros compostos, parcelas e gorjetas",
      icon: TrendingUp,
    },
    {
      id: "dates",
      label: "Datas & Horas",
      category: "Cálculos",
      desc: "Diferença de dias e horas de trabalho",
      icon: Calendar,
    },
    {
      id: "currency",
      label: "Moedas & Câmbio",
      category: "Conversores",
      desc: "Cotações cambiais atualizadas",
      icon: Coins,
    },
    {
      id: "units",
      label: "Medidas & Unidades",
      category: "Conversores",
      desc: "Comprimento, peso, área e temperatura",
      icon: Scale,
    },
  ];

  const currentModeObj = MODE_ITEMS.find((m) => m.id === activeTab) || MODE_ITEMS[0];
  const CurrentModeIcon = currentModeObj.icon;

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const compoundRes = calculateCompoundInterest();
  const loanRes = calculateLoan();
  const discountRes = calculateDiscountAndTip();
  const dateDiffRes = calculateDateDiff();
  const workHoursRes = calculateWorkHours();

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col justify-between text-ink relative transition-colors duration-300 antialiased selection:bg-rose/20">
      {/* ULTRA CLEAN & MODERN REDESIGNED NAVBAR */}
      <header className="sticky top-0 z-40 w-full pt-2.5 sm:pt-4 px-2 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <nav className="w-full rounded-2xl bg-sand/90 dark:bg-sand/80 backdrop-blur-xl border border-ink/8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 transition-all">
            
            {/* BRAND / LOGO */}
            <div
              onClick={() => setActiveTab("calc")}
              className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
            >
              <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-rose to-rose-deep grid place-items-center text-white text-sm sm:text-base font-[family-name:var(--font-fredoka)] font-bold shadow-sm shadow-rose/25 group-hover:scale-105 transition-transform duration-200">
                +
              </div>
              <div className="hidden xs:flex items-center gap-1">
                <span className="font-[family-name:var(--font-fredoka)] font-semibold text-sm sm:text-base text-ink tracking-tight leading-none group-hover:text-rose-deep transition-colors">
                  Calculadora
                </span>
                <span className="text-[9px] uppercase font-black tracking-wider bg-rose/15 text-rose-deep px-1.5 py-0.5 rounded-md leading-none">
                  Plus
                </span>
              </div>
            </div>

            {/* ULTRA-MINIMALIST CENTRAL MODE SELECTOR */}
            <div className="relative" ref={modeDropdownRef}>
              <button
                onClick={() => setShowModeMenu((prev) => !prev)}
                className="calc-key flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-display hover:bg-white text-ink border border-ink/8 text-xs sm:text-sm font-semibold select-none cursor-pointer shadow-xs transition-all"
                title="Alternar Modo / Ferramenta"
                aria-expanded={showModeMenu}
              >
                <div className="size-5 rounded-lg bg-rose/15 text-rose-deep grid place-items-center shrink-0">
                  <CurrentModeIcon className="size-3" />
                </div>
                <span className="font-[family-name:var(--font-fredoka)] font-semibold tracking-tight">
                  {currentModeObj.label}
                </span>
                <ChevronDown
                  className={[
                    "size-3.5 text-ink-soft transition-transform duration-200",
                    showModeMenu ? "rotate-180 text-rose-deep" : "",
                  ].join(" ")}
                />
              </button>

              {/* Categorized Dropdown Menu */}
              {showModeMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 sm:w-80 rounded-2xl bg-sand/95 dark:bg-sand/90 backdrop-blur-2xl p-2 border border-ink/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-top">
                  
                  {/* Cálculos Group */}
                  <div className="px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/80">
                      Cálculos
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {MODE_ITEMS.filter((item) => item.category === "Cálculos").map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowModeMenu(false);
                          }}
                          className={[
                            "w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-all border",
                            isSelected
                              ? "bg-rose/20 border-rose text-rose-deep shadow-xs"
                              : "border-transparent text-ink hover:bg-display/90 hover:border-ink/5",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={[
                                "size-7 rounded-xl grid place-items-center shrink-0",
                                isSelected ? "bg-rose text-white shadow-xs" : "bg-display text-ink-soft",
                              ].join(" ")}
                            >
                              <Icon className="size-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold leading-tight">{item.label}</p>
                              <p className="text-[10px] text-ink-soft truncate font-normal leading-tight">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="size-3.5 text-rose-deep shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conversores Group */}
                  <div className="px-2 py-1 border-t border-ink/8 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/80">
                      Conversores
                    </span>
                  </div>
                  <div className="space-y-1">
                    {MODE_ITEMS.filter((item) => item.category === "Conversores").map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowModeMenu(false);
                          }}
                          className={[
                            "w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-all border",
                            isSelected
                              ? "bg-rose/20 border-rose text-rose-deep shadow-xs"
                              : "border-transparent text-ink hover:bg-display/90 hover:border-ink/5",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={[
                                "size-7 rounded-xl grid place-items-center shrink-0",
                                isSelected ? "bg-rose text-white shadow-xs" : "bg-display text-ink-soft",
                              ].join(" ")}
                            >
                              <Icon className="size-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold leading-tight">{item.label}</p>
                              <p className="text-[10px] text-ink-soft truncate font-normal leading-tight">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="size-3.5 text-rose-deep shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

            {/* RIGHT COMPACT ACTIONS */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              
              {/* History Button */}
              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="calc-key relative size-8 sm:size-9 rounded-xl bg-display hover:bg-white text-ink border border-ink/8 flex items-center justify-center cursor-pointer shadow-xs transition-all"
                title="Histórico de Cálculos & Exportação"
                aria-label="Abrir histórico"
              >
                <History className="size-4 text-rose-deep shrink-0" />
                {calculationHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {calculationHistory.length > 9 ? "9+" : calculationHistory.length}
                  </span>
                )}
              </button>

              {/* 16 Visual Themes Dropdown */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  onClick={() => setShowThemeMenu((prev) => !prev)}
                  className="calc-key h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-display hover:bg-white text-ink border border-ink/8 flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer shadow-xs transition-all"
                  title="Alterar Tema Visual"
                >
                  <span className={`size-3.5 rounded-full ${currentThemeObj.color} ring-1 ring-black/10 shadow-xs shrink-0`} />
                  <span className="hidden lg:inline capitalize truncate max-w-[85px]">{currentThemeObj.label}</span>
                  <ChevronDown className="size-3 text-ink-soft" />
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-sand/95 dark:bg-sand/90 backdrop-blur-2xl p-2.5 border border-ink/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-ink/8 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Palette className="size-3.5 text-rose-deep" />
                        <span className="text-xs font-bold font-[family-name:var(--font-fredoka)] text-ink">
                          16 Temas Visuais
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose/15 text-rose-deep px-1.5 py-0.5 rounded-md">
                        16 opções
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setShowThemeMenu(false);
                          }}
                          className={[
                            "flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium cursor-pointer transition-all border",
                            theme === t.id
                              ? "bg-rose/20 border-rose text-rose-deep font-bold shadow-xs"
                              : "border-transparent text-ink hover:bg-display/90 hover:border-ink/5",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`size-3.5 shrink-0 rounded-full ${t.color} ring-1 ring-black/15 shadow-xs`} />
                            <div className="truncate">
                              <p className="truncate text-xs font-semibold leading-none">{t.label}</p>
                              <span className="text-[9px] text-ink-soft font-normal">{t.tag}</span>
                            </div>
                          </div>
                          {theme === t.id && <Check className="size-3.5 text-rose-deep shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account / Login CTA */}
              <Link
                to="/login"
                className="calc-key h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-all shadow-xs bg-rose/15 text-rose-deep border border-rose/30 hover:bg-rose/25"
                title={currentUser ? `Conectado como ${currentUser.name}` : "Entrar / Perfil"}
              >
                {currentUser ? (
                  <>
                    <div className="size-5 rounded-full bg-gradient-to-tr from-rose to-rose-deep text-white text-[10px] font-bold grid place-items-center shadow-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline truncate max-w-[65px] font-bold">
                      {currentUser.name.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-3.5 shrink-0" />
                    <span className="hidden sm:inline">Entrar</span>
                  </>
                )}
              </Link>

            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        
        {/* VIEW 1: CALCULATOR (Standard & Scientific + Memory & Constants) */}
        {activeTab === "calc" && (
          <div className="flex flex-col items-center w-full">
            {/* User status card / Welcome banner above Calculator */}
            {!currentUser ? (
              <div
                className={[
                  "w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-sand/80 dark:bg-sand/60 backdrop-blur-md border border-ink/8 flex items-center justify-between shadow-xs transition-all duration-300 animate-in fade-in",
                  scientificMode ? "max-w-[450px]" : "max-w-[370px]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-xl bg-rose/15 text-rose-deep grid place-items-center shrink-0">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-ink leading-tight">Modo Visitante</span>
                    <span className="text-[10px] text-ink-soft leading-tight">Faça login para sincronizar contas</span>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="calc-key text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose to-rose-deep text-white hover:brightness-105 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <LogIn className="size-3" />
                  <span>Entrar</span>
                </Link>
              </div>
            ) : (
              <div
                className={[
                  "w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-sand/90 dark:bg-sand/70 backdrop-blur-md border border-rose/30 shadow-xs flex items-center justify-between gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-top-2",
                  scientificMode ? "max-w-[450px]" : "max-w-[370px]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="size-8 rounded-xl bg-gradient-to-tr from-rose to-rose-deep text-white text-xs font-bold grid place-items-center shadow-xs ring-2 ring-white/60">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-rose rounded-full ring-2 ring-sand" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-ink-soft">Olá,</span>
                      <span className="text-xs font-bold text-ink truncate font-[family-name:var(--font-fredoka)]">
                        {currentUser.name.split(" ")[0]}
                      </span>
                      <span className="text-xs">👋</span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-deep flex items-center gap-1.5 leading-tight">
                      <span className="size-1.5 rounded-full bg-rose animate-pulse inline-block" />
                      Conta ativa
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to="/login"
                    className="calc-key px-3 py-1.5 rounded-xl bg-display hover:bg-white text-ink border border-ink/8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="Gerenciar Conta"
                  >
                    <span>Perfil</span>
                    <ArrowRight className="size-3 text-rose-deep" />
                  </Link>
                </div>
              </div>
            )}

            <div
              className={[
                "calc-fade-up w-full rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-4 sm:p-5 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)] transition-all duration-300",
                scientificMode ? "max-w-[450px]" : "max-w-[370px]",
              ].join(" ")}
            >
              {/* Scientific Toggle & Tools Header */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-1.5">
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
                    onClick={() => setShowConstantsModal(true)}
                    className="calc-key flex items-center gap-1 px-2 py-1 rounded-xl bg-display text-ink-soft hover:text-ink text-xs font-medium ring-1 ring-ink/5 cursor-pointer"
                    title="Biblioteca de Constantes Físicas & Matemáticas"
                  >
                    <BookOpen className="size-3 text-rose-deep" />
                    <span>Constantes</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowShortcuts(true)}
                    className="calc-key hidden sm:flex size-7 rounded-xl bg-display ring-1 ring-ink/5 items-center justify-center text-ink-soft hover:text-ink text-xs cursor-pointer"
                    title="Atalhos do Teclado"
                  >
                    <Keyboard className="size-3.5" />
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
              </div>

              {/* Memory Keys Row (MC, MR, M+, M-, MS) */}
              <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                <button
                  onClick={memoryClear}
                  className="calc-key py-1 rounded-xl bg-display text-ink-soft hover:text-rose-deep text-[11px] font-bold ring-1 ring-ink/5 cursor-pointer"
                  title="Memory Clear (Limpar Memória)"
                >
                  MC
                </button>
                <button
                  onClick={memoryRecall}
                  className={[
                    "calc-key py-1 rounded-xl text-[11px] font-bold ring-1 cursor-pointer",
                    memoryValue !== null
                      ? "bg-rose/20 text-rose-deep ring-rose/30 font-extrabold"
                      : "bg-display text-ink-soft/60 ring-ink/5",
                  ].join(" ")}
                  title="Memory Recall (Recuperar Memória)"
                >
                  MR
                </button>
                <button
                  onClick={memoryAdd}
                  className="calc-key py-1 rounded-xl bg-display text-ink-soft hover:text-ink text-[11px] font-bold ring-1 ring-ink/5 cursor-pointer"
                  title="Memory Add (Adicionar à Memória)"
                >
                  M+
                </button>
                <button
                  onClick={memorySubtract}
                  className="calc-key py-1 rounded-xl bg-display text-ink-soft hover:text-ink text-[11px] font-bold ring-1 ring-ink/5 cursor-pointer"
                  title="Memory Subtract (Subtrair da Memória)"
                >
                  M−
                </button>
                <button
                  onClick={memoryStore}
                  className="calc-key py-1 rounded-xl bg-display text-ink-soft hover:text-ink text-[11px] font-bold ring-1 ring-ink/5 cursor-pointer"
                  title="Memory Store (Gravar Valor na Memória)"
                >
                  MS
                </button>
              </div>

              {/* Display Box */}
              <div className="rounded-[min(4vw,22px)] bg-display ring-1 ring-ink/5 px-5 pt-3.5 pb-3.5 h-[142px] flex flex-col items-end justify-end overflow-hidden shadow-inner relative">
                {/* Memory Active Badge */}
                {memoryValue !== null && (
                  <span className="absolute top-3 left-4 text-[10px] font-extrabold tracking-wider bg-rose/20 text-rose-deep px-1.5 py-0.5 rounded-md border border-rose/30">
                    M: {formatNumber(memoryValue)}
                  </span>
                )}

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
                    className="calc-pop inline-block text-[42px] sm:text-[48px] leading-none font-[family-name:var(--font-fredoka)] font-medium tracking-tight text-ink tabular-nums break-all"
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
                {renderKey(
                  "=",
                  "Enter",
                  "bg-gradient-to-tr from-rose to-rose-deep text-white text-2xl sm:text-3xl font-bold ring-1 ring-white/30 shadow-md shadow-rose/25 hover:brightness-105 active:scale-95"
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FINANCIAL CALCULATOR (Juros Compostos, Parcelas, Descontos) */}
        {activeTab === "finance" && (
          <div className="calc-fade-up w-full max-w-[460px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-5 sm:p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-xl text-ink">
                  Calculadora Financeira
                </h2>
                <p className="text-[11px] text-ink-soft">Simulações de investimentos e custos</p>
              </div>
            </div>

            {/* Financial Sub-Tabs */}
            <div className="flex p-1 rounded-xl bg-display ring-1 ring-ink/5 gap-1 mb-5">
              <button
                onClick={() => setFinanceTab("compound")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  financeTab === "compound"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Juros Compostos
              </button>
              <button
                onClick={() => setFinanceTab("loan")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  financeTab === "loan"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Parcelas / Juros
              </button>
              <button
                onClick={() => setFinanceTab("discount")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  financeTab === "discount"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Desconto & Conta
              </button>
            </div>

            {/* SUB-VIEW 1: JUROS COMPOSTOS */}
            {financeTab === "compound" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Capital Inicial (R$)
                    </label>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Aporte Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Taxa de Juros (% ao ano)
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Período (Anos)
                    </label>
                    <input
                      type="number"
                      value={interestPeriodYears}
                      onChange={(e) => setInterestPeriodYears(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Compound Interest Results Card */}
                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 shadow-inner mt-2">
                  <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block text-center">
                    Valor Total Acumulado
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-fredoka)] text-ink text-center my-1 text-rose-deep">
                    R$ {compoundRes.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ink/8 text-center text-xs">
                    <div className="p-2 rounded-xl bg-sand/60">
                      <span className="text-ink-soft text-[10px] block">Total Investido</span>
                      <strong className="text-ink font-semibold text-sm">
                        R$ {compoundRes.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-sand/60">
                      <span className="text-ink-soft text-[10px] block">Total em Juros</span>
                      <strong className="text-rose-deep font-semibold text-sm">
                        + R$ {compoundRes.totalInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: PARCELAS & FINANCIAMENTO */}
            {financeTab === "loan" && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                    Valor do Bem / Financiamento (R$)
                  </label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                    placeholder="5000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Nº de Parcelas (Meses)
                    </label>
                    <input
                      type="number"
                      value={loanInstallments}
                      onChange={(e) => setLoanInstallments(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Taxa Mensal (% ao mês)
                    </label>
                    <input
                      type="number"
                      value={loanMonthlyRate}
                      onChange={(e) => setLoanMonthlyRate(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 shadow-inner mt-2">
                  <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block text-center">
                    Valor da Parcela Mensal
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-fredoka)] text-rose-deep text-center my-1">
                    R$ {loanRes.monthlyPayment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ink/8 text-center text-xs">
                    <div className="p-2 rounded-xl bg-sand/60">
                      <span className="text-ink-soft text-[10px] block">Total a Pagar</span>
                      <strong className="text-ink font-semibold text-sm">
                        R$ {loanRes.totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-sand/60">
                      <span className="text-ink-soft text-[10px] block">Acréscimo de Juros</span>
                      <strong className="text-ink font-semibold text-sm">
                        R$ {loanRes.totalInterest.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: DESCONTO & DIVISÃO DE CONTA */}
            {financeTab === "discount" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Valor Total (R$)
                    </label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="180"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Gorjeta / Serviço (%)
                    </label>
                    <input
                      type="number"
                      value={tipPercent}
                      onChange={(e) => setTipPercent(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Dividir por (Pessoas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={splitPeople}
                      onChange={(e) => setSplitPeople(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 shadow-inner mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
                        Valor por Pessoa
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-fredoka)] text-rose-deep">
                        R$ {discountRes.perPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
                        Total Final da Conta
                      </span>
                      <div className="text-xl font-bold font-[family-name:var(--font-fredoka)] text-ink">
                        R$ {discountRes.finalTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ink/8 text-xs text-center">
                    <div className="p-1.5 rounded-lg bg-sand/60">
                      <span className="text-[10px] text-ink-soft">Economia (Desconto):</span>{" "}
                      <strong>R$ {discountRes.discountValue.toFixed(2)}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-sand/60">
                      <span className="text-[10px] text-ink-soft">Gorjeta:</span>{" "}
                      <strong>R$ {discountRes.tipValue.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: DATE & TIME CALCULATOR */}
        {activeTab === "dates" && (
          <div className="calc-fade-up w-full max-w-[460px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-5 sm:p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                <Calendar className="size-4" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-xl text-ink">
                  Calculadora de Datas & Tempo
                </h2>
                <p className="text-[11px] text-ink-soft">Prazos, diferenças e horas trabalhadas</p>
              </div>
            </div>

            {/* Date Sub-Tabs */}
            <div className="flex p-1 rounded-xl bg-display ring-1 ring-ink/5 gap-1 mb-5">
              <button
                onClick={() => setDateTab("diff")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  dateTab === "diff"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Entre Datas
              </button>
              <button
                onClick={() => setDateTab("add_sub")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  dateTab === "add_sub"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Somar/Subtrair
              </button>
              <button
                onClick={() => setDateTab("work_hours")}
                className={[
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center",
                  dateTab === "work_hours"
                    ? "bg-rose text-white shadow-xs"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Horas Trabalho
              </button>
            </div>

            {/* SUB-VIEW 1: DIFFERENCE BETWEEN DATES */}
            {dateTab === "diff" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-xs font-semibold text-ink outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-xs font-semibold text-ink outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {dateDiffRes && (
                  <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 shadow-inner mt-2">
                    <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block text-center">
                      Diferença Total
                    </span>
                    <div className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-fredoka)] text-rose-deep text-center my-1">
                      {dateDiffRes.absDays} {dateDiffRes.absDays === 1 ? "dia" : "dias"}
                    </div>
                    <p className="text-xs text-center text-ink-soft">
                      {dateDiffRes.isFuture ? "Até a data futura" : "Passaram-se desde a data inicial"}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-ink/8 text-center text-xs">
                      <div className="p-2 rounded-xl bg-sand/60">
                        <span className="text-[10px] text-ink-soft block">Dias Úteis</span>
                        <strong className="text-ink font-semibold">{dateDiffRes.workdays}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-sand/60">
                        <span className="text-[10px] text-ink-soft block">Fins de Semana</span>
                        <strong className="text-ink font-semibold">{dateDiffRes.weekends}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-sand/60">
                        <span className="text-[10px] text-ink-soft block">Semanas</span>
                        <strong className="text-ink font-semibold">{dateDiffRes.weeks}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: ADD OR SUBTRACT DAYS */}
            {dateTab === "add_sub" && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                    Data Base
                  </label>
                  <input
                    type="date"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-xs font-semibold text-ink outline-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Operação
                    </label>
                    <div className="flex rounded-xl bg-display ring-1 ring-ink/5 p-1 gap-1">
                      <button
                        onClick={() => setDeltaMode("add")}
                        className={[
                          "flex-1 py-1 rounded-lg text-xs font-semibold cursor-pointer",
                          deltaMode === "add" ? "bg-rose text-white" : "text-ink-soft",
                        ].join(" ")}
                      >
                        + Somar
                      </button>
                      <button
                        onClick={() => setDeltaMode("sub")}
                        className={[
                          "flex-1 py-1 rounded-lg text-xs font-semibold cursor-pointer",
                          deltaMode === "sub" ? "bg-rose text-white" : "text-ink-soft",
                        ].join(" ")}
                      >
                        − Subtrair
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Quantidade de Dias
                    </label>
                    <input
                      type="number"
                      value={daysDelta}
                      onChange={(e) => setDaysDelta(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-base font-semibold text-ink outline-none"
                      placeholder="30"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="rounded accent-rose size-4"
                  />
                  <span className="text-xs font-medium text-ink">Considerar apenas dias úteis (pular fins de semana)</span>
                </label>

                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 text-center shadow-inner mt-2">
                  <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block">
                    Data Resultante
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-[family-name:var(--font-fredoka)] text-rose-deep capitalize mt-1">
                    {calculateAddSubDays()}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: HORAS TRABALHADAS & BANCO DE HORAS */}
            {dateTab === "work_hours" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Entrada
                    </label>
                    <input
                      type="time"
                      value={workEntry}
                      onChange={(e) => setWorkEntry(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-sm font-semibold text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Saída Almoço
                    </label>
                    <input
                      type="time"
                      value={lunchOut}
                      onChange={(e) => setLunchOut(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-sm font-semibold text-ink outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Retorno Almoço
                    </label>
                    <input
                      type="time"
                      value={lunchIn}
                      onChange={(e) => setLunchIn(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-sm font-semibold text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                      Saída Final
                    </label>
                    <input
                      type="time"
                      value={workExit}
                      onChange={(e) => setWorkExit(e.target.value)}
                      className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-sm font-semibold text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                    Carga Contratada Diária (Horas)
                  </label>
                  <input
                    type="number"
                    value={contractHours}
                    onChange={(e) => setContractHours(e.target.value)}
                    className="w-full rounded-xl bg-display ring-1 ring-ink/5 p-2.5 text-sm font-semibold text-ink outline-none"
                    placeholder="8"
                  />
                </div>

                <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 shadow-inner mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
                      Total Trabalhado
                    </span>
                    <div className="text-2xl font-bold font-[family-name:var(--font-fredoka)] text-ink">
                      {workHoursRes.totalHoursFormatted}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
                      Saldo / Horas Extras
                    </span>
                    <div
                      className={[
                        "text-2xl font-bold font-[family-name:var(--font-fredoka)]",
                        workHoursRes.isOvertime ? "text-rose-deep" : "text-rose",
                      ].join(" ")}
                    >
                      {workHoursRes.balanceFormatted}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CURRENCY CONVERTER */}
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

              <div className="grid grid-cols-2 gap-3 items-center relative">
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

        {/* VIEW 5: UNIT CONVERTER */}
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
          Maxwell Você é o Melhor
        </p>
      </footer>

      {/* CONSTANTS MODAL */}
      {showConstantsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowConstantsModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-sand p-6 ring-1 ring-ink/5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-ink/8 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-rose/15 text-rose-deep grid place-items-center">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink">
                    Constantes Científicas
                  </h3>
                  <p className="text-[11px] text-ink-soft">Clique para inserir diretamente no visor</p>
                </div>
              </div>
              <button
                onClick={() => setShowConstantsModal(false)}
                className="size-8 rounded-full bg-display ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {SCIENTIFIC_CONSTANTS.map((c) => (
                <button
                  key={c.symbol}
                  onClick={() => insertConstant(c)}
                  className="w-full p-2.5 rounded-2xl bg-display ring-1 ring-ink/5 hover:ring-rose/40 hover:bg-sand/40 transition-all flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-8 rounded-xl bg-sand flex items-center justify-center font-bold text-rose-deep text-sm ring-1 ring-ink/5 group-hover:scale-105 transition-transform">
                      {c.symbol}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink leading-tight">{c.name}</p>
                      <span className="text-[10px] text-ink-soft">{c.unit}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-ink-soft group-hover:text-rose-deep">
                    {c.value > 10000 || (c.value < 0.001 && c.value > 0)
                      ? c.value.toExponential(4)
                      : c.value.toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY DRAWER WITH ADVANCED EXPORT & SHARE */}
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
            <div className="flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-ink/10 shrink-0">
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

                <div className="flex items-center gap-1.5">
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

              {/* Export Toolbar */}
              {calculationHistory.length > 0 && (
                <div className="py-2.5 border-b border-ink/8 flex items-center justify-between gap-1.5 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-ink-soft tracking-wider">Exportar:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={exportHistoryAsCSV}
                      className="calc-key px-2 py-1 rounded-lg bg-display ring-1 ring-ink/5 text-[11px] font-semibold text-ink hover:text-rose-deep flex items-center gap-1 cursor-pointer"
                      title="Baixar planilha CSV para Excel"
                    >
                      <FileSpreadsheet className="size-3 text-rose-deep" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={exportHistoryAsTXT}
                      className="calc-key px-2 py-1 rounded-lg bg-display ring-1 ring-ink/5 text-[11px] font-semibold text-ink hover:text-rose-deep flex items-center gap-1 cursor-pointer"
                      title="Baixar arquivo TXT"
                    >
                      <FileText className="size-3 text-rose-deep" />
                      <span>TXT</span>
                    </button>
                    <button
                      onClick={copyForWhatsApp}
                      className="calc-key px-2 py-1 rounded-lg bg-display ring-1 ring-ink/5 text-[11px] font-semibold text-ink hover:text-rose-deep flex items-center gap-1 cursor-pointer"
                      title="Copiar lista formatada para WhatsApp"
                    >
                      <Share2 className="size-3 text-rose-deep" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Toast Feedback */}
              {shareFeedback && (
                <div className="my-1 py-1.5 px-3 rounded-xl bg-rose/20 border border-rose text-rose-deep text-xs font-bold text-center animate-in fade-in shrink-0">
                  {shareFeedback}
                </div>
              )}

              {/* History Items List */}
              <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {calculationHistory.length === 0 ? (
                  <div className="text-center py-16">
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
                        className="size-8 rounded-xl bg-sand/60 hover:bg-sand ring-1 ring-ink/5 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer transition-all shrink-0"
                        title="Copiar resultado"
                      >
                        {copiedId === item.id ? (
                          <Check className="size-4 text-rose-deep" />
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
              className="calc-key mt-4 w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose to-rose-deep text-white font-[family-name:var(--font-fredoka)] font-semibold text-center cursor-pointer shadow-sm shadow-rose/20 hover:brightness-105 shrink-0"
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
              className="calc-key mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose to-rose-deep text-white font-[family-name:var(--font-fredoka)] font-semibold text-center cursor-pointer shadow-sm shadow-rose/20 hover:brightness-105"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
