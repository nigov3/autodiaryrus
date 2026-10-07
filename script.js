/* ============================================================
   GARAGE · standalone MVP (vanilla JS)
   Разделы: Главная (онбординг по VIN) · Дашборд · Дневник расходов
   Данные: localStorage. Без сборки — просто открой index.html.
   ============================================================ */
'use strict';

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ₽';
const num = (n, d = 1) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: d }).format(n);
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const fmtDate = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso) => iso.slice(0, 7);

/* ---------------- categories ---------------- */
const CATS = [
  { id: 'fuel',      name: 'Топливо',    icon: '⛽', color: '#FF6B35' },
  { id: 'maint',     name: 'ТО',         icon: '🛠', color: '#00D6FF' },
  { id: 'repair',    name: 'Ремонт',     icon: '🔧', color: '#FF3B5C' },
  { id: 'insurance', name: 'Страховка',  icon: '🛡', color: '#8B5CF6' },
  { id: 'tax',       name: 'Налог',      icon: '🏛', color: '#FFB800' },
  { id: 'wash',      name: 'Мойка',      icon: '💧', color: '#00D68F' },
  { id: 'parking',   name: 'Парковка',   icon: '🅿️', color: '#0066FF' },
  { id: 'tuning',    name: 'Тюнинг',     icon: '⚡', color: '#F472B6' },
];
const catById = (id) => CATS.find(c => c.id === id) || CATS[0];

/* ---------------- VIN decoder (demo) ---------------- */
const DB = [
  { match: /^WVW|1VW|3VW|JVW/i, make: 'Volkswagen', model: 'Golf', year: 2021, trim: 'Comfortline', engine: '1.4 TSI, 125 л.с., бензин', drive: 'передний', trans: 'DSG-7', body: 'хэтчбек', tank: 50, oilEvery: 15000,
    issues: ['Цепь ГРМ 1.4 TSI — растяжение к 80–120 тыс. км', 'Мехатроник DSG — сбои переключений', 'Помпа/термостат — тосольные утечки'],
    recall: 'Отзывная кампания: блок управленияairbag (2021)' },
  { match: /^JTM|2T3|4T1|5TD|JTJ/i, make: 'Toyota', model: 'RAV4', year: 2022, trim: 'Prestige', engine: '2.5 Dynamic Force, 199 л.с.', drive: 'полный', trans: 'Aisin 8AT', body: 'кроссовер', tank: 55, oilEvery: 10000,
    issues: ['Топливный насос низкого давления — износы', 'Ржавчина арок (без доп. защиты)', 'CVT-вариатор ранних лет — отзовите'],
    recall: null },
  { match: /^WBA|WBS|4US/i, make: 'BMW', model: '3 Series (G20)', year: 2020, trim: 'M Sport', engine: '2.0 TwinPower Turbo, 184 л.с.', drive: 'задний', trans: 'ZF 8HP', body: 'седан', tank: 59, oilEvery: 12000,
    issues: ['B48 — расход масла после 70 тыс. км', 'Насос ГУР/электроусилитель руля', 'Панорамная крыша — стуки'],
    recall: 'Отзывная: предохранитель блока управления (2020)' },
  { match: /^KNA|KND|LJD/i, make: 'Kia', model: 'Rio', year: 2023, trim: 'Lux', engine: '1.6 MPI, 123 л.с.', drive: 'передний', trans: '6AT', body: 'седан', tank: 47, oilEvery: 15000,
    issues: ['G4FG — дребезг холодного пуска (LAH)', 'Скрип передних стоек', 'ЛКП — сколы на кромках'],
    recall: null },
];
function decodeVin(vin) {
  const v = vin.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(v)) return null;
  // детерминированный выбор для демо
  let car = DB.find(d => d.match.test(v));
  if (!car) car = DB[(v.length + v.charCodeAt(0)) % DB.length];
  const wmi = v.slice(0, 3);
  return {
    vin: v, wmi, make: car.make, model: car.model, year: car.year, trim: car.trim,
    engine: car.engine, drive: car.drive, trans: car.trans, body: car.body,
    tank: car.tank, oilEvery: car.oilEvery, issues: car.issues, recall: car.recall,
    plate: 'А 123 ВС', region: '77 RUS',
  };
}

/* ---------------- store (localStorage) ---------------- */
const LS_KEY = 'garage.v1';
const defaultState = () => ({ user: null, cars: [], activeCarId: null });
let state = (() => { try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(LS_KEY)) }; } catch { return defaultState(); } })();
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
const activeCar = () => state.cars.find(c => c.id === state.activeCarId) || null;

function seedDemo() {
  const info = decodeVin('WVWZZZAUZLW012345');
  const now = new Date();
  // базовые даты — не позже «сегодня», чтобы свежие записи были в начале списка
  const baseDay = Math.min(now.getDate(), 25);
  const mk = (m, day) => {
    let d = new Date(now.getFullYear(), now.getMonth() - m, Math.min(day, baseDay));
    if (m === 0 && d > now) d = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - Math.ceil(day / 6)));
    return d.toISOString().slice(0, 10);
  };
  const car = {
    id: uid(), ...info, mileage: 64850, nextTO_km: 70000, lastOilDate: mk(5, 12), lastOilKm: 59800,
    policyEnd: mk(-11, 20), fines: [{ id: uid(), num: '03541877230112345678', sum: 500, date: mk(1, 8), desc: 'Превышение скорости (камера), Москва', paid: false }],
    health: { engine: 82, brakes: 64, oil: 45 },
    serviceHistory: [
      { date: mk(5, 12), title: 'ТО-4: масло + фильтры', cat: 'maint', cost: 12400 },
      { date: mk(8, 3), title: 'Замена колодок (перед)', cat: 'repair', cost: 8900 },
      { date: mk(12, 17), title: 'Сезонная резина', cat: 'maint', cost: 4200 },
    ],
    expenses: [
      { id: uid(), cat: 'fuel', desc: 'АИ-95, Лукойл Ленина', amount: 2600, date: mk(0, 30), km: 64800, liters: 32.5, place: 'Лукойл' },
      { id: uid(), cat: 'fuel', desc: 'АИ-95', amount: 2400, date: mk(0, 29), km: 64300, liters: 30, place: 'Татнефть' },
      { id: uid(), cat: 'wash', desc: 'Мойка комплекс', amount: 900, date: mk(0, 27), km: 64600, place: 'Автомойка №1' },
      { id: uid(), cat: 'parking', desc: 'Парковка ТЦ, месяц', amount: 3000, date: mk(0, 26), km: 64100 },
      { id: uid(), cat: 'fuel', desc: 'АИ-95', amount: 2500, date: mk(1, 27), km: 63600, liters: 31, place: 'Лукойл' },
      { id: uid(), cat: 'maint', desc: 'ТО: масло VAG GTF 5W-30 + фильтры', amount: 12400, date: mk(5, 12), km: 59800, place: 'VAG-сервис' },
      { id: uid(), cat: 'insurance', desc: 'ОСАГО на год', amount: 8740, date: mk(11, 20), km: 52000 },
      { id: uid(), cat: 'repair', desc: 'Передние колодки Mando', amount: 8900, date: mk(8, 3), km: 56400, place: 'Автопомощник' },
      { id: uid(), cat: 'fuel', desc: 'АИ-95 трасса', amount: 3100, date: mk(2, 11), km: 58900, liters: 38, place: 'Газпром' },
      { id: uid(), cat: 'tax', desc: 'Транспортный налог', amount: 3500, date: mk(4, 25), km: 57500 },
      { id: uid(), cat: 'wash', desc: 'Химчистка салона', amount: 4500, date: mk(6, 8), km: 55000 },
      { id: uid(), cat: 'fuel', desc: 'АИ-95', amount: 2300, date: mk(3, 6), km: 56800, liters: 29 },
    ],
  };
  state.user = { name: 'Автолюбитель', phone: '+7 900 000-00-00' };
  state.cars = [car];
  state.activeCarId = car.id;
  save();
}

/* ---------------- stats ---------------- */

