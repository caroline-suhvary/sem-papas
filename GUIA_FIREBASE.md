# Guia Firebase / Google Cloud — do zero ao site no ar

> Firebase é o "pacote para apps" do Google Cloud (GCP). Ao criar um projeto no Firebase,
> ele cria automaticamente um projeto no GCP. Você só precisa usar o **Console do Firebase**.

## ⚠️ Antes de começar: planos e custos
| Serviço | Plano Spark (grátis, sem cartão) | Observação |
|---|---|---|
| Authentication (Google + e-mail) | ✅ | |
| Firestore (banco) | ✅ 1 GB, 50 mil leituras/dia, 20 mil gravações/dia | |
| Hosting (site no ar) | ✅ 10 GB, domínio `.web.app` | **Hospedagem grátis no Google — sim!** |
| **Storage (anexos)** | ❌ desde out/2024 exige plano **Blaze** | Blaze pede cartão, mas tem cota grátis (~5 GB armazenados, ~1 GB download/dia). Abaixo disso, custo R$ 0. |

**Recomendação:** comece no Spark (tudo funciona menos anexos). Se quiser anexos, ative o Blaze
e **crie um alerta de orçamento** (passo 9). Sem Blaze, o botão 📎 vai dar erro ao enviar.

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com e entre com sua conta Google.
2. **Adicionar projeto** → nome `sem-papas` → pode desativar Google Analytics → **Criar**.

## 2. Registrar o app Web e pegar as chaves
1. Na página inicial do projeto, clique no ícone **`</>`** (Web).
2. Apelido: `sem-papas-web`. **Não** marque Hosting aqui (faremos depois). **Registrar app**.
3. Aparece um bloco `firebaseConfig = { apiKey: ..., ... }`. Copie os valores para o `.env.local`:
```
VITE_FIREBASE_API_KEY=valor de apiKey
VITE_FIREBASE_AUTH_DOMAIN=valor de authDomain
VITE_FIREBASE_PROJECT_ID=valor de projectId
VITE_FIREBASE_STORAGE_BUCKET=valor de storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=valor de messagingSenderId
VITE_FIREBASE_APP_ID=valor de appId
```
(sem aspas). Perdeu? ⚙️ **Configurações do projeto** → **Seus apps**.
> Essas chaves são públicas por natureza. Quem protege os dados são as **regras**.

## 3. Ativar login
1. Menu **Criação → Authentication → Vamos começar**.
2. Aba **Método de login**: ative **E-mail/senha** → Salvar.
3. **Adicionar novo provedor → Google** → ativar → escolha um e-mail de suporte → Salvar.
4. Aba **Configurações → Domínios autorizados**: `localhost` já vem. Depois do deploy,
   `sem-papas.web.app` entra automático; se usar Vercel, **adicione o domínio da Vercel** aqui.

## 4. Criar o banco Firestore
1. **Criação → Firestore Database → Criar banco de dados**.
2. Local: `southamerica-east1 (São Paulo)` (não dá para mudar depois).
3. Modo: **produção** → Criar.
4. Aba **Regras**: apague tudo, cole o conteúdo de `firestore.rules` → **Publicar**.

## 5. (Opcional, Blaze) Storage para anexos
1. **Criação → Storage → Vamos começar** (vai pedir upgrade para Blaze se necessário).
2. Mesmo local do Firestore, modo produção.
3. Aba **Regras**: cole `storage.rules` → **Publicar**.
   Na primeira publicação, o console pode pedir permissão para o Storage ler o Firestore — **aceite**
   (é isso que deixa só membros do grupo verem os anexos).

## 6. Rodar no VS Code
```bash
npm install
npm run dev
```
Abra http://localhost:5173. Teste: escreva na praça pública em duas abas e veja aparecer na hora.
Para testar grupos: crie conta, crie grupo, copie o código, abra uma **janela anônima**, crie outra
conta e entre com o código. Só com 2 pessoas o campo de mensagem libera.

## 7. Publicar no Firebase Hosting (grátis)
```bash
npm install -g firebase-tools
firebase login                 # abre o navegador
firebase use --add             # escolha o projeto sem-papas, apelido "default"
npm run build                  # gera a pasta dist
firebase deploy --only hosting
```
O terminal mostra `Hosting URL: https://sem-papas.web.app` 🎉
Atualizar o site depois: `npm run build && firebase deploy --only hosting`.
(Opcional) Publicar as regras pelo terminal: `firebase deploy --only firestore:rules,storage`.

### Alternativa: Vercel
Framework **Vite**, build `npm run build`, saída `dist`, cadastre as 6 variáveis `VITE_FIREBASE_*`
e adicione o domínio da Vercel em Authentication → Domínios autorizados.

