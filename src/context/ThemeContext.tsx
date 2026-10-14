// Context = "variável global" do React. Qualquer componente pode ler
// o tema sem precisar receber props de pai em pai.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "claro" | "escuro";
const Ctx = createContext<{ tema: Tema; alternar: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Função no useState: roda só na primeira vez (lê preferência salva ou do sistema).
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem("sem-papas:tema") as Tema | null;
    if (salvo) return salvo;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  });

  // Efeito colateral: sempre que o tema mudar, aplica a classe no <html> e salva.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
    localStorage.setItem("sem-papas:tema", tema);
  }, [tema]);

  return <Ctx.Provider value={{ tema, alternar: () => setTema((t) => (t === "claro" ? "escuro" : "claro")) }}>{children}</Ctx.Provider>;
}

export function useTema() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTema precisa estar dentro de <ThemeProvider>");
  return c;
}