// «живые» health-метрики: считаются из пробега и истории, а не хранятся мёртвыми числами
function computeHealth(car) {
  const h = { ...car.health };
  // масло: убывает с км после последней замены (ТО/замена масла в расходах)
  let lastOilKm = car.lastOilKm || 0;
  car.expenses.filter(e => ['maint', 'repair'].includes(e.cat) && /масл|оил|oil|фильтр/i.test(e.desc) && e.km)
    .forEach(e => { if (e.km > lastOilKm) lastOilKm = e.km; });
  const sinceOil = Math.max(0, car.mileage - lastOilKm);
  h.oil = Math.max(5, Math.min(100, Math.round(100 - sinceOil / car.oilEvery * 100)));
  // тормоза: восстанавливаются при покупке колодок/дисков, иначе деградируют с пробегом
  const brakeEvents = car.expenses.filter(e => /колодк|тормоз|disк|диск/i.test(e.desc));
  if (brakeEvents.length) {
    const kmAt = Math.max(...brakeEvents.map(e => e.km || 0), lastOilKm);
    h.brakes = Math.max(10, Math.min(98, Math.round(98 - Math.max(0, car.mileage - kmAt) / 40000 * 88)));
  } else {
    h.brakes = Math.max(10, Math.min(100, Math.round(100 - car.mileage / 120000 * 100)));
  }
  // двигатель: общий износ + штрафы за игнор ТО
  let eng = Math.max(20, Math.min(97, Math.round(97 - car.mileage / 300000 * 60)));
  if (car.nextTO_km - car.mileage < 0) eng -= 5;
  h.engine = Math.max(15, eng);
  return h;
}

function calcStats(car) {
  const ex = car.expenses;
  const yNow = new Date().getFullYear();
  const thisMonth = todayISO().slice(0, 7);
  const prevMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const yearTotal = ex.filter(e => e.date.startsWith(yNow)).reduce((s, e) => s + e.amount, 0);
  const monthTotal = ex.filter(e => monthKey(e.date) === thisMonth).reduce((s, e) => s + e.amount, 0);
  const prevTotal = ex.filter(e => monthKey(e.date) === prevMonth).reduce((s, e) => s + e.amount, 0);
  const delta = prevTotal > 0 ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100) : null;

  // стоимость 1 км: сумма года / км за год (по пробегу в записях)
  const sorted = [...ex].sort((a, b) => a.date.localeCompare(b.date));
  const kms = sorted.filter(e => e.km).map(e => e.km);
  const kmDriven = kms.length >= 2 ? Math.max(...kms) - Math.min(...kms) : 0;
  const perKm = kmDriven > 0 ? yearTotal / Math.max(kmDriven, 1) : 0.62; // фолбэк оценка

  const fuels = ex.filter(e => e.cat === 'fuel' && e.liters && e.km);
  let avgCons = 8.1;
  if (fuels.length) {
    const L = fuels.reduce((s, e) => s + e.liters, 0);
    const K = Math.max(...fuels.map(e => e.km)) - Math.min(...fuels.map(e => e.km));
    if (K > 50) avgCons = (L / K) * 100;
  }

  const byCat = CATS.map(c => ({ ...c, total: ex.filter(e => e.cat === c.id).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const byMonth = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    byMonth.push({ key, label: MONTHS[d.getMonth()], total: ex.filter(e => monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0) });
  }
  return { yearTotal, monthTotal, prevTotal, delta, perKm, avgCons, byCat, byMonth };
}

/* ---------------- SVG car silhouette ---------------- */
function carSVG(color = 'var(--car-line)', animated = false) {
  return `<svg class="${animated ? 'silhouette-draw' : ''}" width="340" height="130" viewBox="0 0 340 130" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 96 C28 82 34 76 46 72 L74 46 C84 38 96 34 112 34 L210 34 C232 34 248 40 262 52 L292 70 C306 74 314 82 314 96"/>
    <path d="M28 96 H314"/>
    <path d="M96 40 L112 62 M180 36 V62 M246 48 L258 62"/>
    <path d="M46 72 L60 62 M292 70 L276 62"/>
    <circle cx="86" cy="98" r="15"/><circle cx="256" cy="98" r="15"/>
    <circle cx="86" cy="98" r="6"/><circle cx="256" cy="98" r="6"/>
    <path d="M120 62 H240" opacity=".5"/>
    <path d="M20 112 H320" stroke-dasharray="3 6" opacity=".35"/>
  </svg>`;
}

/* ============================================================
   ROUTER
   ============================================================ */
const routes = { '/': renderHome, '/dashboard': renderDashboard, '/expenses': renderExpenses, '/parts': renderParts, '/profile': renderProfile };
function currentPath() { return (location.hash.slice(1) || '/').split('?')[0]; }
function navigate(p) { location.hash = '#' + p; }

function renderApp() {
  const path = currentPath();
  const fn = routes[path] || renderHome;
  $('#app').innerHTML = '';
  fn($('#app'));
  updateChrome(path);
  // страницы, которым нужно связать обработчики после вставки HTML
  if (typeof window.__afterRender === 'function') { const f = window.__afterRender; window.__afterRender = null; f(); }
}

function updateChrome(path) {
  // nav active states
  $$('#mainNav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + path));
  $$('#bottomNav a').forEach(a => a.classList.toggle('active', a.dataset.route === path));
  // login btn / header CTA
  const logged = !!state.user;
  $('#loginBtn').textContent = logged ? (state.user.name || 'Профиль') : 'Войти';
  $('#loginBtn').setAttribute('href', logged ? '#/profile' : '#/login');
  $('#ctaHeader').textContent = logged ? '+ Расход' : 'Добавить авто';
  $('#ctaHeader').onclick = () => logged ? openExpenseModal() : navigate('/');
  // FAB только на расходах
  $('#fab').hidden = !(logged && path === '/expenses');
  $('#fab').onclick = openExpenseModal;
  renderCarSwitcher();
}

function buildNav() {
  const items = [['/', 'Главная'], ['/dashboard', 'Гараж'], ['/expenses', 'Расходы'], ['/parts', 'Запчасти']];
  $('#mainNav').innerHTML = items.map(([p, t]) => `<a href="#${p}">${t}</a>`).join('');
}

/* ---------------- car switcher ---------------- */
function renderCarSwitcher() {
  const el = $('#carSwitcher');
  if (!state.cars.length) { el.hidden = true; return; }
  el.hidden = false;
  const act = activeCar();
  el.innerHTML = `
    <button class="cs-btn" id="csBtn"><span class="cs-dot"></span><span class="cs-name">${esc(act.make + ' ' + act.model)}</span><span class="cs-caret">▾</span></button>
    <div class="cs-menu" id="csMenu" hidden>
      ${state.cars.map(c => `<button class="cs-item ${c.id === act.id ? 'sel' : ''}" data-id="${c.id}">
        <span class="cs-dot" style="background:${c.id === act.id ? 'var(--accent2)' : 'var(--text3)'};box-shadow:none"></span>${esc(c.make + ' ' + c.model)} <span class="dim mono" style="margin-left:auto;font-size:11px">${c.year}</span></button>`).join('')}
      <button class="cs-item cs-add" data-add="1">＋ Добавить автомобиль</button>
    </div>`;
  $('#csBtn').onclick = (e) => { e.stopPropagation(); $('#csMenu').hidden = !$('#csMenu').hidden; };
  document.addEventListener('click', () => { const m = $('#csMenu'); if (m) m.hidden = true; });
  $$('.cs-item', el).forEach(b => b.onclick = () => {
    if (b.dataset.add) { navigate('/'); return; }
    state.activeCarId = b.dataset.id; save(); renderApp();
  });
}

/* ============================================================
   PAGE: HOME (главная + онбординг по VIN)
   ============================================================ */
function renderHome(root) {
  root.innerHTML = `
  <section class="hero">
    <div class="glow" style="background:var(--accent);top:-60px;left:20%"></div>
    <div class="glow" style="background:var(--accent2);top:40px;right:15%;opacity:.16"></div>
    <div class="container">
      <h1>Твой автомобиль.<br><span class="gr">Твой цифровой гараж.</span></h1>
      <p class="sub">Введи VIN — и GARAGE соберёт персональный хаб: запчасти по вин, дневник расходов, штрафы, страховка и всё, что нужно именно твоей машине.</p>
      <div class="vin-box hud-frame" id="vinBox">
        ${vinIdleHTML()}
      </div>
    </div>
  </section>

  <section class="section container">
    <h2 class="sec-title">Сервисы под капотом</h2>
    <p class="sec-sub">Всё адаптировано под конкретную машину — как только она в гараже.</p>
    <div class="svc-grid">
      ${[['🧩','Запчасти','Подбор строго по VIN: оригинал, аналоги, б/у с ценами','#/parts'],
         ['📊','Дневник расходов','Стоимость 1 км, диаграммы, категории','#/expenses'],
         ['🛞','Колёса и шины','Подбор по размеру, примерка дисков','soon'],
         ['🔧','Ремонт и ТО','Карта СТО, запись онлайн, калькулятор ТО','soon'],
         ['🛡','Страхование','Калькулятор ОСАГО/КАСКО, покупка в 1 клик','soon'],
         ['👥','Сообщество','Бортжурналы владельцев твоей модели','soon']]
        .map(([ic,t,d,link]) => `
        <div class="card svc-card" data-link="${link}">
          <div class="svc-ic" style="background:rgba(0,102,255,.12);border:1px solid rgba(0,214,255,.2)">${ic}</div>
          <h3>${t}</h3><p>${d}</p>
          ${link === 'soon' ? '<span class="badge b-purple">скоро</span>' : '<span class="badge b-info">открыть →</span>'}
        </div>`).join('')}
    </div>
  </section>

  <section class="section container">
    <h2 class="sec-title">Как это работает</h2>
    <p class="sec-sub">От VIN до полного контроля над машиной — меньше минуты.</p>
    <div class="steps">
      ${[['01','Сканируй VIN','Частицы соберут силуэт твоей машины и распакодят комплектацию'],
         ['02','Получи инсайты','Типичные болячки модели и отзывные кампании — ещё до регистрации'],
         ['03','Управляй гаражом','Расходы, ТО, штрафы, запчасти — всё в одном тёмном кокпите']]
        .map(([n,t,d]) => `<div class="card step hud-frame"><div class="step-num">${n}</div><h3 style="font-size:18px;margin:10px 0 6px">${t}</h3><p class="muted" style="font-size:14px">${d}</p></div>`).join('')}
    </div>
  </section>`;

  bindVinBox();
  $$('.svc-card').forEach(c => c.onclick = () => { if (c.dataset.link !== 'soon') navigate(c.dataset.link); else toast('Раздел в разработке — v1.0+'); });
}

function vinIdleHTML() {
  return `
    <div class="row spread" style="margin-bottom:14px">
      <span class="mono dim" style="font-size:11px;letter-spacing:.1em">VIN SCAN · v1</span>
      <span class="badge b-ok"><span style="width:6px;height:6px;border-radius:50%;background:var(--ok);display:inline-block"></span>online</span>
    </div>
    <div class="vin-row">
      <input id="vinInput" class="input mono" placeholder="VIN или госномер — например WVWZZZAUZLW012345" maxlength="17" autocomplete="off"/>
      <button class="btn btn-primary" id="vinGo">Проверить</button>
    </div>
    <div class="vin-hint">демо-VIN:
      <button data-vin="WVWZZZAUZLW012345">WVW…Golf</button>
      <button data-vin="JTMZZZCA002345678">JTM…RAV4</button>
      <button data-vin="WBA8A5C57K1234567">WBA…BMW 3</button>
      <button data-vin="KNAMT811CP1234567">KNA…Rio</button>
    </div>`;
}

function bindVinBox() {
  const box = $('#vinBox');
  const go = () => {
    const raw = $('#vinInput').value.trim();
    const info = decodeVin(raw);
    if (!info) { shake(box); toast('Похоже, VIN некорректен — проверь 17 символов'); return; }
    startScan(box, info);
  };
  $('#vinGo').onclick = go;
  $('#vinInput').addEventListener('keydown', e => e.key === 'Enter' && go());
  $$('.vin-hint button', box).forEach(b => b.onclick = () => { $('#vinInput').value = b.dataset.vin; go(); });
}

function shake(el) {
  el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 260 });
}

