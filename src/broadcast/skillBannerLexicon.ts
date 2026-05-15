import type { DangoId } from "@/types/game";
import type { LocalizedText } from "@/i18n/types";

export type SkillBannerActionId =
  | "carlotta.double"
  | "chisa.underdog"
  | "lynae.double"
  | "lynae.stuck"
  | "aemeath.leap"
  | "sigrika.markSingle"
  | "sigrika.markDouble"
  | "denia.repeat"
  | "hiyuki.metAbby"
  | "hiyuki.bondedAdvance"
  | "phoebe.lucky"
  | "cartethyia.awaken"
  | "cartethyia.boost"
  | "jinhsi.stackAscend"
  | "changli.actLastNextRound"
  | "calcharo.lastPlaceBoost"
  | "augusta.governorAuthority"
  | "iuno.anchoredDestiny"
  | "phrolova.bottomBoost"
  | `${string}.activate`;

const SKILL_NAME_KEY_BY_CHARACTER: Record<string, string> = {
  luukHerssen: "skills.names.luukHerssen",
  sigrika: "skills.names.sigrika",
  denia: "skills.names.denia",
  hiyuki: "skills.names.hiyuki",
  cartethyia: "skills.names.cartethyia",
  phoebe: "skills.names.phoebe",
  mornye: "skills.names.mornye",
  shorekeeper: "skills.names.shorekeeper",
  chisa: "skills.names.chisa",
  carlotta: "skills.names.carlotta",
  lynae: "skills.names.lynae",
  aemeath: "skills.names.aemeath",
  augusta: "skills.names.augusta",
  iuno: "skills.names.iuno",
  phrolova: "skills.names.phrolova",
  changli: "skills.names.changli",
  jinhsi: "skills.names.jinhsi",
  calcharo: "skills.names.calcharo",
};

const LEGACY_LOG_KEY_TO_ACTION: Record<string, SkillBannerActionId> = {
  "simulation.skills.carlottaDouble": "carlotta.double",
  "simulation.skills.chisaUnderdog": "chisa.underdog",
  "simulation.skills.lynaeDouble": "lynae.double",
  "simulation.skills.lynaeStuck": "lynae.stuck",
  "simulation.skills.aemeathLeap": "aemeath.leap",
  "simulation.skills.sigrikaMarkSingle": "sigrika.markSingle",
  "simulation.skills.sigrikaMarkDouble": "sigrika.markDouble",
  "simulation.skills.deniaRepeat": "denia.repeat",
  "simulation.skills.hiyukiMetAbby": "hiyuki.metAbby",
  "simulation.skills.hiyukiBondedAdvance": "hiyuki.bondedAdvance",
  "simulation.skills.phoebeLucky": "phoebe.lucky",
  "simulation.skills.cartethyiaComebackAwaken": "cartethyia.awaken",
  "simulation.skills.cartethyiaComebackBoost": "cartethyia.boost",
  "simulation.skills.jinhsiStackAscend": "jinhsi.stackAscend",
  "simulation.skills.changliActLastNextRound": "changli.actLastNextRound",
  "simulation.skills.calcharoLastPlaceBoost": "calcharo.lastPlaceBoost",
  "simulation.skills.augustaGovernorAuthority": "augusta.governorAuthority",
  "simulation.skills.iunoAnchoredDestiny": "iuno.anchoredDestiny",
  "simulation.skills.phrolovaBottomBoost": "phrolova.bottomBoost",
};

export function inferSkillBannerActionId(
  narrative: LocalizedText
): SkillBannerActionId | undefined {
  return LEGACY_LOG_KEY_TO_ACTION[narrative.key];
}

export function resolveSkillBannerActionId(
  actorId: DangoId,
  narrative?: LocalizedText,
  explicit?: SkillBannerActionId
): SkillBannerActionId {
  if (explicit) {
    return explicit;
  }
  if (narrative) {
    const inferred = inferSkillBannerActionId(narrative);
    if (inferred) {
      return inferred;
    }
  }
  return `${actorId}.activate` as SkillBannerActionId;
}

export function resolveSkillNameKey(
  actorId: DangoId,
  actionId: SkillBannerActionId
): string {
  const characterId = actionId.split(".")[0]!;
  return SKILL_NAME_KEY_BY_CHARACTER[characterId] ?? SKILL_NAME_KEY_BY_CHARACTER[actorId] ?? `skills.names.${actorId}`;
}

export function resolveSkillBannerDetailKey(
  actionId: SkillBannerActionId
): string {
  if (actionId.endsWith(".activate")) {
    return "banner.skill.details.activate";
  }
  const dotIndex = actionId.indexOf(".");
  if (dotIndex === -1) {
    return "banner.skill.details.activate";
  }
  const characterId = actionId.slice(0, dotIndex);
  const variant = actionId.slice(dotIndex + 1);
  return `banner.skill.details.${characterId}.${variant}`;
}
