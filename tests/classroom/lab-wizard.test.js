'use strict';

const assert = require('assert');
const wiz = require('../../classroom/modules/00-pick-your-lab/wizard.js');

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
assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'new', job: ['games'] }), ['bazzite', 'mint']);
assert.deepStrictEqual(ids({ side: 'linux', role: 'everyday', skill: 'ok', job: ['games'] }), ['bazzite', 'mint', 'omarchy']);
assert.ok(!ids({ side: 'linux', role: 'server', ram: 64, job: ['games', 'movies'] }).includes('bazzite'));
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

const winPlan = wiz.explain(base({ side: 'win', role: 'everyday', job: ['games', 'movies'], flavor: 'win', gpu: 8 }));
assert.ok(winPlan.plan.use.includes('product key'));
assert.ok(winPlan.plan.use.includes('without activation'));
assert.ok(winPlan.plan.now.some(function (line) { return line.includes('Steam'); }));
assert.ok(winPlan.plan.now.some(function (line) { return line.includes('Jellyfin or Plex'); }));
assert.ok(winPlan.plan.keep.includes('Lite'));
assert.ok(winPlan.plan.keep.includes('does not install Plex'));
assert.ok(winPlan.plan.path.some(function (line) { return line.includes('OtaconsKeep Lite'); }));
assert.ok(winPlan.plan.guides.some(function (item) { return item.href.indexOf('youtu.be/OitYjPlbTng') !== -1; }));
assert.ok(winPlan.plan.guides.some(function (item) { return item.href.indexOf('wiki.servarr.com') !== -1; }));
assert.ok(winPlan.plan.lessons.filter(function (item) { return item.title.indexOf('Ollama') !== -1; })[0].steps.length >= 4);
assert.ok(winPlan.plan.lessons.some(function (item) { return item.title.indexOf('Piper') !== -1 && item.paragraphs.join(' ').indexOf('two different jobs') !== -1; }));
assert.ok(winPlan.plan.lessons.some(function (item) { return item.title.indexOf('Prowlarr') !== -1; }));
assert.ok(winPlan.plan.lessons.some(function (item) { return item.steps.join(' ').indexOf('OTACON IS READY') !== -1; }));

const gameLinux = wiz.explain(base({ side: 'linux', role: 'everyday', job: ['games'], skill: 'new', gpu: 8 }));
assert.strictEqual(gameLinux.pick, 'bazzite');
assert.ok(gameLinux.plan.use.includes('Bazzite'));
assert.ok(gameLinux.plan.use.includes('NVIDIA'));

const brain = wiz.explain(base({ side: 'linux', role: 'server', ram: 64, skill: 'ok', job: ['movies', 'ai', 'smart'], flavor: 'proxmox', storage: 16000, gpu: 8 }));
assert.strictEqual(brain.pick, 'proxmox');
assert.ok(brain.plan.setup.some(function (line) { return line.includes('Leave 8 GB'); }));
assert.ok(brain.plan.now.some(function (line) { return line.includes('Jellyfin or Plex'); }));
assert.ok(brain.plan.now.some(function (line) { return line.includes('Ollama'); }));
assert.ok(brain.plan.now.some(function (line) { return line.includes('Home Assistant'); }));
assert.ok(brain.plan.keep.includes('Do not install OtaconsKeep Lite on the Proxmox host'));

const desk = wiz.explain(base({ side: 'linux', role: 'everyday', skill: 'ok', job: ['learn'], flavor: 'omarchy' }));
assert.strictEqual(desk.pick, 'omarchy');
assert.ok(desk.plan.use.includes('good daily Linux desk'));
assert.ok(desk.plan.guides.some(function (item) { return item.href.indexOf('omarchy.org') !== -1; }));
assert.ok(desk.plan.guides.some(function (item) { return item.href.indexOf('ollama.com') !== -1; }));
assert.ok(desk.plan.guides.some(function (item) { return item.href.indexOf('github.com/rhasspy/piper') !== -1; }));
assert.ok(desk.plan.guides.some(function (item) { return item.href.indexOf('wiki.servarr.com') !== -1; }));
assert.ok(desk.plan.path.some(function (line) { return line.includes('Prowlarr'); }));