function startScan(box, info) {
  box.innerHTML = `
    <div class="scan-stage" id="stage">${carSVG('var(--car-line)', true)}<div class="scanline"></div></div>
    <div class="mono dim" style="font-size:12px;text-align:center" id="scanLog">▸ декодирование WMI ${esc(info.wmi)}…</div>`;
  // частицы слетаются в силуэт
  const stage = $('#stage');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = 20 + Math.random() * 280 + 'px';
    p.style.top = 30 + Math.random() * 140 + 'px';
    p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--dy', (Math.random() * 120 - 60) + 'px');
    p.style.animationDelay = Math.random() * 0.5 + 's';
    stage.appendChild(p);
  }
  const logs = [`▸ WMI: ${info.wmi} → ${info.make}`, '▸ модель / год / комплектация…', `▸ двигатель: ${info.engine.split(',')[0]}…`, '▸ сверка с базой отзывных кампаний…'];
  let li = 0;
  const iv = setInterval(() => { if ($('#scanLog')) $('#scanLog').textContent = logs[Math.min(li++, logs.length - 1)]; }, 450);
  setTimeout(() => { clearInterval(iv); showTeaser(box, info); }, 2100);
}

function showTeaser(box, info) {
  box.innerHTML = `
  <div class="teaser">
    <div class="row spread">
      <div><h3 style="font-family:Unbounded;font-size:20px">${esc(info.make)} ${esc(info.model)}</h3>
      <div class="mono dim" style="font-size:12px;margin-top:2px">${esc(info.vin)}</div></div>
      <span class="badge b-info">распознан</span>
    </div>
    <div class="spec-grid">
      <div class="spec"><span>год</span><b>${info.year}</b></div>
      <div class="spec"><span>комплектация</span><b>${esc(info.trim)}</b></div>
      <div class="spec"><span>двигатель</span><b>${esc(info.engine)}</b></div>
      <div class="spec"><span>КПП</span><b>${esc(info.trans)}</b></div>
      <div class="spec"><span>привод</span><b>${esc(info.drive)}</b></div>
    </div>
    <div class="field-label" style="margin-top:16px">Типичные проблемы модели</div>
    ${info.issues.map(t => `<div class="insight"><div class="i-ic" style="background:rgba(255,184,0,.12)">⚠️</div><div>${esc(t)}</div></div>`).join('')}
    ${info.recall ? `<div class="insight"><div class="i-ic" style="background:rgba(255,59,92,.12)">📢</div><div>${esc(info.recall)}</div></div>` : ''}
    <div class="row" style="margin-top:18px;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" id="addCarBtn">Добавить в гараж</button>
      <button class="btn btn-ghost" id="againBtn">Другой VIN</button>
      <span class="dim" style="font-size:12px">Чтобы сохранить — создай аккаунт за 15 секунд</span>
    </div>
  </div>`;
  $('#againBtn').onclick = () => { box.innerHTML = vinIdleHTML(); bindVinBox(); };
  $('#addCarBtn').onclick = () => quickRegister(box, info);
}

/* быстрая регистрация SMS (демо) + сохранение авто */
function quickRegister(box, info) {
  box.innerHTML = `
  <div class="teaser">
    <h3 style="font-family:Unbounded;font-size:18px">Создаём аккаунт</h3>
    <p class="muted" style="font-size:13.5px;margin:6px 0 14px">Регистрация по SMS — без паролей. Или через соцсети.</p>
    <div class="vin-row">
      <input id="phoneIn" class="input mono" placeholder="+7 900 000-00-00" value="+7 900 123-45-67"/>
      <button class="btn btn-ghost" id="sendCode">Получить код</button>
    </div>
    <div id="codeWrap" hidden style="margin-top:10px" class="vin-row">
      <input id="codeIn" class="input mono" placeholder="4 цифры кода (демо: любой)" maxlength="4"/>
      <button class="btn btn-primary" id="verifyCode">Подтвердить</button>
    </div>
    <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
      <button class="chip soc" data-soc="Яндекс">🟡 Яндекс</button>
      <button class="chip soc" data-soc="VK">🔵 VK ID</button>
      <button class="chip soc" data-soc="Google">🟢 Google</button>
    </div>
  </div>`;
  $('#sendCode').onclick = () => { $('#codeWrap').hidden = false; toast('Код отправлен в SMS-пустоту ✦ (демо: введи любые 4 цифры)'); $('#codeIn').focus(); };
  $('#verifyCode').onclick = () => finishAuth(info);
  $$('.soc').forEach(b => b.onclick = () => finishAuth(info, b.dataset.soc));
}

function finishAuth(info, soc) {
  const car = {
    id: uid(), ...info, mileage: 12000 + Math.floor(Math.random() * 60000),
    nextTO_km: 0, policyEnd: '', fines: [],
    health: { engine: 88, brakes: 78, oil: 70 },
    serviceHistory: [], expenses: [],
    lastOilKm: 0, // будет = пробегу на момент добавления
  };
  car.lastOilKm = car.mileage;
  car.nextTO_km = car.mileage + info.oilEvery;
  const d = new Date(); d.setMonth(d.getMonth() + 4);
  car.policyEnd = d.toISOString().slice(0, 10);
  state.user = { name: soc ? `Владелец (${soc})` : 'Автолюбитель', phone: '+7 900 123-45-67', soc: soc || 'sms' };
  state.cars.push(car);
  state.activeCarId = car.id;
  save();
  toast(`Готово! ${car.make} ${car.model} в гараже 🚗`);
  navigate('/dashboard');
}

