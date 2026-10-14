// Gera um apelido sem sentido e guarda no localStorage, para que o
// MESMO navegador mantenha o MESMO nome na sala pública.
const PARTES_A = [
  "Bigode",
  "Pastel",
  "Vinil",
  "Fusca",
  "Biscoito",
  "Chiclete",
  "Disco",
  "Pipoca",
  "Tamanco",
  "Bolacha",
];
const PARTES_B = [
  "Voador",
  "Elétrico",
  "Sonolento",
  "Saltitante",
  "Cósmico",
  "Banguela",
  "Distraído",
  "Groovy",
];
const CHAVE = "sem-papas:apelido";

export function obterApelido(): string {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) return salvo;
  const sorteia = (l: string[]) => l[Math.floor(Math.random() * l.length)];
  const novo = `${sorteia(PARTES_A)}${sorteia(PARTES_B)}-${Math.floor(100 + Math.random() * 90)}`;
  localStorage.setItem(CHAVE, novo);
  return novo;
}
