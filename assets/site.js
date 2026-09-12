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

  document.addEventListener('DOMContentLoaded', function () {
    initCopyButtons();
    initNavToggle();
  });
})();
