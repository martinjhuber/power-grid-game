import { CONFIG } from './config.js';
import { Game } from './game/Game.js';

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
  score: $('win-score'),
  time: $('win-time'),
  rotations: $('win-rotations'),
  minRotations: $('win-min-rotations'),
  replayBtn: $('win-replay'),
  newGameBtn: $('win-new-game'),
};

buildSizeOptions('width-options', 'width', CONFIG.grid.defaultWidth);
buildSizeOptions('height-options', 'height', CONFIG.grid.defaultHeight);

const game = new Game(gameCanvas, gameColumn, hud, winOverlay, showSetup);

$('start-btn').addEventListener('click', () => startGame(game));

showSetup();
