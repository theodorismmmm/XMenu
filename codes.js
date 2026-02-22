// codes.js – XMenu Code Configuration
// Edit this file to add, remove, or update discount codes, XP rewards, and membership tiers.
// Changes here take effect immediately on the live site (no rebuild required).

window.XMENU_CODE_CONFIG = (function () {
  "use strict";

  // ── Discount Codes ───────────────────────────────────────────────────────
  // Each key is the lowercase code string.
  // Fields:
  //   discount  – percentage off the repair price shown in the Tech Support panel
  //   xpReward  – XP awarded when this code is first successfully applied
  //   maxUses   – maximum number of times this code can be used site-wide (null = unlimited)
  const DISCOUNT_CODES = {
    "2026xrepairpro": { discount: 10, xpReward: 50, maxUses: null }
  };

  // ── Admin Code ────────────────────────────────────────────────────────────
  // This code grants XP every time it is entered and has unlimited uses.
  // The admin code itself is NOT a discount code – it only awards XP.
  const ADMIN_CODE = "admin123";
  const ADMIN_XP_REWARD = 100;

  // ── Membership Tier Discount Codes ───────────────────────────────────────
  // These codes are automatically revealed to members of the matching tier (or higher).
  // They can also be entered manually in the Tech Support discount code field.
  const MEMBERSHIP_DISCOUNT_CODES = {
    "BRONZE5":  { discount: 5,  tier: "bronze"   },
    "SILVER10": { discount: 10, tier: "silver"   },
    "GOLD15":   { discount: 15, tier: "gold"     },
    "PLAT20":   { discount: 20, tier: "platinum" }
  };

  // ── Membership Tiers ─────────────────────────────────────────────────────
  // Must remain sorted ascending by xpRequired.
  // Fields:
  //   id           – internal identifier
  //   label        – display name
  //   xpRequired   – minimum XP to reach this tier
  //   color        – badge accent colour (CSS colour string)
  //   icon         – emoji / symbol shown in the badge
  //   discountCode – the code that members of this tier receive (null for "none")
  //   discountPct  – the discount percentage the code provides
  const MEMBERSHIP_TIERS = [
    { id: "none",     label: "No Membership", xpRequired: 0,    color: "#64748b", icon: "—",  discountCode: null,       discountPct: 0  },
    { id: "bronze",   label: "Bronze",        xpRequired: 100,  color: "#cd7f32", icon: "🥉", discountCode: "BRONZE5",  discountPct: 5  },
    { id: "silver",   label: "Silver",        xpRequired: 200,  color: "#c0c0c0", icon: "🥈", discountCode: "SILVER10", discountPct: 10 },
    { id: "gold",     label: "Gold",          xpRequired: 1000, color: "#ffd700", icon: "🥇", discountCode: "GOLD15",   discountPct: 15 },
    { id: "platinum", label: "Platinum",      xpRequired: 5000, color: "#e5e4e2", icon: "💎", discountCode: "PLAT20",   discountPct: 20 }
  ];

  return {
    DISCOUNT_CODES,
    ADMIN_CODE,
    ADMIN_XP_REWARD,
    MEMBERSHIP_DISCOUNT_CODES,
    MEMBERSHIP_TIERS
  };
})();