## 8. Ver os dados
- Mensagens e grupos: **Firestore Database → Dados** (`public_messages`, `groups`, `users`).
- Usuários: **Authentication → Usuários**.
- Arquivos: **Storage → Arquivos**.

## 9. Proteções recomendadas
- **Alerta de orçamento** (se Blaze): https://console.cloud.google.com/billing → Orçamentos e alertas →
  criar com valor baixo (ex.: R$ 5) e alertas em 50%/90%/100%. Alerta avisa, não bloqueia.
- **App Check** (opcional, avançado): reduz robôs na praça pública, que aceita escrita sem login.
- A praça pública é aberta: qualquer pessoa pode escrever. Para limpar, apague documentos em `public_messages` no console.

## 10. Robô diário: limpeza, inatividade e e-mails (grátis)
O navegador só roda código quando alguém está com o site aberto. Para apagar dados
vencidos e mandar o e-mail de aviso, usamos o **GitHub Actions** (gratuito) rodando
`scripts/limpeza.mjs` uma vez por dia. Não precisa de plano Blaze para isso.

> ⚠️ Lembre de **publicar as regras novas**: `firebase deploy --only firestore:rules,storage`
> (sem Blaze/Storage, use só `firebase deploy --only firestore:rules`).

**10.1 Chave de administrador do Firebase**
1. Console Firebase → ⚙️ Configurações do projeto → **Contas de serviço** → **Gerar nova chave privada**.
2. Baixa um arquivo `.json`. **Nunca** coloque esse arquivo na pasta do projeto nem no GitHub — é a chave-mestra.

**10.2 Senha de app do Gmail (para enviar os avisos)**
1. Use uma conta Gmail (de preferência uma criada só para o projeto) com **verificação em duas etapas** ativa.
2. Acesse https://myaccount.google.com/apppasswords, crie uma senha chamada "Sem Papas" e copie os 16 caracteres.
   Limite gratuito do Gmail: cerca de 500 e-mails/dia — de sobra para 100 contas.

**10.3 Segredos no GitHub**
No repositório: **Settings → Secrets and variables → Actions → New repository secret**. Crie:

| Nome | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | todo o conteúdo do `.json` do passo 10.1 |
| `GMAIL_USER` | o e-mail Gmail (ex.: sempapas.app@gmail.com) |
| `GMAIL_APP_PASSWORD` | a senha de 16 caracteres do passo 10.2 |
| `APP_URL` | o endereço do site (ex.: https://seu-projeto.web.app) |
| `FIREBASE_STORAGE_BUCKET` | *(só se usar anexos)* ex.: `seu-projeto.firebasestorage.app` |

**10.4 Testar**
GitHub → aba **Actions** → **Limpeza diária** → **Run workflow** → deixe `1` (simulação: só mostra o que faria).
Confira o log; depois rode com `0` para valer. A partir daí ele roda sozinho todo dia às 03:17 (Brasília).

**Como funcionam os prazos**
- Sala pública: mensagens somem da tela após 24h e o robô as apaga.
- Grupos: mensagens duram 6 meses. Anexos: 24h (depois aparecem como "anexo expirado").
- Cada login/abertura do site renova o "último acesso" da conta.
- Dia 28 sem acesso: e-mail para a dona da conta + aviso amarelo para a outra pessoa nos chats a dois.
- Dia 30: conta excluída (vaga liberada), removida dos grupos; chats que ficariam com 1 pessoa são apagados.
  Como o robô roda 1x/dia, a exclusão acontece entre o 30º e o 31º dia.
- Se a pessoa voltar antes, os avisos somem na próxima execução.

> Observação: em repositórios **públicos**, o GitHub pausa agendamentos após 60 dias sem nenhum commit.
> Se receber o e-mail do GitHub avisando, é só clicar para reativar (ou fazer um commit).

## Problemas comuns
| Erro | Causa |
|---|---|
| Tela pede para configurar `.env.local` | Variáveis vazias ou servidor não reiniciado |
| `auth/unauthorized-domain` | Domínio não está em Domínios autorizados |
| `Missing or insufficient permissions` | Regras não publicadas ou ação proibida (ex.: grupo lotado) |
| Erro ao anexar | Storage não ativado (exige Blaze) ou arquivo > 2 MB |
| Cadastro recusado com aviso de limite | Já existem 100 contas — o robô libera vagas de contas inativas |
| Robô falha com "Falta o segredo" | Segredo `FIREBASE_SERVICE_ACCOUNT` não criado no GitHub |
| E-mail não chega | Senha de app errada ou verificação em 2 etapas desligada; veja também o spam |
| "The query requires an index" | Clique no link do erro no console do navegador para criar o índice |
