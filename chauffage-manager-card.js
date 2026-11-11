/* Chauffage Manager - carte Lovelace (type: custom:chauffage-manager-card) */
const MODES = [
  ["off", "Off", "#9e9e9e"], ["frost_protection", "Hors-gel", "#42a5f5"], ["eco", "Éco", "#26a69a"],
  ["comfort_minus_2", "Confort -2", "#ffca28"], ["comfort_minus_1", "Confort -1", "#ffa726"], ["comfort", "Confort", "#ef5350"],
];
const MODE = Object.fromEntries(MODES.map((m) => [m[0], { label: m[1], color: m[2] }]));
const MODE_OPTIONS = MODES.map((m) => ({ value: m[0], label: m[1] }));
const PILOT = { Off: "off", FrostProtection: "frost_protection", Eco: "eco", ComfortMinus2: "comfort_minus_2", ComfortMinus1: "comfort_minus_1", Comfort: "comfort" };
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const TABS = { rooms: "Pièces", schedules: "Plannings", absence: "Absence", config: "Configuration" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const CARD_DEFAULTS = { show_power: true, show_temperature: true, show_mode: true, show_all_off: true, group_by_floor: false, temp_step: 0.5 };
const cssColor = (v) => (!v || v === "state" ? "" : /^(#|rgb|hsl|var\()/.test(v) ? v : `var(--${v}-color)`);
const toMin = (t) => { const [h, m] = t.split(":"); return +h * 60 + +m; };

function slotAt(slots, weekday, minute, hol = false) {
  const eligible = (day, holiday) => {
    if (holiday) { const h = slots.filter((x) => x.holiday && x.days.includes(day)); if (h.length) return h; }
    return slots.filter((x) => !x.holiday && x.days.includes(day));
  };
  for (let back = 0; back < 8; back++) {
    const day = (((weekday - back) % 7) + 7) % 7;
    let best = null;
    for (const s of eligible(day, back === 0 && hol)) {
      const st = toMin(s.time || "00:00");
      if (back === 0 && st > minute) continue;
      if (!best || st > toMin(best.time)) best = s;
    }
    if (best) return best;
  }
  return null;
}

function timeline(sched) {
  const slots = sched.slots.filter((s) => s.time);
  const row = (label, pts, at, title = "") => {
    const segs = pts.map((p, i) => {
      const end = i + 1 < pts.length ? pts[i + 1] : 1440;
      const s = at(p);
      const c = s ? MODE[s.mode].color : "transparent";
      return `<i style="width:${(end - p) / 14.4}%;background:${c}" title="${s ? MODE[s.mode].label : ""}"></i>`;
    }).join("");
    return `<div class="tr"${title ? ` title="${title}"` : ""}><b>${label}</b><div class="bar">${segs}</div></div>`;
  };
  const points = (list) => [...new Set([0, ...list.map((s) => toMin(s.time))])].sort((a, b) => a - b);
  let rows = [0, 1, 2, 3, 4, 5, 6].map((d) => row(DAYS[d], points(slots.filter((s) => !s.holiday && s.days.includes(d))), (p) => slotAt(slots, d, p))).join("");
  const hol = slots.filter((s) => s.holiday);
  if (hol.length) {
    const ref = Math.min(...hol.flatMap((s) => s.days));
    rows += row("F", points(hol.filter((s) => s.days.includes(ref))), (p) => slotAt(slots, ref, p, true), `Jour férié (créneaux fériés du ${["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"][ref]})`);
  }
  const legend = MODES.map((m) => `<span><i style="background:${m[2]}"></i>${m[1]}</span>`).join("");
  return `<div class="tl">${rows}<div class="legend">${legend}</div></div>`;
}

const CSS = `
:host{display:block}
ha-card{overflow:hidden}
.wrap{padding:16px}
.tabs{display:flex;border-bottom:1px solid var(--divider-color);padding:0 8px}
.tabs button{flex:1;background:none;border:none;padding:12px 8px;cursor:pointer;color:var(--secondary-text-color);font:inherit;font-weight:500;border-bottom:2px solid transparent;margin-bottom:-1px}
.tabs button.on{color:var(--primary-color);border-bottom-color:var(--primary-color)}
.title{font-size:var(--ha-card-header-font-size,24px);line-height:1.2;color:var(--ha-card-header-color,var(--primary-text-color));padding:16px 16px 0;letter-spacing:-.012em}
.sub{font-size:var(--ha-font-size-l,16px);font-weight:500;margin:16px 0 8px}
.row{border:1px solid var(--divider-color);border-radius:12px;padding:12px;margin-bottom:8px}
.head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.head>ha-icon{color:var(--secondary-text-color);--mdc-icon-size:24px}
.name{font-weight:500;flex:1;min-width:110px;color:var(--primary-text-color)}
.name small{display:block;font-weight:400;color:var(--secondary-text-color);font-size:.85em}
.temp{color:var(--secondary-text-color)}
.head>ha-icon.heating{color:var(--heat-color,var(--state-climate-heat-color,#ff8c00))}
.pw{display:inline-flex;align-items:center;gap:2px;color:var(--secondary-text-color);font-size:.85em}
.pw.on{color:var(--heat-color,var(--state-climate-heat-color,#ff8c00));font-weight:500}
.pw ha-icon{--mdc-icon-size:14px}
.badge.warn{background:var(--warning-color,#ff9800)}
.badge{padding:3px 10px;border-radius:12px;color:#fff;font-size:.8em;font-weight:500}
.seg{display:flex;border:1px solid var(--divider-color);border-radius:18px;overflow:hidden}
.seg button{border:none;background:none;padding:6px 14px;cursor:pointer;color:var(--primary-text-color);font:inherit}
.seg button.on{background:var(--primary-color);color:var(--text-primary-color,#fff)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}
.chip{border:1px solid var(--c);background:none;color:var(--primary-text-color);border-radius:16px;padding:5px 12px;cursor:pointer;font:inherit;font-size:.9em}
.chip.on{background:var(--c);color:#fff}
.step{display:flex;align-items:center;gap:4px;margin-left:8px}
.btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border:1px solid var(--divider-color);background:none;color:var(--primary-color);border-radius:18px;cursor:pointer;font:inherit;font-weight:500}
.btn.primary{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
.btn.text{border-color:transparent}
.btn ha-icon{--mdc-icon-size:18px}
.ib{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:50%;background:none;color:var(--secondary-text-color);cursor:pointer;padding:0}
.ib:hover{background:var(--secondary-background-color)}
.ib.danger{color:var(--error-color)}
.ib ha-icon{--mdc-icon-size:20px}
.step .ib{border:1px solid var(--divider-color)}
.bar{display:flex;height:10px;flex:1;border-radius:5px;overflow:hidden;background:var(--divider-color)}
.bar i{display:block;height:100%}
.tl{margin-top:10px}
.tl .tr{display:flex;align-items:center;gap:6px;margin:3px 0}
.tl b{width:12px;font-size:.75em;color:var(--secondary-text-color)}
.legend{display:flex;flex-wrap:wrap;gap:10px;font-size:.75em;color:var(--secondary-text-color);margin-top:8px}
.legend i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
.floor{display:flex;align-items:center;gap:10px;margin:16px 0 8px;font-size:.8em;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--secondary-text-color)}
.floor::after{content:"";flex:1;height:1px;background:var(--divider-color)}
.floor:first-child{margin-top:0}
.sched{margin-top:10px}
.slot{border:1px solid var(--divider-color);border-radius:12px;padding:10px;margin-bottom:8px}
.slot .top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.days{display:flex;gap:4px}
.days button{width:30px;height:30px;border-radius:50%;border:1px solid var(--divider-color);background:none;cursor:pointer;color:var(--primary-text-color);font:inherit;font-size:.85em;padding:0}
.days button.on{background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:var(--primary-color)}
.actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:flex-end}
.err{background:var(--error-color);color:#fff;padding:8px 12px;border-radius:8px;margin-bottom:12px}
.info{display:flex;align-items:center;gap:8px;background:var(--primary-color);color:var(--text-primary-color,#fff);padding:8px 12px;border-radius:8px;margin-bottom:12px}
.muted{color:var(--secondary-text-color)}
.hint{color:var(--secondary-text-color);font-size:.85em;margin:4px 0 8px}
.li{display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid var(--divider-color)}
.li:last-of-type{border-bottom:none}
.li .name{flex:1}

.btn,.ib,.chip,.seg button,.tabs button,.days button{position:relative;overflow:hidden;transition:background-color .2s,color .2s,box-shadow .2s,border-color .2s,transform .1s,opacity .2s;-webkit-tap-highlight-color:transparent}
.btn:hover,.chip:hover,.seg button:hover,.tabs button:hover,.days button:hover{background-color:color-mix(in srgb,var(--primary-color) 12%,transparent)}
.btn.primary:hover,.seg button.on:hover,.days button.on:hover{background-color:var(--primary-color);filter:brightness(1.12);box-shadow:var(--ha-card-box-shadow,0 2px 6px rgba(0,0,0,.25))}
.chip.on:hover{background-color:var(--c);filter:brightness(1.1)}
.btn:active,.ib:active,.chip:active,.days button:active{transform:scale(.96)}
.btn:focus-visible,.ib:focus-visible,.chip:focus-visible,.seg button:focus-visible,.tabs button:focus-visible,.days button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
.btn[disabled]{pointer-events:none}
.rip{position:absolute;border-radius:50%;background:currentColor;opacity:.3;transform:scale(0);pointer-events:none;animation:rip .55s ease-out forwards}
@keyframes rip{to{transform:scale(2);opacity:0}}
.btn.busy{opacity:.85}
.btn.ok{background:var(--success-color,#43a047);border-color:var(--success-color,#43a047);color:#fff}
.btn.ko{background:var(--error-color,#db4437);border-color:var(--error-color,#db4437);color:#fff;animation:shake .4s}
.spin{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.row,.slot{transition:box-shadow .2s,border-color .2s}
.badge.phase{--pc:var(--warning-color,#ff9800);border:1px solid var(--pc);color:var(--pc);background:transparent;background:color-mix(in srgb,var(--pc) 16%,transparent)}
.badge.phase.solid{background:var(--pc);color:#fff}
.badge.phase.resume{--pc:var(--primary-color,#03a9f4)}
.badge.pulse{animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{50%{opacity:.55}}
.sub small{font-weight:400;color:var(--secondary-text-color)}
`;

async function ensureHA() {
  if (!customElements.get("ha-form")) {
    try {
      const h = await window.loadCardHelpers();
      const c = await h.createCardElement({ type: "entities", entities: [] });
      await c.constructor.getConfigElement();
    } catch (e) { /* ignore */ }
    try { await Promise.race([customElements.whenDefined("ha-form"), new Promise((_, rej) => setTimeout(rej, 5000))]); }
    catch (e) { /* ignore */ }
  }
  return !!customElements.get("ha-form");
}

class ChauffageManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null; this._edit = null; this._abs = null; this._absDirty = false;
    this._temps = {}; this._error = ""; this._sig = ""; this._tab = null; this._forms = [];
    this._btnState = {}; this._btnT = {};
    const r = this.shadowRoot;
    r.addEventListener("click", (e) => this._click(e));
    r.addEventListener("pointerdown", (e) => this._ripple(e));
  }
  setConfig(config) {
    this._config = { tabs: ["rooms", "schedules", "absence", "config"], ...config };
    if (!this._tab || !this._config.tabs.includes(this._tab)) this._tab = this._config.tabs.includes(this._config.default_tab) ? this._config.default_tab : this._config.tabs[0];
    this._render();
  }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6 }; }
  static getStubConfig() { return {}; }
  static async getConfigElement() { return document.createElement("chauffage-manager-card-editor"); }
  connectedCallback() {
    if (this._hass) { this._subscribe(); this._load(); }
    this._cd = setInterval(() => this._tickCountdown(), 1000);
  }
  disconnectedCallback() {
    if (this._unsub) { this._unsub(); this._unsub = null; }
    clearInterval(this._cd);
  }
  _fmt(sec) { const r = Math.max(0, Math.round(sec)); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; }
  _tickCountdown() {
    this.shadowRoot.querySelectorAll("[data-left]").forEach((el) => {
      el.textContent = `${el.dataset.prefix} ${this._fmt(Number(el.dataset.left) - (Date.now() - this._dataAt) / 1000)}`;
    });
  }
  _pauseBadge(t) {
    const st = t.pause_state || (t.paused ? "paused" : null);
    if (!st) return "";
    if (st === "paused") return `<span class="badge phase solid">En pause (ouverture)</span>`;
    const pre = st === "pausing" ? "Pause dans" : "Reprise dans";
    return `<span class="badge phase pulse ${st === "resuming" ? "resume" : ""}" data-prefix="${pre}" data-left="${t.pause_in ?? 0}">${pre} ${this._fmt(t.pause_in ?? 0)}</span>`;
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) { this._loaded = true; this._load(); this._ensureHA(); }
    this._subscribe();
    this._forms.forEach((f) => { f.hass = hass; });
    const sig = this._liveSig();
    if (sig !== this._sig) { this._sig = sig; if (this._tab === "rooms" && !this._edit) this._render(); }
  }
  async _ensureHA() {
    this._haReady = await ensureHA();
    this._haFail = !this._haReady;
    this._render();
  }
  _subscribe() {
    if (this._unsub || this._subbing || !this._hass) return;
    this._subbing = true;
    this._hass.connection.subscribeEvents(() => this._load(), "chauffage_manager_updated")
      .then((u) => { this._subbing = false; if (this.isConnected) this._unsub = u; else u(); })
      .catch(() => { this._subbing = false; });
  }
  async _load() {
    try {
      this._data = await this._hass.callWS({ type: "chauffage_manager/get" });
      this._dataAt = Date.now();
      if (!this._absDirty) this._abs = JSON.parse(JSON.stringify(this._data.absence));
      if (!this._opnDirty) this._opn = { ...this._data.openings };
      if (!this._tmpDirty) this._tmp = { ...this._data.temperatures };
      if (!this._holDirty) this._hol = { entity: this._data.holidays?.entity || undefined };
      this._error = "";
    } catch (e) { this._error = e.message || "Intégration non disponible"; }
    this._render();
  }
  _liveSig() {
    if (!this._data) return "";
    return this._data.heaters.map((h) => [h.entity, h.climate, h.power_entity].map((id) => {
      const s = id && this._hass.states[id];
      return s ? `${s.state}|${s.attributes.temperature}|${s.attributes.current_temperature}` : "";
    }).join(",")).join(";");
  }
  _admin() { return !!this._hass?.user?.is_admin; }
  _toast(msg) {
    this._error = String(msg?.message || msg);
    this._render();
    clearTimeout(this._tt);
    this._tt = setTimeout(() => { this._error = ""; this._render(); }, 5000);
  }
  _ws(msg) { return this._hass.callWS(msg); }

  /* ---------- état des chauffages ---------- */
  _hstate(h) {
    const s = this._hass.states[h.entity];
    if (!s) return {};
    const pw = h.power_entity && this._hass.states[h.power_entity];
    const power = pw && pw.state !== "unavailable" && pw.state !== "unknown" && !isNaN(Number(pw.state)) ? Number(pw.state) : null;
    let heating = power != null ? power > Number(h.power_threshold ?? 10) : null;
    if (h.type === "pilot_wire") {
      const c = h.climate && this._hass.states[h.climate];
      return { mode: PILOT[s.state], cur: c?.attributes.current_temperature, power, heating };
    }
    if (heating == null && s.attributes.hvac_action) heating = s.attributes.hvac_action === "heating";
    const T = this._data?.temperatures || {}, target = Number(s.attributes.temperature);
    const mode = s.state === "off" ? "off" : ["comfort", "comfort_minus_1", "comfort_minus_2", "eco", "frost_protection"].find((k) => Math.abs(Number(T[k]) - target) < 0.01) || "comfort";
    return { mode, temp: s.attributes.temperature, cur: s.attributes.current_temperature, power, heating };
  }
  _info(t) {
    const hs = t.members.map((id) => this._data.heaters.find((h) => h.id === id)).filter(Boolean);
    const sts = hs.map((h) => ({ h, ...this._hstate(h) }));
    const modes = sts.map((s) => s.mode).filter(Boolean);
    const curs = sts.map((s) => Number(s.cur)).filter((v) => !isNaN(v) && v !== 0);
    const powers = sts.map((x) => x.power).filter((v) => v != null);
    return {
      hs, mode: modes[0], mixed: new Set(modes).size > 1,
      heating: sts.some((x) => x.heating === true),
      power: powers.length ? powers.reduce((a, b) => a + b) : null,
      cur: curs.length ? curs.reduce((a, b) => a + b) / curs.length : null,
      thermo: sts.find((s) => s.h.type === "thermostat"),
    };
  }
  _tempOf(t) {
    const th = this._info(t).thermo;
    return this._temps[t.id] ?? (th && Number(th.temp) > 0 ? Number(th.temp) : 19);
  }

  /* ---------- rendu ---------- */
  _render() {
    if (!this._config) return;
    const admin = this._admin();
    const tabs = this._config.tabs.filter((t) => admin || t !== "config");
    if (!tabs.includes(this._tab)) this._tab = tabs[0];
    const bar = tabs.length > 1 ? `<div class="tabs">${tabs.map((t) => `<button data-a="tab" data-v="${t}" class="${t === this._tab ? "on" : ""}">${TABS[t]}</button>`).join("")}</div>` : "";
    const body = !this._data ? `<div class="muted">${this._error ? "" : "Chargement…"}</div>` : this[`_v_${this._tab}`]();
    const hc = cssColor(this._config.heating_color);
    this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card${hc ? ` style="--heat-color:${esc(hc)}"` : ""}>${this._config.title ? `<div class="title">${esc(this._config.title)}</div>` : ""}${bar}<div class="wrap">${this._error ? `<div class="err">${esc(this._error)}</div>` : ""}${body}</div></ha-card>`;
    this._mountForms();
  }

  _floorRank(name) {
    const f = Object.values(this._hass.floors || {}).find((x) => String(x.name).toLowerCase() === name.toLowerCase());
    return f && typeof f.level === "number" ? f.level : 1000;
  }
  _floorSelector() {
    const names = new Set(Object.values(this._hass.floors || {}).map((f) => f.name));
    [...this._data.heaters, ...this._data.groups].forEach((x) => x.floor && names.add(x.floor));
    return names.size ? { select: { custom_value: true, mode: "dropdown", options: [...names].map((n) => ({ value: n, label: n })) } } : { text: {} };
  }
  _preview() {
    const pv = this.shadowRoot.getElementById("pv");
    if (this._edit && pv) pv.innerHTML = timeline(this._edit);
  }
  _ripple(e) {
    const el = e.target.closest(".btn,.ib,.chip,.seg button,.tabs button,.days button");
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
    const s = document.createElement("span");
    s.className = "rip";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    el.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }
  _setBtn(action, state, ms) {
    this._btnState = { ...this._btnState, [action]: state };
    this._render();
    clearTimeout(this._btnT[action]);
    if (ms) this._btnT[action] = setTimeout(() => { this._btnState = { ...this._btnState, [action]: "" }; this._render(); }, ms);
  }
  _saveBtn(action, label = "Enregistrer") {
    const st = this._btnState[action] || "";
    const icon = st === "busy" ? `<span class="spin"></span>` : st === "ok" ? this._icon("check") : st === "ko" ? this._icon("alert-circle-outline") : "";
    return `<button class="btn primary ${st}" data-a="${action}" ${st === "busy" ? "disabled" : ""}>${icon}${st === "ok" ? "Enregistré" : label}</button>`;
  }
  _icon(name, cls = "") { return `<ha-icon${cls ? ` class="${cls}"` : ""} icon="mdi:${name}"></ha-icon>`; }

  _v_rooms() {
    const d = this._data;
    if (!d.targets.length) return `<div class="muted">Aucun chauffage configuré. Ajoutez-en dans l'onglet Configuration.</div>`;
    const cfg = this._config;
    const tStep = Number(cfg.temp_step) || 0.5;
    const rowHtml = (t) => {
      const i = this._info(t);
      const onlyThermo = i.hs.length > 0 && i.hs.every((h) => h.type === "thermostat");
      const target = i.thermo ? Number(i.thermo.temp) : 0;
      const m = onlyThermo ? (i.mode === "off" ? MODE.off : target > 0 ? { label: `${target.toFixed(1)}°C`, color: (MODE[i.mode] || MODE.comfort).color } : null) : i.mode && MODE[i.mode];
      const sub = t.kind === "group" ? `<small>${i.hs.map((h) => esc(h.name)).join(" + ")}</small>` : "";
      let ctl;
      if (t.control === "manual") {
        const chips = (onlyThermo ? MODES.filter((x) => x[0] === "off") : MODES).map((x) => `<button class="chip ${i.mode === x[0] ? "on" : ""}" style="--c:${x[2]}" data-a="mode" data-t="${t.id}" data-v="${x[0]}">${x[1]}</button>`).join("");
        const step = i.thermo ? `<span class="step"><button class="ib" data-a="temp" data-t="${t.id}" data-d="-${tStep}">${this._icon("minus")}</button><b>${this._tempOf(t).toFixed(1)}°C</b><button class="ib" data-a="temp" data-t="${t.id}" data-d="${tStep}">${this._icon("plus")}</button></span>` : "";
        ctl = `<div class="chips">${chips}${step}</div>`;
      } else {
        ctl = `<div class="sched" data-form="sched" data-i="${t.id}"></div>`;
      }
      return `<div class="row"><div class="head">${this._icon(t.kind === "group" ? "radiator-disabled" : "radiator", i.heating ? "heating" : "")}<div class="name">${esc(t.name)}${sub}</div>
        ${i.power != null && cfg.show_power !== false ? `<span class="pw ${i.heating ? "on" : ""}">${this._icon("flash")}${Math.round(i.power)} W</span>` : ""}
        ${i.cur != null && cfg.show_temperature !== false ? `<span class="temp">${i.cur.toFixed(1)}°C</span>` : ""}
        ${this._pauseBadge(t)}
        ${m && cfg.show_mode !== false ? `<span class="badge" style="background:${m.color}">${m.label}${i.mixed ? "…" : ""}</span>` : ""}
        <div class="seg"><button data-a="control" data-t="${t.id}" data-v="auto" class="${t.control === "auto" ? "on" : ""}">Auto</button><button data-a="control" data-t="${t.id}" data-v="manual" class="${t.control === "manual" ? "on" : ""}">Manuel</button></div></div>${ctl}</div>`;
    };
    const floorOf = (t) => (t.kind === "group" ? d.groups : d.heaters).find((x) => x.id === t.id)?.floor || "";
    let rows;
    if (this._config.group_by_floor && d.targets.some(floorOf)) {
      const byFloor = new Map();
      d.targets.forEach((t) => { const f = floorOf(t); if (!byFloor.has(f)) byFloor.set(f, []); byFloor.get(f).push(t); });
      const keys = [...byFloor.keys()].sort((a, b) => (a === "") - (b === "") || (a && b ? this._floorRank(a) - this._floorRank(b) : 0));
      rows = keys.map((k) => `<div class="floor">${esc(k || "Sans étage")}</div>${byFloor.get(k).map(rowHtml).join("")}`).join("");
    } else rows = d.targets.map(rowHtml).join("");
    const banner = (d.absence.active ? `<div class="info">${this._icon("home-export-outline")}Mode absence actif</div>` : "") + (d.holidays?.today ? `<div class="info">${this._icon("calendar-star")}Jour férié aujourd'hui</div>` : "");
    return `${banner}${rows}${cfg.show_all_off !== false ? `<div class="actions"><button class="btn" data-a="alloff">${this._icon("power")}Tout éteindre</button></div>` : ""}`;
  }

  _v_schedules() {
    const admin = this._admin();
    const e = this._edit;
    if (e && e.kind === "schedule") {
      const slotHtml = (s, i) => `<div class="slot"><div class="top"><div class="days">${DAYS.map((l, d) => `<button data-a="day" data-i="${i}" data-d="${d}" class="${s.days.includes(d) ? "on" : ""}">${l}</button>`).join("")}</div>
        <button class="ib danger" data-a="delslot" data-i="${i}" title="Supprimer le créneau">${this._icon("delete")}</button></div>
        <div data-form="slot" data-i="${i}"></div></div>`;
      const normal = e.slots.map((s, i) => (s.holiday ? "" : slotHtml(s, i))).join("");
      const feries = e.slots.map((s, i) => (s.holiday ? slotHtml(s, i) : "")).join("");
      return `<div data-form="sname"></div>
        <div class="hint">Chaque créneau s'applique à partir de son heure jusqu'au suivant. Les thermostats prennent la température du mode (voir Configuration).</div>
        <div class="sub">Jours normaux</div>${normal}
        <div class="actions" style="justify-content:flex-start"><button class="btn" data-a="addslot">${this._icon("plus")}Créneau</button></div>
        <div class="sub">Jours fériés <small>(optionnel)</small></div>
        <div class="hint">Un jour férié suit les créneaux fériés du jour de la semaine correspondant (ex. un férié un mercredi utilise les créneaux fériés « M » du mercredi). S'il n'y en a pas pour ce jour, le planning normal s'applique. Le calendrier des jours fériés se choisit dans Configuration.</div>${feries}
        <div class="actions" style="justify-content:flex-start"><button class="btn" data-a="addslot" data-hol="1">${this._icon("plus")}Créneau férié</button></div>
        <div id="pv">${timeline(e)}</div>
        <div class="actions"><button class="btn text" data-a="cancel">Annuler</button>${this._saveBtn("save")}</div>`;
    }
    const list = this._data.schedules.map((s) => {
      const users = this._data.targets.filter((t) => t.schedule_id === s.id).map((t) => esc(t.name)).join(", ");
      return `<div class="row"><div class="head">${this._icon("calendar-clock")}<div class="name">${esc(s.name)}<small>${users ? "Utilisé par : " + users : "Non assigné"}${s.slots.some((x) => x.holiday) ? " · jours fériés" : ""}</small></div>
        ${admin ? `<button class="ib" data-a="edit" data-k="schedule" data-id="${s.id}" title="Modifier">${this._icon("pencil")}</button><button class="ib danger" data-a="del" data-k="schedule" data-id="${s.id}" title="Supprimer">${this._icon("delete")}</button>` : ""}</div>${timeline(s)}</div>`;
    }).join("") || `<div class="muted">Aucun planning.</div>`;
    return `${list}${admin ? `<div class="actions"><button class="btn primary" data-a="new" data-v="schedule">${this._icon("plus")}Nouveau planning</button></div>` : ""}
      <div class="hint">L'assignation d'un planning se fait dans l'onglet Pièces (mode Auto).</div>`;
  }

  _v_absence() {
    const status = this._data.absence.active ? `<div class="info">${this._icon("home-export-outline")}Absence en cours</div>` : `<div class="hint">Absence = plus aucune des personnes sélectionnées à la maison.</div>`;
    return `${status}<div data-form="absence"></div>${this._admin() ? `<div class="actions">${this._saveBtn("abs-save")}</div>` : ""}`;
  }

  _v_config() {
    const e = this._edit;
    if (e && (e.kind === "heater" || e.kind === "group")) {
      return `<div class="sub">${e.id ? "Modifier" : "Nouveau"} ${e.kind === "heater" ? "chauffage" : "groupe"}</div><div data-form="${e.kind}"></div>
        <div class="actions"><button class="btn text" data-a="cancel">Annuler</button>${this._saveBtn("save")}</div>`;
    }
    const row = (k, x, sub, icon) => `<div class="li">${this._icon(icon)}<div class="name">${esc(x.name)}<small>${sub}</small></div><button class="ib" data-a="edit" data-k="${k}" data-id="${x.id}" title="Modifier">${this._icon("pencil")}</button><button class="ib danger" data-a="del" data-k="${k}" data-id="${x.id}" title="Supprimer">${this._icon("delete")}</button></div>`;
    const hs = this._data.heaters.map((h) => row("heater", h, `${h.type === "pilot_wire" ? "Fil pilote" : "Thermostat"} · ${esc(h.entity)}`, "radiator")).join("") || `<div class="muted">Aucun chauffage.</div>`;
    const gs = this._data.groups.map((g) => row("group", g, g.members.map((m) => esc(this._data.heaters.find((h) => h.id === m)?.name || m)).join(" + "), "radiator-disabled")).join("") || `<div class="muted">Aucun groupe.</div>`;
    return `<div class="sub" style="margin-top:0">Chauffages</div>${hs}<div class="actions"><button class="btn primary" data-a="new" data-v="heater">${this._icon("plus")}Chauffage</button></div>
      <div class="sub">Groupes</div>${gs}<div class="actions"><button class="btn primary" data-a="new" data-v="group">${this._icon("plus")}Groupe</button></div>
      <div class="sub">Températures des modes</div><div class="hint">Température appliquée aux thermostats (climate) pour chaque mode : boutons, plannings, absence et ouvertures. « Off » éteint simplement le thermostat.</div><div data-form="temperatures"></div>
      <div class="actions">${this._saveBtn("tmp-save")}</div>
      <div class="sub">Jours fériés</div><div class="hint">Choisissez un calendrier de jours fériés (intégration « Jours fériés » de Home Assistant). Les plannings peuvent avoir des créneaux dédiés à ces jours.${this._data.holidays?.today ? " Aujourd'hui est un jour férié." : ""}</div><div data-form="holidays"></div>
      <div class="actions">${this._saveBtn("hol-save")}</div>
      <div class="sub">Ouvertures</div><div class="hint">Quand une ouverture reste ouverte au-delà du délai, le chauffage passe en pause puis reprend sa consigne à la fermeture. Les ouvertures se choisissent dans chaque chauffage ou groupe.</div><div data-form="openings"></div>
      <div class="actions">${this._saveBtn("opn-save")}</div>`;
  }

  /* ---------- formulaires Home Assistant (ha-form) ---------- */
  _formDef(kind, idx) {
    const text = { text: {} };
    const dropdown = (options) => ({ select: { mode: "dropdown", options } });
    if (kind === "absence") {
      return {
        data: this._abs,
        schema: [
          { name: "persons", selector: { entity: { domain: "person", multiple: true } } },
          { name: "mode", selector: dropdown(MODE_OPTIONS) },
          { name: "control", selector: dropdown([{ value: "manual", label: "Manuel (applique le mode d'absence)" }, { value: "auto", label: "Automatique (suit le planning)" }]) },
          { name: "restore", selector: { boolean: {} } },
        ],
        labels: { persons: "Personnes", mode: "Mode du chauffage en absence", control: "Programmation en absence", restore: "Restaurer l'état au retour" },
        change: (v) => {
          this._abs = { ...this._abs, ...v }; this._absDirty = true;
          if (this._data?.absence?.active && this._admin()) { clearTimeout(this._absT); this._absT = setTimeout(() => this._saveAbsence(), 600); }
        },
      };
    }
    if (kind === "temperatures") {
      const num = { number: { min: 0, max: 35, step: 0.5, unit_of_measurement: "°C", mode: "box" } };
      return {
        data: this._tmp,
        schema: [{ type: "grid", name: "", flatten: true, schema: ["comfort", "comfort_minus_1", "comfort_minus_2", "eco", "frost_protection"].map((name) => ({ name, required: true, selector: num })) }],
        labels: { comfort: "Confort", comfort_minus_1: "Confort -1", comfort_minus_2: "Confort -2", eco: "Éco", frost_protection: "Hors-gel" },
        change: (v) => { this._tmp = { ...this._tmp, ...v }; this._tmpDirty = true; },
      };
    }
    if (kind === "holidays") {
      return {
        data: this._hol,
        schema: [{ name: "entity", selector: { entity: { domain: "calendar" } } }],
        labels: { entity: "Calendrier des jours fériés" },
        change: (v) => { this._hol = { ...this._hol, ...v }; this._holDirty = true; },
      };
    }
    if (kind === "openings") {
      const num = { number: { min: 0, max: 120, step: 1, unit_of_measurement: "min", mode: "box" } };
      return {
        data: this._opn,
        schema: [
          { name: "delay", required: true, selector: num },
          { name: "resume_delay", required: true, selector: num },
          { name: "mode", required: true, selector: dropdown(MODE_OPTIONS) },
        ],
        labels: { delay: "Délai avant la pause", resume_delay: "Délai avant la reprise", mode: "Mode pendant l'ouverture" },
        change: (v) => { this._opn = { ...this._opn, ...v }; this._opnDirty = true; },
      };
    }
    if (kind === "sched") {
      const t = this._data.targets.find((x) => x.id === idx);
      if (!t) return null;
      return {
        data: { schedule: t.schedule_id || "__none__" },
        schema: [{ name: "schedule", selector: dropdown([{ value: "__none__", label: "— Aucun planning —" }, ...this._data.schedules.map((x) => ({ value: x.id, label: x.name }))]) }],
        labels: { schedule: "Planning" },
        change: (v) => {
          const next = v.schedule && v.schedule !== "__none__" ? v.schedule : null;
          if (next === (t.schedule_id || null)) return;
          const item = { ...(t.kind === "group" ? this._data.groups : this._data.heaters).find((x) => x.id === t.id) };
          delete item.id;
          item.schedule_id = next;
          this._ws({ type: "chauffage_manager/save", kind: t.kind, item_id: t.id, value: item }).catch((err) => this._toast(err));
        },
      };
    }
    const e = this._edit;
    if (kind === "sname") {
      return { data: { name: e.name }, schema: [{ name: "name", required: true, selector: text }], labels: { name: "Nom du planning" }, change: (v) => { e.name = v.name || ""; } };
    }
    if (kind === "slot") {
      const s = e.slots[+idx];
      return {
        data: { time: `${s.time || "00:00"}:00`, mode: s.mode },
        schema: [{ type: "grid", name: "", flatten: true, schema: [
          { name: "time", required: true, selector: { time: {} } },
          { name: "mode", required: true, selector: dropdown(MODE_OPTIONS) },
        ] }],
        labels: { time: "Heure", mode: "Mode" },
        change: (v) => {
          s.time = String(v.time || "").slice(0, 5); s.mode = v.mode;
          this._preview();
        },
      };
    }
    if (kind === "heater") {
      const pilot = e.type === "pilot_wire";
      let entitySel = { entity: { domain: "climate" } };
      if (pilot) {
        const ids = Object.keys(this._hass.states).filter((id) => id.startsWith("select.") && (this._hass.states[id].attributes.options || []).some((o) => o in PILOT));
        entitySel = { entity: ids.length ? { include_entities: ids } : { domain: "select" } };
      }
      return {
        data: { name: e.name, floor: e.floor || undefined, type: e.type, entity: e.entity || undefined, climate: e.climate || undefined, power_entity: e.power_entity || undefined, power_threshold: e.power_threshold ?? 10, openings: e.openings || [] },
        schema: [
          { name: "name", required: true, selector: text },
          { name: "floor", selector: this._floorSelector() },
          { name: "type", required: true, selector: dropdown([{ value: "pilot_wire", label: "Fil pilote (select)" }, { value: "thermostat", label: "Thermostat (climate)" }]) },
          { name: "entity", required: true, selector: entitySel },
          ...(pilot ? [{ name: "climate", selector: { entity: { domain: "climate" } } }] : []),
          { name: "power_entity", selector: { entity: { domain: "sensor", device_class: "power" } } },
          { name: "power_threshold", selector: { number: { min: 0, max: 5000, step: 1, unit_of_measurement: "W", mode: "box" } } },
          { name: "openings", selector: { entity: { domain: "binary_sensor", multiple: true } } },
        ],
        labels: { name: "Nom", floor: "Étage (optionnel)", type: "Type", power_entity: "Capteur de puissance (optionnel)", power_threshold: "Seuil de chauffe", entity: pilot ? "Entité du fil pilote (select)" : "Entité thermostat (climate)", climate: "Entité climate pour la température (optionnel)", openings: "Ouvertures (fenêtres, portes) qui mettent en pause" },
        change: (v) => {
          const typeChanged = v.type !== e.type;
          Object.assign(e, { name: v.name || "", floor: v.floor || "", type: v.type, entity: v.entity || "", climate: v.climate || "", openings: v.openings || [], power_entity: v.power_entity || "", power_threshold: v.power_threshold ?? 10 });
          if (typeChanged) { e.entity = ""; e.climate = ""; this._render(); }
        },
      };
    }
    if (kind === "group") {
      return {
        data: { name: e.name, floor: e.floor || undefined, members: e.members, openings: e.openings || [] },
        schema: [
          { name: "name", required: true, selector: text },
          { name: "floor", selector: this._floorSelector() },
          { name: "members", selector: { select: { multiple: true, mode: "list", options: this._data.heaters.map((h) => ({ value: h.id, label: h.name })) } } },
          { name: "openings", selector: { entity: { domain: "binary_sensor", multiple: true } } },
        ],
        labels: { name: "Nom", floor: "Étage (optionnel)", members: "Chauffages synchronisés (un chauffage appartient à un seul groupe)", openings: "Ouvertures (fenêtres, portes) qui mettent en pause" },
        change: (v) => { e.name = v.name || ""; e.floor = v.floor || ""; e.members = v.members || []; e.openings = v.openings || []; },
      };
    }
  }
  _mountForms() {
    this._forms = [];
    const hosts = this.shadowRoot.querySelectorAll("[data-form]");
    hosts.forEach((host) => {
      if (!this._haReady) { host.innerHTML = `<div class="muted">${this._haFail ? "Composants Home Assistant indisponibles" : "Chargement…"}</div>`; return; }
      const def = this._formDef(host.dataset.form, host.dataset.i);
      if (!def) return;
      const f = document.createElement("ha-form");
      f.hass = this._hass; f.schema = def.schema; f.data = def.data; f.disabled = !this._admin();
      f.computeLabel = (s) => def.labels[s.name] || s.name;
      f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); f.data = ev.detail.value; def.change(ev.detail.value); });
      host.appendChild(f);
      this._forms.push(f);
    });
  }

  /* ---------- interactions ---------- */
  _blank(kind) {
    return {
      schedule: { kind, id: null, name: "", slots: [{ days: [0, 1, 2, 3, 4], time: "06:30", mode: "comfort" }, { days: [0, 1, 2, 3, 4], time: "22:00", mode: "eco" }] },
      heater: { kind, id: null, name: "", type: "pilot_wire", entity: "", climate: "", schedule_id: null, floor: "", openings: [], power_entity: "", power_threshold: 10 },
      group: { kind, id: null, name: "", members: [], schedule_id: null, floor: "", openings: [] },
    }[kind];
  }
  async _click(e) {
    const el = e.target.closest("[data-a]");
    if (!el) return;
    const d = el.dataset, h = this._hass;
    const call = (s, data) => h.callService("chauffage_manager", s, data).catch((err) => this._toast(err));
    switch (d.a) {
      case "tab": this._tab = d.v; this._edit = null; this._render(); break;
      case "control": call("set_control", { target: d.t, control: d.v }); break;
      case "mode": {
        const t = this._data.targets.find((x) => x.id === d.t);
        call("set_manual", { target: d.t, mode: d.v }); break;
      }
      case "temp": {
        const t = this._data.targets.find((x) => x.id === d.t);
        const v = Math.min(30, Math.max(5, this._tempOf(t) + Number(d.d)));
        this._temps[d.t] = v;
        call("set_manual", { target: d.t, mode: "comfort", temperature: v }); break;
      }
      case "alloff": this._data.targets.forEach((t) => call("set_manual", { target: t.id, mode: "off" })); break;
      case "new": this._edit = this._blank(d.v); this._render(); break;
      case "edit": {
        const coll = { schedule: "schedules", heater: "heaters", group: "groups" }[d.k];
        this._edit = { kind: d.k, ...JSON.parse(JSON.stringify(this._data[coll].find((x) => x.id === d.id))) };
        if (d.k === "heater") this._edit.climate = this._edit.climate || "";
        this._render(); break;
      }
      case "del":
        if (confirm("Supprimer ?")) this._ws({ type: "chauffage_manager/delete", kind: d.k, item_id: d.id }).catch((err) => this._toast(err));
        break;
      case "cancel": this._edit = null; this._render(); break;
      case "save": this._save(); break;
      case "abs-save": this._saveAbsence(); break;
      case "opn-save": this._saveOpenings(); break;
      case "hol-save": this._saveHolidays(); break;
      case "tmp-save": this._saveTemperatures(); break;
      case "day": {
        const s = this._edit.slots[+d.i], n = +d.d;
        s.days = s.days.includes(n) ? s.days.filter((x) => x !== n) : [...s.days, n].sort();
        el.classList.toggle("on");
        this._preview();
        break;
      }
      case "addslot": this._edit.slots.push({ days: [0, 1, 2, 3, 4, 5, 6], time: "12:00", mode: "comfort", holiday: !!d.hol }); this._render(); break;
      case "delslot": this._edit.slots.splice(+d.i, 1); this._render(); break;
    }
  }
  async _saveAbsence() {
    const a = this._abs;
    this._setBtn("abs-save", "busy");
    try {
      await this._ws({ type: "chauffage_manager/save", kind: "absence", value: { persons: a.persons || [], mode: a.mode, control: a.control, restore: !!a.restore } });
      this._absDirty = false; await this._load();
      this._setBtn("abs-save", "ok", 1500);
    } catch (err) { this._setBtn("abs-save", "ko", 2000); this._toast(err); }
  }
  async _saveTemperatures() {
    const t = this._tmp, def = { comfort: 19, comfort_minus_1: 18, comfort_minus_2: 17, eco: 15.5, frost_protection: 7 };
    this._setBtn("tmp-save", "busy");
    try {
      const value = Object.fromEntries(Object.keys(def).map((k) => [k, Number(t[k] ?? def[k])]));
      await this._ws({ type: "chauffage_manager/save", kind: "temperatures", value });
      this._tmpDirty = false; await this._load();
      this._setBtn("tmp-save", "ok", 1500);
    } catch (err) { this._setBtn("tmp-save", "ko", 2000); this._toast(err); }
  }
  async _saveHolidays() {
    this._setBtn("hol-save", "busy");
    try {
      await this._ws({ type: "chauffage_manager/save", kind: "holidays", value: { entity: this._hol.entity || null } });
      this._holDirty = false; await this._load();
      this._setBtn("hol-save", "ok", 1500);
    } catch (err) { this._setBtn("hol-save", "ko", 2000); this._toast(err); }
  }
  async _saveOpenings() {
    const o = this._opn;
    this._setBtn("opn-save", "busy");
    try {
      await this._ws({ type: "chauffage_manager/save", kind: "openings", value: { delay: Number(o.delay) || 0, resume_delay: Number(o.resume_delay) || 0, mode: o.mode } });
      this._opnDirty = false; await this._load();
      this._setBtn("opn-save", "ok", 1500);
    } catch (err) { this._setBtn("opn-save", "ko", 2000); this._toast(err); }
  }
  async _save() {
    const e = this._edit;
    let value;
    if (!e.name.trim()) return this._toast("Nom requis");
    if (e.kind === "schedule") {
      if (e.slots.some((s) => !s.days.length || !s.time)) return this._toast("Chaque créneau nécessite des jours et une heure");
      value = { name: e.name.trim(), slots: e.slots.map((s) => ({ days: s.days, time: s.time, mode: s.mode, holiday: !!s.holiday })) };
    } else if (e.kind === "heater") {
      if (!e.entity) return this._toast("Entité requise");
      value = { name: e.name.trim(), type: e.type, entity: e.entity, climate: e.type === "pilot_wire" ? e.climate || null : null, schedule_id: e.schedule_id || null, floor: e.floor || null, openings: e.openings || [], power_entity: e.power_entity || null, power_threshold: e.power_threshold === "" || e.power_threshold == null ? 10 : Number(e.power_threshold) };
    } else {
      value = { name: e.name.trim(), members: e.members, schedule_id: e.schedule_id || null, floor: e.floor || null, openings: e.openings || [] };
    }
    this._setBtn("save", "busy");
    try {
      await this._ws({ type: "chauffage_manager/save", kind: e.kind, item_id: e.id || undefined, value });
      this._edit = null; this._btnState = { ...this._btnState, save: "" }; await this._load();
    } catch (err) { this._setBtn("save", "ko", 2000); this._toast(err); }
  }
}

