export function countLikes(votes: { value: number }[]) {
  return votes.filter((vote) => vote.value === 1).length;
}
