// Logo: a língua pop-art (imagem em /public).
export function Logo({ tamanho = 48 }: { tamanho?: number }) {
  return <img src="/lingua-esquerda.png" width={tamanho} height={tamanho} alt="Logo Sem Papas" />;
}
