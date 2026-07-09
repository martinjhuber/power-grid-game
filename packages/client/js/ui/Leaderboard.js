import { formatScore } from '@power-grid/shared/score/ScoreCalculator.js';
import { ScoreApiClient } from '../verification/ScoreApiClient.js';

function formatPlayedAt(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export class Leaderboard {
  #overlay;
  #tableBody;
  #statusEl;
  #closeBtn;

  constructor({ overlay, tableBody, statusEl, closeBtn }) {
    this.#overlay = overlay;
    this.#tableBody = tableBody;
    this.#statusEl = statusEl;
    this.#closeBtn = closeBtn;

    this.#closeBtn.addEventListener('click', () => this.close());
    this.#overlay.addEventListener('click', (event) => {
      if (event.target === this.#overlay) {
        this.close();
      }
    });
  }

  async open() {
    this.#overlay.hidden = false;
    this.#statusEl.textContent = 'Loading…';
    this.#statusEl.hidden = false;
    this.#tableBody.replaceChildren();

    try {
      const data = await ScoreApiClient.fetchLeaderboard();
      this.#renderEntries(data.entries ?? []);
      this.#statusEl.hidden = true;
    } catch {
      this.#statusEl.textContent = 'Could not load the leaderboard.';
      this.#statusEl.hidden = false;
    }
  }

  close() {
    this.#overlay.hidden = true;
  }

  #renderEntries(entries) {
    this.#tableBody.replaceChildren();

    if (entries.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'No entries yet.';
      row.append(cell);
      this.#tableBody.append(row);
      return;
    }

    for (const entry of entries) {
      const row = document.createElement('tr');
      if (entry.rank === 1) {
        row.classList.add('leaderboard-row--rank-1');
      } else if (entry.rank === 2) {
        row.classList.add('leaderboard-row--rank-2');
      } else if (entry.rank === 3) {
        row.classList.add('leaderboard-row--rank-3');
      }

      const rankCell = document.createElement('td');
      rankCell.className = 'leaderboard-rank';
      rankCell.textContent = String(entry.rank);
      row.append(rankCell);

      const scoreCell = document.createElement('td');
      scoreCell.className = 'leaderboard-score';
      scoreCell.textContent = formatScore(entry.score);
      row.append(scoreCell);

      const dateCell = document.createElement('td');
      dateCell.textContent = formatPlayedAt(entry.playedAt);
      row.append(dateCell);

      const nameCell = document.createElement('td');
      if (entry.name) {
        nameCell.textContent = entry.name;
      } else {
        const anonymous = document.createElement('span');
        anonymous.className = 'leaderboard-anonymous';
        anonymous.textContent = 'Anonymous';
        nameCell.append(anonymous);
      }
      row.append(nameCell);

      this.#tableBody.append(row);
    }
  }
}
