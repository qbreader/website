export default class Team {
  constructor (teamId) {
    this.teamId = teamId;
    this.bonusStats = { 0: 0, 10: 0, 20: 0, 30: 0 };
  }

  clearStats () {
    this.bonusStats = { 0: 0, 10: 0, 20: 0, 30: 0 };
  }

  safelySetTeamName (teamName) {
    if (!teamName) { teamName = ''; }
    this.teamName = teamName;
    return this.teamName;
  }

  updateStats (points) {
    this.bonusStats[points]++;
  }
}
