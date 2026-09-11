import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Efeito ambiente decorativo para as laterais da tela: um brilho verde suave,
 * com leve movimento contínuo, ocupando toda a altura da viewport. Só aparece
 * quando há espaço sobrando fora do conteúdo (telas largas) e nunca recebe
 * interação — é puramente estético, no estilo usado por produtos SaaS
 * modernos (glows ambientes desfocados em vez de ilustrações literais).
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
    </div>
  `,
  styles: [`
    .side-ambient {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 220px;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
      display: none;
    }

    /* Só aparece quando sobra espaço fora do conteúdo central (max-width: 1440px) */
    @media (min-width: 1680px) {
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

    /* Linha fina de acento correndo a lateral inteira */
    .accent-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(21, 128, 61, 0.14) 15%,
        rgba(21, 128, 61, 0.14) 85%,
        transparent 100%
      );
    }

    .side-left .accent-line { left: 46px; }
    .side-right .accent-line { right: 46px; }

    /* Brilhos verdes desfocados, flutuando lentamente ao longo da lateral */
    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(46px);
      background: radial-gradient(circle at 35% 35%, rgba(34, 197, 94, 0.4), rgba(21, 128, 61, 0.05) 70%);
      animation: ambient-float 16s ease-in-out infinite;
      will-change: transform, opacity;
    }

    .side-left .glow {
      left: -70px;
    }

    .side-right .glow {
      right: -70px;
    }

    .glow-1 {
      width: 220px;
      height: 220px;
      top: 4%;
      animation-delay: 0s;
    }

    .glow-2 {
      width: 170px;
      height: 170px;
      top: 42%;
      background: radial-gradient(circle at 40% 40%, rgba(217, 119, 6, 0.16), transparent 70%);
      animation-delay: -6s;
      animation-duration: 19s;
    }

    .glow-3 {
      width: 200px;
      height: 200px;
      top: 76%;
      animation-delay: -11s;
      animation-duration: 21s;
    }

    @keyframes ambient-float {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.55; }
      50% { transform: translateY(-48px) scale(1.1); opacity: 0.9; }
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