const tiny = wiz.explain(base({ side: 'win', role: 'everyday', job: ['ai'], flavor: 'win', gpu: 1, ram: 16 }));
assert.ok(tiny.plan.later.some(function (line) { return line.startsWith('Ollama'); }));
assert.ok(!tiny.plan.now.some(function (line) { return line.startsWith('Ollama'); }));

const deep = wiz.explain(base({ side: 'linux', role: 'everyday', job: ['games'], skill: 'ok', gpu: 8, flavor: 'bazzite' }));
assert.ok(deep.plan.advanced.some(function (item) { return item.title.indexOf('Proton') !== -1 && item.paragraphs.join(' ').indexOf('opt-in') !== -1; }));
assert.ok(deep.plan.advanced.some(function (item) { return item.paragraphs.join(' ').indexOf('Nouveau') !== -1; }));
assert.ok(deep.plan.advanced.some(function (item) { return item.paragraphs.join(' ').indexOf('Red Plus') !== -1 && item.paragraphs.join(' ').indexOf('SMR') !== -1; }));
assert.ok(deep.plan.advanced.some(function (item) { return item.paragraphs.join(' ').indexOf('IP hash') !== -1 && item.paragraphs.join(' ').indexOf('LACP') !== -1; }));
const adam = deep.plan.advanced.filter(function (item) { return item.title.indexOf('Adam') !== -1; })[0];
assert.ok(adam.paragraphs.join(' ').indexOf('not a setting inside Ollama') !== -1);
assert.ok(adam.paragraphs.join(' ').indexOf('0.999') !== -1);
assert.ok(adam.paragraphs.join(' ').indexOf('m-hat') !== -1);
assert.ok(deep.plan.advanced.some(function (item) {
  return item.paragraphs.join(' ').indexOf('exp(z_i / T)') !== -1 && item.paragraphs.join(' ').indexOf('0.87') !== -1;
}));
assert.ok(deep.plan.advanced.some(function (item) {
  var text = item.paragraphs.join(' ');
  return text.indexOf('num_ctx') !== -1 && text.indexOf('2048') !== -1 && text.indexOf('0.045') !== -1;
}));
assert.ok(deep.plan.advanced.some(function (item) {
  var text = item.paragraphs.join(' ') + ' ' + (item.steps || []).join(' ');
  return text.indexOf('ollama create') !== -1 && text.indexOf('SYSTEM') !== -1 && text.indexOf('few-shot') !== -1;
}));
assert.ok(deep.plan.advanced.some(function (item) { return item.paragraphs.join(' ').indexOf('802.3at') !== -1; }));

