'use strict';

const assert = require('assert');
const wiz = require('../../classroom/modules/11-pick-your-lab/wizard.js');

function base(partial) {
  return Object.assign({
    side: 'linux',
    role: 'everyday',
    job: 'learn',
    skill: 'new',
    games: 'no',
    ram: 16,
    gpu: 'none',
    storage: 1000,
    budget: 'have',
  }, partial);
}

function ids(partial) {
  return wiz.flavorChoices(base(partial)).map(function (choice) { return choice.value; });
}

assert.deepStrictEqual(wiz.stepsFor({}).map(function (s) { return s.id; })[0], 'side');
assert.ok(!wiz.stepsFor({ side: 'mac' }).some(function (s) { return s.id === 'gpu'; }), 'Mac skips the NVIDIA card question');
assert.ok(wiz.stepsFor({ side: 'win' }).some(function (s) { return s.id === 'gpu'; }));

assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'new' }), ['mint']);
assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'ok' }), ['mint', 'omarchy']);
assert.deepStrictEqual(ids({ side: 'linux', role: 'server', skill: 'new', ram: 16 }), ['ubuntu']);
assert.ok(ids({ side: 'linux', role: 'server', skill: 'ok', ram: 64, job: 'movies' }).includes('proxmox'));
assert.ok(!ids({ side: 'linux', role: 'server', ram: 16 }).includes('mint'));
assert.ok(ids({ side: 'linux', role: 'server', skill: 'ok', ram: 8, job: 'smart' }).includes('alpine'));

assert.deepStrictEqual(ids({ side: 'win', role: 'everyday' }), ['win', 'winpro']);
assert.deepStrictEqual(ids({ side: 'mac', role: 'server' }), ['macmini']);
assert.ok(ids({ side: 'mac', role: 'both', skill: 'lab' }).includes('maclab'));

const mint = wiz.explain(base({ flavor: 'mint' }));
assert.strictEqual(mint.pick, 'mint');
assert.ok(mint.profile.build.includes('Friendly'));

const forced = wiz.explain(base({ side: 'linux', role: 'server', ram: 16, flavor: 'proxmox' }));
assert.strictEqual(forced.pick, 'ubuntu', 'a 16 GB closet box cannot sneak into Proxmox');

const card = wiz.explain(base({ side: 'linux', gpu: 6, flavor: 'mint' }));
assert.ok(card.hardware.models.includes('7-billion'));
assert.ok(!card.hardware.models.includes('70-billion'));

const mac = wiz.explain(base({ side: 'mac', role: 'everyday', ram: 16, flavor: 'mac' }));
assert.ok(mac.hardware.models.includes('unified memory'));
assert.ok(mac.hardware.models.toLowerCase().includes('cuda'));
assert.ok(mac.profile.next.toLowerCase().includes('next doll'));

const sheet = wiz.explain(base({ side: 'linux', role: 'server', ram: 64, skill: 'ok', job: 'movies', flavor: 'proxmox', storage: 16000 }));
assert.strictEqual(sheet.pick, 'proxmox');
assert.ok(sheet.profile.first.length >= 3);
assert.ok(sheet.hardware.storage.includes('TrueNAS') || sheet.hardware.storage.includes('16 TB'));

console.log('lab wizard tests ok');