/* ============================================================
   PAGE: DASHBOARD
   ============================================================ */
function renderDashboard(root) {
  if (!activeCar()) { root.innerHTML = emptyGarage(); bindEmpty(); return; }
  const car = activeCar();
  const st = calcStats(car);
  const health = computeHealth(car);
  const toLeft = car.nextTO_km - car.mileage;
  const daysToPolicy = car.policyEnd ? Math.ceil((new Date(car.policyEnd) - new Date()) / 864e5) : null;
  const unpaid = car.fines.filter(f => !f.paid);
  const hColor = (v) => v >= 75 ? 'var(--ok)' : v >= 50 ? 'var(--warn)' : 'var(--danger)';

  const alerts = [];
  if (toLeft <= 3000) alerts.push(['a-danger', '🛠', `ТО ${toLeft <= 0 ? 'просрочено' : 'скоро'}: осталось ${num(Math.max(toLeft, 0), 0)} км`, 'Замени масло и фильтры — запишись на ТО']);
  if (daysToPolicy !== null && daysToPolicy <= 45) alerts.push([daysToPolicy < 0 ? 'a-danger' : 'a-warn', '🛡', 'Полис ОСАГО ' + (daysToPolicy < 0 ? 'истёк' : 'истекает через ' + daysToPolicy + ' дн.'), 'Продли онлайн — калькулятор в профиле']);
  if (unpaid.length) alerts.push(['a-danger', '🚨', `${unpaid.length} неоплаченный штраф на ${money(unpaid.reduce((s, f) => s + f.sum, 0))}`, 'Оплати со скидкой 50% в первые 20 дней']);
  if (health.oil < 50) alerts.push(['a-warn', '🛢', 'Срок службы масла на исходе', `Рекомендуемая замена через ${num(Math.max(toLeft, 0), 0)} км`]);

  root.innerHTML = `
  <div class="container">
    <div class="page-head">
      <div>
        <div class="mono dim" style="font-size:12px;letter-spacing:.1em">// МОЙ ГАРАЖ</div>
        <h2>Привет, ${esc(state.user?.name || 'владелец')} 👋</h2>
      </div>
      <div class="row">
        <button class="btn btn-ghost btn-sm" id="seedBtn">Наполнить демо-данными</button>
        <button class="btn btn-primary btn-sm" onclick="navigate('/')">+ Авто</button>
      </div>
    </div>

    <div class="dash-cols">
      <!-- карточка авто -->
      <div class="card card-pad hud-frame fade-in">
        <div class="glow" style="background:var(--accent);top:-80px;right:-60px"></div>
        <div class="row spread">
          <div>
            <h3 style="font-family:Unbounded;font-size:22px">${esc(car.make)} ${esc(car.model)}</h3>
            <div class="mono dim" style="font-size:12.5px;margin-top:4px">${esc(car.vin)}</div>
          </div>
          <span class="badge b-info mono">${esc(car.plate)} · ${esc(car.region)}</span>
        </div>
        <div style="display:grid;place-items:center;margin:14px 0;position:relative">${carSVG()}</div>
        <div class="spec-grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">
          <div class="spec"><span>год</span><b>${car.year}</b></div>
          <div class="spec"><span>двигатель</span><b>${esc(car.engine.split(',')[0])}</b></div>
          <div class="spec"><span>КПП</span><b>${esc(car.trans)}</b></div>
          <div class="spec"><span>пробег</span><b class="mono">${num(car.mileage, 0)} км</b></div>
        </div>
        <div class="field-label" style="margin-top:18px">Здоровье автомобиля</div>
        ${[['Двигатель', health.engine], ['Тормоза', health.brakes], ['Масло', health.oil]].map(([l, v]) => `
          <div class="health-row">
            <div class="health-lbl"><span>${l}</span><span class="mono" data-to="${v}" style="color:${hColor(v)}">0%</span></div>
            <div class="pbar"><div class="pfill" style="width:0%;background:${hColor(v)}" data-w="${v}"></div></div>
          </div>`).join('')}
      </div>

      <!-- сводка + алерты -->
      <div class="grid" style="align-content:start">
        <div class="card card-pad fade-in">
          <div class="field-label" style="margin:0 0 6px">Сводка</div>
          <div class="summary-item"><div class="sum-ic">🛠</div><div><b>Следующее ТО</b><div class="muted" style="font-size:13px">${toLeft > 0 ? `через ${num(toLeft, 0)} км` : `просрочено на ${num(-toLeft, 0)} км`} · ${money(12400)} ориентировочно</div>
            <div class="pbar" style="margin-top:8px"><div class="pfill" style="width:0%;background:var(--grad)" data-w="${Math.min(100, Math.max(0, Math.round((car.mileage % car.oilEvery) / car.oilEvery * 100)))}"></div></div></div></div>
          <div class="summary-item"><div class="sum-ic">🚨</div><div><b>Штрафы</b><div class="muted" style="font-size:13px">${unpaid.length ? unpaid.length + ' неоплачен. на ' + money(unpaid.reduce((s, f) => s + f.sum, 0)) : 'нет — чист как в сервисе ✨'}</div></div></div>
          <div class="summary-item"><div class="sum-ic">💸</div><div><b>Расход в месяц</b><div class="muted" style="font-size:13px">${money(st.monthTotal || st.yearTotal / 12)} · 1 км ≈ ${num(st.perKm, 1)} ₽</div></div></div>
          <div class="summary-item"><div class="sum-ic">🛡</div><div><b>Полис ОСАГО</b><div class="muted" style="font-size:13px">${car.policyEnd ? fmtDate(car.policyEnd) + ' ' + (daysToPolicy !== null ? `· осталось ${daysToPolicy} дн.` : '') : '—'}</div></div></div>
        </div>
        <div class="card card-pad fade-in">
          <div class="field-label" style="margin:0 0 10px">Что нужно сейчас</div>
          ${alerts.length ? alerts.map(([cls, ic, t, d]) => `<div class="alert ${cls}"><div style="font-size:20px">${ic}</div><div><b style="font-size:14px">${esc(t)}</b><div class="muted" style="font-size:12.5px">${esc(d)}</div></div></div>`).join('') : '<div class="muted" style="font-size:14px">Всё под контролем ✅</div>'}
        </div>
      </div>
    </div>

    <!-- быстрые действия -->
    <div class="quick-grid" style="margin-top:20px">
      ${[['#/expenses','📊','Дневник расходов','Добавить и посмотреть траты'],
         ['#/parts','🧩','Подбор запчастей','По VIN: оригинал / аналоги / б/у'],
         ['#/profile','🚨','Проверить штрафы','По госномеру и СТС'],
         ['#/profile','🛡','Продлить ОСАГО','Калькулятор и покупка']]
        .map(([href, ic, t, d]) => `<a class="card quick" href="${href}"><div style="font-size:22px">${ic}</div><b style="font-size:15px">${t}</b><span class="muted" style="font-size:12.5px">${d}</span></a>`).join('')}
    </div>

    <!-- история обслуживания -->
    <div class="card card-pad" style="margin-top:20px">
      <div class="field-label" style="margin:0 0 14px">История обслуживания</div>
      ${car.serviceHistory.length ? `<ul class="timeline">${car.serviceHistory.map(h => {
        const c = catById(h.cat);
        return `<li class="tl-item" style="--dot:${c.color}"><b style="font-size:14.5px">${esc(h.title)}</b>
          <div class="muted" style="font-size:12.5px">${fmtDate(h.date)} · <span class="mono">${money(h.cost)}</span></div></li>`;
      }).join('')}</ul>` : '<div class="muted" style="font-size:14px">Пока пусто — записи появятся из дневника расходов (ТО, ремонт).</div>'}
    </div>
  </div>`;

  requestAnimationFrame(() => $$('.pfill').forEach(p => p.style.width = p.dataset.w + '%'));
  $('#seedBtn').onclick = () => { if (!car.expenses.length) { seedInto(car); save(); toast('Демо-данные загружены'); renderApp(); } else toast('Данные уже есть 🙂'); };

  // анимация «цифр» на дашборде (count-up для процентов здоровья)
  animateNums();
}

