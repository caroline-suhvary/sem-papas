// Um balão de mensagem com "avatar" (inicial do nome). Componente "burro":
// só recebe dados e desenha. React escapa o texto, então não há injeção de HTML.
//   - mensagens dos outros: avatar à esquerda, balão roxo
//   - minhas mensagens: avatar à direita, balão laranja
import { VIDA_ANEXO, type Mensagem } from "../../types";

function Avatar({ nome, cor }: { nome: string; cor: string }) {
  return (
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 font-titulo text-2xl ${cor}`} aria-hidden>
      {(nome || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function MessageBubble({ m, minha }: { m: Mensagem; minha: boolean }) {
  const hora = m.createdAt ? m.createdAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "…";
  const anexoVencido = !!m.createdAt && Date.now() - m.createdAt.toMillis() > VIDA_ANEXO;
  const balao = minha ? "border-laranja bg-laranja-claro" : "border-roxo bg-roxo-claro";
  const avatar = minha ? "border-laranja bg-laranja-claro text-laranja" : "border-roxo bg-roxo-claro text-roxo";
  return (
    <div className={`flex items-start gap-3 ${minha ? "flex-row-reverse" : ""}`}>
      <Avatar nome={m.authorName} cor={avatar} />
      <div className={`max-w-[80%] sm:max-w-[65%] rounded-2xl border-4 px-4 py-2 ${balao}`}>
        <p className="text-xs font-semibold text-suave">{m.authorName} · {hora}</p>
        {m.text && <p className="whitespace-pre-wrap break-words font-semibold">{m.text}</p>}
        {m.file && anexoVencido && <p className="mt-2 text-sm italic text-suave">📎 {m.file.name} — anexo expirado (arquivos duram 24h)</p>}
        {m.file && !anexoVencido && (m.file.type.startsWith("image/") ? (
          <a href={m.file.url} target="_blank" rel="noreferrer"><img src={m.file.url} alt={m.file.name} className="mt-2 max-h-60 rounded-xl" /></a>
        ) : (
          <a href={m.file.url} target="_blank" rel="noreferrer" className="mt-2 block underline">📎 {m.file.name} ({Math.ceil(m.file.size / 1024)} KB)</a>
        ))}
      </div>
    </div>
  );
}
