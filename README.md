# Sem Papas 👅 — chat retrô em tempo real

React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage, Hosting).

## Regras do app
- **Praça pública:** sem login, só texto, apelido aleatório fixo por navegador.
- **Grupos privados:** login com Google ou e-mail/senha; 2 a 6 pessoas; cada pessoa em no máximo 5 chats; entrada por código de convite (ex.: `PAPA-1234`).
- **Anexos:** só nos grupos, até 2 MB (PNG, JPG, GIF, WebP, PDF, TXT).
- **Mensagens:** até 1.000 caracteres incluindo espaços (contador na tela + bloqueio nas regras do banco).
- **Limite de 100 contas** (contador protegido pelas regras do banco).
- **Validade:** sala pública 24h · mensagens de grupo 6 meses · anexos 24h.
- **Inatividade:** 28 dias sem entrar → e-mail de aviso + aviso nos chats a dois; 30 dias → conta excluída, removida dos chats, e chats que ficariam com 1 pessoa são apagados.
- **Tema claro/escuro**, responsivo (no celular, conversas abrem pelo botão ☰).

## Rodar
```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Firebase
npm run dev
```
Passo a passo completo do Firebase: **GUIA_FIREBASE.md**.

## Estrutura
```
src/
  components/<Nome>/index.tsx  telas e pedaços de tela
  context/                     tema e login (estado global)
  hooks/useMensagens.ts        escuta em tempo real
  services/                    toda conversa com o Firebase
  types/                       tipos e limites
  utils/apelido.ts             apelido da sala pública
scripts/limpeza.mjs           robô diário (limpeza + e-mails)
.github/workflows/limpeza.yml  agenda do robô no GitHub Actions
firestore.rules / storage.rules  segurança (o que realmente protege os dados)
```

## O que mudou na v2
Novos: `src/services/users.ts`, `scripts/`, `.github/workflows/limpeza.yml`.
Alterados: `types/index.ts`, `context/AuthContext.tsx`, `services/chat.ts`, `components/AuthPanel`, `components/ChatWindow`, `components/MessageBubble`, `firestore.rules`, `storage.rules`, `.gitignore`, `GUIA_FIREBASE.md` (seção 10).
