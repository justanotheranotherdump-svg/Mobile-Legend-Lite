import {heroArt} from '../heroes/art.js';
export const HERO_PORTRAITS = Object.freeze({layla:heroArt('layla'),franco:heroArt('franco')});
export const getHeroPortrait = (id) => HERO_PORTRAITS[id] || null;
