export class ScoreApiClient {
  static async submitScore({ session, statistics, clientScore, appVersion }) {
    const body = {
      session,
      statistics,
      clientScore,
      appVersion,
    };

    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Score submit failed: ${response.status}`);
    }

    return response.json();
  }

  static async setPlayerName(id, name, editToken) {
    const response = await fetch(`/api/scores/${id}/name`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, editToken }),
    });

    if (!response.ok) {
      throw new Error(`Name update failed: ${response.status}`);
    }

    return response.json();
  }

  static async fetchLeaderboard() {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) {
      throw new Error(`Leaderboard fetch failed: ${response.status}`);
    }
    return response.json();
  }
}
