import {HERO_OFFERS, playableHeroIds} from "../heroes/commerce.js";
const purchaseLocks=new Map();
// Account wallet is separate from match gold. Purchases never grant currency.
export const STARTING_COINS = 30000;
export const STARTING_DIAMONDS = 0;
export const progressKey = (username) =>
  `moba-lab.progress.v1:${encodeURIComponent(username)}`;
const balance = (n) => Number.isSafeInteger(n) && n >= 0;
export function validateProgress(value) {
  if (
    !value ||
    value.version !== 1 ||
    value.starterGrantApplied !== true ||
    !balance(value.coins) ||
    !balance(value.diamonds) ||
    !Array.isArray(value.ownedHeroes)
  )
    return null;
  return {
    version: 1,
    starterGrantApplied: true,
    coins: value.coins,
    diamonds: value.diamonds,
    ownedHeroes: ["layla",...playableHeroIds.filter(id=>id!=="layla" && value.ownedHeroes.includes(id))],
  };
}
export class ProgressStore {
  constructor(storage) {
    this.storage = storage;
    this.sessions = new Map();
    this.current = null;
    this.persistent = false;
    this.recovered = false;
    this.quotes = new Map();
    this.purchaseSerial=0;
  }
  loadFor(profile) {
    const key = progressKey(profile.username);
    this.key=key;
    if (this.sessions.has(key)) {
      const cached = this.sessions.get(key);
      Object.assign(this, cached);
      return this.snapshot();
    }
    let raw = null;
    try {
      raw = this.storage?.getItem(key) ?? null;
    } catch {}
    let existing = null;
    try {
      existing = validateProgress(JSON.parse(raw));
    } catch {}
    this.recovered = Boolean(raw && !existing);
    // A missing record gets the one-time grant, including migration of old profiles.
    // A corrupt existing wallet is recovered at zero, never re-granted repeatedly.
    this.current = existing || {
      version: 1,
      starterGrantApplied: true,
      coins: this.recovered ? 0 : STARTING_COINS,
      diamonds: STARTING_DIAMONDS,
      ownedHeroes: ["layla"],
    };
    this.persistent = false;
    try {
      this.storage?.setItem(key, JSON.stringify(this.current));
      this.persistent =
        JSON.stringify(
          validateProgress(JSON.parse(this.storage?.getItem(key) || "null")),
        ) === JSON.stringify(this.current);
    } catch {}
    this.sessions.set(key, {
      current: this.current,
      persistent: this.persistent,
      recovered: this.recovered,
    });
    return this.snapshot();
  }
  quotePurchase(heroId, currency) {
    const offer=HERO_OFFERS[heroId], amount=offer?.prices[currency];
    if (!this.current || !Number.isSafeInteger(amount) || amount<=0) return {error:"invalid-offer"};
    if (this.current.ownedHeroes.includes(heroId)) return {error:"already-owned"};
    if (this.current[currency]<amount) return {error:"insufficient-funds"};
    const quote=Object.freeze({id:`purchase-${++this.purchaseSerial}`,key:this.key,heroId,currency,amount});
    this.quotes.set(quote.id,quote);
    return quote;
  }
  cancelPurchase(quote){if(quote?.id)this.quotes.delete(quote.id);}
  async confirmPurchase(quote) {
    const issued=this.quotes.get(quote?.id);
    if(!issued || issued!==quote || quote.key!==this.key) return "invalid-confirmation";
    // Consume the confirmation synchronously, before waiting for any storage lock.
    this.quotes.delete(quote.id);
    const transaction=()=>{
      if(quote.key!==this.key)return "profile-changed";
      let latest;
      try {latest=validateProgress(JSON.parse(this.storage?.getItem(quote.key)||"null"));}catch{}
      if(!latest)return "storage-unavailable";
      const amount=HERO_OFFERS[quote.heroId]?.prices[quote.currency];
      if(amount!==quote.amount)return "offer-changed";
      if(latest.ownedHeroes.includes(quote.heroId)){this.current=latest;this.cacheCurrent();return "already-owned";}
      if(latest[quote.currency]<amount){this.current=latest;this.cacheCurrent();return "insufficient-funds";}
      const candidate={...latest,[quote.currency]:latest[quote.currency]-amount,ownedHeroes:[...latest.ownedHeroes,quote.heroId]};
      const encoded=JSON.stringify(candidate);
      try {this.storage.setItem(quote.key,encoded);if(this.storage.getItem(quote.key)!==encoded)return "storage-unavailable";}catch{return "storage-unavailable";}
      this.current=candidate;this.persistent=true;this.cacheCurrent();return "purchased";
    };
    const lockName=`moba-hero-purchase:${quote.key}`;
    // Web Locks serialize real tabs where available; the local queue also covers
    // independent stores on this page and the isolated Node harness.
    const previous=purchaseLocks.get(lockName)||Promise.resolve();
    const run=previous.catch(()=>{}).then(()=>globalThis.navigator?.locks?.request ? navigator.locks.request(lockName,transaction).catch(()=>"storage-unavailable") : transaction());
    purchaseLocks.set(lockName,run);
    try{return await run;}finally{if(purchaseLocks.get(lockName)===run)purchaseLocks.delete(lockName);}
  }
  cacheCurrent(){this.sessions.set(this.key,{current:this.current,persistent:this.persistent,recovered:this.recovered});}
  developerAdd(kind, amount) {
    if (!["coins", "diamonds"].includes(kind) || !Number.isSafeInteger(amount) || amount < 1 || amount > 1000000 || !this.current || !Number.isSafeInteger(this.current[kind] + amount)) return "invalid-amount";
    this.current[kind] += amount;
    this.persistent = false;
    const key = [...this.sessions].find(([,v])=>v.current===this.current)?.[0];
    try { this.storage?.setItem(key, JSON.stringify(this.current)); this.persistent = this.storage?.getItem(key) === JSON.stringify(this.current); } catch {}
    if (key) this.sessions.set(key,{current:this.current,persistent:this.persistent,recovered:this.recovered});
    return "ok";
  }
  snapshot() {
    return (
      this.current && {
        ...this.current,
        ownedHeroes: [...this.current.ownedHeroes],
      }
    );
  }
}
