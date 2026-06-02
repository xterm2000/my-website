(function () {
  'use strict';

  // ── IP fetch ────────────────────────────────────────────────
  var ipEl = document.getElementById('visitor-ip');
  fetch('https://api.ipify.org?format=json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      ipEl.textContent = data.ip;
      ipEl.classList.add('prompt-ip--resolved');
    })
    .catch(function () { ipEl.textContent = ''; });

  // ── YAML content renderer ───────────────────────────────────
  fetch('content.yaml')
    .then(function (r) { return r.ok ? r.text() : Promise.reject('failed to load content.yaml'); })
    .then(function (text) { render(jsyaml.load(text)); })
    .catch(function (e) { console.error('content.yaml:', e); });

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function span(cls, text) {
    return '<span class="' + cls + '">' + esc(text) + '</span>';
  }

  function render(data) {
    var block = document.getElementById('yaml-content');
    var frag = document.createDocumentFragment();

    function addLine(cls, html) {
      var p = document.createElement('p');
      p.className = cls;
      p.innerHTML = html;
      frag.appendChild(p);
    }

    function addBlank() {
      var p = document.createElement('p');
      p.className = 'yaml-blank';
      frag.appendChild(p);
    }

    data.sections.forEach(function (section, i) {
      if (i > 0) addBlank();

      // Section header (one or more comment lines)
      if (section.header) {
        section.header.trim().split('\n').forEach(function (line) {
          addLine('yaml-comment', esc(line.trim()));
        });
      }

      // key: value pairs (value can be a scalar or a list)
      if (section.fields) {
        Object.entries(section.fields).forEach(function ([key, val]) {
          if (Array.isArray(val)) {
            addLine('yaml-line', span('yaml-key', key) + span('yaml-colon', ':'));
            val.forEach(function (item) {
              addLine('yaml-list', span('yaml-dash', '-') + span('yaml-list-value', ' ' + item));
            });
          } else {
            addLine('yaml-line',
              span('yaml-key', key) + span('yaml-colon', ':') + span('yaml-value', ' ' + val));
          }
        });
      }

      // List: items can be plain strings OR objects with a `fields` key
      if (section.list) {
        section.list.forEach(function (item) {
          if (typeof item === 'string') {
            addLine('yaml-list', span('yaml-dash', '-') + span('yaml-list-value', ' ' + item));
          } else if (item.fields) {
            var entries = Object.entries(item.fields);
            entries.forEach(function ([key, val], idx) {
              if (idx === 0) {
                // First field goes on the dash line:  - key: value
                addLine('yaml-list',
                  span('yaml-dash', '-') + ' ' +
                  span('yaml-key', key) + span('yaml-colon', ':') +
                  span('yaml-value', ' ' + val));
              } else {
                // Continuation fields indented to align under first key
                addLine('yaml-list-cont',
                  '  ' + span('yaml-key', key) + span('yaml-colon', ':') +
                  span('yaml-value', ' ' + val));
              }
            });
          }
        });
      }

      // Inline mapping list:  - key: value
      if (section.items) {
        section.items.forEach(function (item) {
          var key = Object.keys(item)[0];
          var val = item[key];
          addLine('yaml-list',
            span('yaml-dash', '-') + ' ' +
            span('yaml-key', key) + span('yaml-colon', ':') +
            span('yaml-value', ' ' + val));
        });
      }
    });

    block.appendChild(frag);
  }
}());