function animateNums() {
  $$('.health-lbl .mono[data-to]').forEach(el => {
    const to = +el.dataset.to; let cur = 0;
    const step = Math.max(1, Math.ceil(to / 28));
    const iv = setInterval(() => { cur = Math.min(to, cur + step); el.textContent = cur + '%'; if (cur >= to) clearInterval(iv); }, 24);
  });
}

function emptyGarage() {
  return `<div class="container"><div class="card empty hud-frame" style="margin-top:40px">
    <div class="big">🚗</div><h3 style="font-family:Unbounded;font-size:20px">Гараж пуст</h3>
    <p class="muted" style="max-width:420px;margin:10px auto 22px">Добавь автомобиль по VIN — и весь сервис заточится под твою машину.</p>
    <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" id="addCarEmpty">Добавить авто</button>
      <button class="btn btn-ghost" id="demoBtn">Посмотреть демо</button>
    </div></div></div>`;
}
function bindEmpty() {
  window.__afterRender = () => {
    const d = $('#demoBtn'); if (d) d.onclick = () => { seedDemo(); save(); toast('Демо-гараж загружен'); renderApp(); };
    const a = $('#addCarEmpty'); if (a) a.onclick = () => navigate('/');
  };
}

function seedInto(car) {
  const demo = defaultState(); const tmp = state; state = demo; seedDemo(); const src = state.cars[0]; state = tmp;
  car.expenses = src.expenses; car.serviceHistory = src.serviceHistory; car.fines = src.fines;
  car.health = src.health; car.policyEnd = src.policyEnd; car.mileage = src.mileage; car.nextTO_km = src.nextTO_km;
}

/* ============================================================
   PAGE: EXPENSES (дневник расходов)
   ============================================================ */
let expFilter = 'all';
let lastAddedId = null;
let editingId = null;

function renderExpenses(root) {
  const car = activeCar();
  if (!car) { root.innerHTML = emptyGarage(); bindEmpty(); return; }
  const st = calcStats(car);
  const list = [...car.expenses].sort((a, b) => b.date.localeCompare(a.date)).filter(e => expFilter === 'all' || e.cat === expFilter);
  root.innerHTML = `
  <div class="container">
    <div class="page-head">
      <div><div class="mono dim" style="font-size:12px;letter-spacing:.1em">// ДНЕВНИК РАСХОДОВ</div>
        <h2>${esc(car.make)} ${esc(car.model)}</h2></div>
      <div class="row" style="gap:8px">
        <button class="btn btn-ghost" id="csvBtn" title="Выгрузить все записи в CSV">⬇ CSV</button>
        <button class="btn btn-primary" id="addBtn">＋ Добавить расход</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="card stat"><div class="lbl">Всего за год</div><div class="val">${money(st.yearTotal)}</div>
        <div class="delta down">≈ ${money(st.yearTotal / 12)} / мес</div></div>
      <div class="card stat"><div class="lbl">За месяц</div><div class="val">${money(st.monthTotal)}</div>
        ${st.delta === null ? '<div class="delta muted">нет данных за прошлый месяц</div>' :
          `<div class="delta ${st.delta > 0 ? 'up' : 'down'}">${st.delta > 0 ? '↑' : '↓'} ${Math.abs(st.delta)}% к прошлому месяцу</div>`}</div>
      <div class="card stat"><div class="lbl">Стоимость 1 км</div><div class="val" id="perKmVal">${num(st.perKm, 1)} ₽</div>
        <div class="delta ${st.perKm <= 5 ? 'down' : 'up'}">${st.perKm <= 5 ? '👍 дешевле среднего по классу' : '💡 выше среднего — проверь расходники'}</div></div>
      <div class="card stat"><div class="lbl">Средний расход</div><div class="val">${num(st.avgCons, 1)} л<span style="font-size:13px;color:var(--text3)">/100км</span></div>
        <div class="delta muted">бак ${car.tank} л · ${esc(car.engine.split(',')[0])}</div></div>
    </div>

    <div class="chart-cols" style="margin-top:20px">
      <div class="card card-pad">
        <div class="field-label" style="margin:0">По категориям · год</div>
        <div class="donut-wrap">${donutSVG(st.byCat, st.yearTotal)}</div>
        <div class="legend">${st.byCat.map(c => `<div class="legend-item"><span class="cdot" style="width:9px;height:9px;border-radius:50%;background:${c.color};display:inline-block"></span>${c.icon} ${c.name}<b style="color:var(--text)">${money(c.total)}</b><span class="pct">${Math.round(c.total / (st.yearTotal || 1) * 100)}%</span></div>`).join('') || '<div class="muted">Нет данных</div>'}</div>
      </div>
      <div class="card card-pad">
        <div class="field-label" style="margin:0">По месяцам · 12 мес</div>
        <div class="bars">${renderBars(st.byMonth)}</div>
        <div class="spark-note mono dim">${sparkInsight(st.byMonth)}</div>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-pad" style="padding-bottom:12px">
        <div class="row spread" style="flex-wrap:wrap;gap:10px">
          <div class="field-label" style="margin:0">Последние записи · ${list.length}</div>
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <span class="chip ${expFilter === 'all' ? 'on' : ''}" data-f="all">Все</span>
            ${CATS.map(c => `<span class="chip ${expFilter === c.id ? 'on' : ''}" data-f="${c.id}"><span class="cdot" style="background:${c.color}"></span>${c.name}</span>`).join('')}
          </div>
        </div>
      </div>
      <div>${list.length ? list.map(e => expItemHTML(e, car)).join('') : '<div class="empty" style="padding:40px"><div class="big">🧾</div><p class="muted">Записей нет — добавь первый расход</p></div>'}</div>
    </div>
  </div>`;

  $('#addBtn').onclick = () => openExpenseModal();
  $('#csvBtn').onclick = exportCSV;
  $$('.chip[data-f]').forEach(ch => ch.onclick = () => { expFilter = ch.dataset.f; renderExpenses(root); });
  $$('.exp-del').forEach(b => b.onclick = () => {
    const car2 = activeCar();
    car2.expenses = car2.expenses.filter(x => x.id !== b.dataset.id);
    save(); toast('Запись удалена'); renderExpenses(root);
  });
  $$('.exp-edit').forEach(b => b.onclick = () => openExpenseModal(b.dataset.id));
  if (lastAddedId) { const el = $(`.exp-item[data-id="${lastAddedId}"]`); if (el) el.classList.add('new-flash'); lastAddedId = null; }
}

function expItemHTML(e, car) {
  const c = catById(e.cat);
  const meta = [e.km ? `${num(e.km, 0)} км` : '', e.liters ? `${num(e.liters, 1)} л · ${num(e.amount / e.liters, 1)} ₽/л` : '', e.place ? esc(e.place) : ''].filter(Boolean).join(' · ');
  return `<div class="exp-item" data-id="${e.id}">
    <div class="exp-ic" style="background:${c.color}1f;border:1px solid ${c.color}44">${c.icon}</div>
    <div style="min-width:0"><b style="font-size:14.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.desc)}</b>
      <div class="muted" style="font-size:12.5px">${fmtDate(e.date)}${meta ? ' · ' + meta : ''}</div></div>
    <div class="exp-sum" style="color:${c.color}">${money(e.amount)}</div>
    <button class="icon-btn exp-edit" data-id="${e.id}" title="Редактировать" style="width:32px;height:32px;font-size:13px">✎</button>
    <button class="icon-btn exp-del" data-id="${e.id}" title="Удалить" style="width:32px;height:32px;font-size:13px">✕</button>
  </div>`;
}

function donutSVG(byCat, total) {
  const R = 88, C = 2 * Math.PI * R;
  let off = 0, segs = '';
  byCat.forEach(c => {
    const frac = total ? c.total / total : 0;
    segs += `<circle r="${R}" cx="115" cy="115" fill="none" stroke="${c.color}" stroke-width="26"
      stroke-dasharray="${(frac * C - 3).toFixed(1)} ${(C - frac * C + 3).toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}"
      transform="rotate(-90 115 115)" stroke-linecap="butt" opacity=".92"/>`;
    off += frac;
  });
  return `<svg width="230" height="230" viewBox="0 0 230 230">
    <circle r="${R}" cx="115" cy="115" fill="none" stroke="var(--card2)" stroke-width="26"/>${segs}
    </svg><div class="donut-center"><div><span class="dim" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em">всего</span><b>${money(total)}</b></div></div>`;
}

