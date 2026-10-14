// Campo de digitação com contador de caracteres e (só nos grupos) anexo.
// Ele não sabe ONDE salvar: recebe "aoEnviar" do pai. Assim o mesmo
// componente serve para a sala pública e para os grupos.
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LIMITE_TEXTO } from "../../types";
// import { validarArquivo } from "../../services/chat"; // Desativado temporariamente (sem Storage)

interface Props {
  permiteAnexo: boolean;
  desabilitado?: string | null; // motivo para bloquear (ex.: grupo com 1 pessoa)
  aoEnviar: (texto: string, arquivo: File | null) => Promise<void>;
}

export function MessageInput({ permiteAnexo, desabilitado, aoEnviar }: Props) {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null); // useRef: acesso direto ao <input> escondido

  const restante = LIMITE_TEXTO - texto.length;
  const perto = restante <= 100;

  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (enviando || (!texto.trim() && !arquivo)) return;
    setEnviando(true);
    setErro(null);
    try {
      await aoEnviar(texto, arquivo);
      setTexto("");
      setArquivo(null);
    } catch (er) {
      setErro(er instanceof Error ? er.message : "Falha ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  // Enter envia; Shift+Enter pula linha.
  function teclas(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  if (desabilitado)
    return (
      <p className="rounded-2xl border-4 border-rosa bg-rosa-claro p-4 text-center text-suave">
        {desabilitado}
      </p>
    );

  return (
    <form onSubmit={enviar} className="pt-2">
      {/* 1. Visualização do anexo selecionado (desativado)
      {arquivo && (
        <p className="mb-2 text-sm">📎 {arquivo.name} <button type="button" onClick={() => setArquivo(null)} className="ml-2 text-lingua underline">remover</button></p>
      )}
      */}

      <div className="flex items-end gap-2">
        {/* 2. Botão do clipe e seletor de arquivo (desativados)
        {permiteAnexo && (
          <>
            <input ref={inputArquivo} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                if (!f) return;
                const problema = validarArquivo(f);
                if (problema) { setErro(problema); return; }
                setErro(null); setArquivo(f);
              }} />
            <button type="button" onClick={() => inputArquivo.current?.click()} className="rounded-xl border-4 border-rosa bg-rosa-claro px-3 py-2" aria-label="Anexar arquivo (máx. 2 MB)">📎</button>
          </>
        )}
        */}

        {/* maxLength trava a digitação em 1000 — inclusive ao colar texto */}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={teclas}
          maxLength={LIMITE_TEXTO}
          rows={2}
          placeholder="Fala sem papas na língua…"
          className="flex-1 resize-none rounded-2xl border-4 border-rosa bg-rosa-claro px-4 py-3 outline-none placeholder:text-suave focus:border-laranja"
        />
        <button
          disabled={enviando}
          className="self-end rounded-xl border-4 border-verde bg-verde-claro px-4 py-1 font-titulo text-2xl text-verde hover:bg-verde hover:text-cartao disabled:opacity-50">
          enviar
        </button>
      </div>
      <div className="mt-1 flex justify-between text-xs">
        <span className="text-lingua">{erro}</span>
        <span className={perto ? "font-bold text-lingua" : "text-suave"}>
          {texto.length.toLocaleString("pt-BR")} /{" "}
          {LIMITE_TEXTO.toLocaleString("pt-BR")}
        </span>
      </div>
    </form>
  );
}
