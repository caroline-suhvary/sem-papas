// =====================================================================
// ROBÔ DE LIMPEZA DIÁRIO DO SEM PAPAS
// Roda 1x por dia no GitHub Actions (grátis), fora do navegador.
// Usa a chave de ADMINISTRADOR do Firebase, então ignora as regras.
//
//  1. Sala pública: apaga mensagens com mais de 24h
//  2. Grupos: apaga mensagens com mais de 6 meses
//  3. Anexos: apaga arquivos com mais de 24h (se o Storage existir)
//  4. Contas: 28 dias sem acesso → e-mail para a dona da conta
//             + aviso dentro dos chats a dois
//             30 dias sem acesso → exclui conta, tira dos chats e
//             apaga chats que ficariam com 1 pessoa só
// =====================================================================
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import nodemailer from "nodemailer";

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.now();
const SIMULAR = process.env.SIMULAR === "1"; // SIMULAR=1 só mostra, não apaga

const conta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "{}");
if (!conta.project_id) throw new Error("Falta o segredo FIREBASE_SERVICE_ACCOUNT.");
const bucketNome = process.env.FIREBASE_STORAGE_BUCKET || "";
initializeApp({ credential: cert(conta), ...(bucketNome ? { storageBucket: bucketNome } : {}) });
const db = getFirestore();
const auth = getAuth();
const APP_URL = process.env.APP_URL || `https://${conta.project_id}.web.app`;

const correio = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
  : null;

const log = (...a) => console.log(SIMULAR ? "[simulação]" : "", ...a);
const antesDe = (ms) => Timestamp.fromMillis(AGORA - ms);

// Apaga em lotes de 400 (o Firestore aceita até 500 por lote).
async function apagarConsulta(consulta, rotulo) {
  let total = 0;
  for (;;) {
    const snap = await consulta.limit(400).get();
    if (snap.empty) break;
    total += snap.size;
    if (SIMULAR) break;
    const lote = db.batch();
    snap.docs.forEach((d) => lote.delete(d.ref));
    await lote.commit();
  }
  if (total) log(`${rotulo}: ${total} apagada(s)`);
}

async function apagarArquivosDoGrupo(grupoId) {
  if (!bucketNome) return;
  const [arquivos] = await getStorage().bucket().getFiles({ prefix: `groups/${grupoId}/` });
  if (!SIMULAR) await Promise.all(arquivos.map((f) => f.delete().catch(() => {})));
}

async function apagarGrupo(grupoId, membrosRestantes) {
  log(`chat ${grupoId} excluído (ficaria com menos de 2 pessoas)`);
  if (SIMULAR) return;
  await db.recursiveDelete(db.doc(`groups/${grupoId}`)); // grupo + mensagens
  await apagarArquivosDoGrupo(grupoId);
  for (const uid of membrosRestantes) {
    await db.doc(`users/${uid}`).set({ groups: FieldValue.arrayRemove(grupoId) }, { merge: true });
  }
}

async function enviarAviso(perfil, dataExclusao) {
  if (!perfil.email) return;
  if (!correio) { log(`(sem Gmail configurado) aviso para ${perfil.email} não enviado`); return; }
  if (SIMULAR) { log(`enviaria e-mail para ${perfil.email}`); return; }
  const data = dataExclusao.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  await correio.sendMail({
    from: `"Sem Papas" <${process.env.GMAIL_USER}>`,
    to: perfil.email,
    subject: "Sua conta no Sem Papas será excluída em 2 dias",
    text:
      `Oi, ${perfil.name || "tudo bem"}!\n\n` +
      `Você não entra no Sem Papas há 28 dias. Se não acessar até ${data}, sua conta será excluída, ` +
      `você sairá de todos os chats e os chats a dois em que você está deixarão de existir.\n\n` +
      `Para manter a conta, basta entrar: ${APP_URL}\n\n— Sem Papas 👅`,
  });
  log(`e-mail de aviso enviado para ${perfil.email}`);
}

