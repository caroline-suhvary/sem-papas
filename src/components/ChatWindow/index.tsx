// Janela da conversa aberta: lista de mensagens + campo de envio.
// Decide as regras de cada tipo de conversa (pública x grupo).
import { useEffect, useMemo, useRef } from "react";
import type { Conversa } from "../../types";
import { MIN_MEMBROS } from "../../types";
import { useMensagens } from "../../hooks/useMensagens";
import { useAuth } from "../../context/AuthContext";
import { enviarNoGrupo, enviarPublica } from "../../services/chat";
import { sairDoGrupo } from "../../services/groups";
import { obterApelido } from "../../utils/apelido";
import { MessageBubble } from "../MessageBubble";
import { MessageInput } from "../MessageInput";

export function ChatWindow({
  conversa,
  aoSairDoGrupo,
}: {
  conversa: Conversa;
  aoSairDoGrupo: () => void;
}) {
  const { usuario } = useAuth();
  const grupo = conversa.tipo === "grupo" ? conversa.grupo : null;
  const { mensagens, erro, carregando } = useMensagens(grupo?.id);
  const apelido = useMemo(() => obterApelido(), []); // calcula uma vez só
  const fim = useRef<HTMLDivElement>(null);

  // Toda mensagem nova rola a tela até o fim.
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const sozinho = grupo && grupo.members.length < MIN_MEMBROS;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
        <h2 className="font-titulo text-3xl text-verde">
          {grupo ? grupo.name : "# praça pública"}
        </h2>
        {grupo ? (
          <>
            <span className="rounded-full bg-mostarda px-3 text-sm font-bold text-[#1a1a1a]">
              convite: {grupo.id}
            </span>
            <span className="text-sm text-suave">
              {grupo.members.length}/6 pessoas
            </span>
            <button
              onClick={async () => {
                if (usuario && confirm("Sair deste grupo?")) {
                  await sairDoGrupo(usuario.uid, grupo.id);
                  aoSairDoGrupo();
                }
              }}
              className="ml-auto text-sm text-lingua underline">
              Sair do grupo
            </button>
          </>
        ) : (
          <span className="text-sm text-suave">
            Você é <strong>{apelido}</strong> · somente texto · aberta a todos
          </span>
        )}
      </div>

      {/* Aviso de inatividade: a outra pessoa do chat a dois sumiu há 28+ dias */}
      {grupo?.expiring && grupo.expiring.uid !== usuario?.uid && (
        <div
          role="alert"
          className="rounded-xl bg-mostarda px-4 py-2 text-sm font-bold text-[#1a1a1a]">
          ⏳ {grupo.expiring.name} não entra há 28 dias. Se não voltar até{" "}
          {grupo.expiring.deleteAt.toDate().toLocaleDateString("pt-BR")}, a
          conta dela será excluída e este chat deixará de existir.
        </div>
      )}
      {!grupo && (
        <p className="px-2 text-xs text-suave">
          Mensagens desta sala somem após 24 horas.
        </p>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-3">
        {carregando && <p className="text-suave">Girando o disco…</p>}
        {erro && (
          <p className="text-lingua">Não foi possível carregar: {erro}</p>
        )}
        {!carregando && !erro && mensagens.length === 0 && (
          <p className="text-suave">
            Ninguém falou nada ainda. Seja a primeira voz!
          </p>
        )}
        {mensagens.map((m) => (
          <MessageBubble
            key={m.id}
            m={m}
            minha={
              grupo ? m.authorId === usuario?.uid : m.authorName === apelido
            }
          />
        ))}
        <div ref={fim} />
      </div>

      <MessageInput
        permiteAnexo={!!grupo}
        desabilitado={
          sozinho
            ? `Aguardando mais alguém: envie o código ${grupo!.id}. Um chat precisa de pelo menos 2 pessoas.`
            : null
        }
        aoEnviar={(texto, arquivo) =>
          grupo && usuario
            ? enviarNoGrupo(
                grupo.id,
                texto,
                {
                  uid: usuario.uid,
                  nome: usuario.displayName || usuario.email || "Anônimo",
                },
                arquivo,
              )
            : enviarPublica(texto, apelido)
        }
      />
    </section>
  );
}
