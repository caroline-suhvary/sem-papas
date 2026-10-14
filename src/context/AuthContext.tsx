// Guarda "quem está logado" para o app inteiro.
// onAuthStateChanged avisa quando a pessoa entra, sai ou recarrega a página.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  sendEmailVerification, signInWithPopup, signOut, updateProfile, type User,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { LimiteContasError, registrarAcesso, registrarNome } from "../services/users";

interface AuthValor {
  usuario: User | null;
  carregando: boolean;
  avisoConta: string | null; // ex.: limite de 100 contas atingido
  entrarGoogle: () => Promise<void>;
  entrarEmail: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  reenviarVerificacao: () => Promise<void>;
  conferirVerificacao: () => Promise<boolean>;
}
const Ctx = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [avisoConta, setAvisoConta] = useState<string | null>(null);

  useEffect(() => {
    // Retornar o "unsubscribe" faz o React parar de ouvir ao desmontar.
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          await registrarAcesso(u); // cria perfil ou renova o "último acesso"
          setAvisoConta(null);
        } catch (e) {
          if (e instanceof LimiteContasError) {
            // Conta nova acima do limite: desfaz o cadastro no Authentication.
            setAvisoConta(e.message);
            await u.delete().catch(() => signOut(auth));
            setUsuario(null); setCarregando(false);
            return;
          }
          console.error(e);
        }
      }
      setUsuario(u); setCarregando(false);
    });
  }, []);

  const valor: AuthValor = {
    usuario, carregando, avisoConta,
    entrarGoogle: async () => { await signInWithPopup(auth, googleProvider); },
    entrarEmail: async (e, s) => { await signInWithEmailAndPassword(auth, e, s); },
    cadastrar: async (nome, e, s) => {
      const cred = await createUserWithEmailAndPassword(auth, e, s);
      await updateProfile(cred.user, { displayName: nome.trim().slice(0, 40) });
      // O perfil já foi criado antes do nome existir; corrigimos aqui.
      await registrarNome(cred.user.uid, nome);
      // Envia o link de confirmação. Até clicar, os grupos ficam bloqueados.
      await sendEmailVerification(cred.user);
      setUsuario({ ...cred.user }); // força re-render com o nome novo
    },
    sair: () => signOut(auth),
    reenviarVerificacao: async () => { if (auth.currentUser) await sendEmailVerification(auth.currentUser); },
    // reload() busca o status novo no Google; getIdToken(true) renova o
    // "crachá" para as regras do Firestore também enxergarem a confirmação.
    conferirVerificacao: async () => {
      const u = auth.currentUser;
      if (!u) return false;
      await u.reload();
      if (u.emailVerified) { await u.getIdToken(true); setUsuario({ ...u } as User); }
      return u.emailVerified;
    },
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return c;
}

// Traduz os códigos de erro do Firebase para português.
export function traduzirErro(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const mapa: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já tem conta.",
    "auth/weak-password": "Senha fraca: use pelo menos 6 caracteres.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/popup-closed-by-user": "Janela do Google fechada antes de concluir.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    "permission-denied": "Ação bloqueada pelas regras de segurança.",
  };
  return mapa[code] ?? (e instanceof Error ? e.message : "Algo deu errado.");
}
