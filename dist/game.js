"use strict";

const geography = globalThis.CHINA_GEOGRAPHY;
const regions = geography?.regions ?? [];
const byId = new Map(regions.map(region => [region.id, region]));
const trivia = globalThis.CHINA_TRIVIA?.regions ?? {};
const historyData = globalThis.CHINA_HISTORY?.regions ?? {};
const languages = globalThis.PROVINCE_LANGUAGES ?? {};
const gdpData = globalThis.CHINA_EXTRAS?.gdpPerCapita ?? {};
const gdpYear = globalThis.CHINA_EXTRAS?.gdpYear ?? 2024;
const stages = [
  ["outline", "Province outline", "outline"],
  ["neighbors", "Neighbours", "neighbors"],
  ["capital", "Capital", "pin"],
  ["orientation", "Orientation", "compass"],
  ["flag", "Flag", "flag"],
  ["trivia", "Trivia", "trivia"],
  ["landmark", "Landmark", "landmark"],
  ["emblem", "Emblem", "emblem"],
  ["languages", "Spoken languages", "language"],
  ["gdp", "GDP per capita", "bars"],
  ["population", "Population & currency", "population"],
  ["cities", "Populous cities", "cities"],
  ["area", "Area", "area"],
  ["summary", "Summary", "list"]
];
const icons = {
  outline: '<path d="m3 11 3-1 1-4 4 1 3-4 3 3-1 3 5 3-3 3-1 4-5 1-3-3-4 1z"/>',
  neighbors: '<path d="m4 5 7-2 3 3 6-2v14l-6 2-3-3-7 2zM11 3v14m3-11v14"/>',
  pin: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.7 8.3-2.1 5.3-5.3 2.1 2.1-5.3z"/>',
  flag: '<path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  trivia: '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.2a2.3 2.3 0 0 1 4.6.2c0 1.9-2.3 2.2-2.3 3.9m0 3h.01"/>',
  landmark: '<path d="m3 9 9-5 9 5H3Zm2 10h14M7 10v7m5-7v7m5-7v7M3 21h18"/>',
  emblem: '<path d="M12 3 5 6v6c0 4 4 7 7 9 3-2 7-5 7-9V6z"/><path d="m12 8 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 10.3l2-.3z"/>',
  language: '<path d="M4 5h16v11H9l-5 4zM8 9h8m-8 3h6"/>',
  bars: '<path d="M4 20h16M7 17v-5m5 5V6m5 11V9"/>',
  population: '<circle cx="9" cy="8" r="2.8"/><path d="M3.5 19v-2.2c0-2.2 2.1-3.9 5.5-3.9s5.5 1.7 5.5 3.9V19m1-14a2.8 2.8 0 0 1 0 5.5m1.5 2.8c2.2.4 3.5 1.7 3.5 3.5V19"/>',
  cities: '<path d="M3 20h18M5 20V9h5v11m0 0V4h5v16m0 0v-8h4v8M7 12h1m4-4h1m-1 4h1m4 3h1"/>',
  area: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5M7 17 17 7m-5 0h5v5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4m8-4v4M4 11h16"/>'
};
const icon = (name, className = "") => `<svg class="line-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] ?? ""}</svg>`;
const compass = `<svg class="map-compass" viewBox="0 0 44 58" aria-hidden="true">
  <text x="22" y="10" text-anchor="middle" fill="currentColor" font-size="9" font-weight="700">N</text>
  <circle cx="22" cy="35" r="14.5" fill="none" stroke="currentColor" opacity=".4"/>
  <path d="M22 17v36M4 35h36" stroke="currentColor" opacity=".42"/>
  <path d="m22 18-5 17 5-2 5 2z" fill="currentColor"/>
  <path d="m22 51 5-16-5 2-5-2z" fill="none" stroke="currentColor"/>
</svg>`;
const $ = (selector, scope = document) => scope.querySelector(selector);
const panel = $("#game-panel");
const dialog = $("#dialog");
const formatNumber = new Intl.NumberFormat("en");
const symbols = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
const compassPoints = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
const prefix = "provincele.v1.";
const anchor = Date.UTC(2026, 10, 12);
const rad = Math.PI / 180;
const normalize = value => String(value ?? "").normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]/gu, "");
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const fmt = value => formatNumber.format(Math.round(value));
const textOptions = values => values.map(value => ({ value, label: value }));

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback; }
  catch { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); }
  catch { /* The current puzzle is still playable if storage is unavailable. */ }
}

