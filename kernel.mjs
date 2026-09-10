// konomi-design-kit — the design gate. Freedom on the surface, the kernel stays sacred.
//
// The estate is weakest at UX/UI, so a brilliant designer improving a build is high value —
// but an estate build is a WITNESSED kernel behind a live surface, and a redesign must not
// break the logic or the wiring. This gate draws the line: a designer owns the SKIN (colours,
// type, layout, spacing, copy, motion — the CSS variables and the look); the KERNEL and the
// control WIRING are locked. The gate checks a proposed redesign against the build's contract
// and says exactly one of: SHIP (safe), or REJECT with precisely what broke. Design freedom
// lives ABOVE this gate; the proven thing lives below it, untouched.
//
// "All in konomi" = the design contribution is witnessed the same way code is. A gorgeous
// redesign that drops a wired control or leaves a CSS variable undefined is not shippable, and
// the gate names it — so the designer iterates freely and can never ship a broken build.
//
// Pure and total; guards one-per-line.

function isStrArr(a) {
  if (!Array.isArray(a)) return false;
  return a.every((x) => typeof x === 'string');
}
function readContract(c) {
  if (typeof c !== 'object' || c === null || Array.isArray(c)) return 'contract is { controls[], vars[], kernelHash }';
  if (!isStrArr(c.controls)) return 'contract.controls must be an array of element-id strings the wiring needs';
  if (!isStrArr(c.vars)) return 'contract.vars must be an array of required CSS variable names';
  if (typeof c.kernelHash !== 'string') return 'contract.kernelHash must be a string (the locked kernel fingerprint)';
  if (c.kernelHash.length === 0) return 'contract.kernelHash must be non-empty';
  return null;
}
function readSkin(s) {
  if (typeof s !== 'object' || s === null || Array.isArray(s)) return 'skin is { controls[], vars[], varsUsed[], kernelHash }';
  if (!isStrArr(s.controls)) return 'skin.controls must be an array of element ids present in the redesign';
  if (!isStrArr(s.vars)) return 'skin.vars must be an array of CSS variables the redesign defines';
  if (!isStrArr(s.varsUsed)) return 'skin.varsUsed must be an array of CSS variables the redesign references';
  if (typeof s.kernelHash !== 'string') return 'skin.kernelHash must be a string (the kernel fingerprint in the redesign)';
  if (s.kernelHash.length === 0) return 'skin.kernelHash must be non-empty';
  return null;
}

/**
 * designGate(contract, skin) — can this redesign ship?
 * Four checks, each a way a beautiful redesign can silently break a working build:
 *   1. KERNEL INTACT   — the locked logic is byte-identical (fingerprints match). The designer
 *                        touched the skin, not the code.
 *   2. CONTROLS WIRED  — every element id the wiring binds to still exists. A renamed/removed
 *                        control leaves a dead button.
 *   3. REQUIRED VARS   — every CSS variable the build depends on is still defined.
 *   4. NO UNDEFINED VARS — every var(--x) the redesign USES is defined (an undefined var paints nothing).
 * SHIP iff all four hold; otherwise REJECT, naming each break.
 */
export function designGate(contract, skin) {
  const ce = readContract(contract);
  if (ce !== null) return { ok: false, why: ce };
  const se = readSkin(skin);
  if (se !== null) return { ok: false, why: se };

  const kernelIntact = skin.kernelHash === contract.kernelHash;
  const droppedControls = contract.controls.filter((c) => !skin.controls.includes(c));
  const missingVars = contract.vars.filter((v) => !skin.vars.includes(v));
  const undefinedVars = skin.varsUsed.filter((v) => !skin.vars.includes(v));

  const breaks = [];
  if (!kernelIntact) breaks.push({ law: 'KERNEL', why: 'the locked kernel changed — the redesign touched the logic, not just the skin' });
  if (droppedControls.length > 0) breaks.push({ law: 'CONTROLS', why: 'wired control(s) missing from the redesign: ' + droppedControls.join(', ') });
  if (missingVars.length > 0) breaks.push({ law: 'REQUIRED-VARS', why: 'required CSS variable(s) not defined: ' + missingVars.join(', ') });
  if (undefinedVars.length > 0) breaks.push({ law: 'UNDEFINED-VARS', why: 'CSS variable(s) used but never defined: ' + undefinedVars.join(', ') });

  const ship = breaks.length === 0;
  return {
    ok: true,
    ship,
    verdict: ship ? 'SHIP' : 'REJECT',
    breaks,
    report: { kernelIntact, controlsWired: droppedControls.length === 0, requiredVars: missingVars.length === 0, noUndefinedVars: undefinedVars.length === 0 },
  };
}

// A tiny, stable content fingerprint (FNV-1a, 32-bit hex) — enough to detect that a locked
// kernel block was edited. Deterministic; whitespace-significant on purpose (any edit shows).
export function fingerprint(text) {
  if (typeof text !== 'string') return { ok: false, why: 'fingerprint reads a string' };
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return { ok: true, hash: (h >>> 0).toString(16).padStart(8, '0') };
}
