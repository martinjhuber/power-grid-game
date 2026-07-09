const NAME_PATTERN = /^[A-Za-z0-9]{1,16}$/;
const COOKIE_NAME = 'pg_leaderboard_name';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function getPlayerName() {
  const value = readCookie(COOKIE_NAME);
  return validatePlayerName(value) ? value : '';
}

export function setPlayerName(name) {
  if (!validatePlayerName(name)) {
    return false;
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(name)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return true;
}

export function validatePlayerName(name) {
  return typeof name === 'string' && NAME_PATTERN.test(name);
}