// ---------------- 1 e 2: mensagens ----------------
await apagarConsulta(db.collection("public_messages").where("createdAt", "<", antesDe(DIA)), "sala pública");
const grupos = await db.collection("groups").get();
for (const g of grupos.docs) {
  await apagarConsulta(g.ref.collection("messages").where("createdAt", "<", antesDe(180 * DIA)), `grupo ${g.id}`);
}

// ---------------- 3: anexos com mais de 24h ----------------
if (bucketNome) {
  const [arquivos] = await getStorage().bucket().getFiles({ prefix: "groups/" });
  const velhos = arquivos.filter((f) => AGORA - new Date(f.metadata.timeCreated).getTime() > DIA);
  if (!SIMULAR) await Promise.all(velhos.map((f) => f.delete().catch(() => {})));
  if (velhos.length) log(`anexos: ${velhos.length} apagado(s)`);
}

// ---------------- 4: contas inativas ----------------
const perfis = await db.collection("users").get();
for (const p of perfis.docs) {
  const perfil = p.data();
  const uid = p.id;
  const ultimo = (perfil.lastSeen ?? perfil.createdAt)?.toMillis?.() ?? AGORA;
  const diasFora = (AGORA - ultimo) / DIA;
  const meusGrupos = perfil.groups ?? [];

  if (diasFora >= 30) {
    log(`conta ${uid} excluída (${Math.floor(diasFora)} dias sem acesso)`);
    for (const gid of meusGrupos) {
      const gRef = db.doc(`groups/${gid}`);
      const gSnap = await gRef.get();
      if (!gSnap.exists) continue;
      const restantes = (gSnap.data().members ?? []).filter((m) => m !== uid);
      if (restantes.length < 2) await apagarGrupo(gid, restantes);
      else if (!SIMULAR) {
        await gRef.update({
          members: FieldValue.arrayRemove(uid),
          ...(gSnap.data().expiring?.uid === uid ? { expiring: FieldValue.delete() } : {}),
        });
      }
    }
    if (!SIMULAR) {
      await p.ref.delete();
      await db.doc("meta/stats").set({ accounts: FieldValue.increment(-1) }, { merge: true });
      await auth.deleteUser(uid).catch(() => {}); // libera a vaga e o e-mail
    }
    continue;
  }

  const gruposDeDois = [];
  for (const gid of meusGrupos) {
    const s = await db.doc(`groups/${gid}`).get();
    if (s.exists && (s.data().members ?? []).length === 2) gruposDeDois.push(s);
  }

  if (diasFora >= 28 && !perfil.warnedAt) {
    const exclusao = new Date(ultimo + 30 * DIA);
    await enviarAviso(perfil, exclusao);
    if (!SIMULAR) {
      await p.ref.update({ warnedAt: Timestamp.now() });
      for (const g of gruposDeDois) {
        await g.ref.update({ expiring: { uid, name: perfil.name || "A outra pessoa", deleteAt: Timestamp.fromDate(exclusao) } });
      }
    }
  } else if (diasFora < 28) {
    // Voltou a tempo: some com qualquer aviso antigo.
    for (const g of gruposDeDois) {
      if (g.data().expiring?.uid === uid && !SIMULAR) await g.ref.update({ expiring: FieldValue.delete() });
    }
  }
}

// Contas do Authentication sem perfil há mais de 1 dia
// (ex.: tentaram se cadastrar quando já havia 100 contas).
const comPerfil = new Set(perfis.docs.map((d) => d.id));
let pagina;
do {
  const r = await auth.listUsers(1000, pagina);
  for (const u of r.users) {
    const idade = AGORA - new Date(u.metadata.creationTime).getTime();
    if (!comPerfil.has(u.uid) && idade > DIA) {
      log(`login órfão ${u.uid} removido`);
      if (!SIMULAR) await auth.deleteUser(u.uid).catch(() => {});
    }
  }
  pagina = r.pageToken;
} while (pagina);

// Recalcula o contador para nunca ficar dessincronizado.
if (!SIMULAR) {
  const n = (await db.collection("users").count().get()).data().count;
  await db.doc("meta/stats").set({ accounts: n });
  log(`contas ativas: ${n}/100`);
}
log("limpeza concluída");
