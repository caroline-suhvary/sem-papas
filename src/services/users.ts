// Perfil da pessoa no Firestore + contador global de contas (máx. 100).
// Roda a cada login/abertura do app: cria o perfil na 1ª vez e,
// nas outras, atualiza "lastSeen" (base da regra de 30 dias de inatividade).
import { deleteField, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import { MAX_CONTAS } from "../types";

export class LimiteContasError extends Error {
  constructor() { super(`O Sem Papas atingiu o limite de ${MAX_CONTAS} contas. A sala pública continua aberta!`); }
}

export async function registrarAcesso(u: User) {
  const perfilRef = doc(db, "users", u.uid);
  const statsRef = doc(db, "meta", "stats");
  // Transação: lê e grava junto. Se duas pessoas se cadastram ao mesmo
  // tempo, o Firestore repete uma delas — o contador nunca "pula" o 100.
  await runTransaction(db, async (t) => {
    const perfil = await t.get(perfilRef);
    if (perfil.exists()) {
      // Voltou: renova o prazo e apaga um eventual aviso de inatividade.
      t.update(perfilRef, { lastSeen: serverTimestamp(), warnedAt: deleteField() });
      return;
    }
    const stats = await t.get(statsRef);
    const contas = (stats.data()?.accounts as number | undefined) ?? 0;
    if (contas >= MAX_CONTAS) throw new LimiteContasError();
    t.set(statsRef, { accounts: contas + 1 });
    t.set(perfilRef, {
      name: (u.displayName || u.email || "Anônimo").slice(0, 40),
      email: u.email ?? "",
      groups: [],
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  });
}

export async function registrarNome(uid: string, nome: string) {
  await updateDoc(doc(db, "users", uid), { name: nome.trim().slice(0, 40) }).catch(() => {});
}