const TAB_OPTIONS = Object.entries(TABS).map(([value, label]) => ({ value, label }));
const bool = { boolean: {} };
const EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "tabs", selector: { select: { multiple: true, mode: "list", options: TAB_OPTIONS } } },
  { name: "default_tab", selector: { select: { mode: "dropdown", options: TAB_OPTIONS } } },
  { name: "group_by_floor", selector: bool },
  { type: "grid", name: "", flatten: true, schema: [
    { name: "show_power", selector: bool }, { name: "show_temperature", selector: bool },
    { name: "show_mode", selector: bool }, { name: "show_all_off", selector: bool },
  ] },
  { name: "heating_color", selector: { ui_color: {} } },
  { name: "temp_step", selector: { select: { mode: "dropdown", options: [{ value: "0.5", label: "0,5 °C" }, { value: "1", label: "1 °C" }] } } },
];
const EDITOR_LABELS = {
  title: "Titre (optionnel)", tabs: "Onglets affichés", default_tab: "Onglet affiché par défaut",
  group_by_floor: "Séparer les pièces par étage", show_power: "Afficher la puissance (W)",
  show_temperature: "Afficher la température", show_mode: "Afficher le badge de mode", show_all_off: "Bouton « Tout éteindre »",
  heating_color: "Couleur de l'icône quand le chauffage chauffe", temp_step: "Pas du réglage de température",
};
const EDITOR_KEYS = ["title", "tabs", "default_tab", "group_by_floor", "show_power", "show_temperature", "show_mode", "show_all_off", "heating_color", "temp_step"];
class ChauffageManagerCardEditor extends HTMLElement {
  setConfig(config) { this._config = config || {}; this._render(); }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _formData() {
    const c = this._config, order = Object.keys(TABS);
    const tabs = c.tabs || order;
    const data = { title: c.title || "", tabs, default_tab: c.default_tab && tabs.includes(c.default_tab) ? c.default_tab : tabs[0], heating_color: c.heating_color || undefined, temp_step: String(c.temp_step ?? 0.5) };
    ["group_by_floor", "show_power", "show_temperature", "show_mode", "show_all_off"].forEach((k) => { data[k] = c[k] ?? CARD_DEFAULTS[k]; });
    return data;
  }
  _changed(v) {
    const order = Object.keys(TABS);
    const tabs = order.filter((t) => (v.tabs || []).includes(t));
    const config = { ...this._config };
    EDITOR_KEYS.forEach((k) => delete config[k]);
    if (v.title) config.title = v.title;
    if (tabs.length && tabs.length < order.length) config.tabs = tabs;
    if (v.default_tab && v.default_tab !== (tabs.length ? tabs[0] : order[0])) config.default_tab = v.default_tab;
    ["group_by_floor", "show_power", "show_temperature", "show_mode", "show_all_off"].forEach((k) => { if (v[k] !== undefined && v[k] !== CARD_DEFAULTS[k]) config[k] = v[k]; });
    if (v.heating_color) config.heating_color = v.heating_color;
    const step = Number(v.temp_step);
    if (step && step !== 0.5) config.temp_step = step;
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
  async _render() {
    if (!(await ensureHA())) { this.innerHTML = "<div>Composants Home Assistant indisponibles</div>"; return; }
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => { ev.stopPropagation(); this._form.data = ev.detail.value; this._changed(ev.detail.value); });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = this._formData();
  }
}
if (!customElements.get("chauffage-manager-card-editor")) customElements.define("chauffage-manager-card-editor", ChauffageManagerCardEditor);
if (!customElements.get("chauffage-manager-card")) customElements.define("chauffage-manager-card", ChauffageManagerCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "chauffage-manager-card", name: "Chauffage Manager", description: "Pièces, plannings, groupes et absence des chauffages" });
