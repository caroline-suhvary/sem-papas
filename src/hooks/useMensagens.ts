// Hook personalizado: encapsula "escutar mensagens de uma conversa".
// O componente só faz: const { mensagens } = useMensagens(grupoId)
import { useEffect, useState } from "react";
import { escutarMensagens } from "../services/chat";
import type { Mensagem } from "../types";

export function useMensagens(grupoId?: string) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true); setErro(null); setMensagens([]);
    const parar = escutarMensagens(
      grupoId,
      (m) => { setMensagens(m); setCarregando(false); },
      (e) => { setErro(e.message); setCarregando(false); },
    );
    return parar; // trocar de conversa = parar de ouvir a anterior
  }, [grupoId]);

  return { mensagens, erro, carregando };
}
