import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { routes } from './app.routes';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Backend clássico via XHR (em vez de withFetch): é o que o zone.js
    // intercepta de forma confiável para disparar a detecção de mudanças
    // automaticamente quando uma resposta da API chega.
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
};


