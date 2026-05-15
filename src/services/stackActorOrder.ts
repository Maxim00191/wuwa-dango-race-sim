import { ABBY_ID } from "@/constants/ids";
import type { DangoId } from "@/types/game";

/** Turn order: stack top first, then downward; Abby (when present) acts after racers. */
export function entityOrderFromStackTopToBottom(
  stackBottomToTop: readonly DangoId[]
): DangoId[] {
  const racersTopToBottom = [...stackBottomToTop]
    .reverse()
    .filter((id): id is DangoId => id !== ABBY_ID);
  const includesAbby = stackBottomToTop.includes(ABBY_ID);
  return includesAbby ? [...racersTopToBottom, ABBY_ID] : racersTopToBottom;
}
