(function () {
  'use strict';

  // Copy-to-clipboard for every [data-copy-target] button.
  function initCopyButtons() {
    var buttons = document.querySelectorAll('[data-copy-target]');
    buttons.forEach(function (btn) {
      var targetId = btn.getAttribute('data-copy-target');
      var target = document.getElementById(targetId);
      if (!target) return;

      btn.addEventListener('click', function () {
        var text = target.textContent.replace(/\s+\\\s*\n\s*/g, ' \\\n').trim();
        var original = btn.textContent;

        function settle(ok) {
          btn.textContent = ok ? 'Copied' : 'Select & copy manually';
          btn.classList.toggle('copy-fail', !ok);
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove('copy-fail');
          }, 1800);
        }

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(target.textContent.trim()).then(
              function () { settle(true); },
              function () { settle(false); }
            );
          } else {
            settle(false);
          }
        } catch (err) {
          settle(false);
        }
      });
    });
  }

  // Mobile nav toggle.
  function initNavToggle() {
    var toggle = document.querySelector('.navtoggle');
    var links = document.querySelector('.navlinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------------- Inside the Keep: gallery + lightbox + tour ----------------

  var GALLERY_DATA = [
    { slug: 'loading-room', title: 'Entering the Keep', caption: 'A boot sequence with real continuity and atmosphere, not just a spinner.' },
    { slug: 'war-room-1', title: 'War Room: Situation View', caption: 'Commander-level awareness of active operations, decisions and outcomes.' },
    { slug: 'war-room-2', title: 'War Room: Operational Detail', caption: 'Live operational picture: discoveries, active work, and outcomes in one surface.' },
    { slug: 'project-rex-board', title: 'Project REX', caption: 'From proposal to approval, execution, verification and tracked outcome.' },
    { slug: 'video-studio', title: 'Production Studio', caption: 'Local AI production, GPU jobs, media generation and workflow control.' },
    { slug: 'module-entry-video-studio', title: 'Production Studio: Module Entry', caption: 'Where an AI media-production job begins.' },
    { slug: 'module-tuning-video-studio', title: 'Production Studio: Model Tuning', caption: 'Real controls over module and model parameters, not just a generate button.' },
    { slug: 'albedo-room', title: 'Albedo’s Lair', caption: 'A themed governance and media-curation room built around one agent’s personality.' },
    { slug: 'albedo-dossier-1', title: 'Albedo: Personnel Dossier', caption: 'Persistent identity and role record for an individual agent.' },
    { slug: 'albedo-dossier-2', title: 'Albedo: Detailed Dossier', caption: 'A deeper look at how the Keep tracks agent state over time.' },
    { slug: 'codec-1', title: 'Codec: Ecosystem Cockpit', caption: 'Voice, TTS and agent routing in one communications cockpit.' },
    { slug: 'codec-2', title: 'Codec: Live Conversation', caption: 'The actual interaction experience behind a Codec call.' },
    { slug: 'foxdie', title: 'FOXDIE: Media Integrity', caption: 'Autonomous duplicate detection and quarantine across the media library.' },
    { slug: 'greyfox', title: 'Gray Fox: Systems Health', caption: 'CPU, RAM, storage pressure and bottlenecks as an agent’s domain.' },
    { slug: 'mantis-automation-builder', title: 'Home Automation: Visual Builder', caption: 'Drag-and-drop automation authoring across hundreds of real devices.' },
    { slug: 'mantis-automation', title: 'Home Automation: Control', caption: 'The broader automation interface behind a single agent’s domain.' },
    { slug: 'mantis-room', title: 'Psycho Mantis: Automation Room', caption: 'Character identity paired with a functional automation domain.' },
    { slug: 'relationships-1', title: 'Agent Relationships', caption: 'Persistent relationship state between agents and the operator.' },
    { slug: 'relationships-2', title: 'Relationship Dynamics', caption: 'How agents’ regard for each other evolves instead of resetting.' },
    { slug: 'more-agent-rooms', title: 'A Keep Full of Agents', caption: 'Many persistent personas, each with its own room and responsibility.' },
    { slug: 'sniperwolf-room', title: 'Sniper Wolf: Agent Room', caption: 'An immersive, persistent persona with its own presentation.' },
    { slug: 'meiling-room', title: 'Mei Ling: Operations Room', caption: 'Tied directly to file integrity, backups and schedules, not decorative.' },
    { slug: 'nastasha-room', title: 'Nastasha Romanenko: Agent Room', caption: 'Another persistent character occupying its own visual space.' },
    { slug: 'johnny-quickhands', title: 'Johnny Quickhands: Agent Room', caption: 'An independently styled agent space with its own identity.' },
    { slug: 'johnny-2', title: 'Johnny Quickhands: Live Interaction', caption: 'Proof these rooms are functioning interfaces, not static cards.' },
    { slug: 'agent-room-halister', title: 'Halister Blackcloak: Agent Room', caption: 'A dedicated visual environment for an individual persona.' },
    { slug: 'snake-security', title: 'Solid Snake: Security Operations', caption: 'Vulnerabilities, CVEs, patching and firewall posture as a named domain.' },
    { slug: 'agent-report', title: 'Agent Operational Report', caption: 'What an agent owns, is doing, and the state of its responsibilities.' },
    { slug: 'agent-reporting', title: 'Agent Reporting System', caption: 'Structured status and activity across Keep personnel.' },
    { slug: 'dossier-2', title: 'Personnel Dossier System', caption: 'Structured agent records that live outside the chat session.' },
    { slug: 'dossier-3', title: 'Agent Identity & Role Records', caption: 'Agents modeled as members of an organization, not a dropdown list.' },
    { slug: 'dossier-4', title: 'Keep Roster Intelligence', caption: 'The scale of structured information the Keep maintains per agent.' },
    { slug: 'cli-runner', title: 'Keep CLI Runner', caption: 'Real operator tooling for controlled technical execution.' },
    { slug: 'monolith-editor', title: 'Monolith Editor', caption: 'Built-in tooling for evolving the environment itself.' },
    { slug: 'otacons-myspace', title: 'Otacon MySpace: Social Layer', caption: 'A persistent, retro social world the agents participate in.' },
    { slug: 'otacons-myspace-posts', title: 'Agent Social Posts', caption: 'Persistent agent voice and output outside direct prompts.' },
    { slug: 'fitness-ai', title: 'AI Fitness Control Room', caption: 'Workout tracking, progression and AI coaching in one panel.' }
  ];

  var FEATURED_SLUGS = [
    'loading-room', 'war-room-1', 'project-rex-board', 'video-studio',
    'albedo-room', 'codec-1', 'foxdie', 'mantis-automation-builder',
    'relationships-1', 'more-agent-rooms'
  ];

  var TOUR_STEPS = [
    { slug: 'loading-room', label: '01 ENTERING' },
    { slug: 'war-room-1', label: '02 WAR ROOM' },
    { slug: 'project-rex-board', label: '03 REX' },
    { slug: 'video-studio', label: '04 PRODUCTION' },
    { slug: 'more-agent-rooms', label: '05 AGENT ROOMS' },
    { slug: 'mantis-automation-builder', label: '06 AUTOMATION' },
    { slug: 'codec-1', label: '07 CODEC' }
  ];

  function imgPath(slug) { return 'assets/img/keep/' + slug + '.webp'; }
  function findItem(slug) {
    for (var i = 0; i < GALLERY_DATA.length; i++) if (GALLERY_DATA[i].slug === slug) return i;
    return -1;
  }

  function galleryCardHTML(item, idx) {
    return (
      '<button type="button" class="gallery-item" data-idx="' + idx + '">' +
        '<span class="thumb-wrap">' +
          '<img src="' + imgPath(item.slug) + '" alt="' + item.title + ': real screenshot from the Otaconskeep reference Keep" loading="lazy">' +
          '<span class="gtag">Reference Keep</span>' +
        '</span>' +
        '<span class="gbody">' +
          '<h4>' + item.title + '</h4>' +
          '<p>' + item.caption + '</p>' +
        '</span>' +
      '</button>'
    );
  }

  function initGalleries() {
    var featuredEl = document.getElementById('gallery-featured');
    var fullEl = document.getElementById('gallery-full');
    if (!featuredEl && !fullEl) return;

    if (featuredEl) {
      featuredEl.innerHTML = FEATURED_SLUGS.map(function (slug) {
        var idx = findItem(slug);
        return galleryCardHTML(GALLERY_DATA[idx], idx);
      }).join('');
    }

    if (fullEl) {
      fullEl.innerHTML = GALLERY_DATA.map(function (item, idx) {
        return galleryCardHTML(item, idx);
      }).join('');
    }

    initLightbox();
  }

  function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var imgEl = lb.querySelector('.lightbox-inner img');
    var titleEl = lb.querySelector('.lightbox-caption h4');
    var capEl = lb.querySelector('.lightbox-caption p');
    var current = 0;

    function show(idx) {
      current = (idx + GALLERY_DATA.length) % GALLERY_DATA.length;
      var item = GALLERY_DATA[current];
      imgEl.src = imgPath(item.slug);
      imgEl.alt = item.title;
      titleEl.textContent = item.title;
      capEl.textContent = item.caption;
    }

    document.querySelectorAll('.gallery-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(parseInt(btn.getAttribute('data-idx'), 10));
        lb.classList.add('open');
      });
    });

    lb.querySelector('.lightbox-close').addEventListener('click', function () {
      lb.classList.remove('open');
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) lb.classList.remove('open');
    });
    lb.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  function initTour() {
    var stepsEl = document.getElementById('tour-steps');
    var stageImg = document.getElementById('tour-stage-img');
    var stageNum = document.getElementById('tour-step-num');
    var stageTitle = document.getElementById('tour-step-title');
    var stageCaption = document.getElementById('tour-step-caption');
    if (!stepsEl || !stageImg) return;

    stepsEl.innerHTML = TOUR_STEPS.map(function (step, i) {
      return '<button type="button" class="tour-step' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + step.label + '</button>';
    }).join('');

    function activate(i) {
      var step = TOUR_STEPS[i];
      var item = GALLERY_DATA[findItem(step.slug)];
      stageImg.src = imgPath(step.slug);
      stageImg.alt = item.title;
      stageNum.textContent = step.label;
      stageTitle.textContent = item.title;
      stageCaption.textContent = item.caption;
      stepsEl.querySelectorAll('.tour-step').forEach(function (btn, idx) {
        btn.classList.toggle('active', idx === i);
      });
    }

    stepsEl.querySelectorAll('.tour-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activate(parseInt(btn.getAttribute('data-i'), 10));
      });
    });

    activate(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCopyButtons();
    initNavToggle();
    initGalleries();
    initTour();
  });
})();