function shuffled(items, seed) {
  const result = [...items];
  let state = [...String(seed)].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dailyDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dailyPuzzle(now = new Date()) {
  const day = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - anchor) / 86400000);
  const order = ["sichuan", ...shuffled(regions.map(region => region.id).filter(id => id !== "sichuan"), "Provincele first atlas")];
  return { date: dailyDate(now), day, id: order[((day % order.length) + order.length) % order.length] };
}

function emptyGame(targetId) {
  return { targetId, guesses: [], stage: "outline", rounds: {} };
}

let daily = dailyPuzzle();
let dailyGame = read("day." + daily.date, null);
if (dailyGame?.targetId !== daily.id) dailyGame = emptyGame(daily.id);
let practiceGame = read("practice", null);
let mode = "daily";
let settings = read("settings", { unit: "km", difficulty: "outline" });

const current = () => mode === "daily" ? dailyGame : practiceGame;
const answer = () => byId.get(current().targetId);
const won = () => current().guesses.includes(current().targetId);
const unlocked = () => won() || current().guesses.length === 6;
const roundState = (key = current().stage) => current().rounds[key] ??= { tasks: {} };
const taskState = key => roundState().tasks[key] ??= { tries: 0 };
const distanceLabel = kilometers => settings.unit === "mi" ? `${fmt(kilometers * .621371)} mi` : `${fmt(kilometers)} km`;

function save() {
  write(mode === "daily" ? "day." + daily.date : "practice", current());
  if (mode === "daily" && unlocked()) {
    const results = read("results", {});
    results[daily.date] = won() ? current().guesses.length : 0;
    write("results", results);
  }
}

function geoBetween(from, to, capitals = false) {
  const lat1 = (capitals ? from.capitalLat ?? from.lat : from.lat) * rad;
  const lat2 = (capitals ? to.capitalLat ?? to.lat : to.lat) * rad;
  const delta = ((capitals ? to.capitalLon ?? to.lon : to.lon) - (capitals ? from.capitalLon ?? from.lon : from.lon)) * rad;
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(delta / 2) ** 2;
  const degrees = (Math.atan2(Math.sin(delta) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(delta)) / rad + 360) % 360;
  return { kilometers: 12742 * Math.asin(Math.sqrt(Math.min(1, h))), degrees };
}

const maximumDistance = Math.max(1, ...regions.flatMap(region => regions.map(other => geoBetween(region, other).kilometers)));
const proximity = (km, exact) => exact ? 100 : Math.min(99, Math.max(0, Math.round(100 - 100 * km / maximumDistance)));

function setMode(next) {
  if (next === "practice" && !byId.has(practiceGame?.targetId)) freshPractice();
  mode = next;
  render();
}

function freshPractice() {
  const candidates = regions.filter(region => region.id !== practiceGame?.targetId && region.id !== daily.id);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  practiceGame = emptyGame(chosen.id);
  write("practice", practiceGame);
}

function announce(message) {
  $("#announcer").textContent = message;
}

function changeStage(key) {
  if (!stages.some(stage => stage[0] === key) || (!unlocked() && key !== "outline")) return;
  current().stage = key;
  save();
  render();
  const heading = $("h2", panel);
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  if (panel.getBoundingClientRect().top < 0 || matchMedia("(max-width: 680px)").matches) {
    panel.scrollIntoView({ block: "nearest" });
  }
}

function updateSidebar() {
  const game = current();
  const completed = Number(unlocked()) + Object.values(game.rounds).filter(round => round.status).length;
  $("#round-count").textContent = `${completed} / ${stages.length - 1}`;
  $("#round-progress").innerHTML = `<span style="width:${completed / (stages.length - 1) * 100}%"></span>`;
  $("#rounds").innerHTML = stages.map(([key, name, glyph]) => {
    const done = key === "outline" ? unlocked() : Boolean(game.rounds[key]?.status);
    const lock = key !== "outline" && !unlocked();
    return `<button type="button" class="round-tab${done ? " done" : ""}" data-stage="${key}"${game.stage === key ? ' aria-current="step"' : ""}${lock ? " disabled" : ""}>
      <span class="round-icon">${icon(glyph)}</span><span>${escapeHtml(name)}</span>${lock ? icon("lock") : done ? icon("check", "round-done") : game.stage === key ? icon("arrow") : ""}
    </button>`;
  }).join("");
  $("#round-hint").textContent = unlocked() ? "Choose any round to play or review." : "Finish the outline to unlock the bonus rounds.";
}

