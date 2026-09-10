import { test } from 'node:test';
import assert from 'node:assert/strict';
import { designGate, fingerprint } from './kernel.mjs';

const CONTRACT = { controls: ['go', 'out', 'reset'], vars: ['--bg', '--ink', '--accent'], kernelHash: 'abc123' };
const goodSkin = { controls: ['go', 'out', 'reset', 'header'], vars: ['--bg', '--ink', '--accent', '--dim'], varsUsed: ['--bg', '--ink', '--accent', '--dim'], kernelHash: 'abc123' };

test('designGate SHIPS a redesign that keeps the kernel, controls and vars', () => {
  const r = designGate(CONTRACT, goodSkin);
  assert.equal(r.ok, true);
  assert.equal(r.ship, true);
  assert.equal(r.verdict, 'SHIP');
  assert.equal(r.breaks.length, 0);
  assert.deepEqual(r.report, { kernelIntact: true, controlsWired: true, requiredVars: true, noUndefinedVars: true });
});

test('a designer may ADD controls and vars freely — surface freedom above the gate', () => {
  // extra controls (header) and extra vars (--dim) are fine; only DROPPING required ones fails
  assert.equal(designGate(CONTRACT, goodSkin).ship, true);
});

test('REJECT: the kernel was altered', () => {
  const r = designGate(CONTRACT, { ...goodSkin, kernelHash: 'deadbeef' });
  assert.equal(r.ship, false);
  assert.equal(r.breaks.some((b) => b.law === 'KERNEL'), true);
  assert.equal(r.report.kernelIntact, false);
});

test('REJECT: a wired control was dropped/renamed (a dead button)', () => {
  const r = designGate(CONTRACT, { ...goodSkin, controls: ['go', 'out'] });   // dropped 'reset'
  assert.equal(r.ship, false);
  assert.equal(r.breaks.some((b) => b.law === 'CONTROLS' && b.why.includes('reset')), true);
});

test('REJECT: a required CSS variable is no longer defined', () => {
  const r = designGate(CONTRACT, { ...goodSkin, vars: ['--bg', '--ink'], varsUsed: ['--bg', '--ink'] }); // dropped --accent
  assert.equal(r.ship, false);
  assert.equal(r.breaks.some((b) => b.law === 'REQUIRED-VARS' && b.why.includes('--accent')), true);
});

test('REJECT: a variable is used but never defined (paints nothing)', () => {
  const r = designGate(CONTRACT, { ...goodSkin, varsUsed: ['--bg', '--ink', '--accent', '--ghost'] }); // --ghost undefined
  assert.equal(r.ship, false);
  assert.equal(r.breaks.some((b) => b.law === 'UNDEFINED-VARS' && b.why.includes('--ghost')), true);
});

test('several breaks are named at once', () => {
  const r = designGate(CONTRACT, { controls: ['go'], vars: ['--bg'], varsUsed: ['--bg', '--x'], kernelHash: 'zzz' });
  assert.equal(r.ship, false);
  assert.deepEqual(r.breaks.map((b) => b.law).sort(), ['CONTROLS', 'KERNEL', 'REQUIRED-VARS', 'UNDEFINED-VARS']);
  assert.deepEqual(r.report, { kernelIntact: false, controlsWired: false, requiredVars: false, noUndefinedVars: false });
});

test('empty required contract (no controls, no vars) ships any skin with the right kernel', () => {
  const r = designGate({ controls: [], vars: [], kernelHash: 'k' }, { controls: [], vars: [], varsUsed: [], kernelHash: 'k' });
  assert.equal(r.ship, true);
});

test('designGate: total on garbage, each guard alone', () => {
  assert.equal(designGate(null, goodSkin).ok, false);
  assert.equal(designGate({ controls: 'x', vars: [], kernelHash: 'k' }, goodSkin).ok, false);
  assert.equal(designGate({ controls: [1], vars: [], kernelHash: 'k' }, goodSkin).ok, false);
  assert.equal(designGate({ controls: [], vars: [], kernelHash: '' }, goodSkin).ok, false);       // empty hash
  assert.equal(designGate(CONTRACT, null).ok, false);
  assert.equal(designGate(CONTRACT, { ...goodSkin, varsUsed: 'x' }).ok, false);
  assert.equal(designGate(CONTRACT, { ...goodSkin, kernelHash: 42 }).ok, false);
});

test('fingerprint: deterministic, edit-sensitive, total', () => {
  // exact FNV-1a values pinned — kills the loop-bound < → <= (an extra pass changes the hash)
  assert.equal(fingerprint('hello').hash, '4f9f2cab');
  assert.equal(fingerprint('konomi').hash, 'b4195e26');
  assert.equal(fingerprint('hello').hash, fingerprint('hello').hash);
  assert.notEqual(fingerprint('hello').hash, fingerprint('hello ').hash);   // one space changes it
  assert.notEqual(fingerprint('a').hash, fingerprint('b').hash);
  assert.equal(/^[0-9a-f]{8}$/.test(fingerprint('anything').hash), true);
  assert.equal(fingerprint(42).ok, false);
  // a locked kernel + its fingerprint round-trips through the gate
  const src = 'export function k(){ return 1 }';
  const h = fingerprint(src).hash;
  assert.equal(designGate({ controls: [], vars: [], kernelHash: h }, { controls: [], vars: [], varsUsed: [], kernelHash: fingerprint(src).hash }).ship, true);
  assert.equal(designGate({ controls: [], vars: [], kernelHash: h }, { controls: [], vars: [], varsUsed: [], kernelHash: fingerprint(src + ' ').hash }).ship, false);
});
