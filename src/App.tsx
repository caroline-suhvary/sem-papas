// src/App.tsx
// Componente raiz do Sem Papas: gerencia a conversa ativa, os grupos,
// o tema visual e a reunião temporária da sessão.

import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useTema } from "./context/ThemeContext";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { TempChatWindow } from "./components/TempChatWindow";
import { TempRoomModal } from "./components/TempRoomModal";
import { escutarMeusGrupos } from "./services/groups";
import { firebaseConfigurado } from "./services/firebase";
import {
  buscarSalaTemporaria,
  buscarSalaAtivaDoHost,
  ouvirSalaTemporaria,
  type TempRoom,
} from "./services/tempRooms";
import type { Conversa, Grupo } from "./types";

export default function App() {
  const { usuario } = useAuth();
  const { tema, alternar } = useTema();

  const [conversa, setConversa] = useState<Conversa>({ tipo: "publica" });
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalTempAberto, setModalTempAberto] = useState(false);
  const [salaTemporaria, setSalaTemporaria] = useState<TempRoom | null>(null);

  // Escuta os grupos da pessoa autenticada em tempo real.
  useEffect(() => {
    if (!usuario) {
      setGrupos([]);
      return;
    }
    const parar = escutarMeusGrupos(usuario.uid, setGrupos);
    return parar;
  }, [usuario?.uid]);

  // Mantém o grupo aberto atualizado caso seus dados mudem (ex: contagem de membros).
  useEffect(() => {
    if (conversa.tipo !== "grupo") return;
    const atualizado = grupos.find((g) => g.id === conversa.grupo.id);
    if (!atualizado) setConversa({ tipo: "publica" });
    else if (atualizado !== conversa.grupo)
      setConversa({ tipo: "grupo", grupo: atualizado });
  }, [grupos]);

  // Recupera reunião ao abrir a página:
  // 1. Pelo parâmetro na URL (?temp=ID)
  // 2. Pelo sessionStorage desta aba
  // 3. Se for a anfitriã logada que já tem sala ativa aberta
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const roomIdDaUrl = parametros.get("temp");
    const roomIdSalvo =
      roomIdDaUrl || sessionStorage.getItem("sem_papas_temp_room_id");

    if (roomIdSalvo && roomIdSalvo !== "[object Object]") {
      buscarSalaTemporaria(roomIdSalvo).then((sala) => {
        if (!sala || !sala.active || sala.expiresAt <= Date.now()) {
          sessionStorage.removeItem("sem_papas_temp_room_id");
          return;
        }

        setSalaTemporaria(sala);
        sessionStorage.setItem("sem_papas_temp_room_id", sala.id);

        if (roomIdDaUrl) {
          setConversa({ tipo: "temp", roomId: sala.id });
        }
      });
    } else if (usuario?.uid) {
      buscarSalaAtivaDoHost(usuario.uid).then((sala) => {
        if (sala && sala.active && sala.expiresAt > Date.now()) {
          setSalaTemporaria(sala);
          sessionStorage.setItem("sem_papas_temp_room_id", sala.id);
        }
      });
    }
  }, [usuario?.uid]);

  // Monitora encerramento ou expiração da sala temporária em tempo real.
  useEffect(() => {
    if (!salaTemporaria) return;

    const parar = ouvirSalaTemporaria(salaTemporaria.id, (salaAtualizada) => {
      const salaExpirou =
        !salaAtualizada || salaAtualizada.expiresAt <= Date.now();

      if (!salaAtualizada || !salaAtualizada.active || salaExpirou) {
        setSalaTemporaria(null);
        sessionStorage.removeItem("sem_papas_temp_room_id");

        setConversa((atual) =>
          atual.tipo === "temp" ? { tipo: "publica" } : atual,
        );
        return;
      }

      setSalaTemporaria(salaAtualizada);
    });

    return parar;
  }, [salaTemporaria?.id]);

  // Logo após criar a sala no modal, entra nela imediatamente sem recarregar a página
  async function handleRoomCreated(roomId: string) {
    const sala = await buscarSalaTemporaria(roomId);
    if (!sala) return;

    setSalaTemporaria(sala);
    sessionStorage.setItem("sem_papas_temp_room_id", sala.id);
    setConversa({ tipo: "temp", roomId: sala.id });
    setModalTempAberto(false);
  }

  function escolherConversa(c: Conversa) {
    setConversa(c);
    setMenuAberto(false);
  }

  function sairDaReuniaoTemporaria() {
    setConversa({ tipo: "publica" });
  }

  function sairDoGrupoAtual() {
    setConversa({ tipo: "publica" });
  }

  if (!firebaseConfigurado) {
    return (
      <p className="p-8 font-bold">
        Configure o arquivo .env.local com as chaves do Firebase (veja
        GUIA_FIREBASE.md) e reinicie o npm run dev.
      </p>
    );
  }

  return (
    // Moldura azul arredondada original
    <div className="h-dvh p-2 sm:p-4">
      <div className="mx-auto flex h-full max-w-6xl flex-col rounded-3xl border-4 border-moldura bg-ceu p-3 sm:p-5">
        {/* CABEÇALHO CENTRALIZADO */}
        <header className="relative shrink-0 px-2 pt-1 pb-3 text-center">
          {/* Botões do canto superior direito (em posição absoluta para não empurrar o centro) */}
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="md:hidden rounded-full border-2 border-verde bg-cartao px-3 py-1 font-bold text-verde hover:opacity-80 transition"
              aria-label="Abrir conversas">
              ☰
            </button>
            <button
              type="button"
              onClick={alternar}
              className="rounded-full border-2 border-verde bg-cartao px-3 py-1 text-sm font-semibold text-verde cursor-pointer hover:opacity-80 transition"
              aria-label="Alternar tema"
              title={
                tema === "claro" ? "Ativar modo escuro" : "Ativar modo claro"
              }>
              {tema === "claro" ? "☾" : "☀"}
            </button>
          </div>

          {/* Logos e título centralizados */}
          <div className="flex items-center justify-center gap-3 sm:gap-8">
            <img
              src="/lingua-esquerda.png"
              alt="Logo Sem Papas"
              className="h-10 w-10 sm:h-16 sm:w-16 object-contain -rotate-6 select-none shrink-0"
            />
            <h1 className="whitespace-nowrap font-titulo text-3xl sm:text-5xl text-verde">
              Sem Papas
            </h1>
            <img
              src="/lingua-direita.png"
              alt=""
              className="h-10 w-10 sm:h-16 sm:w-16 object-contain rotate-6 select-none shrink-0"
            />
          </div>

          {/* Legenda centralizada */}
          <p className="mt-1 text-xs sm:text-sm font-semibold text-suave">
            Um chat para falar sem papas na língua — entre na sala pública ou
            crie seu grupo.
          </p>
        </header>

        {/* CORPO DO APLICATIVO */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden mt-1">
          <Sidebar
            aberta={menuAberto}
            atual={conversa}
            grupos={grupos}
            salaTemporaria={salaTemporaria}
            aoEscolher={escolherConversa}
            aoFechar={() => setMenuAberto(false)}
            aoAbrirTempModal={() => setModalTempAberto(true)}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {conversa.tipo === "temp" ? (
              salaTemporaria ? (
                <TempChatWindow
                  room={salaTemporaria}
                  onLeave={sairDaReuniaoTemporaria}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-borda bg-cartao p-6 text-center">
                  <p className="text-sm font-bold text-suave">
                    Carregando dados da reunião temporária…
                  </p>
                  <button
                    type="button"
                    onClick={() => setConversa({ tipo: "publica" })}
                    className="rounded-xl border-2 border-verde bg-cartao px-4 py-2 text-sm font-bold text-verde hover:bg-verde-claro transition">
                    Voltar para a Praça Pública
                  </button>
                </div>
              )
            ) : (
              <ChatWindow
                key={conversa.tipo === "grupo" ? conversa.grupo.id : "publica"}
                conversa={conversa}
                aoSairDoGrupo={sairDoGrupoAtual}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO DE REUNIÃO TEMPORÁRIA */}
      <TempRoomModal
        isOpen={modalTempAberto}
        onClose={() => setModalTempAberto(false)}
        hostUid={usuario?.uid || ""}
        hostName={
          usuario?.displayName || usuario?.email?.split("@")[0] || "Anfitrião"
        }
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}