function render() {
  if (!regions.length || !byId.has(current()?.targetId)) {
    panel.innerHTML = '<p class="loading-message">The province data could not be loaded. Reload the game to try again.</p>';
    return;
  }
  const practicing = mode === "practice";
  const key = current().stage;
  $("#daily-mode").setAttribute("aria-pressed", String(!practicing));
  $("#practice-mode").setAttribute("aria-pressed", String(practicing));
  $("#date-label").hidden = practicing;
  $("#new-practice").hidden = !practicing;
  $("#date-label").innerHTML = icon("calendar") + '<time datetime="' + daily.date + '">' + new Date(daily.date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + "</time>";
  $("#puzzle-label").innerHTML = "<span></span>" + (practicing ? "Practice mode" : "Daily puzzle #" + String(Math.max(1, daily.day + 1)).padStart(3, "0"));
  $("#page-title").innerHTML = key === "outline" ? "Guess the <em>province.</em>" : `${escapeHtml(answer().name)}<em>.</em>`;
  $("#intro-copy").textContent = key === "outline"
    ? settings.difficulty === "hidden" && !unlocked() ? "Find the region using distance and direction clues." : "Identify the region from its outline in six guesses."
    : answer().chinese + (key === "trivia" ? "" : " · " + answer().type);
  updateSidebar();
  if (key === "outline") renderOutline();
  else if (key === "summary") renderSummary();
  else renderBonus(key);
}

function mapFrame(content, label, note = "") {
  return `<div class="map-field"><span class="map-kicker">${icon("compass")}${escapeHtml(label)}</span>${compass}${content}${note ? `<span class="map-note">${escapeHtml(note)}</span>` : ""}</div>`;
}

function searchForm({ placeholder, button = "Guess", label }) {
  return `<form class="guess-form" id="search-form" novalidate>
    <div class="guess-field">
      ${icon("search", "search-icon")}
      <label class="sr-only" for="guess-input">${escapeHtml(label)}</label>
      <input id="guess-input" placeholder="${escapeHtml(placeholder)}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggestions" aria-describedby="form-feedback" autocomplete="off" autocapitalize="off" spellcheck="false">
      <ul class="suggestions" id="suggestions" role="listbox" hidden></ul>
    </div>
    <button class="primary-button guess-button" type="submit">${escapeHtml(button)} ${icon("arrow")}</button>
  </form><p class="form-feedback" id="form-feedback" role="status"></p>`;
}

const regionOptions = regions.map(region => ({
  value: region.id, label: region.name, secondary: region.chinese,
  aliases: [...(region.aliases ?? []), region.chinese, region.name + " " + region.type, ...(region.abbreviations ?? [])]
}));

function attachSearch(options, guesses, onGuess) {
  const form = $("#search-form", panel);
  const input = $("#guess-input", form);
  const list = $("#suggestions", form);
  const guessed = new Set(guesses);
  const available = options.filter(option => !guessed.has(option.value));
  let shown = [];
  let active = -1;
  const terms = option => [option.label, ...(option.aliases ?? [])].map(normalize);

  function paintOptions() {
    list.hidden = !shown.length;
    input.setAttribute("aria-expanded", String(shown.length > 0));
    input.removeAttribute("aria-activedescendant");
    if (active !== -1) input.setAttribute("aria-activedescendant", "suggestion-" + active);
    list.innerHTML = shown.map((option, index) => `<li id="suggestion-${index}" role="option" data-option="${index}" aria-selected="${index === active}"><span>${escapeHtml(option.label)}</span><small>${escapeHtml(option.secondary)}</small></li>`).join("");
    if (active !== -1) list.children[active]?.scrollIntoView({ block: "nearest" });
  }

  function update() {
    const query = normalize(input.value);
    shown = available.filter(option => !query || terms(option).some(term => term.includes(query)));
    shown.sort((a, b) => Number(!normalize(a.label).startsWith(query)) - Number(!normalize(b.label).startsWith(query)) || a.label.localeCompare(b.label));
    active = -1;
    paintOptions();
    list.scrollTop = 0;
  }

  function choose(index) {
    if (!shown[index]) return;
    input.value = shown[index].label;
    shown = [];
    active = -1;
    paintOptions();
  }

  input.addEventListener("input", () => { $("#form-feedback", panel).textContent = ""; update(); });
  input.addEventListener("focus", update);
  input.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!shown.length) update();
      if (shown.length) {
        const down = event.key === "ArrowDown";
        active = active === -1 && !down ? shown.length - 1 : (active + (down ? 1 : shown.length - 1)) % shown.length;
      }
      paintOptions();
    } else if (event.key === "Enter" && active !== -1) {
      event.preventDefault();
      choose(active);
      form.requestSubmit();
    } else if (event.key === "Escape") {
      shown = [];
      active = -1;
      paintOptions();
    }
  });
  list.addEventListener("pointerdown", event => {
    if (event.target.closest("[data-option]")) event.preventDefault();
  });
  list.addEventListener("click", event => {
    const option = event.target.closest("[data-option]");
    if (option) {
      choose(Number(option.dataset.option));
      input.focus();
    }
  });
  form.addEventListener("focusout", event => {
    if (!form.contains(event.relatedTarget)) {
      shown = [];
      active = -1;
      paintOptions();
    }
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const query = normalize(input.value);
    const exact = query ? options.find(option => terms(option).includes(query)) : undefined;
    const match = exact ?? (query && shown.length === 1 ? shown[0] : undefined);
    if (match && guessed.has(match.value)) {
      $("#form-feedback", panel).textContent = "You already made that guess.";
      return;
    }
    if (!match) {
      $("#form-feedback", panel).textContent = query ? "Choose a matching name from the list." : "Enter a guess to continue.";
      input.focus();
      return;
    }
    const error = onGuess(match.value);
    if (error) $("#form-feedback", panel).textContent = error;
  });
}

