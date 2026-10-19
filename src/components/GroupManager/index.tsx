// Criar grupo ou entrar com código - compacto, elegante e compatível com modo escuro.
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

  async function rodar(
    acao: () => Promise<string | void>,
    sucesso: (r?: string) => string,
  ) {
    setMsg(null);
    try {
      const r = await acao();
      setMsg(sucesso(r ?? undefined));
      setNome("");
      setCodigo("");
    } catch (e) {
      setMsg(traduzirErro(e));
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {lotado && (
        <p className="text-xs text-lingua font-bold">
          Limite de 5 grupos atingido.
        </p>
      )}

      {/* CRIAR NOVO GRUPO */}
      <div>
        <span className="block text-[11px] font-bold text-verde uppercase mb-1">
          Novo Grupo
        </span>
        <div className="flex gap-1.5">
          <input
            className="flex-1 min-w-0 rounded-xl border-2 border-borda bg-cartao px-2.5 py-1 text-sm outline-none transition focus:border-verde"
            placeholder="Nome do grupo..."
            maxLength={40}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <button
            disabled={lotado || !nome.trim()}
            onClick={() =>
              rodar(
                () => criarGrupo(usuario.uid, nome),
                (c) => `Código: ${c}`,
              )
            }
            className="rounded-xl border-2 border-borda bg-mostarda px-3 py-1 text-xs font-bold text-[#1a1a1a] transition hover:brightness-105 active:scale-95 disabled:opacity-40 cursor-pointer shrink-0">
            + Criar
          </button>
        </div>
      </div>

      {/* ENTRAR COM CÓDIGO */}
      <div>
        <span className="block text-[11px] font-bold text-verde uppercase mb-1">
          Entrar com Código
        </span>
        <div className="flex gap-1.5">
          <input
            className="flex-1 min-w-0 rounded-xl border-2 border-borda bg-cartao px-2.5 py-1 text-xs uppercase font-mono tracking-wider outline-none transition focus:border-verde"
            placeholder="Ex: PAPA-1234"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          />
          <button
            disabled={lotado || !codigo.trim()}
            onClick={() =>
              rodar(
                () => entrarComCodigo(usuario.uid, codigo),
                () => "Você entrou no grupo!",
              )
            }
            className="rounded-xl border-2 border-borda bg-cartao px-3 py-1 text-xs font-bold transition hover:bg-verde hover:text-white active:scale-95 disabled:opacity-40 cursor-pointer shrink-0">
            Entrar
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-xs font-semibold p-1.5 rounded-lg bg-cartao border border-borda">
          {msg}
        </p>
      )}
    </div>
  );
}
