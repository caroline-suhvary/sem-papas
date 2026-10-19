import React, { useEffect, useRef, useState } from "react";
import {
  TempRoom,
  TempMessage,
  ouvirMensagensTemporarias,
  enviarMensagemTemporaria,
  encerrarSalaTemporaria,
} from "../../services/tempRooms";
import { useAuth } from "../../context/AuthContext";

interface TempChatWindowProps {
  room: TempRoom;
  guestNickname?: string;
  onLeave: () => void;
}

export const TempChatWindow: React.FC<TempChatWindowProps> = ({
  room,
  guestNickname,
  onLeave,
}) => {
  // No AuthContext deste projeto, o usuário logado chama-se "usuario".
  const { usuario } = useAuth();

  const [messages, setMessages] = useState<TempMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [tempoRestante, setTempoRestante] = useState("");
  const [salaExpirada, setSalaExpirada] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Descobre se a pessoa atual é a anfitriã da reunião.
  const souAnfitriao = Boolean(usuario && usuario.uid === room.hostUid);

  // Participante sem login usa o apelido escolhido ao entrar.
  const meuApelido = souAnfitriao
    ? usuario?.displayName || usuario?.email?.split("@")[0] || "Anfitrião"
    : guestNickname || "Convidado";

  // Escuta as mensagens em tempo real.
  useEffect(() => {
    const unsubscribe = ouvirMensagensTemporarias(room.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [room.id]);

  // Mantém a última mensagem visível.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Atualiza o cronômetro até a expiração da sala.
  useEffect(() => {
    const calcularTempo = () => {
      const diff = room.expiresAt - Date.now();

      if (diff <= 0) {
        setTempoRestante("00:00:00");
        setSalaExpirada(true);
        return;
      }

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTempoRestante(
        `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
          2,
          "0",
        )}:${String(segundos).padStart(2, "0")}`,
      );
    };

    calcularTempo();

    const interval = window.setInterval(calcularTempo, 1000);

    return () => window.clearInterval(interval);
  }, [room.expiresAt]);

  const handleEnviar = async (event: React.FormEvent) => {
    event.preventDefault();

    const textoLimpo = inputText.trim();

    if (!textoLimpo || sending || !room.active || salaExpirada) {
      return;
    }

    try {
      setSending(true);

      await enviarMensagemTemporaria(
        room.id,
        textoLimpo,
        meuApelido,
        usuario?.uid,
        souAnfitriao,
      );

      setInputText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem na sala temporária:", error);
      alert(
        "Não foi possível enviar a mensagem. A sala pode ter sido encerrada.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleEncerrar = async () => {
    const confirmou = window.confirm(
      "Deseja realmente encerrar a reunião para todos os participantes?",
    );

    if (!confirmou) return;

    try {
      setEncerrando(true);
      await encerrarSalaTemporaria(room.id);
    } catch (error) {
      console.error("Erro ao encerrar sala:", error);
      alert("Falha ao encerrar a sala.");
    } finally {
      setEncerrando(false);
    }
  };

  const estaFechada = !room.active || salaExpirada;

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-2 border-black bg-[#fdfbf7] shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-[#1a1824] dark:shadow-[4px_4px_0_0_#fff]">
      {/* Cabeçalho compacto: ocupa menos espaço vertical no chat. */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-[#ffdd59] p-2.5 dark:border-white dark:bg-[#2c2738] sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-3 w-3 shrink-0 animate-pulse rounded-full border border-black bg-red-500" />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded bg-black px-2 py-0.5 text-xs font-black uppercase text-white">
                Temporária
              </span>

              <h2 className="truncate text-base font-black text-black dark:text-white sm:text-lg">
                {room.name}
              </h2>
            </div>

            <p className="truncate text-xs text-neutral-700 dark:text-neutral-300">
              Você está como:{" "}
              <strong className="text-black dark:text-white">
                {meuApelido}
              </strong>
              {souAnfitriao && " 👑 (Anfitrião)"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-neutral-600 dark:text-neutral-300">
              Expira em
            </span>

            <span className="rounded border border-black bg-white px-2 py-0.5 font-mono text-sm font-black text-red-600 shadow-sm dark:border-white dark:bg-black sm:text-base">
              ⏳ {tempoRestante || "03:00:00"}
            </span>
          </div>

          {souAnfitriao ? (
            <button
              type="button"
              onClick={handleEncerrar}
              disabled={encerrando || estaFechada}
              className="rounded border border-black bg-red-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-[2px_2px_0_0_#000] hover:bg-red-700 disabled:opacity-50">
              {encerrando ? "Encerrando..." : "Encerrar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeave}
              className="rounded border border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000] hover:bg-neutral-100">
              Sair
            </button>
          )}
        </div>
      </header>

      {estaFechada && (
        <div className="border-b-2 border-red-500 bg-red-100 p-3 text-center text-xs font-bold text-red-900 dark:bg-red-950 dark:text-red-200 sm:text-sm">
          ⛔ Esta sala temporária foi encerrada e não aceita mais mensagens. O
          histórico será descartado.
        </div>
      )}

      {/* min-w-0 e overflow-x-hidden impedem mensagens longas de esmagarem a Sidebar. */}
      <main className="min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-neutral-500">
            <span className="mb-2 text-4xl">💬</span>
            <p className="text-sm font-bold">Nenhuma mensagem ainda.</p>
            <p className="text-xs">
              Comece a conversa! Ela será descartada quando a sala fechar.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              (usuario && msg.authorId === usuario.uid) ||
              (!usuario && msg.authorNickname === meuApelido);

            return (
              <div
                key={msg.id}
                className={`flex min-w-0 flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}>
                <div className="mb-1 flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  <span className="max-w-full truncate">
                    {msg.authorNickname}
                  </span>

                  {msg.isHost && (
                    <span className="shrink-0 rounded border border-black bg-yellow-400 px-1 py-0.5 text-[9px] font-black text-black">
                      👑 Anfitrião
                    </span>
                  )}
                </div>

                <div
                  className={`min-w-0 max-w-[85%] overflow-hidden rounded-lg border-2 border-black p-3 text-sm shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff] sm:max-w-[70%] ${
                    isMe
                      ? "bg-[#a3e635] text-black"
                      : "bg-white text-black dark:bg-[#2c2738] dark:text-white"
                  }`}>
                  {/* overflow-wrap quebra inclusive links e textos enormes sem espaços. */}
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleEnviar}
        className="flex shrink-0 gap-2 border-t-2 border-black bg-white p-3 dark:border-white dark:bg-[#201d2d]">
        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder={
            estaFechada
              ? "Sala encerrada"
              : "Digite sua mensagem temporária... (máx. 1.000)"
          }
          maxLength={1000}
          disabled={estaFechada || sending}
          className="min-w-0 flex-1 rounded border-2 border-black bg-neutral-100 px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 dark:border-white dark:bg-[#15131d] dark:text-white"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || estaFechada || sending}
          className="shrink-0 cursor-pointer rounded border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-black uppercase text-black shadow-[2px_2px_0_0_#000] hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? "..." : "Enviar"}
        </button>
      </form>
    </section>
  );
};
