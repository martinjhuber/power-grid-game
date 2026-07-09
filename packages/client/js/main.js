import { CONFIG } from './config.js';
import { Game } from './game/Game.js';
import { Leaderboard } from './ui/Leaderboard.js';
import { Help } from './ui/Help.js';
import { APP_VERSION } from './version.js';

function $(id) {
  return document.getElementById(id);
}

function buildSizeOptions(containerId, name, defaultValue) {
  const container = $(containerId);
  for (const size of CONFIG.grid.allowedSizes) {
    const inputId = `${name}-${size}`;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.id = inputId;
    input.value = String(size);
    input.checked = size === defaultValue;

    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = String(size);

    container.append(input, label);
  }
}

function getSelectedSize(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? Number.parseInt(selected.value, 10) : CONFIG.grid.defaultWidth;
}

function getWrapEnabled() {
  const selected = document.querySelector('input[name="wrap"]:checked');
  return selected?.value === 'on';
}

function showSetup() {
  $('setup-screen').hidden = false;
  $('game-screen').hidden = true;
}

function showGame() {
  $('setup-screen').hidden = true;
  $('game-screen').hidden = false;
}

function startGame(game) {
  const setupError = $('setup-error');
  setupError.hidden = true;

  try {
    const width = getSelectedSize('width');
    const height = getSelectedSize('height');
    const wrap = getWrapEnabled();

    showGame();
    requestAnimationFrame(() => {
      game.start({ width, height, wrap });
    });
  } catch (error) {
    console.error(error);
    showSetup();
    setupError.textContent = 'Could not start the game. Please reload the page.';
    setupError.hidden = false;
  }
}

const gameCanvas = $('game-canvas');
const gameColumn = $('game-column');

const hud = {
  el: $('hud'),
  rotations: $('hud-rotations'),
  minRotations: $('hud-min-rotations'),
  time: $('hud-time'),
  connected: $('hud-connected'),
  pauseBtn: $('hud-pause'),
  cancelBtn: $('hud-cancel'),
};

const winOverlay = {
  el: $('win-overlay'),
  rankPrefix: $('win-rank-prefix'),
  rank: $('win-rank'),
  score: $('win-score'),
  time: $('win-time'),
  rotations: $('win-rotations'),
  minRotations: $('win-min-rotations'),
  replayBtn: $('win-replay'),
  newGameBtn: $('win-new-game'),
  leaderboardBtn: $('win-leaderboard'),
  leaderboardNotice: $('win-leaderboard-notice'),
  successNotice: $('win-success-notice'),
  onOpenLeaderboard: null,
};

const nameDialog = {
  el: $('name-dialog'),
  rank: $('name-dialog-rank'),
  score: $('name-dialog-score'),
  input: $('name-dialog-input'),
  submitBtn: $('name-dialog-submit'),
  skipBtn: $('name-dialog-skip'),
  error: $('name-dialog-error'),
};

const leaderboard = new Leaderboard({
  overlay: $('leaderboard-overlay'),
  tableBody: $('leaderboard-body'),
  statusEl: $('leaderboard-status'),
  closeBtn: $('leaderboard-close'),
});

const help = new Help({
  overlay: $('help-overlay'),
  closeBtn: $('help-close'),
});

winOverlay.onOpenLeaderboard = () => leaderboard.open();

buildSizeOptions('width-options', 'width', CONFIG.grid.defaultWidth);
buildSizeOptions('height-options', 'height', CONFIG.grid.defaultHeight);

const game = new Game(gameCanvas, gameColumn, hud, winOverlay, nameDialog, showSetup);

$('start-btn').addEventListener('click', () => startGame(game));
$('leaderboard-btn').addEventListener('click', () => leaderboard.open());
$('help-btn').addEventListener('click', () => help.open());

$('app-version').textContent = `Version ${APP_VERSION}`;

showSetup();
