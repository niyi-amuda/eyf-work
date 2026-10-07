export const GAME_END_AT = new Date("2026-10-07T23:30:00+01:00");

export function isGameEnded() {
  return new Date() >= GAME_END_AT;
}

export function gameEndedResponse() {
  return {
    message: "The EYF Experience games have ended. Thank you for participating! 🏆",
    gameEnded: true,
  };
}
