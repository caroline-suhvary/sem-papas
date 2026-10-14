// Aviso mostrado para quem criou conta com e-mail e ainda não clicou no link.
// Enquanto isso, grupos privados ficam bloqueados (aqui e nas regras do Firestore).
import { useState } from "react";
import { traduzirErro, useAuth } from "../../context/AuthContext";

export function VerifyEmail() {
  const { usuario, reenviarVerificacao, conferirVerificacao } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function rodar(acao: () => Promise<void>) {
    setMsg(null); setOcupado(true);
    try { await acao(); } catch (e) { setMsg(traduzirErro(e)); } finally { setOcupado(false); }
  }

  const botao = "w-full rounded-xl border-2 border-borda py-1 font-bold";
  return (
    <div className="rounded-xl border-2 border-borda bg-cartao p-3 sombra-pop text-sm">
      <p className="font-bold">📧 Confirme seu e-mail!</p>
      <p className="mt-1">Enviamos um link para <strong>{usuario?.email}</strong>. Clique nele para liberar os grupos privados. Veja também o spam.</p>
      <div className="mt-3 flex flex-col gap-2">
        <button disabled={ocupado} className={`${botao} bg-verde text-cartao`}
          onClick={() => rodar(async () => { if (!(await conferirVerificacao())) setMsg("Ainda não confirmado. Clique no link do e-mail e tente de novo."); })}>
          Já cliquei no e-mail
        </button>
        <button disabled={ocupado} className={`${botao} bg-mostarda text-[#1a1a1a]`}
          onClick={() => rodar(async () => { await reenviarVerificacao(); setMsg("Link reenviado!"); })}>
          Reenviar link
        </button>
      </div>
      {msg && <p className="mt-2 text-lingua">{msg}</p>}
    </div>
  );
}