function guessRow(id, index) {
  const region = byId.get(id);
  if (!region) {
    return `<li class="guess-row empty${index === current().guesses.length && !unlocked() ? " current" : ""}"><span class="attempt-number">${String(index + 1).padStart(2, "0")}</span><span aria-label="No guess">—</span></li>`;
  }
  const exact = id === current().targetId;
  const { kilometers, degrees } = geoBetween(region, answer());
  const direction = Math.round(degrees / 45) % 8;
  return `<li class="guess-row${exact ? " correct" : ""}">
    <span class="attempt-number">${String(index + 1).padStart(2, "0")}</span><span class="guess-name">${escapeHtml(region.name)}</span>
    <span class="metric">${distanceLabel(kilometers)}</span>
    <span class="direction" aria-label="${exact ? "Correct" : compassPoints[direction]}" title="${exact ? "Correct" : compassPoints[direction]}">${exact ? "✓" : symbols[direction]}</span>
    <span class="metric proximity">${proximity(kilometers, exact)}%</span>
  </li>`;
}

function renderOutline() {
  const game = current();
  const isHidden = settings.difficulty === "hidden" && !unlocked();
  const rotated = settings.difficulty === "rotate" && !unlocked();
  const title = unlocked() ? answer().name + " outline" : "Mystery region outline";
  const shape = isHidden ? '<span class="hidden-outline" aria-label="Outline hidden">?</span>' : `<svg class="map-outline" viewBox="${answer().viewBox}" role="img" aria-label="${escapeHtml(title)}"${rotated ? ' style="transform:rotate(140deg) scale(.83)"' : ""}><path d="${answer().path}"/></svg>`;
  const controls = unlocked()
    ? `<div class="result-banner${won() ? "" : " missed"}"><div><strong>${won() ? "Correct!" : "Answer"} · ${escapeHtml(answer().name)} <span lang="zh">${escapeHtml(answer().chinese)}</span></strong><small>${won() ? `Solved in ${game.guesses.length} ${game.guesses.length === 1 ? "guess" : "guesses"}.` : "All six guesses used."}</small></div><div class="result-actions"><button type="button" class="secondary-button" data-share>Share</button><button type="button" class="primary-button" data-stage="neighbors">Play bonuses ${icon("arrow")}</button></div></div>`
    : searchForm({ label: "Guess a province-level region", placeholder: "Search provinces and regions…" });
  panel.innerHTML = mapFrame(shape, unlocked() ? "Answer outline" : "Mystery outline", isHidden ? "Outline hidden" : rotated ? "Outline rotated · Scale varies" : "North up · Scale varies")
    + `<div class="main-body">${controls}<section class="guess-history" aria-label="Guess history">
      <div class="history-heading"><h2>Guess history</h2><span>${game.guesses.length} of 6 guesses</span></div>
      <ol class="history-list">${Array.from({ length: 6 }, (_, index) => guessRow(game.guesses[index], index)).join("")}</ol>
    </section></div>`;
  if (!unlocked()) {
    attachSearch(regionOptions, game.guesses, id => {
      game.guesses.push(id);
      save();
      const { kilometers, degrees } = geoBetween(byId.get(id), answer());
      render();
      if (!unlocked()) $("#guess-input", panel).focus();
      else $("button[data-stage]", panel)?.focus({ preventScroll: true });
      announce(id === game.targetId ? "Correct! Bonus rounds unlocked." : unlocked() ? `The answer was ${answer().name}. Bonus rounds unlocked.` : `${distanceLabel(kilometers)} ${compassPoints[Math.round(degrees / 45) % 8]}, ${proximity(kilometers, false)} percent.`);
    });
  }
}

