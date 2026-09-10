# Konomi Design Kit — reskin a build, never break it

**Live: https://sjgant80-hub.github.io/konomi-design-kit/**

The estate is weakest at visual craft, so a brilliant designer improving a build is high
value — but every estate build is a **witnessed kernel behind a live surface**, and a
redesign must not break the logic or the wiring. This is the safe on-ramp:

- The designer owns the **skin** — colours, type, layout, spacing, radius, copy, motion (the
  CSS variables and the look). Total freedom.
- The **kernel and the control wiring are locked**. Untouchable.
- A live **gate** proves, on every change, that the redesign still works.

Design freedom lives *above* the gate; the proven thing lives *below* it, untouched.

## The gate (`designGate`)

Four checks — each a way a beautiful redesign silently breaks a working build:

1. **KERNEL intact** — the locked logic is byte-identical (fingerprints match).
2. **CONTROLS wired** — every element id the wiring binds to still exists (no dead buttons).
3. **REQUIRED vars** — every CSS variable the build depends on is still defined.
4. **NO undefined vars** — every `var(--x)` the redesign uses is defined.

SHIP iff all four hold; otherwise REJECT, naming exactly what broke. The live page is a
working harness: reskin the embedded build in real time, watch the gate stay green, and flip
"break it" to watch it reject a redesign that drops a control.

## All in konomi

The design contribution is witnessed exactly like code. A designer forks a build, edits only
the skin, and the gate clears (or rejects) their PR — so they iterate endlessly and can never
ship a broken build. Pairs with [ui-gate](https://github.com/sjgant80-hub/ui-gate).

## Proof

`kernel.mjs` — pure, total. Mutation gate **CLEAN: 26/26, zero survivors, zero exemptions**
(11 tests; every law's ship/reject direction and the fingerprint pinned). Kernel-backed page
(CI-diffed). Tested locally, playing to completion, before every push.

MIT.
