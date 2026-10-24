import {heroSkillArt} from "../heroes/art.js";
// Reuse the project's original local vector vocabulary; no screenshot extraction.
import { icon } from "../ui/components/icons.js";
const names = {
  passive: "spark",
  "skill-1": "arc",
  "skill-2": "ultimate",
  "skill-ultimate": "strike",
};
export const abilityIcon = (slot, heroId="layla") => `<img class="hero-ability-png" src="${heroSkillArt(heroId,slot)}" alt="">`;
export const abilityLabel = (slot) =>
  ({
    passive: "Passive",
    "skill-1": "Skill I",
    "skill-2": "Skill II",
    "skill-ultimate": "Ultimate",
  })[slot] || "Ability";
