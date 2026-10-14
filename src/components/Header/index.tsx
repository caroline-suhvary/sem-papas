// Cabeçalho: línguas nas laterais, título no centro e o parágrafo explicativo.
// As duas imagens ficam em /public, então o caminho começa com "/".
import { useTema } from "../../context/ThemeContext";

interface Props {
  aoAbrirMenu: () => void;
}

export function Header({ aoAbrirMenu }: Props) {
  const { tema, alternar } = useTema();
  return (
    <header className="relative px-2 pt-2 pb-4 text-center">
      <div className="mb-1 flex justify-end gap-2 sm:absolute sm:right-0 sm:top-0 sm:mb-0">
        <button
          onClick={aoAbrirMenu}
          className="md:hidden rounded-full border-2 border-verde bg-cartao px-3 py-1 font-bold text-verde"
          aria-label="Abrir conversas">
          ☰
        </button>
        <button
          onClick={alternar}
          className="rounded-full border-2 border-verde bg-cartao px-3 py-1 text-sm font-semibold text-verde"
          aria-label="Alternar tema">
          {tema === "claro" ? "☾" : "☀"}
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 sm:gap-10">
        <img
          src="/lingua-esquerda.png"
          alt=""
          className="h-12 w-12 object-contain sm:h-24 sm:w-24 -rotate-6"
        />
        <h1 className="whitespace-nowrap font-titulo text-4xl text-verde sm:text-7xl">
          Sem Papas
        </h1>
        <img
          src="/lingua-direita.png"
          alt=""
          className="h-12 w-12 object-contain sm:h-24 sm:w-24 rotate-6"
        />
      </div>
      <p className="mt-2 font-semibold text-suave">
        Utilize o chat público para teste. Faça login para criar chats privados.
      </p>
    </header>
  );
}
