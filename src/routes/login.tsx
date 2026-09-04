
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
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na Conta — Calculadora Plus" },
      {
        name: "description",
        content: "Acesse sua conta ou cadastre-se na Calculadora Plus para sincronizar preferências e histórico.",
      },
      { property: "og:title", content: "Entrar na Conta — Calculadora Plus" },
    ],
  }),
  component: LoginRoute,
});

interface UserSession {
  name: string;
  email: string;
}

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

  // Load session from localStorage on mount
  useEffect(() => {
    try {
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
    };

    setCurrentUser(session);
    try {
      localStorage.setItem("calc_user_session", JSON.stringify(session));
    } catch {
      // safe fallback
    }

    setSuccessMsg(isSignUp ? "Conta criada com sucesso!" : "Login realizado com sucesso!");
    setTimeout(() => {
      setSuccessMsg(null);
      navigate({ to: "/" });
    }, 1000);
  };

  const handleQuickDemoLogin = () => {
    const demoSession: UserSession = {
      name: "Maxwell",
      email: "maxwell@calculadoraplus.com",
    };
    setCurrentUser(demoSession);
    try {
      localStorage.setItem("calc_user_session", JSON.stringify(demoSession));
    } catch {
      // safe fallback
    }
    setSuccessMsg("Conectado instantaneamente como Maxwell!");
    setTimeout(() => {
      setSuccessMsg(null);
      navigate({ to: "/" });
    }, 900);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("calc_user_session");
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col justify-between text-ink transition-colors duration-300">
      {/* Top Navbar */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 z-20 calc-fade-up">
        <nav className="w-full rounded-3xl bg-sand/90 backdrop-blur-md ring-1 ring-ink/5 px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_10px_35px_rgb(0,0,0,0.05)]">
          {/* Logo Brand / Back */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="size-9 rounded-2xl bg-rose grid place-items-center text-white text-base font-[family-name:var(--font-fredoka)] font-bold ring-1 ring-white/40 shadow-sm group-hover:scale-105 transition-transform">
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
          </Link>

          {/* Navigation link to Home Calculator */}
          <Link
            to="/"
            className="calc-key flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-display ring-1 ring-ink/5 text-ink hover:bg-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <ArrowLeft className="size-3.5 text-rose-deep" />
            <span>Voltar à Calculadora</span>
          </Link>
        </nav>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="calc-fade-up w-full max-w-[430px] rounded-[min(5vw,32px)] bg-sand ring-1 ring-ink/5 p-6 sm:p-8 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.07)]">
          {currentUser ? (
            /* Logged-in Profile Area */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-mint/40 text-ink grid place-items-center">
                  <ShieldCheck className="size-6 text-rose-deep" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-fredoka)] font-semibold text-2xl text-ink leading-tight">
                    Sua Conta
                  </h2>
                  <p className="text-xs text-ink-soft">Você está autenticado na Calculadora Plus</p>
                </div>
              </div>

              <div className="rounded-2xl bg-display ring-1 ring-ink/5 p-5 flex items-center gap-4 shadow-inner">
                <div className="size-14 rounded-2xl bg-rose text-white text-2xl font-bold grid place-items-center ring-2 ring-white/50 shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-[family-name:var(--font-fredoka)] font-semibold text-lg text-ink truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-ink-soft truncate font-medium">{currentUser.email}</p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-mint uppercase tracking-wider mt-1.5">
                    <span className="size-2 rounded-full bg-mint" />
                    Sessão Ativa
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-display/60 ring-1 ring-ink/5 p-4 text-xs text-ink-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span>Cálculos realizados:</span>
                  <span className="font-bold text-ink">{calcCount} operações</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Armazenamento:</span>
                  <span className="font-bold text-emerald-600">Sincronizado Localmente</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  to="/"
                  className="calc-key w-full py-3.5 rounded-2xl bg-rose text-white font-[family-name:var(--font-fredoka)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:bg-rose-deep text-center"
                >
                  <Calculator className="size-4" />
                  <span>Abrir a Calculadora</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="calc-key w-full py-2.5 rounded-2xl bg-rose/15 text-rose-deep hover:bg-rose hover:text-white font-[family-name:var(--font-fredoka)] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="size-3.5" />
                  <span>Desconectar da Conta</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login & Sign Up Form */
            <div>
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
                      ? "Cadastre-se para salvar seus cálculos favoritos"
                      : "Entre com seus dados para continuar"}
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
                  <span>{isSignUp ? "Concluir Cadastro Gratuito" : "Entrar na Calculadora"}</span>
                </button>
              </form>

              {/* Quick 1-Click Demo Login */}
              <div className="mt-5 pt-4 border-t border-ink/10 text-center">
                <p className="text-[11px] text-ink-soft mb-2.5">Acesso rápido para testes:</p>
                <button
                  onClick={handleQuickDemoLogin}
                  className="calc-key w-full py-2.5 rounded-2xl bg-display hover:bg-white ring-1 ring-ink/5 text-xs font-semibold text-ink flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="size-4 text-rose-deep" />
                  <span>Entrar como Maxwell (1 Clique)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footnote */}
      <footer className="w-full pb-6 px-4 text-center calc-fade-up">
        <p className="text-sm font-medium text-ink-soft">
          Maxwell Você é o Melhro
        </p>
      </footer>
    </div>
  );
}
  