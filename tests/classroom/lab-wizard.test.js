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

const jobStep = wiz.stepsFor({}).filter(function (s) { return s.id === 'job'; })[0];
assert.strictEqual(jobStep.multi, true);
assert.ok(jobStep.choices.some(function (choice) { return choice.value === 'games'; }));
assert.ok(!wiz.stepsFor(base({ job: ['photos', 'video'] })).some(function (s) { return s.id === 'games'; }));
assert.ok(wiz.stepsFor(base({ job: ['games', 'photos'] })).some(function (s) { return s.id === 'games'; }));
assert.ok(!wiz.stepsFor({ side: 'mac' }).some(function (s) { return s.id === 'gpu'; }), 'Mac skips the NVIDIA card question');
assert.ok(wiz.stepsFor({ side: 'win' }).some(function (s) { return s.id === 'gpu'; }));

assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'new' }), ['mint']);
assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'ok' }), ['mint', 'omarchy']);
assert.deepStrictEqual(ids({ side: 'linux', role: 'server', skill: 'new', ram: 16 }), ['ubuntu']);
assert.ok(ids({ side: 'linux', role: 'server', skill: 'ok', ram: 64, job: 'movies' }).includes('proxmox'));
assert.ok(!ids({ side: 'linux', role: 'server', ram: 16 }).includes('mint'));
assert.ok(ids({ side: 'linux', role: 'server', skill: 'ok', ram: 8, job: 'smart' }).includes('alpine'));
assert.ok(!ids({ side: 'linux', role: 'server', skill: 'ok', ram: 8, job: ['smart', 'games'] }).includes('alpine'));

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

const gpuStep = wiz.stepsFor({ side: 'win' }).filter(function (s) { return s.id === 'gpu'; })[0];
assert.deepStrictEqual(gpuStep.choices.map(function (choice) { return choice.value; }).slice(0, 4), ['none', 1, 2, 4]);

const oneGig = wiz.explain(base({ side: 'win', gpu: 1, flavor: 'win' }));
assert.ok(oneGig.hardware.gpuLabel.includes('1 GB'));
assert.ok(!oneGig.hardware.models.includes('7-billion'));

const twoGig = wiz.explain(base({ side: 'win', gpu: 2, flavor: 'win' }));
assert.ok(twoGig.hardware.models.includes('2 GB cannot'));
assert.ok(twoGig.hardware.models.includes('several times'));

const fourGig = wiz.explain(base({ side: 'win', gpu: 4, flavor: 'win' }));
assert.ok(fourGig.hardware.gpuLabel.includes('3 or 4'));
assert.ok(fourGig.hardware.models.includes('does not fit'));

const mac = wiz.explain(base({ side: 'mac', role: 'everyday', ram: 16, flavor: 'mac' }));
assert.ok(mac.hardware.models.includes('unified memory'));
assert.ok(mac.hardware.models.toLowerCase().includes('cuda'));
assert.ok(mac.profile.next.toLowerCase().includes('next doll'));

const many = wiz.explain(base({ job: ['games', 'photos'], storage: 16000, role: 'server', flavor: 'ubuntu' }));
assert.deepStrictEqual(many.jobs, ['Games', 'Photos']);

const sheet = wiz.explain(base({ side: 'linux', role: 'server', ram: 64, skill: 'ok', job: ['movies', 'games'], flavor: 'proxmox', storage: 16000 }));
assert.strictEqual(sheet.pick, 'proxmox');
assert.ok(sheet.profile.first.length >= 3);
assert.ok(sheet.hardware.storage.includes('TrueNAS') || sheet.hardware.storage.includes('16 TB'));

console.log('lab wizard tests ok');
