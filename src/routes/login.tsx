import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calculator,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Crown,
  Database,
  Palette,
  HardDrive,
  Calendar,
  Activity,
  Trash2,
  ArrowRight,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Perfil & Conta — Calculadora Plus" },
      {
        name: "description",
        content: "Acesse sua conta ou visualize o painel de perfil e privilégios de administrador da Calculadora Plus.",
      },
      { property: "og:title", content: "Perfil & Conta — Calculadora Plus" },
    ],
  }),
  component: LoginRoute,
});

interface UserSession {
  name: string;
  email: string;
  role?: string;
  loginTime?: string;
}

const DARK_THEME_IDS = ["dark", "cyberpunk", "midnight", "crimson", "galaxy"];

function LoginRoute() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [calcCount, setCalcCount] = useState<number>(0);
  const [currentThemeName, setCurrentThemeName] = useState<string>("Candy Pastel");

  // Load theme & session from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("calc_theme_selection") || "candy";
      document.documentElement.setAttribute("data-theme", savedTheme);
      if (DARK_THEME_IDS.includes(savedTheme)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      setCurrentThemeName(savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1));

      const savedUser = localStorage.getItem("calc_user_session");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedHistory = localStorage.getItem("calc_history_plus");
      if (savedHistory) {
        const hist = JSON.parse(savedHistory);
        setCalcCount(Array.isArray(hist) ? hist.length : 0);
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Por favor, informe um e-mail válido.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("A senha deve conter no mínimo 4 caracteres.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg("Por favor, informe seu nome.");
      return;
    }

    const userName = isSignUp
      ? name.trim()
      : name.trim() || email.split("@")[0];

    const session: UserSession = {
      name: userName,
      email: email.trim(),
      role: email.toLowerCase().includes("admin") || email.toLowerCase().includes("maxwell") ? "Administrador Master" : "Membro Plus",
      loginTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setCurrentUser(session);
    try {
      localStorage.setItem("calc_user_session", JSON.stringify(session));
    } catch {
      // safe fallback
    }

    setSuccessMsg(isSignUp ? "Conta criada com sucesso!" : "Autenticado com sucesso!");
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  const handleQuickDemoLogin = () => {
    const demoSession: UserSession = {
      name: "Maxwell",
      email: "maxwell@calculadoraplus.com",
      role: "Administrador Master",
      loginTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setCurrentUser(demoSession);
    try {
      localStorage.setItem("calc_user_session", JSON.stringify(demoSession));
    } catch {
      // safe fallback
    }
    setSuccessMsg("Conectado como Maxwell (Administrador Master)!");
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("calc_user_session");
    } catch {
      // safe fallback
    }
    setSuccessMsg("Você saiu da conta.");
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem("calc_history_plus");
      setCalcCount(0);
      setSuccessMsg("Histórico de cálculos limpo com sucesso!");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col justify-between text-ink transition-colors duration-300 antialiased selection:bg-rose/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full pt-3 sm:pt-4 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <nav className="w-full rounded-2xl bg-sand/90 dark:bg-sand/80 backdrop-blur-xl border border-ink/8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
            {/* Logo Brand / Back */}
            <Link to="/" className="flex items-center gap-2.5 cursor-pointer group select-none">
              <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-tr from-rose to-rose-deep grid place-items-center text-white text-base font-[family-name:var(--font-fredoka)] font-bold shadow-sm shadow-rose/25 group-hover:scale-105 transition-all duration-200">
                +
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-[family-name:var(--font-fredoka)] font-semibold text-sm sm:text-base text-ink tracking-tight leading-none group-hover:text-rose-deep transition-colors">
                    Calculadora
                  </span>
                  <span className="text-[9px] uppercase font-black tracking-wider bg-rose/15 text-rose-deep px-1.5 py-0.5 rounded-md leading-none">
                    Plus
                  </span>
                </div>
                <span className="text-[10px] font-medium text-ink-soft leading-tight mt-0.5 hidden xs:inline">
                  {currentUser ? "Painel do Usuário" : "Autenticação"}
                </span>
              </div>
            </Link>

            {/* Navigation link to Home Calculator */}
            <Link
              to="/"
              className="calc-key flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-display hover:bg-white text-ink border border-ink/8 text-xs sm:text-sm font-semibold cursor-pointer shadow-xs transition-all"
            >
              <ArrowLeft className="size-3.5 text-rose-deep" />
              <span>Voltar à Calculadora</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
        
        {/* LOGGED IN: COMPLETE ADMIN & USER PROFILE DASHBOARD */}
        {currentUser ? (
          <div className="calc-fade-up w-full max-w-[480px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-5 sm:p-7 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)] space-y-4">
            
            {/* Feedback message */}
            {successMsg && (
              <div className="p-3 rounded-2xl bg-mint/30 ring-1 ring-mint text-ink text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile Header Card */}
            <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-4 sm:p-5 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="relative shrink-0">
                  <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-tr from-rose to-rose-deep text-white text-2xl font-bold grid place-items-center shadow-md shadow-rose/25 ring-2 ring-white/60">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full ring-2 ring-display flex items-center justify-center" title="Online">
                    <span className="size-1.5 bg-white rounded-full animate-pulse" />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-[family-name:var(--font-fredoka)] font-bold text-lg sm:text-xl text-ink truncate">
                      {currentUser.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose/20 text-rose-deep px-2 py-0.5 rounded-md ring-1 ring-rose/30">
                      <Crown className="size-3" />
                      {currentUser.role || "Administrador Master"}
                    </span>
                  </div>
                  
                  <p className="text-xs text-ink-soft truncate font-medium mt-0.5">
                    {currentUser.email}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3.5" />
                    <span>Acesso Total & Permissões Administrativas Ativas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Stats Grid */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft px-1 block mb-2">
                Visão Geral do Administrador
              </span>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-display/80 ring-1 ring-ink/5">
                  <div className="flex items-center gap-2 text-ink-soft mb-1">
                    <Activity className="size-3.5 text-rose-deep" />
                    <span className="text-[11px] font-semibold">Cálculos Salvos</span>
                  </div>
                  <p className="text-xl font-bold font-[family-name:var(--font-fredoka)] text-ink">
                    {calcCount} <span className="text-xs font-normal text-ink-soft">operações</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-display/80 ring-1 ring-ink/5">
                  <div className="flex items-center gap-2 text-ink-soft mb-1">
                    <Palette className="size-3.5 text-rose-deep" />
                    <span className="text-[11px] font-semibold">Tema do Sistema</span>
                  </div>
                  <p className="text-sm font-bold font-[family-name:var(--font-fredoka)] text-ink truncate mt-1">
                    {currentThemeName}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-display/80 ring-1 ring-ink/5">
                  <div className="flex items-center gap-2 text-ink-soft mb-1">
                    <HardDrive className="size-3.5 text-rose-deep" />
                    <span className="text-[11px] font-semibold">Armazenamento</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    Sincronizado Local
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-display/80 ring-1 ring-ink/5">
                  <div className="flex items-center gap-2 text-ink-soft mb-1">
                    <ShieldCheck className="size-3.5 text-rose-deep" />
                    <span className="text-[11px] font-semibold">Privilégios</span>
                  </div>
                  <p className="text-xs font-bold text-rose-deep mt-1">
                    Nível Master (Total)
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Resources & Privileges Checklist */}
            <div className="rounded-2xl bg-display/60 ring-1 ring-ink/5 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
                Recursos Liberados para sua Conta
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-ink-soft">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-rose-deep shrink-0" />
                  <span>16 Temas Customizáveis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-rose-deep shrink-0" />
                  <span>Modo Científico & Constantes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-rose-deep shrink-0" />
                  <span>Cálculo de Juros & Finanças</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-rose-deep shrink-0" />
                  <span>Exportação CSV / WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link
                to="/"
                className="calc-key w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose to-rose-deep text-white font-[family-name:var(--font-fredoka)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose/25 hover:brightness-105 active:scale-95 transition-all text-center"
              >
                <Calculator className="size-4" />
                <span>Abrir a Calculadora Agora</span>
                <ArrowRight className="size-4 ml-1" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleClearHistory}
                  className="calc-key py-2.5 rounded-xl bg-display hover:bg-white ring-1 ring-ink/5 text-xs font-semibold text-ink-soft hover:text-rose-deep flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  <span>Limpar Histórico</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="calc-key py-2.5 rounded-xl bg-rose/15 text-rose-deep hover:bg-rose hover:text-white font-[family-name:var(--font-fredoka)] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="size-3.5" />
                  <span>Desconectar Conta</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* NOT LOGGED IN: LOGIN & SIGN UP CARD */
          <div className="calc-fade-up w-full max-w-[430px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-6 sm:p-8 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-11 rounded-2xl bg-rose/15 text-rose-deep grid place-items-center">
                <User className="size-6" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-2xl text-ink leading-tight">
                  {isSignUp ? "Criar sua Conta" : "Acessar sua Conta"}
                </h2>
                <p className="text-xs text-ink-soft">
                  {isSignUp
                    ? "Cadastre-se para sincronizar seus cálculos e temas"
                    : "Entre com seus dados para acessar o perfil de administrador"}
                </p>
              </div>
            </div>

            {/* Tab Selector: Entrar vs Cadastrar */}
            <div className="flex bg-display p-1 rounded-2xl ring-1 ring-ink/5 mb-5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className={[
                  "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  !isSignUp ? "bg-rose text-white shadow-sm ring-1 ring-white/30" : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Já tenho conta (Entrar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className={[
                  "flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                  isSignUp ? "bg-rose text-white shadow-sm ring-1 ring-white/30" : "text-ink-soft hover:text-ink",
                ].join(" ")}
              >
                Criar conta
              </button>
            </div>

            {/* Feedback messages */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-mint/30 ring-1 ring-mint text-ink text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose/15 ring-1 ring-rose-deep text-rose-deep text-xs font-semibold animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                    Seu Nome
                  </label>
                  <div className="rounded-2xl bg-display ring-1 ring-ink/5 px-3.5 py-3 flex items-center gap-2.5 shadow-inner focus-within:ring-rose/50">
                    <User className="size-4 text-ink-soft" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="w-full bg-transparent text-sm text-ink outline-none font-medium"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                  E-mail
                </label>
                <div className="rounded-2xl bg-display ring-1 ring-ink/5 px-3.5 py-3 flex items-center gap-2.5 shadow-inner focus-within:ring-rose/50">
                  <Mail className="size-4 text-ink-soft" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@calculadoraplus.com"
                    className="w-full bg-transparent text-sm text-ink outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider block mb-1">
                  Senha
                </label>
                <div className="rounded-2xl bg-display ring-1 ring-ink/5 px-3.5 py-3 flex items-center gap-2.5 shadow-inner focus-within:ring-rose/50">
                  <Lock className="size-4 text-ink-soft" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-ink outline-none font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink-soft hover:text-ink cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="calc-key w-full mt-2 py-3.5 rounded-2xl bg-rose text-white font-[family-name:var(--font-fredoka)] font-semibold text-sm shadow-md ring-1 ring-white/30 flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-deep active:scale-95 transition-all"
              >
                <LogIn className="size-4" />
                <span>{isSignUp ? "Concluir Cadastro Gratuito" : "Entrar na Conta"}</span>
              </button>
            </form>

            {/* Quick 1-Click Demo Login as Maxwell Admin */}
            <div className="mt-5 pt-4 border-t border-ink/10 text-center">
              <p className="text-[11px] text-ink-soft mb-2.5">Acesso rápido de administrador:</p>
              <button
                onClick={handleQuickDemoLogin}
                className="calc-key w-full py-2.5 rounded-2xl bg-display hover:bg-white ring-1 ring-ink/5 text-xs font-semibold text-ink flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-rose/20 text-rose-deep"
              >
                <Crown className="size-4 text-rose-deep" />
                <span>Entrar como Maxwell (Administrador Master)</span>
              </button>
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
    </div>
  );
}