function spoilerFreeShare() {
  const game = current();
  const grid = game.guesses.map(id => {
    const exact = id === game.targetId;
    const { kilometers, degrees } = geoBetween(byId.get(id), answer());
    const tens = Math.floor(proximity(kilometers, exact) / 10);
    return "🟩".repeat(Math.floor(tens / 2)) + "🟨".repeat(tens % 2) + "⬛".repeat(5 - Math.ceil(tens / 2)) + " " + (exact ? "🎯" : symbols[Math.round(degrees / 45) % 8]);
  });
  const bonuses = stages.slice(1, -1).map(([key]) => game.rounds[key]?.status === "correct" ? "🟢" : game.rounds[key]?.status ? "🟠" : "⚪");
  const label = mode === "daily" ? "#" + Math.max(1, daily.day + 1) : "Practice";
  const link = location.protocol === "file:" ? "" : "\n" + location.origin + location.pathname;
  return `Provincele ${label} ${won() ? game.guesses.length : "X"}/6\n${grid.join("\n")}\nBonuses ${bonuses.join("")}${link}`;
}

async function share() {
  try {
    await navigator.clipboard.writeText(spoilerFreeShare());
    const button = $("[data-share]", panel);
    if (button) button.textContent = "Copied!";
    announce("Result copied to your clipboard.");
  } catch {
    showDialog("share");
  }
}

