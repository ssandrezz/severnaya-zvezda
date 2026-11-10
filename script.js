// «Северная звезда»: звонок через время, разрез 1913/1938, снег, эпоха, часы, купе на 360°,
// табло, табличка вагона, карточки, галерея. Без библиотек; звук синтезируется на месте.
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.dataset.era) root.dataset.era = 'vera';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // ---------- звук (только после нажатия) ----------
  var ctx = null, soundOn = true, hiss = null;
  function ac() {
    if (!soundOn) return null;
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function noiseBuffer(c, sec) {
    var b = c.createBuffer(1, Math.floor(c.sampleRate * sec), c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // электромеханический звонок: два тона, которые бьёт молоточек ~22 раза в секунду
  function ring(times) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + 0.02;
    for (var k = 0; k < times; k++) {
      var start = t + k * 1.0, len = 0.7;
      var out = c.createGain(); out.gain.setValueAtTime(0, start);
      out.gain.linearRampToValueAtTime(0.16, start + 0.02); out.gain.setValueAtTime(0.16, start + len - 0.08);
      out.gain.linearRampToValueAtTime(0, start + len); out.connect(c.destination);
      var am = c.createGain(); am.gain.value = 0.5; am.connect(out);
      var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 22;
      var lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
      [1046, 1318, 2093].forEach(function (f, i) {
        var o = c.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle'; o.frequency.value = f;
        var g = c.createGain(); g.gain.value = i === 2 ? 0.25 : 0.5; o.connect(g); g.connect(am);
        o.start(start); o.stop(start + len + 0.05);
      });
      lfo.start(start); lfo.stop(start + len + 0.05);
    }
  }
  function click() {
    var c = ac(); if (!c) return;
    var s = c.createBufferSource(); s.buffer = noiseBuffer(c, 0.05);
    var f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
    var g = c.createGain(); g.gain.setValueAtTime(0.35, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  function hissOn() {
    var c = ac(); if (!c || hiss) return;
    var s = c.createBufferSource(); s.buffer = noiseBuffer(c, 2); s.loop = true;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
    var g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.025, c.currentTime + 0.4);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    hiss = { s: s, g: g };
  }
  function hissOff() {
    if (!hiss || !ctx) return;
    var h = hiss; hiss = null;
    h.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    setTimeout(function () { try { h.s.stop(); } catch (e) {} }, 800);
  }
  function tick() {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 1500;
    var g = c.createGain(); g.gain.setValueAtTime(0.08, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.07);
  }
  // паровозный свисток: аккорд из трёх «труб» с лёгким дрожанием
  function whistle() {
    var c = ac(); if (!c) return;
    var t = c.currentTime + 0.02;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000;
    var g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.18);
    g.gain.setValueAtTime(0.09, t + 1.2); g.gain.linearRampToValueAtTime(0, t + 1.7);
    lp.connect(g); g.connect(c.destination);
    var vib = c.createOscillator(); vib.frequency.value = 5.5; var vg = c.createGain(); vg.gain.value = 4; vib.connect(vg);
    [370, 466, 554].forEach(function (f) {
      var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; vg.connect(o.frequency);
      o.connect(lp); o.start(t); o.stop(t + 1.8);
    });
    vib.start(t); vib.stop(t + 1.8);
    var n = c.createBufferSource(); n.buffer = noiseBuffer(c, 1.8);
    var nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900;
    var ng = c.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.03, t + 0.2); ng.gain.linearRampToValueAtTime(0, t + 1.7);
    n.connect(nf); nf.connect(ng); ng.connect(c.destination); n.start(t);
  }

  var soundBtn = $('.sound');
  if (soundBtn) soundBtn.addEventListener('click', function () {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен');
    if (!soundOn) hissOff(); else tick();
  });

  // ---------- верхняя панель ----------
  var bar = $('.bar');
  var onScroll = function () { bar.classList.toggle('is-solid', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- разрез через время ----------
  var hook = $('.hook');
  var split = { cur: 50, target: 50 };
  var pointer = { x: -999, y: -999 };
  var setSplit = function (v) { split.cur = v; hook.style.setProperty('--split', v.toFixed(2) + '%'); };
  var aimSplit = function (v) { split.target = clamp(v, 4, 96); if (reduce) setSplit(split.target); };
  (function loop() {
    if (!reduce && Math.abs(split.target - split.cur) > 0.05) setSplit(split.cur + (split.target - split.cur) * 0.12);
    requestAnimationFrame(loop);
  })();

  var dragging = false;
  var fromEvent = function (e) {
    var r = hook.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    return (pointer.x / r.width) * 100;
  };
  hook.addEventListener('pointermove', function (e) {
    var v = fromEvent(e);
    if (e.pointerType === 'mouse' || dragging) aimSplit(v);
  });
  hook.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button, a')) return;
    dragging = true; aimSplit(fromEvent(e));
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) {
    hook.addEventListener(n, function () { dragging = false; if (n === 'pointerleave') { pointer.x = -999; } });
  });

  // звонок и разговор
  var callBtn = $('.callbtn'), callLabel = $('.callbtn__label'), subs = $('.subs');
  var lines = [
    { who: 'vera', t: 'Алло? Кто на линии? Это служебный аппарат вагона.' },
    { who: 'alexey', t: 'Слышу вас. Сквозь треск, но слышу. Вы в каком вагоне?' },
    { who: 'vera', t: 'В этом же. Ночной экспресс «Северная звезда».' },
    { who: 'alexey', t: 'Я тоже в нём. А какой у вас год?' },
    { who: 'vera', t: 'Тысяча девятьсот тринадцатый.' },
    { who: 'alexey', t: '…А у меня тридцать восьмой.' },
    { who: null, t: 'Двое в одном вагоне с разницей в 25 лет. Вы не видите мир друг друга — у вас есть только голос.' }
  ];
  var step = -1, timer = null;
  var names = { vera: 'Вера, 1913', alexey: 'Алексей, 1938' };
  function say(i) {
    clearTimeout(timer);
    step = i;
    var l = lines[i];
    var p = document.createElement('p');
    p.className = 'subs__line is-new';
    if (l.who) {
      var n = document.createElement('span'); n.className = 'subs__name subs__name--' + l.who; n.textContent = names[l.who];
      p.appendChild(n);
    }
    p.appendChild(document.createTextNode(l.t));
    subs.replaceChildren(p);
    if (l.who === 'vera') aimSplit(74); else if (l.who === 'alexey') aimSplit(26); else aimSplit(50);
    if (i < lines.length - 1) {
      callLabel.textContent = 'Дальше';
      timer = setTimeout(function () { say(i + 1); }, 1700 + l.t.length * 48);
    } else {
      hissOff();
      callLabel.textContent = 'Позвонить ещё раз';
      hook.classList.remove('is-call');
      step = -1;
    }
  }
  callBtn.addEventListener('click', function () {
    if (step >= 0) { say(step + 1); return; }
    hook.classList.add('is-call');
    ring(1);
    callLabel.textContent = 'Слушайте…';
    setTimeout(function () { click(); hissOn(); say(0); }, 900);
  });

  // ---------- снег: только в 1938 году и сторонится курсора ----------
  function snow(canvas, host, opts) {
    if (!canvas || !canvas.getContext) return;
    var c2 = canvas.getContext('2d');
    var flakes = [], w = 0, h = 0, run = false, vis = true, last = 0;
    function flake(any) {
      var d = Math.random();
      return { x: Math.random() * w, y: any ? Math.random() * h : -8, r: 0.6 + d * 2.4, vy: 22 + d * 50, sw: 8 + Math.random() * 18, ph: Math.random() * 6.28, a: 0.35 + d * 0.6, vx: 0 };
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      c2.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes = []; var n = Math.min(240, Math.round(w * h / 6500));
      for (var i = 0; i < n; i++) flakes.push(flake(true));
      draw();
    }
    function draw() {
      c2.clearRect(0, 0, w, h);
      c2.save();
      if (opts.clip) { var x0 = opts.clip() * w; c2.beginPath(); c2.rect(x0, 0, w - x0, h); c2.clip(); }
      c2.fillStyle = '#eef3fb';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        c2.globalAlpha = f.a; c2.beginPath();
        c2.arc(f.x + Math.sin(f.ph + f.y * 0.012) * f.sw, f.y, f.r, 0, 6.283); c2.fill();
      }
      c2.restore();
    }
    function frame(now) {
      if (!run) return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        var dx = f.x - pointer.x, dy = f.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000 && d2 > 1) { var k = (1 - d2 / 9000) * 260 * dt; f.vx += dx / Math.sqrt(d2) * k; f.y += dy / Math.sqrt(d2) * k * 0.6; }
        f.vx *= 0.94;
        f.x += f.vx * dt * 20 - 10 * dt * (f.r / 2);
        f.y += f.vy * dt;
        if (f.y > h + 10 || f.x < -40 || f.x > w + 40) { flakes[i] = flake(false); }
      }
      draw();
      requestAnimationFrame(frame);
    }
    function start() { if (reduce || run || !vis || document.hidden) return; run = true; last = performance.now(); requestAnimationFrame(frame); }
    size();
    window.addEventListener('resize', function () { clearTimeout(size.t); size.t = setTimeout(size, 150); });
    document.addEventListener('visibilitychange', function () { document.hidden ? (run = false) : start(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; vis ? start() : (run = false); }).observe(host);
    start();
  }
  snow($('.hook__snow'), hook, { clip: function () { return split.cur / 100; } });

  // ---------- эпоха и часы ----------
  var watch = $('.watch');
  var ticks = $('.watch__ticks');
  if (ticks) {
    var ns = 'http://www.w3.org/2000/svg', roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      var ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', 100 + Math.sin(a) * 72); ln.setAttribute('y1', 140 - Math.cos(a) * 72);
      ln.setAttribute('x2', 100 + Math.sin(a) * 77); ln.setAttribute('y2', 140 - Math.cos(a) * 77);
      ticks.appendChild(ln);
      if (i % 3 === 0) {
        var tx = document.createElementNS(ns, 'text');
        tx.setAttribute('x', 100 + Math.sin(a) * 58); tx.setAttribute('y', 145 - Math.cos(a) * 58);
        tx.setAttribute('text-anchor', 'middle'); tx.textContent = roman[i];
        ticks.appendChild(tx);
      }
    }
  }
  var turns = 0;
  var hHand = $('.watch__h'), mHand = $('.watch__m'), yearText = $('.watch__year');
  var setHands = function () {
    if (!hHand) return;
    hHand.style.setProperty('--h', (305 + turns * 150) + 'deg');
    mHand.style.setProperty('--m', (60 + turns * 1800) + 'deg');
  };
  setHands();

  var eraBtns = $$('.era-switch [data-era]');
  var range = $('.compare__range');
  function setEra(era, byUser) {
    if (root.dataset.era === era && !byUser) return;
    var changed = root.dataset.era !== era;
    root.dataset.era = era;
    eraBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.era === era)); });
    if (yearText) yearText.textContent = era === 'vera' ? '1913' : '1938';
    if (watch) watch.setAttribute('aria-label', 'Переключить эпоху: сейчас ' + (era === 'vera' ? '1913' : '1938') + ' год');
    if (changed) { turns++; setHands(); }
    if (byUser) {
      root.classList.add('era-chosen');
      tick();
      if (range) animateRange(era === 'vera' ? 88 : 12);
      var r = hook.getBoundingClientRect();
      if (r.bottom > 0 && step < 0) aimSplit(era === 'vera' ? 82 : 18);
    }
  }
  eraBtns.forEach(function (b) { b.addEventListener('click', function () { setEra(b.dataset.era, true); }); });
  if (watch) watch.addEventListener('click', function () { setEra(root.dataset.era === 'vera' ? 'alexey' : 'vera', true); });

  // ---------- сравнение эпох ----------
  var stage = $('.compare__stage');
  function setPos(v) { stage.style.setProperty('--pos', v + '%'); }
  function animateRange(to) {
    var from = Number(range.value);
    if (reduce) { range.value = to; setPos(to); return; }
    var t0 = null;
    (function anim(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      var v = from + (to - from) * e; range.value = v; setPos(v);
      if (p < 1) requestAnimationFrame(anim);
    })(performance.now());
  }
  if (stage) {
    var imgA = $('.compare__img--a', stage), imgB = $('.compare__img--b', stage);
    range.addEventListener('input', function () { setPos(range.value); });
    setPos(range.value);
    var tabs = $$('.compare__tabs [role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        imgA.src = tab.dataset.a; imgB.src = tab.dataset.b;
        var name = tab.textContent.toLowerCase();
        imgA.alt = name + ', 1913 год'; imgB.alt = name + ', 1938 год';
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e, obs) {
        if (!e[0].isIntersecting) return;
        obs.disconnect();
        tabs.forEach(function (tab) { [tab.dataset.a, tab.dataset.b].forEach(function (s) { var im = new Image(); im.src = s; }); });
        if (!reduce) setTimeout(function () { animateRange(78); setTimeout(function () { animateRange(50); }, 1000); }, 300);
      }, { threshold: 0.5 }).observe(stage);
    }
  }

  // ---------- купе на 360° ----------
  var spin = $('.spin__stage');
  if (spin) {
    var N = 24, frames = [], cur = 0, used = false;
    for (var f = 0; f < N; f++) frames.push('img/kupe360/k' + (f < 10 ? '0' : '') + f + '.jpg');
    var front = $('.spin__img--front', spin), back = $('.spin__img--back', spin), compass = $('.spin__compass');
    var dirName = function (deg) {
      if (deg <= 30 || deg >= 330) return 'окно';
      if (deg < 150) return 'правый диван';
      if (deg <= 210) return 'дверь';
      return 'левый диван';
    };
    var show = function (i, fade) {
      i = ((i % N) + N) % N;
      if (i === cur) return;
      cur = i;
      if (fade && !reduce) {
        back.src = front.src;
        front.classList.add('is-instant'); front.style.opacity = '0'; front.src = frames[i];
        requestAnimationFrame(function () { requestAnimationFrame(function () { front.classList.remove('is-instant'); front.style.opacity = '1'; }); });
      } else {
        front.classList.add('is-instant'); front.style.opacity = '1'; front.src = frames[i]; back.src = frames[i];
      }
      var deg = i * 15;
      compass.style.setProperty('--yaw', deg + 'deg');
      $('.spin__needle').style.setProperty('--yaw', deg + 'deg');
      spin.setAttribute('aria-valuenow', String(deg));
      spin.setAttribute('aria-valuetext', deg + ' градусов, ' + dirName(deg));
    };
    var markUsed = function () { if (!used) { used = true; spin.classList.add('is-used'); } };
    var sx = 0, sFrame = 0, down = false;
    spin.addEventListener('pointerdown', function (e) {
      down = true; sx = e.clientX; sFrame = cur; markUsed();
      spin.classList.add('is-drag');
      try { spin.setPointerCapture(e.pointerId); } catch (er) {}
    });
    spin.addEventListener('pointermove', function (e) {
      if (!down) return;
      var per = Math.max(12, spin.clientWidth / 36);
      show(sFrame - Math.round((e.clientX - sx) / per), false);
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { spin.addEventListener(n, function () { down = false; spin.classList.remove('is-drag'); }); });
    spin.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(cur + 1, true); markUsed(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { show(cur - 1, true); markUsed(); e.preventDefault(); }
    });
    var tour = null;
    if ('IntersectionObserver' in window) {
      var loaded = false;
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && !loaded) { loaded = true; frames.forEach(function (s) { var im = new Image(); im.src = s; }); }
      }, { rootMargin: '800px 0px' }).observe(spin);
      new IntersectionObserver(function (e) {
        clearInterval(tour);
        if (e[0].isIntersecting && !reduce) tour = setInterval(function () { if (used) { clearInterval(tour); return; } show(cur + 1, true); }, 1700);
      }, { threshold: 0.4 }).observe(spin);
    }
  }

  // ---------- табло с перелистыванием ----------
  var flaps = $$('.flap');
  flaps.forEach(function (el) {
    var txt = el.dataset.flap; el.textContent = '';
    el.setAttribute('aria-label', txt);
    for (var i = 0; i < txt.length; i++) {
      var s = document.createElement('span'); s.className = 'flap__c'; s.setAttribute('aria-hidden', 'true'); s.textContent = txt[i]; el.appendChild(s);
    }
  });
  if (!reduce && flaps.length && 'IntersectionObserver' in window) {
    var pool = '0123456789ABCDEFGHIKLMNOPRSTUVXYZ';
    var spinFlaps = function () {
      flaps.forEach(function (el, n) {
        $$('.flap__c', el).forEach(function (s, k) {
          var final = el.dataset.flap[k];
          if (final === ' ') return;
          var count = 6 + n * 2 + k * 3, j = 0;
          var iv = setInterval(function () {
            s.classList.remove('is-flip'); void s.offsetWidth; s.classList.add('is-flip');
            if (++j >= count) { s.textContent = final; clearInterval(iv); }
            else s.textContent = pool[Math.floor(Math.random() * pool.length)];
          }, 55);
        });
      });
    };
    new IntersectionObserver(function (e, obs) { if (e[0].isIntersecting) { obs.disconnect(); spinFlaps(); } }, { threshold: 0.5 }).observe($('.board'));
  }

  // ---------- карточки ----------
  $$('.card').forEach(function (c) {
    c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); });
  });

  // ---------- табличка вагона ----------
  var plate = $('.plate');
  if (plate) {
    var words = ['СЕВЕРНАЯ', 'ЗВЕЗДА'];
    var holder = $('.plate__words'), movesEl = $('.plate__moves'), done = $('.plate__done');
    var state = [], picked = null, moves = 0, solved = false;
    var shuffleWord = function (w) {
      var a = w.split(''), tries = 0;
      do {
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        var right = a.filter(function (ch, k) { return ch === w[k]; }).length;
        tries++;
      } while ((a.join('') === w || right > 2) && tries < 200);
      return a;
    };
    var render = function () {
      holder.replaceChildren();
      var idx = 0;
      words.forEach(function (w) {
        // обе строки на одной сетке по длине первого слова, короткое слово по центру
        var row = document.createElement('div'); row.className = 'plate__word'; row.style.setProperty('--n', String(words[0].length));
        for (var k = 0; k < w.length; k++) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'tile';
          if (k === 0) b.style.gridColumnStart = String(1 + Math.floor((words[0].length - w.length) / 2));
          b.dataset.i = String(idx); b.textContent = state[idx];
          b.setAttribute('aria-label', 'Буква ' + state[idx] + ', место ' + (idx + 1));
          row.appendChild(b); idx++;
        }
        holder.appendChild(row);
      });
    };
    var newGame = function () {
      state = []; words.forEach(function (w) { state = state.concat(shuffleWord(w)); });
      picked = null; moves = 0; solved = false;
      movesEl.textContent = 'Ходов: 0'; done.hidden = true; plate.classList.remove('is-solved');
      render();
    };
    holder.addEventListener('click', function (e) {
      var b = e.target.closest('.tile'); if (!b || solved) return;
      var i = Number(b.dataset.i);
      if (picked === null) { picked = i; b.classList.add('is-picked'); tick(); return; }
      var pb = holder.querySelector('[data-i="' + picked + '"]');
      pb.classList.remove('is-picked');
      if (picked === i) { picked = null; return; }
      var t = state[i]; state[i] = state[picked]; state[picked] = t;
      [b, pb].forEach(function (x) {
        var k = Number(x.dataset.i); x.textContent = state[k];
        x.setAttribute('aria-label', 'Буква ' + state[k] + ', место ' + (k + 1));
        x.classList.remove('is-swap'); void x.offsetWidth; x.classList.add('is-swap');
      });
      picked = null; moves++; movesEl.textContent = 'Ходов: ' + moves; tick();
      if (state.join('') === words.join('')) {
        solved = true; plate.classList.add('is-solved'); done.hidden = false;
        movesEl.textContent = 'Собрано за ' + moves + ' ' + (moves % 10 === 1 && moves % 100 !== 11 ? 'ход' : (moves % 10 >= 2 && moves % 10 <= 4 && (moves % 100 < 10 || moves % 100 >= 20) ? 'хода' : 'ходов'));
        whistle();
      }
    });
    $('.plate__reset').addEventListener('click', newGame);
    newGame();
  }

  // ---------- увеличение кадра ----------
  var box = $('#lightbox');
  var shots = $$('.shots button');
  if (box && shots.length) {
    var bImg = $('img', box), bCap = $('figcaption', box), at = 0, opener = null;
    var showShot = function (i) {
      at = (i + shots.length) % shots.length;
      var b = shots[at];
      bImg.src = b.dataset.full; bImg.alt = $('img', b).alt; bCap.textContent = $('span', b).textContent;
    };
    var open = function (i) { opener = shots[i]; showShot(i); box.hidden = false; document.body.style.overflow = 'hidden'; $('.lightbox__close', box).focus(); };
    var close = function () { box.hidden = true; document.body.style.overflow = ''; if (opener) opener.focus(); };
    shots.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__nav--prev', box).addEventListener('click', function () { showShot(at - 1); });
    $('.lightbox__nav--next', box).addEventListener('click', function () { showShot(at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') showShot(at - 1); else if (e.key === 'ArrowRight') showShot(at + 1);
    });
    var tx0 = null;
    box.addEventListener('touchstart', function (e) { tx0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (tx0 === null) return; var dx = e.changedTouches[0].clientX - tx0; tx0 = null;
      if (Math.abs(dx) > 50) showShot(at + (dx < 0 ? 1 : -1));
    });
  }

  // ---------- появление блоков (только ниже первого экрана) ----------
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('reveal-in'); en.target.classList.remove('reveal-wait'); io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var vh = window.innerHeight;
    $$('[data-reveal]').forEach(function (el, i) {
      if (el.getBoundingClientRect().top < vh) return;
      el.classList.add('reveal-wait'); el.style.transitionDelay = ((i % 3) * 90) + 'ms'; io.observe(el);
    });
  }
})();
