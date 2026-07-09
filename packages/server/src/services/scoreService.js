import { calculateScore } from '@power-grid/shared/score/ScoreCalculator.js';
import { ReplayVerifier } from '../verification/ReplayVerifier.js';
import { getPool } from '../db/pool.js';
import { generateEditToken, hashEditToken, timingSafeEqualHex, validatePlayerName } from '../lib/tokens.js';

const TOP_N = 100;

function buildExclusionReasons(session) {
  const pauseUsed = session.events?.some((event) => event.kind === 'pause') ?? false;
  return pauseUsed ? { pauseUsed: true } : {};
}

function buildLevelStatistics(statistics, session) {
  if (statistics && typeof statistics === 'object') {
    return {
      width: statistics.width,
      height: statistics.height,
      wrap: statistics.wrap,
      timePassed: statistics.timePassed,
      rotations: statistics.rotations,
      minimumRotationsRequired: statistics.minimumRotationsRequired,
      numTiles: statistics.numTiles,
    };
  }

  const { puzzle, outcome } = session;
  return {
    width: puzzle.width,
    height: puzzle.height,
    wrap: puzzle.wrap,
    timePassed: Math.max(1, Math.floor((outcome.activeDurationMs ?? 0) / 1000)),
    rotations: outcome.rotationCount,
    minimumRotationsRequired: 1,
    numTiles: puzzle.width * puzzle.height,
  };
}

async function getRankForEntry(id) {
  const result = await getPool().query(
    `SELECT rank FROM (
       SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) AS rank
       FROM score_entries
       WHERE leaderboard_eligible = TRUE
     ) ranked
     WHERE id = $1`,
    [id],
  );
  return result.rows[0]?.rank ?? null;
}

async function qualifiesForTop100(score) {
  const result = await getPool().query(
    `SELECT score FROM score_entries
     WHERE leaderboard_eligible = TRUE
     ORDER BY score DESC
     OFFSET $1 LIMIT 1`,
    [TOP_N - 1],
  );

  if (result.rows.length === 0) {
    return true;
  }
  return score >= result.rows[0].score;
}

export async function submitScore({ session, statistics, clientScore, appVersion }) {
  let verification = ReplayVerifier.verify(session);
  const exclusionReasons = buildExclusionReasons(session);
  const pauseUsed = exclusionReasons.pauseUsed === true;

  const levelStats = buildLevelStatistics(statistics, session);
  let serverScore = clientScore ?? 0;

  if (verification.valid) {
    serverScore = calculateScore(levelStats);
    if (clientScore !== undefined && clientScore !== serverScore) {
      verification = {
        valid: false,
        reason: `Score mismatch: client ${clientScore} vs server ${serverScore}`,
      };
    }
  }

  const leaderboardEligible = verification.valid && !pauseUsed;
  const { token: editToken, hash: editTokenHash, expiresAt: editTokenExpiresAt } = generateEditToken();

  const insert = await getPool().query(
    `INSERT INTO score_entries (
      player_name, score, client_score, leaderboard_eligible,
      verification_result, exclusion_reasons, level_statistics, replay, app_version,
      edit_token_hash, edit_token_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id`,
    [
      null,
      serverScore,
      clientScore ?? null,
      leaderboardEligible,
      JSON.stringify(verification),
      JSON.stringify(exclusionReasons),
      JSON.stringify(levelStats),
      JSON.stringify(session),
      appVersion ?? null,
      editTokenHash,
      editTokenExpiresAt,
    ],
  );

  const id = insert.rows[0].id;
  const qualifiesForLeaderboard = leaderboardEligible && await qualifiesForTop100(serverScore);
  const rank = qualifiesForLeaderboard ? await getRankForEntry(id) : null;

  return {
    id,
    editToken,
    score: serverScore,
    rank,
    leaderboardEligible,
    qualifiesForLeaderboard,
    offerNamePrompt: qualifiesForLeaderboard,
  };
}

export async function setPlayerName(id, name, editToken) {
  if (!validatePlayerName(name)) {
    const error = new Error('Invalid player name');
    error.statusCode = 400;
    throw error;
  }

  const result = await getPool().query(
    `SELECT leaderboard_eligible, edit_token_hash, edit_token_expires_at
     FROM score_entries WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  const row = result.rows[0];
  if (!row.leaderboard_eligible) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  if (!row.edit_token_hash || !row.edit_token_expires_at) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  if (new Date(row.edit_token_expires_at) <= new Date()) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  const tokenHash = hashEditToken(editToken);
  if (!timingSafeEqualHex(tokenHash, row.edit_token_hash)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  await getPool().query(
    `UPDATE score_entries
     SET player_name = $1, edit_token_hash = NULL, edit_token_expires_at = NULL
     WHERE id = $2`,
    [name, id],
  );

  return { ok: true };
}

export async function fetchLeaderboard() {
  const result = await getPool().query(
    `SELECT player_name, score, created_at
     FROM score_entries
     WHERE leaderboard_eligible = TRUE
     ORDER BY score DESC, created_at ASC
     LIMIT $1`,
    [TOP_N],
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    score: row.score,
    playedAt: row.created_at.toISOString(),
    name: row.player_name,
  }));
}
