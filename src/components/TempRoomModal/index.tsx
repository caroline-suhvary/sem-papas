import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { criarSalaTemporaria } from "../../services/tempRooms";

interface TempRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostUid: string;
  hostName: string;
  onRoomCreated: (roomId: string) => void;
}

export const TempRoomModal: React.FC<TempRoomModalProps> = ({
  isOpen,
  onClose,
  hostUid,
  hostName,
  onRoomCreated,
}) => {
  const [title, setTitle] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const urlDaSala = createdRoomId
    ? `${window.location.origin}?temp=${createdRoomId}`
    : "";

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const novaSala = await criarSalaTemporaria(hostUid, hostName, title);
      setCreatedRoomId(novaSala.id);
      setTitle("");
    } catch (err: any) {
      setErro(err?.message || "Não foi possível criar a sala temporária.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarLink = async () => {
    if (!urlDaSala) return;
    try {
      await navigator.clipboard.writeText(urlDaSala);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar o link automaticamente.");
    }
  };

  const handleEntrarAgora = () => {
    if (!createdRoomId) return;
    onRoomCreated(createdRoomId);
    setCreatedRoomId(null);
    onClose();
  };

  const handleFechar = () => {
    setCreatedRoomId(null);
    setErro(null);
    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border-4 border-yellow-400 bg-white p-6 shadow-2xl text-zinc-900">
        {/* Cabeçalho do modal */}
        <div className="mb-4 flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <h2 className="text-xl font-black uppercase tracking-wide text-zinc-900">
            {createdRoomId ? "🎉 Sala Criada!" : "⚡ Nova Sala Temporária"}
          </h2>
          <button
            type="button"
            onClick={handleFechar}
            className="rounded-full bg-zinc-200 px-2.5 py-1 text-sm font-bold text-zinc-700 hover:bg-zinc-300"
            aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Mensagem de erro, se houver */}
        {erro && (
          <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-100 p-3 text-xs font-bold text-red-700">
            {erro}
          </div>
        )}

        {!createdRoomId ? (
          /* Formulário de criação */
          <form onSubmit={handleCriar} className="space-y-4">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Crie uma sala para reuniões rápidas. Participantes entram por link
              ou QR Code <strong>sem precisar de cadastro</strong>. Tudo é
              descartado após o término (duração máxima de 3 horas, até 25
              participantes).
            </p>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1">
                Nome da Reunião
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Alinhamento de Projeto"
                maxLength={60}
                required
                className="w-full rounded-xl border-2 border-zinc-300 p-2.5 text-sm font-semibold outline-none focus:border-yellow-400"
              />
            </div>

            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-900 space-y-1">
              <div>
                • <strong>Capacidade:</strong> até 25 pessoas
              </div>
              <div>
                • <strong>Duração máxima:</strong> 3 horas
              </div>
              <div>
                • <strong>Exclusão:</strong> descartada quando você encerrar
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleFechar}
                className="flex-1 rounded-xl border-2 border-zinc-300 py-2.5 text-xs font-black uppercase text-zinc-700 hover:bg-zinc-100">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-yellow-400 py-2.5 text-xs font-black uppercase text-zinc-900 hover:bg-yellow-300 disabled:opacity-50 shadow-md">
                {loading ? "Criando..." : "Criar Sala"}
              </button>
            </div>
          </form>
        ) : (
          /* Visualização da sala criada (Link + QR Code) */
          <div className="space-y-4 text-center">
            <p className="text-xs text-zinc-600">
              Compartilhe o QR Code ou copie o link para que as pessoas entrem
              agora mesmo:
            </p>

            {/* Render do QR Code via qrcode.react */}
            <div className="flex justify-center p-3 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-300">
              <QRCodeSVG
                value={urlDaSala}
                size={180}
                bgColor="#F9FAFB"
                fgColor="#18181B"
                level="M"
              />
            </div>

            {/* Link e botão de copiar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urlDaSala}
                className="flex-1 rounded-xl border-2 border-zinc-300 bg-zinc-100 p-2 text-xs font-mono text-zinc-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopiarLink}
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                {copiado ? "✓ Copiado!" : "Copiar"}
              </button>
            </div>

            {/* Ações finais: entrar na reunião imediatamente */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleEntrarAgora}
                className="w-full rounded-xl bg-green-500 py-3 text-sm font-black uppercase text-white hover:bg-green-600 shadow-md transition hover:scale-[1.02]">
                Entrar na Sala Agora →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
