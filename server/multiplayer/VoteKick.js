export default class Votekick {
  constructor (targetId, threshold, voted = []) {
    this.targetId = targetId;
    this.voted = Array.isArray(voted) ? voted : [];
    this.threshold = threshold;
  }

  exists (givenId) {
    return this.targetId === givenId;
  }

  vote (votingId) {
    if (!this.voted.includes(votingId)) {
      this.voted.push(votingId);
    }
  }

  check () {
    return this.voted.length >= this.threshold;
  }
}