function walkTree(node, acc) {
  acc.push(node);
  (node.children || []).forEach(function (child) { walkTree(child, acc); });
  return acc;
}
const lab = wiz.labBreakdown(base({ side: 'linux', role: 'server', job: ['files'], ram: 32, storage: 8000, flavor: 'proxmox', skill: 'ok' }));
assert.strictEqual(lab.level, 'L1');
assert.strictEqual(lab.title, 'Your lab');
assert.ok(lab.children.some(function (child) { return child.title === 'Compute'; }));
assert.ok(lab.children.some(function (child) { return child.title === 'Storage'; }));
const labNames = walkTree(lab, []).map(function (node) { return node.title; }).join(' ');
const rank = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
function assertLevels(node) {
  (node.children || []).forEach(function (child) {
    assert.strictEqual(rank[child.level], rank[node.level] + 1, node.title + ' to ' + child.title);
    var levels = {};
    node.children.forEach(function (peer) { levels[peer.level] = true; });
    assert.strictEqual(Object.keys(levels).length, 1, node.title + ' peers');
    assertLevels(child);
  });
}
assertLevels(lab);
const hypervisor = walkTree(lab, []).filter(function (node) { return node.title === 'Hypervisor'; })[0];
assert.ok(hypervisor);
assert.strictEqual(hypervisor.level, 'L4');
assert.ok(hypervisor.children.some(function (child) { return child.title === 'Proxmox VE' && child.level === 'L5' && child.line.indexOf('virtual computers') !== -1; }));
assert.ok(labNames.indexOf('Windows') === -1);
const drives = walkTree(lab, []).filter(function (node) { return node.title === 'Hard drives'; })[0];
assert.strictEqual(drives.level, 'L4');
assert.ok(drives.children[0].sections.some(function (item) { return item.name === 'Trade study' && item.study.decision.indexOf('IronWolf') !== -1; }));
const aiLab = wiz.labBreakdown(base({ side: 'linux', role: 'everyday', job: ['ai'], flavor: 'mint' }));
assertLevels(aiLab);
const ollama = walkTree(aiLab, []).filter(function (node) { return node.title === 'Ollama'; })[0];
assert.strictEqual(ollama.level, 'L5');
assert.strictEqual(ollama.kind, 'free-software');
assert.ok(!ollama.sections.some(function (item) { return item && item.slot === 'buy'; }));
assert.strictEqual(lab.model.gateway.decision, 'OPNsense appliance');
assert.ok(lab.model.gateway.rows.some(function (row) { return row.name === 'OPNsense appliance' && row.score > 0; }));
const tightLab = wiz.labBreakdown(base({ side: 'linux', role: 'server', job: ['files', 'smart'], ram: 32, storage: 8000, flavor: 'proxmox', skill: 'new', budget: 200 }));
assert.ok(tightLab.model.conflict);
assert.ok(tightLab.model.conflict.minimum > 200);
assert.ok(tightLab.model.conflict.lines.join(' ').indexOf('cannot be built') !== -1);
assert.strictEqual(tightLab.model.gateway.decision, 'TP-Link Omada gateway');
assert.strictEqual(tightLab.model.gateway.ideal, 'UniFi Dream Machine Pro');
assert.ok(tightLab.model.forecast.some(function (rung) { return rung.spend === 350 && rung.fits === false && rung.line.indexOf('UniFi') !== -1; }));
assert.ok(tightLab.model.forecast.some(function (rung) { return rung.spend === 150 && rung.fits === true && rung.line.indexOf('Omada') !== -1; }));
assert.ok(tightLab.model.forecast.some(function (rung) { return rung.spend === 200 && rung.line.indexOf('closed until you can fix') !== -1; }));
assert.strictEqual(tightLab.model.switchPick.decision, 'Managed PoE');
assert.strictEqual(tightLab.sheet.klass, 'Closet server');
assert.ok(tightLab.sheet.slots.some(function (slot) { return slot.slot === 'CPU' && slot.item.indexOf('7600') !== -1 && slot.status === 'recommended'; }));
assert.ok(!walkTree(tightLab, []).filter(function (node) { return node.title.indexOf('7600') !== -1; })[0].selected);
assert.ok(tightLab.model.recommended > 200);
assert.ok(tightLab.sheet.slots.some(function (slot) { return slot.slot === 'Gateway' && slot.item.indexOf('Omada') !== -1; }));
assert.ok(tightLab.sheet.slots.some(function (slot) { return slot.slot === 'Wi-Fi' && slot.noteOnly; }));
assert.ok(tightLab.sheet.priceNote.indexOf('do not change when a store changes its price') !== -1);
assert.strictEqual(tightLab.model.switchPick.demand.poeClients, 1);
assert.strictEqual(tightLab.model.switchPick.demand.poeWatts, 15.4);
assert.ok(tightLab.model.switchPick.demand.ports >= 3);
assert.ok(tightLab.model.switchPick.demand.lines.join(' ').indexOf('Cameras are not in this count') !== -1);
assert.strictEqual(tightLab.model.fit.tone, 'go');
assert.strictEqual(tightLab.model.fit.cpu.name, 'AMD Ryzen 5 7600');
assert.ok(walkTree(tightLab, []).some(function (node) { return node.title === 'AMD Ryzen 5 7600' && node.level === 'L5'; }));
assert.ok(walkTree(tightLab, []).some(function (node) { return node.title === 'Managed PoE' && node.line.indexOf('15.4') !== -1; }));
assert.strictEqual(lab.model.raid.pick, 'Mirror pairs');
assert.strictEqual(lab.model.raid.disks, 2);
const big = wiz.labBreakdown(base({ side: 'linux', role: 'server', job: ['files'], storage: 16000, ram: 32, flavor: 'proxmox', skill: 'ok' }));
assert.strictEqual(big.model.raid.pick, 'RAIDZ2');
assert.strictEqual(big.model.raid.disks, 4);
assert.ok(big.model.summary.join(' ').indexOf('class floor') !== -1);
const deskLab = wiz.labBreakdown(base({ side: 'win', role: 'everyday', job: ['games'], flavor: 'win' }));
assertLevels(deskLab);
const deskNames = walkTree(deskLab, []).map(function (node) { return node.title; }).join(' ');
assert.ok(deskNames.indexOf('Windows 11 Home') !== -1);
assert.ok(deskNames.indexOf('Proxmox') === -1);
const shop = wiz.topicBoard(base({ side: 'linux', role: 'everyday', job: ['ai', 'games'], gpu: 8, games: 'aaa' }));
assert.ok(shop.topics.some(function (topic) { return topic.id === 'ai' && topic.tone === 'go' && topic.covers.indexOf('Local AI') !== -1; }));
assert.ok(shop.topics.some(function (topic) { return topic.id === 'games' && topic.tone === 'wait' && topic.covers.indexOf('Games') !== -1; }));
assert.ok(shop.extras.some(function (item) { return item.name === 'NAS'; }));
const shelf = wiz.topicBoard(base({ job: ['files'], storage: 8000 }));
const storageTopic = shelf.topics.filter(function (topic) { return topic.id === 'storage'; })[0];
assert.ok(storageTopic.layers.map(function (layer) { return layer.name; }).join(' ').indexOf('SSD and hard drive') !== -1);
assert.ok(storageTopic.layers.some(function (layer) { return layer.name.indexOf('NAS') !== -1 && layer.lines.join(' ').indexOf('separate shelf') !== -1; }));
assert.ok(storageTopic.layers.some(function (layer) { return layer.name.indexOf('M.2') !== -1; }));
const nasAid = shelf.extras.filter(function (item) { return item.name === 'NAS'; })[0];
assert.ok(nasAid.layers.some(function (layer) { return layer.name === 'How to hook it in'; }));
assert.ok(nasAid.layers.some(function (layer) { return layer.name === 'Best price, and why' && layer.lines.join(' ').indexOf('CMR') !== -1 && layer.lines.join(' ').indexOf('does not invent') !== -1; }));
assert.ok(shelf.extras.some(function (item) { return item.name === 'UPS' && item.layers.some(function (layer) { return layer.name === 'Best price, and why'; }); }));
const smallFiles = wiz.topicBoard(base({ job: ['files'], storage: 256 }));
assert.ok(smallFiles.topics.filter(function (topic) { return topic.id === 'storage'; })[0].layers[0].lines.join(' ').indexOf('system disk') !== -1);
const clash = wiz.checkParts({ cpu: 'r5-7600', board: 'b550', ram: 'd5-32', gpu: 'none', psu: 'p650', case: 'atx' });
assert.strictEqual(clash.tone, 'stop');
const fit = wiz.checkParts({ cpu: 'r5-7600', board: 'b650', ram: 'd5-32', gpu: 'g12', psu: 'p750', case: 'atx' });
assert.strictEqual(fit.tone, 'go');
const picture = wiz.checkParts({ cpu: 'r5-7600', board: 'b650', ram: 'd5-32', gpu: 'none', psu: 'p650', case: 'atx' });
assert.strictEqual(picture.tone, 'go');
const noPicture = wiz.checkParts({ cpu: 'i5-12400f', board: 'b760-d5', ram: 'd5-32', gpu: 'none', psu: 'p750', case: 'atx' });
assert.strictEqual(noPicture.tone, 'stop');
const tight = wiz.checkParts({ cpu: 'r5-7600', board: 'b650', ram: 'd4-32', gpu: 'none', psu: 'p650', case: 'atx' });
assert.strictEqual(tight.tone, 'stop');

