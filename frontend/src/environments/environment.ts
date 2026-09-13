// Em desenvolvimento, a URL da API é resolvida a partir do host que serviu a própria
// página (em vez de "localhost" fixo). Isso é o que permite acessar o sistema de outro
// dispositivo na mesma rede — como o celular do operador para testar a câmera — já que
// "localhost" ali apontaria para o próprio celular, não para o computador rodando o backend.
const apiUrlDev = typeof window !== 'undefined' && window.location?.hostname
  ? `${window.location.protocol}//${window.location.hostname}:8080/api`
  : 'http://localhost:8080/api';

export const environment = {
  production: false,
  apiUrl: apiUrlDev
};
