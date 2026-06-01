(function () {
  'use strict';

  const ipEl = document.getElementById('visitor-ip');

  fetch('https://api.ipify.org?format=json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      ipEl.textContent = data.ip;
      ipEl.classList.add('prompt-ip--resolved');
    })
    .catch(function () {
      ipEl.textContent = '';
    });
}());