function renderBars(byMonth) {
  const max = Math.max(...byMonth.map(m => m.total), 1);
  return byMonth.map(m => `
    <div class="bar-col">
      <div class="bar" style="height:${Math.max(2, m.total / max * 100)}%"><div class="bar-tip">${m.label}: <b class="mono">${money(m.total)}</b></div></div>
      <span class="bar-lbl">${m.label}</span>
    </div>`).join('');
}

// короткий текстовый инсайт по динамике трат
function sparkInsight(byMonth) {
  const withData = byMonth.filter(m => m.total > 0);
  if (withData.length < 2) return 'Добавь пару записей — появится динамика.';
  const last = byMonth[byMonth.length - 1], prev = byMonth[byMonth.length - 2];
  const avg = withData.reduce((s, m) => s + m.total, 0) / withData.length;
  const peak = withData.reduce((a, b) => (b.total > a.total ? b : a));
  if (last.total === 0) return `Пик расходов: ${peak.label} (${money(peak.total)}). В этом месяце пока тишина.`;
  const d = prev.total ? Math.round((last.total - prev.total) / prev.total * 100) : 0;
  const trend = d === 0 ? 'на уровне прошлого месяца' : (d > 0 ? `+${d}% к прошлому` : `${d}% к прошлому`);
  const vsAvg = last.total >= avg * 1.3 ? ' · заметно выше среднего за год' : last.total <= avg * 0.7 ? ' · ниже среднего — отлично' : '';
  return `В этом месяце ${money(last.total)} — ${trend}${vsAvg}.`;
}

/* ---------------- expense modal (добавление + редактирование) ---------------- */
let pickedCat = 'fuel';
function buildCatGrid() {
  $('#catGrid').innerHTML = CATS.map(c => `
    <button type="button" class="cat-tile ${c.id === pickedCat ? 'on' : ''}" data-cat="${c.id}" style="--c:${c.color}">
      <span class="t-ic">${c.icon}</span>${c.name}</button>`).join('');
  $$('#catGrid .cat-tile').forEach(t => t.onclick = () => {
    pickedCat = t.dataset.cat;
    $$('#catGrid .cat-tile').forEach(x => x.classList.toggle('on', x === t));
    $('#litersField').hidden = pickedCat !== 'fuel';
  });
}
function openExpenseModal(id) {
  if (!activeCar()) { toast('Сначала добавь авто'); navigate('/'); return; }
  editingId = id || null;
  const rec = id ? activeCar().expenses.find(e => e.id === id) : null;
  pickedCat = rec ? rec.cat : 'fuel';
  buildCatGrid();
  $('#modalTitle').textContent = rec ? 'Редактировать расход' : 'Новый расход';
  $('#submitBtn').textContent = rec ? 'Сохранить изменения' : 'Сохранить';
  $('#expDesc').value = rec ? rec.desc : '';
  $('#expAmount').value = rec ? rec.amount : '';
  $('#expDate').value = rec ? rec.date : todayISO();
  $('#expKm').value = rec && rec.km ? rec.km : '';
  $('#expKm').placeholder = String(activeCar().mileage);
  $('#expLiters').value = rec && rec.liters ? rec.liters : '';
  $('#expPlace').value = rec && rec.place ? rec.place : '';
  $('#litersField').hidden = pickedCat !== 'fuel';
  $('#expenseModal').hidden = false;
  $('#expDesc').focus();
}
function closeExpenseModal() { $('#expenseModal').hidden = true; editingId = null; }

$('#closeModal').onclick = closeExpenseModal;
$('#cancelModal').onclick = closeExpenseModal;
$('#expenseModal').addEventListener('click', e => { if (e.target === $('#expenseModal')) closeExpenseModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExpenseModal(); });

$('#expenseForm').onsubmit = (e) => {
  e.preventDefault();
  const car = activeCar();
  const rec = {
    id: editingId || uid(), cat: pickedCat,
    desc: $('#expDesc').value.trim() || catById(pickedCat).name,
    amount: parseFloat($('#expAmount').value) || 0,
    date: $('#expDate').value || todayISO(),
    km: parseFloat($('#expKm').value) || undefined,
    liters: pickedCat === 'fuel' ? (parseFloat($('#expLiters').value) || undefined) : undefined,
    place: $('#expPlace').value.trim() || undefined,
  };
  if (rec.amount <= 0) { toast('Введи сумму'); return; }
  if (editingId) {
    const idx = car.expenses.findIndex(x => x.id === editingId);
    if (idx >= 0) car.expenses[idx] = rec;
  } else {
    car.expenses.unshift(rec);
  }
  if (rec.km) car.mileage = Math.max(car.mileage, rec.km);
  // история обслуживания: одна запись на событие ТО/ремонта, синхронно с расходом
  const isService = ['maint', 'repair'].includes(rec.cat);
  const hi = car.serviceHistory.findIndex(h => h.srcId === rec.id);
  if (isService) {
    const entry = { date: rec.date, title: rec.desc, cat: rec.cat, cost: rec.amount, srcId: rec.id };
    if (hi >= 0) car.serviceHistory[hi] = entry; else car.serviceHistory.unshift(entry);
  } else if (hi >= 0) {
    car.serviceHistory.splice(hi, 1); // категорию убрали из сервисных — чистим историю
  }
  // после замены масла / ТО — сбрасываем счётчик масла и двигаем следующее ТО
  if (isService && /масл|oil/i.test(rec.desc)) {
    car.lastOilKm = rec.km || car.mileage;
    car.nextTO_km = (rec.km || car.mileage) + car.oilEvery;
  }
  save();
  closeExpenseModal();
  lastAddedId = rec.id;
  expFilter = 'all';
  toast(editingId ? 'Изменения сохранены ✓' : 'Расход добавлен ✓');
  if (currentPath() === '/expenses') renderExpenses($('#app')); else navigate('/expenses');
};

