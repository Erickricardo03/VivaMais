/**
 * Monta a URL base da API a partir do host que serviu a própria página, em vez de um
 * "localhost" fixo. Isso é essencial para acessar o sistema de outro dispositivo na
 * mesma rede (ex: celular do operador) — "localhost" ali apontaria para o próprio
 * celular, não para o computador rodando o backend.
 *
 * O backend roda sempre na porta 8080, no mesmo host (IP ou domínio) e protocolo
 * (http/https) usados para acessar o frontend.
 */
export function apiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
}
