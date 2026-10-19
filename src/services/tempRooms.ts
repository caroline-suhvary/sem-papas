import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface TempRoom {
  id: string;
  code: string;
  name: string;
  hostUid: string;
  hostName: string;
  active: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface TempMessage {
  id: string;
  text: string;
  authorNickname: string;
  authorId?: string;
  isHost: boolean;
  createdAt: number;
}

const LIMITE_SALAS_GLOBAIS = 15;
const DURACAO_SALA_MS = 3 * 60 * 60 * 1000; // 3 horas

/**
 * 1. Cria uma nova sala temporária respeitando os limites:
 * - Máx 1 sala ativa por usuário
 * - Máx 15 salas ativas no total
 */
export async function criarSalaTemporaria(
  hostUid: string,
  hostName: string,
  name: string,
): Promise<TempRoom> {
  const agora = Date.now();
  const roomsRef = collection(db, "temp_rooms");

  // Verifica salas ativas globais
  const qAtivas = query(roomsRef, where("active", "==", true));
  const snapAtivas = await getDocs(qAtivas);

  // Filtra as que ainda não expiraram pelo tempo
  const ativasValidas = snapAtivas.docs.filter((d) => {
    const data = d.data();
    return data.expiresAt > agora;
  });

  if (ativasValidas.length >= LIMITE_SALAS_GLOBAIS) {
    throw new Error(
      "Limite global atingido: já existem 15 salas temporárias ativas no momento. Tente novamente mais tarde.",
    );
  }

  // Verifica se o usuário já tem uma sala ativa
  const usuarioJaTem = ativasValidas.some((d) => d.data().hostUid === hostUid);
  if (usuarioJaTem) {
    throw new Error("Você já possui uma sala temporária ativa em andamento.");
  }

  // Código aleatório de 6 caracteres para convite
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = agora + DURACAO_SALA_MS;

  const docRef = await addDoc(roomsRef, {
    code,
    name: name.trim() || "Reunião Sem Papas",
    hostUid,
    hostName,
    active: true,
    createdAt: agora,
    expiresAt,
    createdTimestamp: serverTimestamp(),
  });

  return {
    id: docRef.id,
    code,
    name: name.trim() || "Reunião Sem Papas",
    hostUid,
    hostName,
    active: true,
    createdAt: agora,
    expiresAt,
  };
}

/**
 * 2. Busca uma sala pelo código ou ID e verifica se está ativa e válida.
 */
export async function buscarSalaTemporaria(
  identificador: string,
): Promise<TempRoom | null> {
  const roomsRef = collection(db, "temp_rooms");

  // Tenta por ID direto
  const docSnap = await getDoc(doc(roomsRef, identificador));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      code: data.code,
      name: data.name || "Reunião Sem Papas",
      hostUid: data.hostUid,
      hostName: data.hostName,
      active: data.active,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  }

  // Se não achou por ID, tenta por código de 6 letras
  const qCode = query(
    roomsRef,
    where("code", "==", identificador.toUpperCase()),
  );
  const snapCode = await getDocs(qCode);
  if (!snapCode.empty) {
    const d = snapCode.docs[0];
    const data = d.data();
    return {
      id: d.id,
      code: data.code,
      name: data.name || "Reunião Sem Papas",
      hostUid: data.hostUid,
      hostName: data.hostName,
      active: data.active,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  }

  return null;
}

/**
 * 3. Escuta a sala em tempo real para detectar encerramento.
 */
export function ouvirSalaTemporaria(
  roomId: string,
  callback: (room: TempRoom | null) => void,
): () => void {
  const docRef = doc(db, "temp_rooms", roomId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      code: data.code,
      name: data.name || "Reunião Sem Papas",
      hostUid: data.hostUid,
      hostName: data.hostName,
      active: data.active,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    });
  });
}

/**
 * 4. Escuta as mensagens da subcoleção em tempo real.
 */
export function ouvirMensagensTemporarias(
  roomId: string,
  callback: (messages: TempMessage[]) => void,
): () => void {
  const msgsRef = collection(db, "temp_rooms", roomId, "messages");
  const q = query(msgsRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const msgs: TempMessage[] = snapshot.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt;
      const createdAtMs =
        ts instanceof Timestamp ? ts.toMillis() : ts || Date.now();

      return {
        id: d.id,
        text: data.text || "",
        authorNickname: data.authorNickname || "Convidado",
        authorId: data.authorId,
        isHost: !!data.isHost,
        createdAt: createdAtMs,
      };
    });
    callback(msgs);
  });
}

/**
 * 5. Envia mensagem para a sala temporária.
 */
export async function enviarMensagemTemporaria(
  roomId: string,
  text: string,
  authorNickname: string,
  authorId?: string,
  isHost: boolean = false,
): Promise<void> {
  const msgsRef = collection(db, "temp_rooms", roomId, "messages");
  await addDoc(msgsRef, {
    text: text.trim().slice(0, 1000),
    authorNickname: authorNickname.trim() || "Convidado",
    authorId: authorId || null,
    isHost,
    createdAt: serverTimestamp(),
  });
}

/**
 * 6. Encerra a sala temporária.
 */
export async function encerrarSalaTemporaria(roomId: string): Promise<void> {
  const docRef = doc(db, "temp_rooms", roomId);
  await updateDoc(docRef, {
    active: false,
    closedAt: serverTimestamp(),
  });
}

// Busca se o anfitrião logado já tem uma sala temporária ativa
export async function buscarSalaAtivaDoHost(
  hostUid: string,
): Promise<TempRoom | null> {
  try {
    const q = query(
      collection(db, "temp_rooms"),
      where("hostUid", "==", hostUid),
      where("active", "==", true),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as any) } as TempRoom;
  } catch (erro) {
    console.error("Erro ao buscar sala ativa do host:", erro);
    return null;
  }
}
