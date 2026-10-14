// Componente raiz: guarda o ESTADO COMPARTILHADO (conversa aberta, grupos,
// menu do celular) e distribui para os filhos via props.
//   App ──props──▶ Sidebar   (Sidebar avisa App com aoEscolher)
//   App ──props──▶ ChatWindow
// Sidebar e ChatWindow são "irmãos": conversam ATRAVÉS do pai.
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { useAuth } from "./context/AuthContext";
import { escutarMeusGrupos } from "./services/groups";
import { firebaseConfigurado } from "./services/firebase";
import type { Conversa, Grupo } from "./types";

export default function App() {
  const { usuario } = useAuth();
  const [conversa, setConversa] = useState<Conversa>({ tipo: "publica" });
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);

  // Escuta os grupos do usuário logado; ao sair da conta, limpa tudo.
  useEffect(() => {
    if (!usuario) { setGrupos([]); setConversa({ tipo: "publica" }); return; }
    return escutarMeusGrupos(usuario.uid, setGrupos);
  }, [usuario]);

  // Mantém o grupo aberto atualizado (ex.: alguém entrou e o contador muda).
  useEffect(() => {
    if (conversa.tipo !== "grupo") return;
    const atualizado = grupos.find((g) => g.id === conversa.grupo.id);
    if (!atualizado) setConversa({ tipo: "publica" });
    else if (atualizado !== conversa.grupo) setConversa({ tipo: "grupo", grupo: atualizado });
  }, [grupos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!firebaseConfigurado) {
    return <p className="p-8 font-bold">Configure o arquivo .env.local com as chaves do Firebase (veja GUIA_FIREBASE.md) e reinicie o npm run dev.</p>;
  }

  return (
    // Moldura azul arredondada envolvendo tudo, como no desenho.
    <div className="h-dvh p-2 sm:p-4">
     <div className="mx-auto flex h-full max-w-6xl flex-col rounded-3xl border-4 border-moldura bg-ceu p-3 sm:p-5">
      <Header aoAbrirMenu={() => setMenuAberto(true)} />
      <div className="flex min-h-0 flex-1 gap-4">
        <Sidebar aberta={menuAberto} atual={conversa} grupos={grupos}
          aoEscolher={(c) => { setConversa(c); setMenuAberto(false); }} aoFechar={() => setMenuAberto(false)} />
        <ChatWindow key={conversa.tipo === "grupo" ? conversa.grupo.id : "publica"} conversa={conversa} aoSairDoGrupo={() => setConversa({ tipo: "publica" })} />
      </div>
     </div>
    </div>
  );
}
