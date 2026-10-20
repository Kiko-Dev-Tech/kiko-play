import { Component } from '@angular/core';
import { UiPageHeader } from '../../shared/ui/ui-page-header';
import { UiGameCard } from './ui-game-card';

interface GameEntry {
  name: string;
  description: string;
  icon: string;
  link: string;
}

/** All available minigames. New games only need an entry here and their own feature folder. */
const GAMES: GameEntry[] = [
  {
    name: 'Kikopardy',
    description:
      'Jeopardy with your friends. Pick a question, hit the buzzer and answer on Discord.',
    icon: '🎯',
    link: '/kikopardy',
  },
];

@Component({
  selector: 'page-game-select',
  imports: [UiPageHeader, UiGameCard],
  template: `
    <ui-page-header title="Choose a game" />
    <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      @for (game of games; track game.link) {
        <li>
          <ui-game-card
            [name]="game.name"
            [description]="game.description"
            [icon]="game.icon"
            [link]="game.link"
          />
        </li>
      }
    </ul>
  `,
})
export class PageGameSelect {
  protected readonly games = GAMES;
}