const emptyBuild = wiz.settleBuild(tightLab, { version: 1, items: {} });
assert.strictEqual(emptyBuild.actualBuild.items.length, 0);
assert.ok(emptyBuild.recommendedBuild.items.some(function (item) { return item.title.indexOf('7600') !== -1 && item.state === 'recommended'; }));
assert.strictEqual(emptyBuild.budget.known, 0);
assert.strictEqual(emptyBuild.budget.unpriced, 0);
assert.strictEqual(emptyBuild.budget.status, 'complete');
assert.ok(emptyBuild.budget.line.indexOf('Known remaining') === 0);
assert.ok(emptyBuild.readiness.missing.indexOf('CPU') !== -1);
assert.ok(emptyBuild.readiness.unresolved.indexOf('Backup target not equipped') !== -1);
assert.ok(emptyBuild.readiness.percent < 100);

const unpriced = wiz.settleBuild(tightLab, { version: 1, items: { 'drive-pick': { state: 'equipped', quantity: 1, actual: null } } });
assert.strictEqual(unpriced.budget.unpriced, 1);
assert.strictEqual(unpriced.budget.known, 0);
assert.strictEqual(unpriced.budget.status, 'incomplete');
assert.ok(unpriced.budget.line.indexOf('At least $') === 0);
assert.ok(unpriced.budget.line.indexOf('not yet priced') !== -1);
assert.ok(unpriced.budget.line.indexOf('Known remaining') === -1);
assert.ok(unpriced.actualBuild.items.some(function (item) { return item.id === 'drive-pick' && item.state === 'equipped'; }));
assert.ok(!unpriced.recommendedBuild.items.some(function (item) { return item.id === 'drive-pick'; }));

