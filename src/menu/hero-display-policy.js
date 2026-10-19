// User's presentation boundary: illustrations everywhere outside selection/game.
// This policy never affects ownership, combat, currencies or saved records.
export function usesHeroPreview(screen, heroId) {
  return screen === 'selection' && Boolean(heroId);
}
