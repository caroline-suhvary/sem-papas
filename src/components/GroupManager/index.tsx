// Criar grupo ou entrar com código de convite.
import { useState } from "react";
import { useAuth, traduzirErro } from "../../context/AuthContext";
import { criarGrupo, entrarComCodigo } from "../../services/groups";
import { MAX_GRUPOS_POR_USUARIO } from "../../types";

export function GroupManager({ totalGrupos }: { totalGrupos: number }) {
  const { usuario } = useAuth();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const lotado = totalGrupos >= MAX_GRUPOS_POR_USUARIO;
  if (!usuario) return null;

  async function rodar(acao: () => Promise<string | void>, sucesso: (r?: string) => string) {
    setMsg(null);
    try { const r = await acao(); setMsg(sucesso(r ?? undefined)); setNome(""); setCodigo(""); }
    catch (e) { setMsg(traduzirErro(e)); }
  }

  const campo = "w-full rounded-xl border-2 border-borda bg-cartao px-2 py-1";
  return (
    <div className="flex flex-col gap-3">
      {lotado && <p className="text-sm text-lingua">Limite de 5 chats atingido.</p>}
      <div>
        <input className={campo} placeholder="Nome do novo grupo" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} />
        <button disabled={lotado || !nome.trim()} onClick={() => rodar(() => criarGrupo(usuario.uid, nome), (c) => `Grupo criado! Envie o código ${c} para alguém entrar.`)}
          className="mt-1 w-full rounded-xl border-2 border-borda bg-mostarda py-1 font-bold text-[#1a1a1a] disabled:opacity-50">+ Criar grupo</button>
      </div>
      <div>
        <input className={campo} placeholder="Código (ex.: PAPA-1234)" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        <button disabled={lotado || !codigo.trim()} onClick={() => rodar(() => entrarComCodigo(usuario.uid, codigo), () => "Você entrou no grupo!")}
          className="mt-1 w-full rounded-xl border-2 border-borda bg-cartao py-1 font-bold disabled:opacity-50">Entrar com código</button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
