// Funções que conversam com o Firestore/Storage sobre MENSAGENS.
// Componentes não falam com o banco direto: chamam estas funções.
import {
  addDoc, collection, limit, Timestamp, where, onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import { LIMITE_ANEXO, LIMITE_TEXTO, VIDA_MSG_GRUPO, VIDA_MSG_PUBLICA, type Mensagem } from "../types";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf", "text/plain"];

// Caminho da coleção: pública ou subcoleção do grupo.
function colecao(grupoId?: string) {
  return grupoId ? collection(db, "groups", grupoId, "messages") : collection(db, "public_messages");
}

// Validação no navegador (a regra do Firestore valida de novo no servidor).
export function validarTexto(texto: string): string | null {
  if (texto.length > LIMITE_TEXTO) return `Máximo de ${LIMITE_TEXTO} caracteres.`;
  return null;
}

export function validarArquivo(f: File): string | null {
  if (f.size > LIMITE_ANEXO) return "O arquivo passa de 2 MB.";
  if (!TIPOS_PERMITIDOS.includes(f.type)) return "Use imagem (PNG, JPG, GIF, WebP), PDF ou TXT.";
  return null;
}

// onSnapshot = "fique escutando". Toda vez que algo muda no banco,
// o callback roda de novo com a lista atualizada. Retorna a função
// que PARA de escutar (usada na limpeza do useEffect).
export function escutarMensagens(grupoId: string | undefined, aoMudar: (m: Mensagem[]) => void, aoErrar: (e: Error) => void) {
  // Só pede ao banco o que ainda está "vivo": 24h na pública, 6 meses nos grupos.
  // Assim, mesmo antes do robô apagar, mensagens vencidas já somem da tela.
  const desde = Timestamp.fromMillis(Date.now() - (grupoId ? VIDA_MSG_GRUPO : VIDA_MSG_PUBLICA));
  const q = query(colecao(grupoId), where("createdAt", ">", desde), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => aoMudar(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Mensagem, "id">) })).reverse()),
    aoErrar,
  );
}

export async function enviarPublica(texto: string, apelido: string) {
  const t = texto.trim();
  const erro = validarTexto(t);
  if (erro || !t) throw new Error(erro ?? "Escreva algo.");
  await addDoc(colecao(), { text: t, authorName: apelido, createdAt: serverTimestamp() });
}

export async function enviarNoGrupo(grupoId: string, texto: string, autor: { uid: string; nome: string }, arquivo?: File | null) {
  const t = texto.trim();
  const erro = validarTexto(t) ?? (arquivo ? validarArquivo(arquivo) : null);
  if (erro) throw new Error(erro);
  if (!t && !arquivo) throw new Error("Escreva algo ou anexe um arquivo.");

  let file: Mensagem["file"];
  if (arquivo) {
    // Nome único para não sobrescrever arquivo de outra pessoa.
    const caminho = `groups/${grupoId}/${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, "_")}`;
    const r = ref(storage, caminho);
    await uploadBytes(r, arquivo, { contentType: arquivo.type });
    file = { url: await getDownloadURL(r), name: arquivo.name, type: arquivo.type, size: arquivo.size };
  }
  await addDoc(colecao(grupoId), {
    text: t, authorName: autor.nome, authorId: autor.uid, createdAt: serverTimestamp(), ...(file ? { file } : {}),
  });
}