function nextMidnightText() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const seconds = Math.max(0, Math.ceil((next - now) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(part => String(part).padStart(2, "0")).join(":");
}

function renderSummary() {
  const completed = Object.values(current().rounds).filter(round => round.status).length;
  const solved = Object.values(current().rounds).filter(round => round.status === "correct").length;
  const statuses = stages.slice(1, -1).map(([key, name]) => {
    const status = current().rounds[key]?.status;
    return `<button type="button" class="summary-row" data-stage="${key}"><span>${escapeHtml(name)}</span><span>${status === "correct" ? "✓ Solved" : status === "missed" ? "Reviewed" : "Play round →"}</span></button>`;
  }).join("");
  panel.innerHTML = `<section class="stage"><div class="eyebrow">Results</div><h2>Game summary</h2>
    <p class="stage-copy">${won() ? `You solved the outline in ${current().guesses.length} ${current().guesses.length === 1 ? "guess" : "guesses"}.` : "You used all six outline guesses."} ${solved} of 12 bonus rounds solved.</p>
    <ol class="history-list">${current().guesses.map(guessRow).join("")}</ol>
    <div class="summary-grid">${statuses}</div>
    <div class="stage-nav"><span class="summary-timer">${mode === "daily" ? 'Next puzzle in <strong id="countdown">' + nextMidnightText() + "</strong>" : completed + " of 12 bonuses completed"}</span><button type="button" class="primary-button" data-share>Share result</button></div>
  </section>`;
}

function statistics() {
  const entries = Object.entries(read("results", {}));
  const wins = entries.filter(([, count]) => count > 0);
  const lookup = new Map(entries);
  const date = new Date();
  if (!lookup.has(dailyDate(date))) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (lookup.get(dailyDate(date)) > 0) { streak++; date.setDate(date.getDate() - 1); }
  return { played: entries.length, winRate: entries.length ? Math.round(100 * wins.length / entries.length) : 0, streak };
}

function showDialog(key) {
  const body = $("#dialog-body");
  const title = $("#dialog-title");
  const sources = [...(geography?.sources ?? []), ...(globalThis.CHINA_TRIVIA?.sources ?? []), ...(globalThis.CHINA_HISTORY?.sources ?? []),
    ...(globalThis.CHINA_EXTRAS?.gdpSources ?? []), ...(globalThis.CHINA_EXTRAS?.symbolSources ?? []),
    { label: "Worldle by Teuteuf Games", url: "https://worldle.teuteuf.fr/" },
    { label: "1997 circular on local flags and emblems", url: "https://cpc.people.com.cn/BIG5/64162/71380/71382/71384/4857802.html" }];
  if (key === "help") {
    title.textContent = "How to play";
    body.innerHTML = "<p>Identify the province-level region from its outline in six guesses. English names, common aliases and Chinese names are accepted.</p><ul><li><strong>Distance</strong> measures the gap between region centres.</li><li><strong>Direction</strong> points from your guess toward the answer.</li><li><strong>Proximity</strong> gives 100% to the answer and 0% to the farthest possible pair in this game.</li></ul><p>Finish the outline to unlock twelve bonus rounds. A new daily puzzle starts at local midnight. Practice lets you play a random outline at any time.</p>";
  } else if (key === "stats") {
    const stats = statistics();
    title.textContent = "Statistics";
    body.innerHTML = `<p>Daily puzzles played in this browser.</p><div class="stat-grid"><div><strong>${stats.played}</strong><span>Played</span></div><div><strong>${stats.winRate}%</strong><span>Win rate</span></div><div><strong>${stats.streak}</strong><span>Current streak</span></div></div>`;
  } else if (key === "settings") {
    title.textContent = "Settings";
    body.innerHTML = `<p><label for="units">Distance units</label><select id="units"><option value="km">Kilometres</option><option value="mi">Miles</option></select></p><p><label for="difficulty">Outline difficulty</label><select id="difficulty"><option value="outline">North up</option><option value="rotate">Rotated</option><option value="hidden">Hidden</option></select></p>`;
    $("#units", body).value = settings.unit;
    $("#difficulty", body).value = settings.difficulty;
    body.onchange = event => {
      if (event.target.id === "units") settings.unit = event.target.value;
      if (event.target.id === "difficulty") settings.difficulty = event.target.value;
      write("settings", settings);
      render();
    };
  } else if (key === "sources") {
    title.textContent = "Data & credits";
    const distinct = Array.from(new Map(sources.filter(source => source?.url).map(source => [source.url, source])).values());
    body.innerHTML = `<p>Provincele includes 34 province-level regions, with Hong Kong, Macau and Taiwan as separate playable geographies. Map boundaries are generalized for play.</p><p>Province banners and capital seals are game symbols. The banner round uses regional abbreviations and the seal round uses Chinese names of seats of government.</p>
    <ul>${distinct.map(source => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label ?? source.title ?? source.url)}</a></li>`).join("")}</ul>${landmarkCredits(regions.map(region => region.id))}`;
  } else {
    title.textContent = "Share result";
    body.innerHTML = '<p>Copy this spoiler-free score.</p><textarea class="share-text" rows="10" readonly aria-label="Spoiler-free result"></textarea>';
    $(".share-text", body).value = spoilerFreeShare();
  }
  dialog.showModal();
  if (key === "share") $(".share-text", body).select();
}

document.addEventListener("click", event => {
  const stage = event.target.closest("button[data-stage]");
  const dialogButton = event.target.closest("[data-dialog]");
  if (stage) changeStage(stage.dataset.stage);
  if (dialogButton) showDialog(dialogButton.dataset.dialog);
  if (event.target.closest("[data-share]")) void share();
});

$("#daily-mode").addEventListener("click", () => setMode("daily"));
$("#practice-mode").addEventListener("click", () => setMode("practice"));
$("#new-practice").addEventListener("click", () => { freshPractice(); render(); });
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

setInterval(() => {
  if (daily.date !== dailyDate()) {
    daily = dailyPuzzle();
    dailyGame = read("day." + daily.date, emptyGame(daily.id));
    if (mode === "daily") render();
  }
  const countdown = $("#countdown");
  if (countdown) countdown.textContent = nextMidnightText();
}, 1000);

render();
