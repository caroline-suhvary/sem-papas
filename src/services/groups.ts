// Funções sobre GRUPOS. Usamos "writeBatch": várias gravações que
// acontecem juntas ou nenhuma acontece (como uma transação SQL).
import {
  arrayRemove, arrayUnion, collection, doc, getDoc, onSnapshot, query, where, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { MAX_GRUPOS_POR_USUARIO, MAX_MEMBROS, type Grupo } from "../types";

// Código de convite legível: PAPA-1234
function gerarCodigo() {
  return `PAPA-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function meusGruposIds(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, "users", uid));
  return (snap.data()?.groups as string[] | undefined) ?? [];
}

// Lista em tempo real dos grupos dos quais sou membro.
export function escutarMeusGrupos(uid: string, aoMudar: (g: Grupo[]) => void) {
  const q = query(collection(db, "groups"), where("members", "array-contains", uid));
  return onSnapshot(q, (snap) => aoMudar(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Grupo, "id">) }))));
}

export async function criarGrupo(uid: string, nome: string) {
  const n = nome.trim();
  if (!n || n.length > 40) throw new Error("Nome entre 1 e 40 caracteres.");
  const ids = await meusGruposIds(uid);
  if (ids.length >= MAX_GRUPOS_POR_USUARIO) throw new Error("Você já está em 5 chats. Saia de um para criar outro.");

  // Tenta alguns códigos até achar um livre.
  let codigo = gerarCodigo();
  for (let i = 0; i < 5 && (await getDoc(doc(db, "groups", codigo))).exists(); i++) codigo = gerarCodigo();

  const lote = writeBatch(db);
  lote.set(doc(db, "groups", codigo), { name: n, createdBy: uid, members: [uid] });
  lote.set(doc(db, "users", uid), { groups: [...ids, codigo] }, { merge: true });
  await lote.commit();
  return codigo;
}

export async function entrarComCodigo(uid: string, codigoBruto: string) {
  const codigo = codigoBruto.trim().toUpperCase();
  const snap = await getDoc(doc(db, "groups", codigo));
  if (!snap.exists()) throw new Error("Código não encontrado.");
  const g = snap.data() as Omit<Grupo, "id">;
  if (g.members.includes(uid)) throw new Error("Você já está neste grupo.");
  if (g.members.length >= MAX_MEMBROS) throw new Error("Grupo lotado (máximo 6 pessoas).");
  const ids = await meusGruposIds(uid);
  if (ids.length >= MAX_GRUPOS_POR_USUARIO) throw new Error("Você já está em 5 chats.");

  const lote = writeBatch(db);
  lote.update(doc(db, "groups", codigo), { members: arrayUnion(uid) });
  lote.set(doc(db, "users", uid), { groups: [...ids, codigo] }, { merge: true });
  await lote.commit();
}

export async function sairDoGrupo(uid: string, grupoId: string) {
  const lote = writeBatch(db);
  lote.update(doc(db, "groups", grupoId), { members: arrayRemove(uid) });
  lote.set(doc(db, "users", uid), { groups: arrayRemove(grupoId) }, { merge: true });
  await lote.commit();
}
