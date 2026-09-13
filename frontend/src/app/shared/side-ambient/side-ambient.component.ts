import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Efeito ambiente decorativo para as laterais da tela: um brilho verde suave,
 * com leve movimento contínuo, ocupando toda a altura da viewport. Só aparece
 * quando há espaço sobrando fora do conteúdo (telas largas) e nunca recebe
 * interação — é puramente estético, no estilo usado por produtos SaaS
 * modernos (glows ambientes desfocados em vez de ilustrações literais).
 *
 * A largura acompanha o espaço real disponível até a borda do conteúdo
 * central (max-width: 1440px), sempre parando um pouco antes dela — o
 * `overflow: hidden` do container garante que nada passe dessa linha.
 */
@Component({
  selector: 'app-side-ambient',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="side-ambient"
      [class.side-left]="side === 'left'"
      [class.side-right]="side === 'right'"
      aria-hidden="true">
      <span class="accent-line"></span>
      <span class="glow glow-1"></span>
      <span class="glow glow-2"></span>
      <span class="glow glow-3"></span>
      <span class="glow glow-4"></span>
      <span class="glow glow-5"></span>
    </div>
  `,
  styles: [`
    .side-ambient {
      position: fixed;
      top: 0;
      bottom: 0;
      /* Metade do espaço vazio fora do conteúdo (1440px centralizado), com uma
         margem de segurança de 40px que nunca é ultrapassada, para o brilho
         nunca encostar no texto/cartões do site. */
      width: clamp(64px, calc((100vw - 1440px) / 2 - 40px), 460px);
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
      display: none;
    }

    /* Só aparece quando sobra espaço real fora do conteúdo central */
    @media (min-width: 1650px) {
      .side-ambient {
        display: block;
      }
    }

    .side-left {
      left: 0;
    }

    .side-right {
      right: 0;
    }

    /* Linha fina de acento correndo a lateral inteira, coladinha na borda do conteúdo */
    .accent-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(21, 128, 61, 0.16) 15%,
        rgba(21, 128, 61, 0.16) 85%,
        transparent 100%
      );
    }

    .side-left .accent-line { right: 12px; }
    .side-right .accent-line { left: 12px; }

    /* Brilhos verdes desfocados, centralizados na faixa e flutuando lentamente.
       Ficam mais largos automaticamente quando a faixa é mais larga (telas
       grandes), sempre contidos pelo overflow:hidden do container. */
    .glow {
      position: absolute;
      left: 50%;
      aspect-ratio: 1;
      border-radius: 50%;
      filter: blur(42px);
      transform: translateX(-50%);
      background: radial-gradient(circle at 35% 35%, rgba(34, 197, 94, 0.42), rgba(21, 128, 61, 0.05) 70%);
      animation: ambient-float 17s ease-in-out infinite;
      will-change: transform, opacity;
    }

    .glow-1 { width: 92%; top: -4%;  animation-delay: 0s; }
    .glow-2 { width: 78%; top: 16%;  animation-delay: -4s; animation-duration: 20s; }
    .glow-3 {
      width: 88%; top: 38%;
      background: radial-gradient(circle at 40% 40%, rgba(217, 119, 6, 0.15), transparent 70%);
      animation-delay: -8s; animation-duration: 22s;
    }
    .glow-4 { width: 76%; top: 60%;  animation-delay: -12s; animation-duration: 19s; }
    .glow-5 { width: 90%; top: 80%;  animation-delay: -16s; animation-duration: 23s; }

    @keyframes ambient-float {
      0%, 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.5; }
      50% { transform: translateX(-50%) translateY(-28px) scale(1.08); opacity: 0.85; }
    }

    @media (prefers-reduced-motion: reduce) {
      .glow {
        animation: none;
      }
    }
  `]
})
export class SideAmbientComponent {
  @Input() side: 'left' | 'right' = 'left';
}
