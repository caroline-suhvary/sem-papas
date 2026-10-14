// Tipos centrais do app. O TypeScript usa isso para avisar
// se tentarmos ler um campo que não existe.
import type { Timestamp } from "firebase/firestore";

export const LIMITE_TEXTO = 1000;          // caracteres, incluindo espaços
export const LIMITE_ANEXO = 2 * 1024 * 1024; // 2 MB
export const MAX_MEMBROS = 6;
export const MIN_MEMBROS = 2;
export const MAX_GRUPOS_POR_USUARIO = 5;
export const MAX_CONTAS = 100;

// Ciclo de vida dos dados (a limpeza real roda no robô diário: scripts/limpeza.mjs)
export const HORA = 60 * 60 * 1000;
export const DIA = 24 * HORA;
export const VIDA_MSG_PUBLICA = DIA;        // sala pública: 24 horas
export const VIDA_MSG_GRUPO = 180 * DIA;    // grupos: ~6 meses
export const VIDA_ANEXO = DIA;              // arquivos: 24 horas

export interface Mensagem {
  id: string;
  text: string;
  authorName: string;
  authorId?: string;         // só existe nos grupos privados
  createdAt: Timestamp | null; // null por um instante, até o servidor carimbar a hora
  file?: { url: string; name: string; type: string; size: number };
}

export interface Grupo {
  id: string; // também é o código de convite
  name: string;
  createdBy: string;
  members: string[];
  // Preenchido pelo robô diário quando, num chat de 2 pessoas, uma delas
  // está há 28+ dias sem entrar. Mostra o aviso para a outra pessoa.
  expiring?: { uid: string; name: string; deleteAt: Timestamp };
}

// "Qual conversa está aberta?" — ou a pública, ou um grupo.
export type Conversa = { tipo: "publica" } | { tipo: "grupo"; grupo: Grupo };
