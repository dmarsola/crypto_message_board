export {} // module not script

declare global {
  var _publicBoardChallenges: Record<string, string> | undefined
  var _privateBoardNicknames: Record<string, string> | undefined
  var _publicBoardNicknames: Record<string, string> | undefined
}