/* ---------------- экспорт расходов в CSV ---------------- */
function exportCSV() {
  const car = activeCar();
  if (!car || !car.expenses.length) { toast('Нечего экспортировать'); return; }
  const rows = [['Дата', 'Категория', 'Описание', 'Сумма, руб', 'Пробег, км', 'Литры', 'Место']];
  [...car.expenses].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
    rows.push([e.date, catById(e.cat).name, `"${(e.desc || '').replace(/"/g, '""')}"`, e.amount, e.km ?? '', e.liters ?? '', `"${(e.place || '').replace(/"/g, '""')}"`]);
  });
  const csv = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `garage-${car.make}-${car.model}-2026.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('CSV выгружен ⬇');
}

/* ============================================================
   PAGE: PARTS (запчасти по VIN)
   ============================================================ */
const NODES = [
  { id: 'engine', x: 120, y: 60, label: 'Двигатель' },
  { id: 'filters', x: 175, y: 48, label: 'Фильтры' },
  { id: 'brakes_f', x: 86, y: 98, label: 'Тормоза пер.' },
  { id: 'brakes_r', x: 256, y: 98, label: 'Тормоза зад.' },
  { id: 'susp', x: 220, y: 78, label: 'Подвеска' },
  { id: 'body', x: 170, y: 90, label: 'Кузов' },
];
const PARTS = {
  engine: [
    { name: 'Комплект цепи ГРМ', offers: [
      { type: 'orig', brand: 'VAG', art: '06K 109 461 K', price: 14900 },
      { type: 'analogue', brand: 'Febi Bilstein', art: '38632', price: 7400 },
      { type: 'used', brand: 'б/у, разборка', art: '± 80 тыс. км', price: 4500 }]},
    { name: 'Помпа + термостат', offers: [
      { type: 'orig', brand: 'VAG', art: '06K 121 004 N', price: 9800 },
      { type: 'analogue', brand: 'SKF', art: 'VKPC 95304', price: 5200 }]},
  ],
  filters: [
    { name: 'Масляный фильтр', offers: [
      { type: 'orig', brand: 'VAG', art: '06L 115 562 A', price: 890 },
      { type: 'analogue', brand: 'Mann', art: 'HU 9008 z', price: 520 },
      { type: 'used', brand: '—', art: 'не рекомендуется', price: 0 }]},
    { name: 'Воздушный фильтр', offers: [
      { type: 'orig', brand: 'VAG', art: '04C 129 620', price: 1450 },
      { type: 'analogue', brand: 'Filtron', art: 'AP 157', price: 640 }]},
  ],
  brakes_f: [
    { name: 'Колодки передние', offers: [
      { type: 'orig', brand: 'VAG', art: '5Q6 615 121 Q', price: 5600 },
      { type: 'analogue', brand: 'TRW', art: 'GDB1826', price: 2700 },
      { type: 'used', brand: 'б/у ATE', art: 'остаток 6 мм', price: 1200 }]},
    { name: 'Диски передние (пара)', offers: [
      { type: 'orig', brand: 'VAG', art: '5Q0 615 301 D', price: 9200 },
      { type: 'analogue', brand: 'Zimmermann', art: '550.3475.20', price: 5400 }]},
  ],
  brakes_r: [
    { name: 'Колодки задние', offers: [
      { type: 'orig', brand: 'VAG', art: '1K0 698 451 R', price: 4800 },
      { type: 'analogue', brand: 'NiBK', art: 'PN1530', price: 1900 }]},
  ],
  susp: [
    { name: 'Стойка стабилизатора', offers: [
      { type: 'orig', brand: 'Lemförder', art: '31334 01', price: 2400 },
      { type: 'analogue', brand: 'Fe Bilstein', art: '38156', price: 1100 },
      { type: 'used', brand: 'б/у', art: '20 тыс. км', price: 500 }]},
    { name: 'Амортизатор передний', offers: [
      { type: 'orig', brand: ' Sachs', art: '317 650', price: 7800 },
      { type: 'analogue', brand: 'KYB', art: 'Excel-G 334', price: 4300 }]},
  ],
  body: [
    { name: 'Форсунка омывателя', offers: [
      { type: 'orig', brand: 'VAG', art: '1K0 955 979 B', price: 900 },
      { type: 'analogue', brand: 'UVP', art: '121001', price: 350 }]},
    { name: 'Зеркало левое (в сборе)', offers: [
      { type: 'orig', brand: 'VAG', art: '5Q1 832 575 S', price: 18400 },
      { type: 'analogue', brand: 'ALkar', art: '8128016', price: 6900 },
      { type: 'used', brand: 'б/у, крашеный', art: 'в цвет', price: 3800 }]},
  ],
};
const TYPE_BADGE = { orig: ['b-ok', 'Оригинал'], analogue: ['b-warn', 'Аналог'], used: ['b-info', 'Б/У'] };
let selNode = 'engine';
let partTypeFilter = 'all';
let partQuery = '';

// персонализация под конкретный VIN: цены зависят от модели
function priceFactor(car) {
  const m = (car.model || '').toLowerCase();
  if (m.includes('golf')) return 1;
  if (m.includes('rio')) return 0.72;
  if (m.includes('rav4')) return 1.35;
  if (m.includes('3 series') || car.make === 'BMW') return 1.6;
  return 1.15;
}
function personalizeOffers(car, p) {
  const f = priceFactor(car);
  return p.offers.map(o => ({ ...o, price: o.price ? Math.round(o.price * f / 100) * 100 : 0 }));
}

function renderParts(root) {
  const car = activeCar();
  if (!car) { root.innerHTML = emptyGarage(); bindEmpty(); return; }
  root.innerHTML = `
  <div class="container">
    <div class="page-head">
      <div><div class="mono dim" style="font-size:12px;letter-spacing:.1em">// ПОДБОР ПО VIN</div>
        <h2>Запчасти · ${esc(car.make)} ${esc(car.model)}</h2></div>
      <span class="badge b-info mono" title="VIN активного авто">${esc(car.vin.slice(0, 8))}…${esc(car.vin.slice(-4))}</span>
    </div>
    <div class="parts-cols">
      <div class="card card-pad hud-frame">
        <div class="field-label" style="margin:0 0 8px">Интерактивная схема — кликни узел</div>
        <svg viewBox="0 0 340 130" style="width:100%">
          <g opacity=".9">${carSVG('var(--parts-car)').replace(/<svg[^>]*>|<\/svg>/g, '')}</g>
          ${NODES.map(n => `<g class="node ${n.id === selNode ? 'sel' : ''}" data-node="${n.id}">
            <circle class="hit" cx="${n.x}" cy="${n.y}" r="20"/>
            <circle class="core" cx="${n.x}" cy="${n.y}" r="7" fill="var(--accent)" stroke="var(--accent2)" stroke-width="1.5"/>
            <text x="${n.x}" y="${n.y - 14}" text-anchor="middle">${n.label}</text></g>`).join('')}
        </svg>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
          ${NODES.map(n => `<span class="chip ${n.id === selNode ? 'on' : ''}" data-node="${n.id}">${n.label}</span>`).join('')}
        </div>
      </div>
      <div>
        <div class="card card-pad" style="padding:14px 16px;margin-bottom:14px">
          <div class="row" style="gap:10px;flex-wrap:wrap">
            <input id="partSearch" class="input" placeholder="🔍 Поиск: название или артикул…" value="${esc(partQuery)}" style="flex:1;min-width:180px"/>
            ${[['all', 'Все типы'], ['orig', 'Оригинал'], ['analogue', 'Аналог'], ['used', 'Б/У']].map(([id, lbl]) =>
              `<span class="chip ${partTypeFilter === id ? 'on' : ''}" data-tf="${id}">${lbl}</span>`).join('')}
          </div>
        </div>
        <div id="partsList">${partsListHTML(car, selNode)}</div>
      </div>
    </div>
  </div>`;
  $$('.node,.chip[data-node]').forEach(el => el.onclick = () => {
    selNode = el.dataset.node;
    $$('.node').forEach(n => n.classList.toggle('sel', n.dataset.node === selNode));
    $$('.chip[data-node]').forEach(c => c.classList.toggle('on', c.dataset.node === selNode));
    $('#partsList').innerHTML = partsListHTML(activeCar(), selNode);
  });
  $$('[data-tf]').forEach(ch => ch.onclick = () => {
    partTypeFilter = ch.dataset.tf;
    $$('[data-tf]').forEach(c => c.classList.toggle('on', c.dataset.tf === partTypeFilter));
    $('#partsList').innerHTML = partsListHTML(activeCar(), selNode);
  });
  const si = $('#partSearch');
  si.oninput = () => { partQuery = si.value.trim().toLowerCase(); $('#partsList').innerHTML = partsListHTML(activeCar(), selNode); };
}

function partsListHTML(car, nodeId) {
  const node = NODES.find(n => n.id === nodeId);
  let items = (PARTS[nodeId] || []).map(p => ({ ...p, offers: personalizeOffers(car, p) }));
  if (partTypeFilter !== 'all') items = items.map(p => ({ ...p, offers: p.offers.filter(o => o.type === partTypeFilter) })).filter(p => p.offers.length);
  if (partQuery) items = items.filter(p => (p.name + ' ' + p.offers.map(o => o.brand + ' ' + o.art).join(' ')).toLowerCase().includes(partQuery));
  return `<div class="card card-pad" style="padding-bottom:8px"><b style="font-family:Unbounded">⚙️ ${esc(node.label)}</b>
    <span class="muted" style="font-size:13px"> · подобрано по VIN · ${items.length} позиции</span></div>
    ${items.length ? items.map(p => partCardHTML(p)).join('') : '<div class="card card-pad"><div class="muted">Ничего не найдено — попробуй другой запрос или тип.</div></div>'}`;
}

function partCardHTML(p) {
  const valid = p.offers.filter(o => o.price > 0);
  const best = valid.length ? Math.min(...valid.map(o => o.price)) : 0;
  return `<div class="card part-card">
    <b style="font-size:15px">${esc(p.name)}</b>
    ${p.offers.filter(o => o.price > 0).map(o => {
      const [cls, lbl] = TYPE_BADGE[o.type];
      return `<div class="offer ${o.price === best ? 'best' : ''}">
        <span class="badge ${cls}">${lbl}</span>
        <div><b style="font-size:13.5px">${esc(o.brand)}</b><div class="art">${esc(o.art)}</div></div>
        <div style="text-align:right"><span class="price">${money(o.price)}</span>
          ${o.price === best ? '<div class="badge b-ok" style="margin-top:4px">выгодно</div>' : ''}</div>
      </div>`;
    }).join('')}
    <div class="row" style="margin-top:12px;justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" onclick="toast('Открываем Exist… (демо-интеграция)')">🛒 Купить на Exist</button>
    </div>
  </div>`;
}

/* ============================================================
   PAGE: PROFILE (профиль + штрафы + страховка)
   ============================================================ */
function renderProfile(root) {
  const car = activeCar();
  if (!state.user) { root.innerHTML = `<div class="container"><div class="card empty"><div class="big">👤</div><p class="muted">Войди, чтобы управлять профилем.</p><button class="btn btn-primary" style="margin-top:14px" onclick="navigate('/')">Войти</button></div></div>`; return; }
  root.innerHTML = `
  <div class="container">
    <div class="page-head"><div><div class="mono dim" style="font-size:12px;letter-spacing:.1em">// ПРОФИЛЬ</div><h2>${esc(state.user.name)}</h2></div>
      <button class="btn btn-ghost btn-sm" id="logout">Выйти</button></div>
    <div class="dash-cols">
      <div class="card card-pad">
        <div class="field-label" style="margin:0 0 10px">Мой гараж · ${state.cars.length}</div>
        ${state.cars.map(c => `<div class="summary-item" style="cursor:pointer" data-sw="${c.id}">
          <div class="sum-ic">${c.id === state.activeCarId ? '🟦' : '⬜'}</div>
          <div style="flex:1"><b>${esc(c.make + ' ' + c.model)}</b>
            <div class="muted mono" style="font-size:12px">${esc(c.vin)} · ${num(c.mileage, 0)} км</div></div>
          <button class="icon-btn" data-edit="${c.id}" title="Изменить пробег / VIN" style="width:32px;height:32px;font-size:13px">✎</button>
          <button class="icon-btn" data-del="${c.id}" title="Удалить" style="width:32px;height:32px;font-size:13px">✕</button>
        </div>`).join('')}
        <button class="btn btn-ghost btn-sm" style="margin-top:12px;width:100%" onclick="navigate('/')">＋ Добавить автомобиль</button>
        ${car ? `
        <div id="editCarBox" hidden style="margin-top:14px;padding:14px;border:1px solid var(--border);border-radius:16px">
          <div class="field-label" style="margin:0 0 8px">Редактирование · ${esc(car.make)} ${esc(car.model)}</div>
          <div class="form-row" style="gap:10px">
            <div class="field grow"><label class="field-label" for="edMileage">Пробег, км</label>
              <input id="edMileage" class="input mono" type="number" min="0" value="${car.mileage}"/></div>
            <div class="field grow"><label class="field-label" for="edVin">VIN</label>
              <input id="edVin" class="input mono" value="${esc(car.vin)}" maxlength="17"/></div>
          </div>
          <div class="row" style="gap:8px;margin-top:10px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" id="edCancel">Отмена</button>
            <button class="btn btn-primary btn-sm" id="edSave">Сохранить</button>
          </div>
        </div>` : ''}
      </div>
      <div class="grid" style="align-content:start">
        <div class="card card-pad">
          <div class="field-label" style="margin:0 0 10px">Штрафы ГИБДД · ${esc(car?.plate || '—')}</div>
          ${car && car.fines.length ? car.fines.map(f => `<div class="summary-item">
            <div class="sum-ic">${f.paid ? '✅' : '🚨'}</div>
            <div style="flex:1"><b style="font-size:14px">${esc(f.desc)}</b>
              <div class="muted mono" style="font-size:11.5px">${f.num} · ${fmtDate(f.date)}</div></div>
            ${f.paid ? `<span class="badge b-ok">оплачен</span>` : `<button class="btn btn-primary btn-sm" data-pay="${f.id}">${money(f.sum)}</button>`}
          </div>`).join('') : '<div class="muted" style="font-size:14px">Неоплаченных штрафов нет ✨</div>'}
        </div>
        <div class="card card-pad">
          <div class="field-label" style="margin:0 0 8px">Страхование</div>
          <div class="row spread"><span>ОСАГО до <b>${car?.policyEnd ? fmtDate(car.policyEnd) : '—'}</b></span>
            <button class="btn btn-ghost btn-sm" onclick="toast('Калькулятор ОСАГО — в v1.0')">Рассчитать</button></div>
        </div>
      </div>
    </div>
  </div>`;
  $('#logout').onclick = () => { state.user = null; save(); toast('Вышли'); navigate('/'); };
  $$('[data-sw]').forEach(el => el.onclick = (ev) => { if (ev.target.closest('[data-del],[data-edit]')) return; state.activeCarId = el.dataset.sw; save(); renderApp(); });
  $$('[data-edit]').forEach(b => b.onclick = () => {
    const c = state.cars.find(x => x.id === b.dataset.edit);
    state.activeCarId = c.id; save();
    renderProfile(root);
    const box = $('#editCarBox'); if (box) { box.hidden = false; $('#edMileage')?.focus(); }
  });
  if (car) {
    $('#edCancel').onclick = () => renderProfile(root);
    $('#edSave').onclick = () => {
      const km = parseInt($('#edMileage').value, 10);
      const vin = $('#edVin').value.trim().toUpperCase();
      if (!(km >= 0)) { toast('Проверь пробег'); return; }
      if (vin !== car.vin) {
        if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) { toast('VIN: 17 символов без I/O/Q'); return; }
        const info = decodeVin(vin);
        Object.assign(car, { vin, make: info.make, model: info.model, year: info.year, trim: info.trim, engine: info.engine, trans: info.trans, drive: info.drive, body: info.body, tank: info.tank, oilEvery: info.oilEvery, issues: info.issues, recall: info.recall });
      }
      car.mileage = km;
      if (!car.lastOilKm || car.lastOilKm > km) car.lastOilKm = Math.max(0, km - 5000);
      save(); toast('Авто обновлено ✓'); renderApp();
    };
  }
  $$('[data-del]').forEach(b => b.onclick = () => {
    state.cars = state.cars.filter(c => c.id !== b.dataset.del);
    if (!state.cars.find(c => c.id === state.activeCarId)) state.activeCarId = state.cars[0]?.id || null;
    save(); toast('Авто удалено'); renderApp();
  });
  $$('[data-pay]').forEach(b => b.onclick = () => {
    const f = activeCar().fines.find(x => x.id === b.dataset.pay);
    f.paid = true; save(); toast('Штраф оплачен ✓ (демо)'); renderApp();
  });
}

/* ============================================================
   LOGIN (маршрут #/login — редирект в онбординг-флоу)
   ============================================================ */
routes['/login'] = function (root) {
  root.innerHTML = `<div class="container" style="max-width:480px;padding-top:60px">
    <div class="card card-pad hud-frame"><h3 style="font-family:Unbounded;font-size:20px">Вход в гараж</h3>
    <p class="muted" style="font-size:14px;margin:8px 0 16px">По SMS или соцсетям. Демо — без реальной отправки.</p>
    <div class="vin-row"><input class="input mono" placeholder="+7 900 000-00-00" id="lph"/><button class="btn btn-primary" id="lsms">SMS-код</button></div>
    <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="chip lso" data-s="Яндекс">🟡 Яндекс</button><button class="chip lso" data-s="VK">🔵 VK</button><button class="chip lso" data-s="Google">🟢 Google</button></div>
    </div></div>`;
  $('#lsms').onclick = () => { state.user = { name: 'Автолюбитель', phone: $('#lph').value || '+7 900 000-00-00', soc: 'sms' }; save(); toast('Вошёл ✦'); navigate(state.cars.length ? '/dashboard' : '/'); };
  $$('.lso').forEach(b => b.onclick = () => { state.user = { name: `Владелец (${b.dataset.s})`, phone: '—', soc: b.dataset.s }; save(); toast('Вошёл через ' + b.dataset.s); navigate(state.cars.length ? '/dashboard' : '/'); });
};

/* ---------------- toast ---------------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------------- тема (светлая/тёмная) ---------------- */
const THEME_KEY = 'garage.theme';
function applyThemeIcon(){
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const moon = document.querySelector('#themeToggle .ic-moon');
  const sun  = document.querySelector('#themeToggle .ic-sun');
  if (moon && sun){ moon.style.display = light ? 'none' : ''; sun.style.display = light ? '' : 'none'; }
}
function initThemeToggle(){
  const btn = $('#themeToggle');
  if (!btn || btn.dataset.ready) return;
  btn.dataset.ready = '1';
  btn.onclick = () => {
    const root = document.documentElement;
    const light = root.getAttribute('data-theme') === 'light';
    if (light) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','light');
    try { localStorage.setItem(THEME_KEY, light ? 'dark' : 'light'); } catch(e){}
    applyThemeIcon();
    toast(light ? 'Тёмная тема 🌙' : 'Светлая тема ☀️');
  };
  applyThemeIcon();
}

/* ---------------- boot ---------------- */
buildNav();
initThemeToggle();
window.addEventListener('hashchange', () => { renderApp(); initThemeToggle(); });
// если гараж пуст и юзер не входил — ничего не делаем; кнопка "демо" на дашборде
renderApp();
window.navigate = navigate; window.toast = toast; // для inline-обработчиков
