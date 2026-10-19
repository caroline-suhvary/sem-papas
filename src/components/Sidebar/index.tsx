// Sidebar: navegação entre Praça Pública, reunião temporária e grupos.
// Em desktop, ela tem largura fixa; assim, mensagens grandes não a comprimem.

import type { Conversa, Grupo } from "../../types";
import type { TempRoom } from "../../services/tempRooms";
import { useAuth } from "../../context/AuthContext";
import { AuthPanel } from "../AuthPanel";
import { GroupManager } from "../GroupManager";
import { VerifyEmail } from "../VerifyEmail";

interface Props {
  aberta: boolean;
  atual: Conversa;
  grupos: Grupo[];
  salaTemporaria?: TempRoom | null;
  aoEscolher: (conversa: Conversa) => void;
  aoFechar: () => void;
  aoAbrirTempModal: () => void;
}

export function Sidebar({
  aberta,
  atual,
  grupos,
  salaTemporaria,
  aoEscolher,
  aoFechar,
  aoAbrirTempModal,
}: Props) {
  const { usuario, sair } = useAuth();

  // Mantém o padrão visual dos itens de navegação.
  const item = (ativo: boolean) =>
    `w-full rounded-xl border-2 border-verde px-3 py-2 text-left font-semibold transition cursor-pointer ${
      ativo
        ? "bg-verde text-cartao"
        : "bg-cartao text-verde hover:bg-verde-claro"
    }`;

  return (
    <>
      {/* Fundo que fecha o menu quando a pessoa toca fora dele, no celular. */}
      {aberta && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
          onClick={aoFechar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-20 flex w-72 shrink-0 flex-col overflow-hidden border-4 border-verde bg-verde-claro p-4 transition-transform md:static md:h-full md:translate-x-0 md:rounded-2xl ${
          aberta ? "translate-x-0" : "-translate-x-full"
        }`}>
        {/* Apenas esta parte rola. A largura fixa impede o chat de esmagar a Sidebar. */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {/* SALA PÚBLICA */}
          <section>
            <h2 className="mb-2 font-titulo text-2xl text-verde">
              Sala aberta
            </h2>

            <button
              type="button"
              className={item(atual.tipo === "publica")}
              onClick={() => aoEscolher({ tipo: "publica" })}>
              # praça pública
            </button>
          </section>

          {/* REUNIÃO TEMPORÁRIA */}
          <section className="mt-5">
            <h2 className="mb-2 font-titulo text-2xl text-verde">Temporária</h2>

            {/* Exibe o botão da reunião sempre que houver sala criada nesta sessão */}
            {salaTemporaria && (
              <button
                type="button"
                className={`${item(atual.tipo === "temp")} mb-2 flex items-center justify-between gap-2`}
                onClick={() =>
                  aoEscolher({ tipo: "temp", roomId: salaTemporaria.id })
                }>
                <span className="min-w-0 truncate">
                  ⚡ {salaTemporaria.name || "Reunião em andamento"}
                </span>
                <span className="shrink-0 text-xs">Entrar</span>
              </button>
            )}

            <button
              type="button"
              onClick={aoAbrirTempModal}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 border-dashed border-verde bg-cartao px-3 py-2 text-left font-bold text-verde transition hover:bg-verde-claro">
              <span>⚡ Criar reunião</span>

              <span className="shrink-0 rounded-full bg-verde px-2 py-0.5 font-sans text-[10px] font-normal text-white">
                QR Code
              </span>
            </button>
          </section>

          {/* GRUPOS PRIVADOS */}
          <section className="mt-5">
            <h2 className="mb-2 font-titulo text-2xl text-verde">
              Meus grupos ({grupos.length}/5)
            </h2>

            {!usuario && (
              <p className="mb-3 text-sm text-suave">
                Entre para criar ou participar de grupos privados.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {usuario?.emailVerified !== false &&
                grupos.map((grupo) => (
                  <button
                    type="button"
                    key={grupo.id}
                    className={item(
                      atual.tipo === "grupo" && atual.grupo.id === grupo.id,
                    )}
                    onClick={() => aoEscolher({ tipo: "grupo", grupo })}>
                    <span className="block truncate">{grupo.name}</span>

                    <span className="text-xs font-normal opacity-80">
                      {grupo.members.length}/6 participantes
                    </span>
                  </button>
                ))}
            </div>
          </section>

          {/* FORMULÁRIOS DE GRUPO E CONTA */}
          <section className="mt-4">
            {usuario ? (
              <>
                {usuario.emailVerified ? (
                  <GroupManager totalGrupos={grupos.length} />
                ) : (
                  <VerifyEmail />
                )}

                <div className="mt-5 border-t-2 border-verde/40 pt-3 text-sm text-verde">
                  <p className="break-words">
                    Logada como{" "}
                    <strong>{usuario.displayName || usuario.email}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={sair}
                    className="mt-2 block cursor-pointer text-lingua underline">
                    Sair da conta
                  </button>
                </div>
              </>
            ) : (
              <AuthPanel />
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