const cpu = walkTree(tightLab, []).filter(function (node) { return node.title.indexOf('7600') !== -1; })[0];
const equippedCpu = wiz.settleBuild(tightLab, { version: 1, items: { [cpu.id]: { state: 'equipped', quantity: 1, actual: null } } });
assert.ok(equippedCpu.budget.known >= 100);
assert.strictEqual(equippedCpu.budget.unpriced, 0);
assert.strictEqual(equippedCpu.budget.status, 'complete');
assert.ok(equippedCpu.readiness.missing.indexOf('CPU') === -1);
const ownedCpu = wiz.settleBuild(tightLab, { version: 1, items: { [cpu.id]: { state: 'owned', quantity: 1, actual: null } } });
assert.strictEqual(ownedCpu.budget.known, 0);
assert.strictEqual(ownedCpu.budget.unpriced, 0);
assert.ok(ownedCpu.actualBuild.items.some(function (item) { return item.id === cpu.id && item.state === 'owned'; }));
const restored = wiz.settleBuild(tightLab, { version: 1, name: 'PROJECT WARDEN', items: { [cpu.id]: { state: 'owned', quantity: 1, actual: null }, 'drive-pick': { state: 'equipped', quantity: 1, actual: 180 } } });
assert.strictEqual(restored.name, 'PROJECT WARDEN');
assert.strictEqual(restored.budget.known, 180);
assert.strictEqual(restored.budget.unpriced, 0);
assert.strictEqual(restored.budget.status, 'complete');

console.log('lab wizard tests ok');
