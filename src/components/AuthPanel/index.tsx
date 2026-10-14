// Formulário de login: Google (1 clique) OU e-mail e senha.
// "modo" alterna entre entrar e cadastrar sem trocar de página.
import { useState, type FormEvent } from "react";
import { traduzirErro, useAuth } from "../../context/AuthContext";

export function AuthPanel() {
  const { entrarGoogle, entrarEmail, cadastrar, avisoConta } = useAuth();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function rodar(acao: () => Promise<void>) {
    setErro(null); setEnviando(true);
    try { await acao(); } catch (e) { setErro(traduzirErro(e)); } finally { setEnviando(false); }
  }

  function enviar(e: FormEvent) {
    e.preventDefault(); // impede o navegador de recarregar a página
    rodar(() => (modo === "entrar" ? entrarEmail(email, senha) : cadastrar(nome, email, senha)));
  }

  const campo = "w-full rounded-xl border-2 border-borda bg-cartao px-2 py-1";
  return (
    <div className="rounded-xl border-2 border-borda bg-cartao p-3 sombra-pop">
      <button disabled={enviando} onClick={() => rodar(entrarGoogle)} className="w-full rounded-xl border-2 border-borda bg-mostarda py-2 font-bold text-[#1a1a1a]">
        Entrar com Google
      </button>
      <p className="my-2 text-center text-xs text-suave">— ou —</p>
      <form onSubmit={enviar} className="flex flex-col gap-2">
        {modo === "cadastrar" && <input className={campo} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={40} />}
        <input className={campo} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={campo} type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        <button disabled={enviando} className="rounded-xl border-2 border-borda bg-lingua py-1 font-bold text-[#fff]">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      {avisoConta && <p className="mt-2 text-sm font-bold text-lingua">{avisoConta}</p>}
      <p className="mt-2 text-xs text-suave">Contas sem acesso por 30 dias são excluídas (aviso por e-mail aos 28).</p>
      {erro && <p className="mt-2 text-sm text-lingua">{erro}</p>}
      <button onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")} className="mt-2 text-xs underline">
        {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tenho conta"}
      </button>
    </div>
  );
}
