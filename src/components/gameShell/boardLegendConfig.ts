export type BoardLegendEntry = {
  labelKey:
    | "game.board.legend.finishLine.label"
    | "game.board.legend.propulsion.label"
    | "game.board.legend.hindrance.label"
    | "game.board.legend.rift.label"
    | "game.board.legend.stacks.label";
  descriptionKey:
    | "game.board.legend.finishLine.description"
    | "game.board.legend.propulsion.description"
    | "game.board.legend.hindrance.description"
    | "game.board.legend.rift.description"
    | "game.board.legend.stacks.description";
  borderClass: string;
};

export const BOARD_LEGEND_ENTRIES: readonly BoardLegendEntry[] = [
  {
    labelKey: "game.board.legend.finishLine.label",
    descriptionKey: "game.board.legend.finishLine.description",
    borderClass: "border-amber-300",
  },
  {
    labelKey: "game.board.legend.propulsion.label",
    descriptionKey: "game.board.legend.propulsion.description",
    borderClass: "border-green-500",
  },
  {
    labelKey: "game.board.legend.hindrance.label",
    descriptionKey: "game.board.legend.hindrance.description",
    borderClass: "border-red-500",
  },
  {
    labelKey: "game.board.legend.rift.label",
    descriptionKey: "game.board.legend.rift.description",
    borderClass: "border-purple-400",
  },
  {
    labelKey: "game.board.legend.stacks.label",
    descriptionKey: "game.board.legend.stacks.description",
    borderClass: "border-slate-500",
  },
];
