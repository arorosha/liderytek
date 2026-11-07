(() => {
  'use strict';
  const D = window.EMBA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* неразрывные пробелы после коротких слов — для текстов из data.js */
  const nb = (t) => t.replace(/(^|[\s(«])(в|во|на|и|с|со|к|ко|у|о|об|а|от|до|из|по|за|не|для|что|как)\s/gi, '$1$2 ');

  /* ── шапка, активный раздел, меню ── */
  const nav = $('#nav');
  const links = $$('.nav__links a');
  const setSolid = () => nav.classList.toggle('is-solid', scrollY > 40);
  setSolid();

  const secs = links.map((a) => $(a.getAttribute('href')));
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach((s) => s && spy.observe(s));

  const burger = $('#burger'), drawer = $('#drawer');
  const toggleMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    drawer.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(drawer.hidden));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) toggleMenu(false); });

  /* ── счётчики ── */
  const runCount = (el) => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { countIO.unobserve(e.target); runCount(e.target); }
  }), { threshold: .4 });

  /* ── появление при прокрутке ── */
  const revealIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  const watchReveals = (root = document) => {
    $$('.reveal', root).forEach((el) => {
      const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--rd', Math.min(i, 5) * .07 + 's');
      revealIO.observe(el);
    });
  };


  /* ── манифест: слова проявляются по мере прокрутки ── */
  const mText = $('#manifestText'), manifest = $('#manifest'), mOrb = $('#manifestOrbits');
  const words = mText.textContent.trim().split(/ +/);
  mText.setAttribute('aria-label', mText.textContent);
  mText.innerHTML = words.map((w, i) => `<span class="w${i >= 3 ? ' key' : ''}" aria-hidden="true">${w}</span>`).join(' ');
  const wEls = $$('.w', mText);

  /* ── компас: восемь направлений и точка отсчёта; один модуль на всех элементах ── */
  const AXES = ['Точка отсчёта', 'Стратегия и развитие', 'Лидерство и люди', 'Технологии и инновации', 'Цифра и ИИ',
    'Международное сотрудничество', 'Государство и регулирование', 'ESG и устойчивое развитие', 'Результаты и эффект'];
  const dial = $('#dial'), pBody = $('#panelBody'), strip = $('#strip');
  const C = 400, R_PT = 300, R_TOP = 226, R_LOW = 237, TOP = 152;
  const IMG = 'assets/img/';
  const polar = (a, r) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
  /* нижняя половина идёт против часовой стрелки, чтобы слова не переворачивались */
  const arc = (a) => {
    const low = a > 90 && a < 270, r = low ? R_LOW : R_TOP;
    return low ? `M${polar(a + 42, r)} A${r} ${r} 0 0 0 ${polar(a - 42, r)}`
      : `M${polar(a - 42, r)} A${r} ${r} 0 0 1 ${polar(a + 42, r)}`;
  };

  let rays = '', clip = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45, long = i % 2 === 0, L = long ? 198 : 132, w = long ? 39 : 30;
    const d = `M${polar(a - 90, w)} L${polar(a, L)} L${polar(a + 90, w)} Z`;
    rays += `<path class="ray" data-ray="${i + 1}" d="${d}"/>`;
    clip += `<path d="${d}"/>`;
  }
  let svg = `<svg viewBox="0 -${TOP} 800 ${800 + TOP}" role="group" aria-label="Компас будущего: выберите модуль">
    <defs><clipPath id="roseClip">${clip}</clipPath>
      <linearGradient id="sheenFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3cf" stop-opacity="0"/><stop offset=".5" stop-color="#fff3cf" stop-opacity=".62"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></linearGradient></defs>
    <image class="bow" href="${IMG}compass-bow.webp" x="300" y="-${TOP}" width="200" height="178"/>
    <image href="${IMG}compass-dial.webp" width="800" height="800"/>
    ${rays}
    <g clip-path="url(#roseClip)"><rect class="sheen" x="60" y="150" width="130" height="500" fill="url(#sheenFill)"/></g>`;
  D.modules.slice(1).forEach((m, i) => {
    const a = i * 45, [x, y] = polar(a, R_PT);
    svg += `<g class="pt" data-m="${m.id}" tabindex="0" role="button" aria-label="${AXES[m.id]}: ${m.title}">
      <circle class="hit" cx="${x}" cy="${y}" r="62"/>
      <image class="coin" href="${IMG}coin-enamel.webp" x="${x - 39}" y="${y - 39}" width="78" height="78"/>
      <image class="coin coin--gold" href="${IMG}coin-gold.webp" x="${x - 39}" y="${y - 39}" width="78" height="78"/>
      <g class="ico" transform="translate(${x - 18} ${y - 18}) scale(1.5)">${m.icon}</g>
      <path id="lbl${m.id}" class="lbl" d="${arc(a)}"/>
      <text><textPath href="#lbl${m.id}" startOffset="50%">${m.short}</textPath></text>
    </g>`;
  });
  svg += `<g class="needleShadow"><g class="needle" id="needle"><image href="${IMG}compass-needle.webp" x="371.800" y="192.500" width="57.300" height="334.500"/></g></g>
    <g class="core" data-m="0" tabindex="0" role="button" aria-label="Модуль 0: форсайт-сессия">
      <circle class="core__ring" cx="400" cy="400" r="56"/>
      <image href="${IMG}compass-hub.webp" x="346" y="346" width="108" height="108"/>
      <text x="400" y="407">М0</text>
    </g></svg>`;
  dial.insertAdjacentHTML('beforeend', svg);
  strip.innerHTML = D.modules.map((m, i) => `<li><button type="button" data-k="${i}"><b>${m.code}</b><span>${m.when}</span></button></li>`).join('');
  const needle = $('#needle', dial), pts = $$('.pt', dial), raysEl = $$('.ray', dial), core = $('.core', dial), ticks = $$('button', strip);
  const faceRect = () => $('.dial__shadow', dial).getBoundingClientRect();

  /* блик на безеле следует за курсором */
  const glint = $('#glint');
  if (!small && !reduced) dial.addEventListener('pointermove', (e) => {
    const b = faceRect();
    const a = Math.atan2(e.clientX - b.left - b.width / 2, -(e.clientY - b.top - b.height / 2)) * 180 / Math.PI;
    glint.style.setProperty('--glint', a.toFixed(1) + 'deg');
  });

  const wide = matchMedia('(min-width: 761px)');
  wide.addEventListener('change', () => $$('.panel__more').forEach((d) => { d.open = wide.matches; }));
  const panelHTML = (m, k) => `
    <p class="panel__axis">${AXES[k]}</p>
    <h3 class="panel__title">${nb(m.title)}</h3>
    <p class="panel__meta">${m.code} · ${m.when} · ${m.place}${m.days ? ' · ' + m.days : ''}</p>
    <p class="panel__goal">${nb(m.goal)}</p>
    ${m.artefact ? `<p class="panel__line"><b>Артефакт</b>${nb(m.artefact)}</p>` : ''}
    ${m.topics ? `<details class="panel__more"${wide.matches ? ' open' : ''}><summary>Темы и треки модуля</summary>
      <ul class="panel__topics">${m.topics.map((t) => `<li>${nb(t)}</li>`).join('')}</ul>
      ${m.tracks ? `<dl class="panel__tracks">${m.tracks.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : ''}
      ${m.speakers ? `<p class="panel__line"><b>Спикеры</b>${m.speakers}</p>` : ''}
    </details>` : ''}`;

  let cur = -1, needleAngle = 0, swapT = 0;
  let shown = 0, spinRaf = 0;
  const drawNeedle = (deg) => { shown = deg; needle.setAttribute('transform', `rotate(${deg.toFixed(2)} ${C} ${C})`); };
  const setNeedle = (deg) => {
    cancelAnimationFrame(spinRaf);
    if (reduced) { drawNeedle(deg); return; }
    const from = shown, t0 = performance.now(), dur = 1150;
    const tick = (t) => {
      const p = clamp((t - t0) / dur, 0, 1), q = p - 1;
      drawNeedle(from + (deg - from) * (1 + 2.2 * q * q * q + 1.2 * q * q));   /* мягкий перелёт и возврат */
      if (p < 1) spinRaf = requestAnimationFrame(tick);
    };
    spinRaf = requestAnimationFrame(tick);
  };
  const pointNeedle = (k) => {
    if (k === 0) { needle.style.opacity = 0; return; }
    needle.style.opacity = 1;
    needleAngle += (((k - 1) * 45 - needleAngle) % 360 + 540) % 360 - 180;
    setNeedle(needleAngle);
  };
  const lightUp = (k) => {
    pts.forEach((p) => p.classList.toggle('is-on', +p.dataset.m === k));
    raysEl.forEach((r) => r.classList.toggle('is-on', +r.dataset.ray === k));
    core.classList.toggle('is-on', k === 0);
  };
  const pick = (k, first) => {
    if (k === cur) { pointNeedle(k); lightUp(k); return; }
    cur = k;
    pointNeedle(k);
    lightUp(k);
    ticks.forEach((b) => b.setAttribute('aria-current', +b.dataset.k === k));
    const t = ticks[k];
    strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduced || first ? 'auto' : 'smooth' });
    clearTimeout(swapT);
    if (first || reduced) { pBody.innerHTML = panelHTML(D.modules[k], k); return; }
    pBody.classList.add('swap');
    swapT = setTimeout(() => { pBody.innerHTML = panelHTML(D.modules[k], k); pBody.classList.remove('swap'); }, 200);
  };
  const step = (d) => pick((cur + d + 9) % 9);
  strip.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(+b.dataset.k); });
  $('#panelPrev').addEventListener('click', () => step(-1));
  $('#panelNext').addEventListener('click', () => step(1));

  /* вращение стрелки перетаскиванием */
  let dragging = false, dragMoved = false, startX = 0, startY = 0, hoverM = 0;
  dial.addEventListener('click', (e) => {
    if (dragMoved) return;
    const t = e.target.closest('[data-m]');
    if (t) pick(+t.dataset.m);
  });
  dial.addEventListener('keydown', (e) => {
    const t = e.target.closest('[data-m]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+t.dataset.m); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  });
  const angleAt = (e) => {
    const r = faceRect();
    return (Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 180 / Math.PI + 360) % 360;
  };
  dial.addEventListener('pointerdown', (e) => {
    dragging = true; dragMoved = false; startX = e.clientX; startY = e.clientY; hoverM = 0;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!dragMoved && Math.hypot(e.clientX - startX, e.clientY - startY) < 8) return;
    if (!dragMoved && e.pointerType === 'touch' && Math.abs(e.clientY - startY) > Math.abs(e.clientX - startX)) { dragging = false; return; }
    dragMoved = true;
    dial.classList.add('dragging');
    const a = angleAt(e);
    needleAngle += ((a - needleAngle) % 360 + 540) % 360 - 180;
    needle.style.opacity = 1;
    cancelAnimationFrame(spinRaf);
    drawNeedle(needleAngle);
    hoverM = Math.round(a / 45) % 8 + 1;
    lightUp(hoverM);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    dial.classList.remove('dragging');
    if (dragMoved && hoverM) pick(hoverM);
    setTimeout(() => { dragMoved = false; }, 0);
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  pick(1, true);
  new IntersectionObserver(([e]) => dial.classList.toggle('is-live', e.isIntersecting)).observe(dial);

  /* ── параллакс и прокрутка: один проход на кадр ── */
  const stage = small || reduced ? null : $('#stage');
  const fStar = reduced ? null : $('.for__star'), forSec = $('#for');
  let ticking = false;
  const onFrame = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    setSolid();
    if (stage && y < vh * 1.2) stage.style.setProperty('--py', (y * .09).toFixed(1) + 'px');
    const mr = manifest.getBoundingClientRect();
    if (mr.bottom > 0 && mr.top < vh) {
      const prog = clamp(-mr.top / Math.max(1, mr.height - vh), 0, 1);
      const on = Math.round(clamp(prog * 1.5 + .12, 0, 1) * wEls.length);
      wEls.forEach((w, i) => w.classList.toggle('on', i < on));
      if (!reduced) mOrb.style.transform = `translate(-50%,-50%) rotate(${(prog * 70).toFixed(1)}deg)`;
    }
    if (fStar) {
      const r = forSec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) fStar.style.transform = `rotate(${((r.top / vh) * -50).toFixed(1)}deg)`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  addEventListener('resize', onFrame);

  /* ── лента фотографий: начинается от края текста и уходит за правый край экрана ── */
  const track = $('#shots'), slides = $$('.shot', track), thumb = $('#shotThumb');
  const maxLeft = () => track.scrollWidth - track.clientWidth;
  const stepPx = () => slides[1].offsetLeft - slides[0].offsetLeft;
  const moveTo = (left) => track.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  const paint = () => {
    const k = track.clientWidth / track.scrollWidth, p = clamp(track.scrollLeft / Math.max(1, maxLeft()), 0, 1);
    thumb.style.setProperty('--k', (k * 100).toFixed(2) + '%');
    thumb.style.setProperty('--x', (p * (1 - k) * 100).toFixed(2) + '%');
  };
  const nextShot = (d) => {
    const left = track.scrollLeft, end = maxLeft();
    if (d > 0 && left >= end - 2) return moveTo(0);
    if (d < 0 && left <= 2) return moveTo(end);
    moveTo((Math.round(left / stepPx()) + d) * stepPx());
  };
  let shotTick = false, autoT = 0, inView = false, hover = false;
  track.addEventListener('scroll', () => {
    if (shotTick) return;
    shotTick = true;
    requestAnimationFrame(() => { shotTick = false; paint(); });
  }, { passive: true });
  addEventListener('resize', paint);
  const stopAuto = () => clearInterval(autoT);
  $('#shotPrev').addEventListener('click', () => { stopAuto(); nextShot(-1); });
  $('#shotNext').addEventListener('click', () => { stopAuto(); nextShot(1); });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); nextShot(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stopAuto(); nextShot(-1); }
  });
  /* перетаскивание мышью; на сенсорных экранах работает обычный свайп */
  let dragX = null, dragLeft = 0, dragged = false;
  track.addEventListener('pointerdown', (e) => {
    stopAuto();
    if (e.pointerType !== 'mouse') return;
    dragX = e.clientX; dragLeft = track.scrollLeft; dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    if (!dragged && Math.abs(dx) < 5) return;
    dragged = true;
    track.classList.add('dragging');
    track.scrollLeft = dragLeft - dx;
  });
  const dragEnd = () => {
    if (dragX === null) return;
    dragX = null;
    if (!dragged) return;
    moveTo(Math.min(Math.round(track.scrollLeft / stepPx()) * stepPx(), maxLeft()));
    setTimeout(() => track.classList.remove('dragging'), 500);
  };
  addEventListener('pointerup', dragEnd);
  addEventListener('pointercancel', dragEnd);
  /* неспешная смена кадров, только пока лента на экране; любое действие её выключает */
  const carousel = $('#carousel');
  carousel.addEventListener('pointerenter', () => { hover = true; });
  carousel.addEventListener('pointerleave', () => { hover = false; });
  carousel.addEventListener('focusin', () => { hover = true; });
  carousel.addEventListener('focusout', () => { hover = false; });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .5 }).observe(track);
  paint();
  if (!reduced) autoT = setInterval(() => {
    if (!inView || hover || document.hidden) return;
    nextShot(1);
  }, 5000);

  /* ── телефон: карточки листаются свайпом, под лентой — полоса прогресса ── */
  $$('.expect,.learn,.gets').forEach((box) => {
    box.insertAdjacentHTML('afterend', '<div class="swipebar" aria-hidden="true"><i></i></div>');
    const bar = box.nextElementSibling.firstElementChild;
    let tick = false;
    const draw = () => {
      tick = false;
      const k = Math.min(1, box.clientWidth / box.scrollWidth);
      const p = clamp(box.scrollLeft / Math.max(1, box.scrollWidth - box.clientWidth), 0, 1);
      bar.style.width = (k * 100).toFixed(1) + '%';
      bar.style.left = (p * (1 - k) * 100).toFixed(1) + '%';
    };
    box.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', draw);
    draw();
  });

  /* ── телефон: кнопка заявки внизу, пока форма и контакты не на экране ── */
  const mbar = $('#mbar');
  const barState = { hero: true, form: false, foot: false };
  const barPaint = () => mbar.classList.toggle('is-on', !barState.hero && !barState.form && !barState.foot);
  [['hero', '.hero'], ['form', '#apply'], ['foot', '#contacts']].forEach(([k, sel]) => {
    new IntersectionObserver(([e]) => { barState[k] = e.isIntersecting; barPaint(); }).observe($(sel));
  });

  /* ── карта выездов: координаты в системе map-dots.svg, маршрут прорисовывается при первом показе ── */
  const P = {
    tyumen: [359.7, 243.0], site: [418.4, 201.7], spb: [180.0, 107.4], moscow: [181.6, 179.4],
    yamal: [407.4, 112.6], beijing: [787.9, 396.2], shenzhen: [840.6, 607.9]
  };
  const legs = [
    ['tyumen', 'site', .14], ['site', 'spb', .1], ['spb', 'beijing', -.13], ['beijing', 'shenzhen', -.1],
    ['shenzhen', 'moscow', -.1], ['moscow', 'yamal', .12], ['yamal', 'tyumen', .16]
  ];
  const curve = ([x1, y1], [x2, y2], b) => {
    const dx = x2 - x1, dy = y2 - y1;
    return `Q${((x1 + x2) / 2 - dy * b).toFixed(1)} ${((y1 + y2) / 2 + dx * b).toFixed(1)} ${x2} ${y2}`;
  };
  const dPath = `M${P.tyumen}` + legs.map(([a, b, k]) => curve(P[a], P[b], k)).join('');
  const stopLabels = [
    { key: 'tyumen', name: 'Тюмень', tag: 'М0–М3 · М8', dx: -6, dy: 30, anchor: 'end' },
    { key: 'site', name: 'Объект ВИНК', tag: 'М3', dx: 15, dy: 6 },
    { key: 'spb', name: 'Санкт-Петербург', tag: 'М4', dx: -8, dy: small ? -32 : -16 },
    { key: 'moscow', name: 'Москва', tag: 'М6', dx: -14, dy: 8, anchor: 'end' },
    { key: 'yamal', name: 'Ямал', tag: 'М7', dx: small ? 14 : 12, dy: small ? 12 : -12 },
    { key: 'beijing', name: 'Пекин', tag: 'М5', dx: 15, dy: 6 },
    { key: 'shenzhen', name: 'Шэньчжэнь', tag: 'М5', dx: 15, dy: 6 }
  ];
  const mapSvg = $('#mapSvg');
  mapSvg.innerHTML = `<path class="rt-base" d="${dPath}"/><path class="rt-gold" id="rtGold" d="${dPath}"/>` +
    stopLabels.map((l) => {
      const [x, y] = P[l.key];
      return `<g class="stop" data-stop="${l.key}">
        <circle class="halo" cx="${x}" cy="${y}" r="13"/>
        <circle class="dot" cx="${x}" cy="${y}" r="${l.key === 'tyumen' ? 6 : 4.5}"/>
        <text x="${x + l.dx}" y="${y + l.dy}" text-anchor="${l.anchor || 'start'}">${l.name} <tspan class="m">${l.tag}</tspan></text>
      </g>`;
    }).join('');
  const routeGold = $('#rtGold'), routeLen = routeGold.getTotalLength();
  if (!reduced) {
    routeGold.style.strokeDasharray = routeLen;
    routeGold.style.strokeDashoffset = routeLen;
    new IntersectionObserver((es, o) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      routeGold.style.transition = 'stroke-dashoffset 3.2s cubic-bezier(.5,0,.2,1)';
      routeGold.style.strokeDashoffset = 0;
    }), { threshold: .3 }).observe($('#map'));
  }
  /* наведение на выезд подсвечивает его точки на карте */
  $$('.trips li').forEach((li) => {
    const on = (v) => {
      li.classList.toggle('is-on', v);
      li.dataset.stops.split(' ').forEach((k) => $(`.stop[data-stop="${k}"]`, mapSvg).classList.toggle('is-on', v));
    };
    li.addEventListener('pointerenter', () => on(true));
    li.addEventListener('pointerleave', () => on(false));
  });

  /* ── форма: письмо в почтовом клиенте ── */
  const form = $('#form'), hint = $('#formHint');
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('bad'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('input', form).forEach((i) => {
      const bad = !i.value.trim() || !i.checkValidity();
      i.closest('.field').classList.toggle('bad', bad);
      i.setAttribute('aria-invalid', bad);
      if (bad && ok) { i.focus(); ok = false; }
    });
    if (!ok) { hint.textContent = 'Проверьте выделенные поля.'; return; }
    const f = new FormData(form);
    const body = [`ФИО: ${f.get('name')}`, `Компания: ${f.get('company')}`, `Должность: ${f.get('role')}`, `E-mail: ${f.get('email')}`, `Телефон: ${f.get('phone')}`].join('\n');
    location.href = `mailto:emba@tyuiu.ru?subject=${encodeURIComponent('Заявка на программу «Лидеры ТЭК будущего»')}&body=${encodeURIComponent(body)}`;
    hint.textContent = 'Если почта открылась, проверьте письмо и отправьте его. Если нет, напишите на emba@tyuiu.ru.';
  });

  /* ── северное сияние: анимируется слой сияния с обложки, остальной кадр неподвижен ── */
  const canvas = $('#aurora'), plate = $('#coverPlate');
  const useBaked = () => { plate.src = 'assets/img/cover.webp'; canvas.remove(); };
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const startAurora = () => {
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;
uniform vec2 R;uniform float T;uniform sampler2D A;uniform sampler2D S;
float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n1(p);p=p*2.03+7.1;a*=.5;}return s;}
vec2 warp(vec2 uv,float t,float k){
 vec2 p=uv*vec2(2.4,1.7)+vec2(k*3.7,0.);
 float a=fbm(p+vec2(t*.05,-t*.03));
 float b=fbm(p*1.3+vec2(-t*.04,t*.045)+5.2);
 vec2 q=uv+vec2((a-.5)*.11,(b-.5)*.085);
 q.x+=.02*sin(uv.y*9.+t*.42+k*2.)+.009*sin(uv.x*14.-t*.33);
 q.y+=.015*sin(uv.x*7.-t*.27+k);
 return q;
}
void main(){
 vec2 uv=vec2(gl_FragCoord.x/R.x,1.-gl_FragCoord.y/R.y);
 float sky=texture2D(S,uv).r;
 vec2 q0=warp(uv,T,0.),q1=warp(uv+vec2(.014,-.012),T*.72+31.,1.);
 vec3 c=texture2D(A,q0).rgb*.88+texture2D(A,q1).rgb*.40;
 float rays=.62+.8*n1(vec2(uv.x*52.+sin(T*.09)*4.,uv.y*2.4-T*.14));
 rays*=.8+.42*n1(vec2(uv.x*17.-T*.07,uv.y*1.1+T*.05));
 float pulse=.84+.26*sin(uv.x*4.6-T*.26+sin(uv.y*3.+T*.1));
 c*=rays*pulse;
 vec3 up=vec3(0.);
 for(int i=1;i<=6;i++){float f=float(i);
  up+=texture2D(A,q0+vec2(0.,.016*f)).rgb*(1.-f/7.);}
 c+=up*.085*rays*rays;
 vec3 halo=texture2D(A,q0+vec2(.03,.0)).rgb+texture2D(A,q0-vec2(.03,.0)).rgb+texture2D(A,q0+vec2(.0,.035)).rgb+texture2D(A,q0-vec2(.0,.035)).rgb;
 c+=halo*.07;
 gl_FragColor=vec4(c*sky,1.);
}`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return useBaked();
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const texture = (img, unit, name) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.uniform1i(gl.getUniformLocation(pr, name), unit);
    };
    const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    Promise.all([load(window.EMBA_TEX.a), load(window.EMBA_TEX.s)]).then(([a, s2]) => {
      texture(a, 0, 'A'); texture(s2, 1, 'S');
      const uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T');
      const fpsGap = 1000 / (small ? 24 : 40);
      const size = () => {
        const b = canvas.getBoundingClientRect(), k = Math.min(small ? .7 : .8, 1280 / Math.max(b.width, 1));
        canvas.width = Math.max(320, b.width * k | 0);
        canvas.height = Math.max(180, b.height * k | 0);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uR, canvas.width, canvas.height);
      };
      const draw = (t) => { gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      size();
      addEventListener('resize', () => { size(); if (reduced) draw(6); });
      draw(6);
      canvas.classList.add('is-live');
      if (reduced) return;
      let visible = true, last = 0, raf = 0;
      const t0 = performance.now() - 6000;
      const loop = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        raf = requestAnimationFrame(loop);
        if (now - last < fpsGap) return;
        last = now;
        draw((now - t0) / 1000);
      };
      const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe($('.hero'));
      document.addEventListener('visibilitychange', kick);
      kick();
    }).catch(useBaked);
  };
  if (gl) startAurora(); else useBaked();

  /* ── вода: рябь смещает нижнюю часть кадра только на открытой воде, лёд и судно неподвижны ── */
  const startWater = () => {
    const cv = $('#water');
    const wg = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!wg || !window.EMBA_WATER) return cv.remove();
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;
uniform vec2 R;uniform float T;uniform sampler2D P;uniform sampler2D M;
float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n1(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float wave(vec2 p){
 float s=n1(p+vec2(T*.20,T*.34))*.55;
 s+=n1(p*2.1+vec2(-T*.29,T*.50)+3.7)*.30;
 s+=n1(p*4.3+vec2(T*.38,T*.76)+9.1)*.15;
 return s;
}
void main(){
 vec2 uv=vec2(gl_FragCoord.x/R.x,1.-gl_FragCoord.y/R.y);
 float d=max(uv.y-.03,0.)+.07;                       /* расстояние от горизонта */
 vec2 p=vec2((uv.x-.5)*6.6/d,16.*log(d));            /* волны сжимаются к горизонту */
 float e=.12,w0=wave(p);
 vec2 g=vec2(wave(p+vec2(e,0.))-w0,wave(p+vec2(0.,e))-w0)/e;
 float near=smoothstep(.02,.32,uv.y);
 vec2 off=g*vec2(.0030,.0110)*(.22+.78*d)*near;
 float m0=texture2D(M,uv).r,m1=texture2D(M,uv+off).r;
 vec3 c=texture2D(P,uv+off*m1).rgb;                  /* лёд не затекает в воду */
 float slope=g.y*.5+g.x*.18;
 c*=1.+.20*slope*near;
 float crest=clamp(g.y*.55,0.,1.);
 c+=vec3(.15,.25,.32)*crest*crest*crest*.20*near;
 float a=m0*smoothstep(.015,.10,uv.y);
 gl_FragColor=vec4(c*a,a);
}`;
    const sh = (type, src) => { const o = wg.createShader(type); wg.shaderSource(o, src); wg.compileShader(o); return o; };
    const pr = wg.createProgram();
    wg.attachShader(pr, sh(wg.VERTEX_SHADER, vs));
    wg.attachShader(pr, sh(wg.FRAGMENT_SHADER, fs));
    wg.linkProgram(pr);
    if (!wg.getProgramParameter(pr, wg.LINK_STATUS)) return cv.remove();
    wg.useProgram(pr);
    wg.bindBuffer(wg.ARRAY_BUFFER, wg.createBuffer());
    wg.bufferData(wg.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), wg.STATIC_DRAW);
    const loc = wg.getAttribLocation(pr, 'p');
    wg.enableVertexAttribArray(loc);
    wg.vertexAttribPointer(loc, 2, wg.FLOAT, false, 0, 0);
    const texture = (img, unit, name) => {
      wg.activeTexture(wg.TEXTURE0 + unit);
      wg.bindTexture(wg.TEXTURE_2D, wg.createTexture());
      wg.texImage2D(wg.TEXTURE_2D, 0, wg.RGB, wg.RGB, wg.UNSIGNED_BYTE, img);
      for (const [k, v] of [[wg.TEXTURE_WRAP_S, wg.CLAMP_TO_EDGE], [wg.TEXTURE_WRAP_T, wg.CLAMP_TO_EDGE], [wg.TEXTURE_MIN_FILTER, wg.LINEAR], [wg.TEXTURE_MAG_FILTER, wg.LINEAR]]) wg.texParameteri(wg.TEXTURE_2D, k, v);
      wg.uniform1i(wg.getUniformLocation(pr, name), unit);
    };
    const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    Promise.all([load(window.EMBA_WATER.p), load(window.EMBA_WATER.m)]).then(([photo, mask]) => {
      texture(photo, 0, 'P'); texture(mask, 1, 'M');
      const uR = wg.getUniformLocation(pr, 'R'), uT = wg.getUniformLocation(pr, 'T');
      const fpsGap = 1000 / (small ? 24 : 40);
      const size = () => {
        const b = cv.getBoundingClientRect();
        const k = Math.min(Math.min(devicePixelRatio || 1, 2), (small ? 1100 : 1920) / Math.max(b.width, 1));
        cv.width = Math.max(320, b.width * k | 0);
        cv.height = Math.max(80, b.height * k | 0);
        wg.viewport(0, 0, cv.width, cv.height);
        wg.uniform2f(uR, cv.width, cv.height);
      };
      size();
      addEventListener('resize', size);
      let visible = true, last = 0, raf = 0;
      const loop = (now) => {
        raf = 0;
        if (!visible || document.hidden) return;
        raf = requestAnimationFrame(loop);
        if (now - last < fpsGap) return;
        last = now;
        wg.uniform1f(uT, now / 1000);
        wg.drawArrays(wg.TRIANGLES, 0, 3);
      };
      const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe($('.hero'));
      document.addEventListener('visibilitychange', kick);
      kick();
      cv.classList.add('is-live');
    }).catch(() => cv.remove());
  };
  /* текстуры воды подгружаются после страницы и не задерживают первый экран */
  if (reduced) $('#water').remove();
  else {
    const tag = document.createElement('script');
    tag.src = 'js/water-tex.js';
    tag.onload = startWater;
    tag.onerror = () => $('#water').remove();
    document.body.append(tag);
  }

  watchReveals();
  $$('[data-count]').forEach((el) => countIO.observe(el));
  onFrame();
})();
