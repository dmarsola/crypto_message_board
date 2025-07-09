export {} // module not script

declare global {
  var _publicBoardChallenges: Record<string, string> | undefined
  var _privateBoardNicknames: Record<string, string> | undefined
  var _publicBoardNicknames: Record<string, string> | undefined
}

declare module 'bootstrap/dist/js/bootstrap.bundle.min.js'
declare module 'bootstrap/js/dist/tooltip'
declare module 'bootstrap/js/dist/modal'

export interface BootstrapTooltip {
  dispose(): void
  enable(): void
  disable(): void
  toggle(): void
  show(): void
  hide(): void
  update(): void
}

export interface BootstrapModal {
  show: () => void
  hide: () => void
}
