import type { MouseEvent } from "react";

export function suppressMouseDownFocus(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}
