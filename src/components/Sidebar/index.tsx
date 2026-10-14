// Barra lateral: sala pública + grupos + login/perfil.
// Ela NÃO guarda qual conversa está aberta: recebe isso do pai (App)
// por props e avisa o pai pelo callback "aoEscolher". Fluxo: filho → pai.
import type { Conversa, Grupo } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { AuthPanel } from "../AuthPanel";
import { GroupManager } from "../GroupManager";
import { VerifyEmail } from "../VerifyEmail";

interface Props {
  aberta: boolean;
  atual: Conversa;
  grupos: Grupo[];
  aoEscolher: (c: Conversa) => void;
  aoFechar: () => void;
}

export function Sidebar({ aberta, atual, grupos, aoEscolher, aoFechar }: Props) {
  const { usuario, sair } = useAuth();
  const item = (ativo: boolean) =>
    `w-full text-left rounded-xl border-2 border-verde px-3 py-2 font-semibold transition ${ativo ? "bg-verde text-cartao" : "bg-cartao hover:bg-verde-claro"}`;

  return (
    <>
      {/* Fundo escuro clicável no celular */}
      {aberta && <div className="fixed inset-0 z-10 bg-black/40 md:hidden" onClick={aoFechar} />}
      <aside className={`fixed z-20 inset-y-0 left-0 w-72 overflow-y-auto border-4 border-verde bg-verde-claro p-4 transition-transform md:static md:translate-x-0 md:rounded-2xl ${aberta ? "translate-x-0" : "-translate-x-full"}`}>
        <h2 className="font-titulo text-2xl text-verde mb-2">Sala aberta</h2>
        <button className={item(atual.tipo === "publica")} onClick={() => aoEscolher({ tipo: "publica" })}># praça pública</button>

        <h2 className="font-titulo text-2xl text-verde mt-6 mb-2">Meus grupos ({grupos.length}/5)</h2>
        {!usuario && <p className="text-sm text-suave mb-3">Entre para criar ou participar de grupos privados.</p>}
        <div className="flex flex-col gap-2">
          {usuario?.emailVerified !== false && grupos.map((g) => (
            <button key={g.id} className={item(atual.tipo === "grupo" && atual.grupo.id === g.id)} onClick={() => aoEscolher({ tipo: "grupo", grupo: g })}>
              {g.name} <span className="text-xs font-normal opacity-80">({g.members.length}/6)</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {usuario ? (
            <>
              {usuario.emailVerified ? <GroupManager totalGrupos={grupos.length} /> : <VerifyEmail />}
              <div className="mt-6 border-t-2 border-verde/40 pt-3 text-sm">
                <p>Logado como <strong>{usuario.displayName || usuario.email}</strong></p>
                <button onClick={sair} className="mt-2 underline text-lingua">Sair da conta</button>
              </div>
            </>
          ) : (
            <AuthPanel />
          )}
        </div>
      </aside>
    </>
  );
}
