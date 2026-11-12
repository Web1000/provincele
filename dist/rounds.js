"use strict";

const bannerColors = ["#8e3d30", "#395b55", "#86613e", "#545784", "#8d514d", "#3f684c", "#62684b", "#5c4b75"];
const currencies = {
  yuan: "Chinese yuan (CNY)",
  hkd: "Hong Kong dollar (HKD)",
  mop: "Macanese pataca (MOP)",
  twd: "New Taiwan dollar (TWD)"
};
const currencyFor = region => ({ "hong-kong": "hkd", macau: "mop", taiwan: "twd" }[region.id] ?? "yuan");

function pool(values, correct, limit, seed) {
  const others = shuffled([...new Set(values)].filter(value => value !== correct), seed).slice(0, limit - 1);
  return shuffled([correct, ...others], seed + "/answer");
}

function mc(id, label, prompt, correct, choices, extra = {}) {
  return { id, label, prompt, kind: "choice", correct, choices, max: 1, ...extra };
}

function intervalQuiz(value, limits, format, id, label, prompt, extra = {}) {
  const labels = limits.map((upper, index) => index === 0 ? "Under " + format(upper) : `${format(limits[index - 1])} to under ${format(upper)}`);
  labels.push(format(limits.at(-1)) + " or more");
  const interval = limits.findIndex(upper => value < upper);
  return mc(id, label, prompt, labels[interval === -1 ? labels.length - 1 : interval], textOptions(labels), extra);
}

function referenceFor(region) {
  const candidates = region.neighbors.map(id => byId.get(id)).filter(other => geoBetween(other, region, true).kilometers >= 120);
  const pool = candidates.length ? candidates : regions.filter(other => other.id !== region.id && geoBetween(other, region, true).kilometers >= 250);
  return shuffled(pool, region.id + "/orientation")[0];
}

function bannerChoices(region) {
  const ids = pool(regions.map(item => item.id), region.id, 8, region.id + "/flag");
  return ids.map((id, index) => ({
    value: id, label: byId.get(id).abbreviation,
    art: `<span class="flag-banner" style="--banner:${bannerColors[index]}"><span lang="zh">${escapeHtml(byId.get(id).abbreviation)}</span></span>`
  }));
}

function sealChoices(region) {
  const ids = pool(regions.map(item => item.id), region.id, 8, region.id + "/seal");
  return ids.map(id => ({
    value: id, label: byId.get(id).capitalChinese,
    art: `<span class="capital-seal"><span lang="zh">${escapeHtml(byId.get(id).capitalChinese)}</span></span>`
  }));
}

function photoMarkup(id, label) {
  const url = trivia[id]?.landmarkImage;
  if (!url) return `<span class="photo-placeholder">${escapeHtml(label)}</span>`;
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(trivia[id].landmarkImageAlt ?? label)}" width="440" height="290" decoding="async">`;
}

function photoCredit(id) {
  const entry = trivia[id]?.landmarkImageCredit;
  if (!entry) return "";
  const license = entry.licenseUrl ? `<a href="${escapeHtml(entry.licenseUrl)}" target="_blank" rel="noopener">${escapeHtml(entry.license)}</a>` : escapeHtml(entry.license);
  return `<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.title)}</a> · ${escapeHtml(entry.artist)} · ${license} · resized`;
}

function landmarkCredits(ids) {
  const credits = ids.map(photoCredit).filter(Boolean);
  return credits.length ? `<details class="photo-credits"><summary>Photo credits</summary><ul>${credits.map(credit => "<li>" + credit + "</li>").join("")}</ul></details>` : "";
}

function roundTasks(key) {
  const region = answer();
  const seed = region.id;
  const details = trivia[seed] ?? {};
  const borderIds = region.neighbors;
  if (key === "neighbors") {
    return borderIds.length
      ? [{ id: "borders", label: "Land borders", kind: "neighbors", prompt: "Name the numbered regions that share a land border with the highlighted region.", max: borderIds.length + 3, correct: borderIds }]
      : [mc("island", "Land borders", "How many province-level regions share a land border with " + region.name + "?", "None", textOptions(["None", "One", "Two", "Three"]), { detail: region.name + " is an island with no province-level land borders.", map: true })];
  }
  if (key === "capital") {
    return [
      { id: "name", label: "Name", prompt: "Name the capital or seat of government.", kind: "capital", correct: region.capital, max: 3 },
      { id: "pin", label: "Pinpoint", prompt: `Place a pin on ${region.capital}. Click the map or move the pin with your arrow keys.`, kind: "pin", max: 2,
        correct: region.capital, detail: region.capital + " is marked in green." }
    ];
  }
  if (key === "orientation") {
    const reference = referenceFor(region);
    const relationship = geoBetween(reference, region, true);
    const distanceMax = Math.ceil((relationship.kilometers + Math.max(300, relationship.kilometers * .9)) / 100) * 100;
    const unitFactor = settings.unit === "mi" ? .621371 : 1;
    return [
      { id: "bearing", label: "Direction", kind: "bearing", prompt: `Which way would you travel from ${reference.capital} to ${region.capital}? Set the compass within 36° of the correct bearing.`, max: 2,
        correct: relationship.degrees, detail: `The bearing is ${Math.round(relationship.degrees)}° ${compassPoints[Math.round(relationship.degrees / 45) % 8]}.` },
      { id: "distance", label: "Distance", kind: "distance", prompt: `Estimate the straight-line distance from ${reference.capital} to ${region.capital}. Get within 10%.`, max: 2, range: Math.ceil(distanceMax * unitFactor / 50) * 50, step: 5, unitFactor,
        correct: relationship.kilometers, detail: `The straight-line distance is about ${distanceLabel(relationship.kilometers)}.` }
    ];
  }
  if (key === "flag") {
    return [mc("banner", "Banner", `Which game banner carries a traditional one-character abbreviation for ${region.name}?`, seed, bannerChoices(region),
      { max: 3, display: "flags", detail: `${region.abbreviation} is ${region.name}’s ${region.abbreviations.length > 1 ? "featured" : "traditional"} abbreviation.` })];
  }
  if (key === "trivia") {
    const hasCoast = new Set(["liaoning", "hebei", "tianjin", "shandong", "jiangsu", "shanghai", "zhejiang", "fujian", "guangdong", "guangxi", "hainan", "taiwan", "hong-kong", "macau"]);
    const fact = hasCoast.has(seed) ? "It has a sea coast." : "It is landlocked.";
    const facts = ["It has a sea coast.", "It is landlocked.", "Its area is under 1 km².", "It has fewer than 100 residents."];
    const types = ["Province", "Autonomous region", "Municipality", "Special administrative region", "Self-governed island"];
    const history = historyData[seed];
    return [
      mc("facts", "Facts", `Which statement is true about ${region.name}?`, fact, textOptions(shuffled(facts, seed + "/fact"))),
      mc("general", "General", `How is ${region.name} classified in this game’s geography?`, region.type, textOptions(pool(types, region.type, 4, seed + "/type"))),
      history && mc("history", "History", history.prompt, history.answer, textOptions(shuffled(history.choices, seed + "/history")), { source: history.source })
    ].filter(Boolean);
  }
  if (key === "landmark") {
    const ids = pool(Object.keys(trivia).filter(id => trivia[id].landmarkImage), seed, 4, seed + "/photos");
    const photos = ids.map((id, index) => ({ value: id, label: `Landmark photo ${index + 1}`, art: photoMarkup(id, `Landmark photo ${index + 1}`) }));
    const names = pool(Object.values(trivia).map(item => item.landmark), details.landmark, 8, seed + "/name");
    return [
      mc("photo", "Image", `Which photo shows a landmark in ${region.name}?`, seed, photos, { max: 2, display: "photos", detail: "The landmark is highlighted.", credits: ids }),
      mc("name", "Name", "Name the landmark shown in the photo.", details.landmark, textOptions(names), { max: 2, photo: seed, credits: [seed] })
    ];
  }
  if (key === "emblem") {
    return [mc("seal", "Capital seal", `Which game seal shows the Chinese name of ${region.capital}?`, seed, sealChoices(region), { max: 3, display: "seals", detail: `${region.capital} is written ${region.capitalChinese}.` })];
  }
  if (key === "languages") {
    const choices = textOptions(pool(Object.keys(languages), details.language, 8, seed + "/language"));
    const written = languages[details.language];
    return [
      mc("language", "Regional variety", details.languageClue, details.language, choices, { max: 2 }),
      mc("text", "Written name", written?.prompt ?? "Match the written name to its language or variety.", details.language, textOptions(pool(Object.keys(languages), details.language, 4, seed + "/text")), { max: 2, sample: written?.text, source: written?.source })
    ];
  }
  if (key === "gdp") {
    const options = borderIds.length ? borderIds : referenceFor(region) ? [referenceFor(region).id] : [];
    const comparison = [seed, ...shuffled(options, seed + "/gdp").slice(0, 3)];
    const highest = comparison.reduce((best, id) => gdpData[id] > gdpData[best] ? id : best);
    const labels = shuffled(comparison, seed + "/gdp-options").map(id => ({ value: id, label: byId.get(id).name }));
    return [
      intervalQuiz(gdpData[seed], [60000, 75000, 90000, 110000, 150000, 200000, 300000], amount => "¥" + fmt(amount), "band", "Estimate", `What was ${region.name}’s nominal GDP per capita in ${gdpYear}, in Chinese yuan equivalents?`,
        { max: 2, detail: `About ¥${fmt(gdpData[seed])} per person, in Chinese yuan equivalents.` }),
      mc("compare", "Comparison", `Which of these regions had the highest GDP per capita in ${gdpYear}?`, highest, labels, { max: 2, detail: `${byId.get(highest).name} had the highest figure at about ¥${fmt(gdpData[highest])} per person.` })
    ];
  }
  if (key === "population") {
    const currency = currencyFor(region);
    return [
      intervalQuiz(region.population, [10000000, 30000000, 60000000], amount => fmt(amount / 1000000) + " million", "people", "Population", `About how many people lived in ${region.name} in the 2020 population snapshot?`, { max: 2, detail: `About ${fmt(region.population)} people.` }),
      mc("currency", "Currency", `What is the main local currency in ${region.name}?`, currency, shuffled(Object.entries(currencies), seed + "/currency").map(([value, label]) => ({ value, label })), { detail: currencies[currency] + "." })
    ];
  }
  if (key === "cities") {
    return [{ id: "rank", label: "Population ranking", kind: "rank", prompt: `Rank these ${details.citiesScope} from most to least populous by resident population in ${details.citiesYear}.`, correct: details.cities, counts: details.cityPopulations, max: 2 }];
  }
  if (key === "area") {
    const rivals = regions.filter(item => item.id !== seed && Math.abs(Math.log(item.area / region.area)) >= Math.log(1.1)).sort((a, b) => Math.abs(Math.log(a.area / region.area)) - Math.abs(Math.log(b.area / region.area)));
    const rival = shuffled(rivals.slice(0, 3), seed + "/area")[0];
    const names = shuffled([region, rival], seed + "/area-choice").map(item => ({ value: item.id, label: item.name }));
    return [mc("larger", "Area comparison", "Which region has the larger surface area?", region.area > rival.area ? seed : rival.id, names,
      { detail: `${region.name} covers about ${fmt(region.area)} km². ${rival.name} covers about ${fmt(rival.area)} km².` })];
  }
  return [];
}

const stageTitles = { flag: "Province banners", emblem: "Capital seals" };

function localViewBox(ids) {
  const boxes = ids.map(id => byId.get(id).viewBox.split(/\s+/).map(Number));
  const x = Math.min(...boxes.map(box => box[0]));
  const y = Math.min(...boxes.map(box => box[1]));
  return [x, y, Math.max(...boxes.map(box => box[0] + box[2])) - x, Math.max(...boxes.map(box => box[1] + box[3])) - y];
}

function regionalMap({ pin = false, task, state = {}, neighbors = [] } = {}) {
  const region = answer();
  const showAll = !pin && !neighbors.length;
  const bounds = pin ? region.viewBox.split(/\s+/).map(Number) : showAll ? geography.mapViewBox.split(/\s+/).map(Number) : localViewBox([region.id, ...neighbors]);
  const span = Math.max(bounds[2], bounds[3]);
  const markerSize = span / 70;
  const mapPaths = regions.map(item => {
    const area = item.id === region.id ? "focus-area"
      : (state.found ?? []).includes(item.id) ? "solved-area"
      : neighbors.includes(item.id) ? "neighbor-area" : "";
    return `<path class="${area}" d="${item.path}"/>`;
  }).join("");
  const numbers = neighbors.map((id, index) => {
    const item = byId.get(id);
    return `<text x="${item.x}" y="${item.y}" class="map-number" style="font-size:${span / 42}px;stroke-width:${span / 115}px">${(state.found ?? []).includes(id) ? "✓" : index + 1}</text>`;
  }).join("");
  const marker = (point, isAnswer = false) => point ? `<circle class="map-marker${isAnswer ? " answer" : ""}" cx="${point.x}" cy="${point.y}" r="${markerSize}"/>` : "";
  const point = state.point;
  const target = pin && state.status ? { x: region.capitalX, y: region.capitalY } : null;
  const line = point && target ? `<path class="pin-guide" d="M${point.x} ${point.y}L${target.x} ${target.y}"/>` : "";
  return mapFrame(`<svg id="regional-map" class="regional-map${pin && !state.status ? " pin-map" : ""}" viewBox="${bounds.join(" ")}" role="img" aria-label="${escapeHtml(pin ? task.prompt : "Map of " + region.name + " and surrounding regions")}"${pin && !state.status ? ' tabindex="0"' : ""}>${mapPaths}${numbers}${line}${marker(point)}${marker(target, true)}</svg>`,
    pin ? "Capital location" : "Regional map", pin ? "North up" : neighbors.length ? "Numbered regions share a land border" : "North up");
}

function choicesMarkup(task, state) {
  const layout = task.display ? " " + task.display : "";
  return `<div class="choices${layout}" aria-label="${escapeHtml(task.label)}">${task.choices.map(choice => {
    const right = state.status && choice.value === task.correct;
    const tried = state.incorrect?.includes(choice.value);
    return `<button type="button" class="choice${right ? " correct" : tried ? " wrong" : ""}" data-action="select" data-value="${escapeHtml(choice.value)}" aria-pressed="${state.selection === choice.value}"${state.status || tried ? " disabled" : ""}>
      ${choice.art ?? `<span>${escapeHtml(choice.label)}</span>`}${right ? icon("check") : ""}</button>`;
  }).join("")}</div>`;
}

function rankMarkup(task, state) {
  if (!state.order) {
    state.order = shuffled(task.correct, answer().id + "/cities");
    if (state.order.every((name, index) => name === task.correct[index])) {
      [state.order[0], state.order[1]] = [state.order[1], state.order[0]];
    }
  }
  const order = state.order;
  return `<ol class="order-list">${order.map((name, index) => `<li class="order-item"><span class="rank">${index + 1}.</span><strong>${escapeHtml(name)}</strong>
    <button type="button" class="icon-button" data-action="move" data-value="${index}" data-delta="-1" aria-label="Move ${escapeHtml(name)} up"${index === 0 || state.status ? " disabled" : ""}>↑</button>
    <button type="button" class="icon-button" data-action="move" data-value="${index}" data-delta="1" aria-label="Move ${escapeHtml(name)} down"${index === order.length - 1 || state.status ? " disabled" : ""}>↓</button></li>`).join("")}</ol>`;
}

function rangeMarkup(task, state) {
  const bearing = task.kind === "bearing";
  const selected = bearing ? state.selection ?? 0
    : state.selection === undefined ? Math.round(task.range / 10) * 5
    : Math.min(task.range, Math.round(state.selection * task.unitFactor / task.step) * task.step);
  const display = bearing ? selected + "° " + compassPoints[Math.round(selected / 45) % 8] : fmt(selected) + " " + settings.unit;
  const dial = bearing ? `<div class="bearing-dial" aria-hidden="true"><span class="dial-n">N</span><span class="dial-e">E</span><span class="dial-s">S</span><span class="dial-w">W</span><span id="dial-needle" class="dial-needle" style="transform:rotate(${selected}deg)">↑</span></div>` : "";
  return `<div class="range-tool">${dial}<label for="round-range">${bearing ? "Compass bearing" : "Estimated distance"} <output id="range-value" for="round-range">${display}</output></label>
    <input type="range" id="round-range" min="0" max="${bearing ? 359 : task.range}" step="${bearing ? 1 : task.step}" value="${selected}"${state.status ? " disabled" : ""}>
    <div class="range-endpoints"><span>0${bearing ? "°" : ""}</span><span>${bearing ? "359°" : fmt(task.range) + " " + settings.unit}</span></div>
  </div>`;
}

function searchMarkup(task, state) {
  if (task.kind === "neighbors") {
    const ordered = shuffled(task.correct, answer().id + "/borders");
    const tags = ordered.map((id, index) => {
      const found = state.found?.includes(id);
      const label = found || state.status ? byId.get(id).name : "—";
      return `<span class="tag${found ? " hit" : state.status ? " miss" : ""}">${index + 1}. ${escapeHtml(label)}</span>`;
    }).join("");
    return regionalMap({ neighbors: ordered, state }) + `<div class="tags">${tags}</div>` + (state.status ? "" : searchForm({ label: "Neighbouring region", placeholder: "Search neighbours…" }));
  }
  const previous = (state.guesses ?? []).map(value => `<span class="tag${value === task.correct ? " hit" : " miss"}">${escapeHtml(value)}</span>`).join("");
  return (previous ? `<div class="tags">${previous}</div>` : "") + (state.status ? "" : searchForm({ label: "Capital or seat of government", placeholder: "Search capitals…" }));
}

function taskContent(task, state) {
  if (task.kind === "neighbors" || task.kind === "capital") return searchMarkup(task, state);
  if (task.kind === "pin") return regionalMap({ pin: true, task, state });
  if (task.kind === "rank") return rankMarkup(task, state);
  if (task.kind === "bearing" || task.kind === "distance") return rangeMarkup(task, state);
  const photo = task.photo ? `<figure class="landmark-photo">${photoMarkup(task.photo, "Landmark to identify")}</figure>` : "";
  const sample = task.sample ? `<div class="language-sample" lang="zh">${escapeHtml(task.sample)}</div>` : "";
  const map = task.map ? regionalMap() : "";
  return map + photo + sample + choicesMarkup(task, state);
}

function taskFeedback(task, state) {
  if (!state.status && !state.tries) return "";
  if (!state.status) {
    return `<p class="stage-feedback missed" role="status">${escapeHtml(state.note ?? "Try again.")}</p>`;
  }
  let detail = task.detail;
  if (task.kind === "rank") detail = task.correct.map((name, index) => `${name} (${fmt(task.counts[index])})`).join(" → ");
  if (task.kind === "neighbors") detail = `${state.found?.length ?? 0} of ${task.correct.length} neighbours found.`;
  if (task.kind === "pin" && state.error !== undefined) detail = `${distanceLabel(state.error)} from ${answer().capital}. ${detail}`;
  if (!detail) detail = task.choices?.find(choice => choice.value === task.correct)?.label ?? task.correct;
  const correct = state.status === "correct";
  return `<p class="stage-feedback${correct ? "" : " missed"}" role="status"><strong>${correct ? "Correct." : "Answer."}</strong> ${escapeHtml(detail)}${task.source ? ` <a href="${escapeHtml(task.source.url)}" target="_blank" rel="noopener">Source</a>` : ""}</p>`;
}

function renderBonus(key) {
  const tasks = roundTasks(key);
  const round = roundState();
  const index = Math.min(round.step ?? 0, tasks.length - 1);
  const task = tasks[index];
  if (!task) {
    panel.innerHTML = '<p class="loading-message">This bonus round could not be loaded.</p>';
    return;
  }
  const state = taskState(task.id);
  const stageIndex = stages.findIndex(stage => stage[0] === key);
  const stageName = stages[stageIndex][1];
  const search = ["neighbors", "capital"].includes(task.kind);
  const checkDisabled = (task.kind === "choice" && state.selection === undefined) || (task.kind === "pin" && !state.point);
  const footer = state.status
    ? index === tasks.length - 1
      ? `<button type="button" class="primary-button" data-stage="${stages[stageIndex + 1][0]}">${key === "area" ? "Summary" : "Next round"} ${icon("arrow")}</button>`
      : '<button type="button" class="primary-button" data-action="next">Next question ' + icon("arrow") + "</button>"
    : `<button type="button" class="quiet-button" data-action="reveal">Give up</button><button type="button" class="secondary-button" data-stage="${stages[stageIndex + 1][0]}">${key === "area" ? "Summary" : "Next round"}</button>`;
  panel.innerHTML = `<section class="stage">
    <div class="eyebrow">Bonus ${stageIndex} of 12${tasks.length > 1 ? " · " + escapeHtml(task.label) : ""}</div>
    <h2>${escapeHtml(stageTitles[key] ?? stageName)}</h2>
    ${tasks.length > 1 ? `<nav class="task-tabs" aria-label="Questions in this round">${tasks.map((item, position) => `<button type="button" data-action="step" data-value="${position}" aria-current="${position === index ? "step" : "false"}"${position > 0 && !round.tasks[tasks[position - 1].id]?.status ? " disabled" : ""}>${escapeHtml(item.label)}${round.tasks[item.id]?.status ? " ✓" : ""}</button>`).join("")}</nav>` : ""}
    <p class="stage-copy">${escapeHtml(task.prompt)}</p>
    ${taskContent(task, state)}
    ${!state.status && !search ? `<button type="button" class="primary-button round-submit" data-action="check"${checkDisabled ? " disabled" : ""}>Check answer</button>` : ""}
    ${taskFeedback(task, state)}
    ${state.status && task.credits ? landmarkCredits(task.credits) : ""}
    <div class="stage-nav"><span class="tries-label">${state.status ? "" : `${task.max - state.tries} ${task.max - state.tries === 1 ? "try" : "tries"} left`}</span>
    <div class="nav-right">${footer}</div></div>
  </section>`;
  if (!state.status && search) attachBonusSearch(task, state);
  if (!state.status && task.kind === "pin") attachPin(state);
  if (!state.status && ["bearing", "distance"].includes(task.kind)) attachRange(task, state);
}

function attachBonusSearch(task, state) {
  const options = task.kind === "neighbors" ? regionOptions : regions.map(region => ({
    value: region.capital, label: region.capital, secondary: region.capitalChinese,
    aliases: [region.capitalChinese, ...(region.capitalAliases ?? [])]
  }));
  attachSearch(options, value => {
    if ((state.guesses ?? []).includes(value)) return "You already made that guess.";
    (state.guesses ??= []).push(value);
    if (task.kind === "neighbors" && task.correct.includes(value)) {
      (state.found ??= []).push(value);
      resolveTask(task, state, state.found.length === task.correct.length, byId.get(value).name + " shares a land border. Keep going.");
    } else {
      resolveTask(task, state, task.kind === "capital" && value === task.correct,
        task.kind === "capital" ? "Try another capital or seat." : "That region does not share a land border.");
    }
    $("#guess-input", panel)?.focus({ preventScroll: true });
  });
}

function attachPin(state) {
  const map = $("#regional-map", panel);
  const bounds = map.viewBox.baseVal;
  function setPin(x, y) {
    state.point = { x, y };
    const old = $(".map-marker", map);
    if (old) {
      old.setAttribute("cx", x);
      old.setAttribute("cy", y);
    } else {
      const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      point.setAttribute("class", "map-marker");
      point.setAttribute("cx", x);
      point.setAttribute("cy", y);
      point.setAttribute("r", Math.max(bounds.width, bounds.height) / 70);
      map.append(point);
    }
    $("[data-action=check]", panel).disabled = false;
    save();
  }
  map.addEventListener("click", event => {
    const matrix = map.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (point.x < bounds.x || point.x > bounds.x + bounds.width || point.y < bounds.y || point.y > bounds.y + bounds.height) return;
    setPin(point.x, point.y);
  });
  map.addEventListener("keydown", event => {
    const offsets = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0] }[event.key];
    if (!offsets) return;
    event.preventDefault();
    const fraction = event.shiftKey ? .08 : .015;
    const x = (state.point?.x ?? (bounds.x + bounds.width / 2)) + offsets[0] * bounds.width * fraction;
    const y = (state.point?.y ?? (bounds.y + bounds.height / 2)) + offsets[1] * bounds.height * fraction;
    setPin(Math.max(bounds.x, Math.min(bounds.x + bounds.width, x)), Math.max(bounds.y, Math.min(bounds.y + bounds.height, y)));
    announce("Pin moved " + event.key.replace("Arrow", "").toLowerCase() + ".");
  });
}

function attachRange(task, state) {
  const range = $("#round-range", panel);
  range.addEventListener("input", () => {
    const value = Number(range.value);
    state.selection = task.kind === "bearing" ? value : value / task.unitFactor;
    if (task.kind === "bearing") {
      $("#dial-needle", panel).style.transform = `rotate(${value}deg)`;
      $("#range-value", panel).textContent = value + "° " + compassPoints[Math.round(value / 45) % 8];
    } else {
      $("#range-value", panel).textContent = fmt(value) + " " + settings.unit;
    }
    save();
  });
}

function resolveTask(task, state, correct, note, reveal = false) {
  if (!reveal) state.tries++;
  state.note = note;
  if (correct) state.status = "correct";
  else if (reveal || state.tries >= task.max) state.status = "missed";
  const tasks = roundTasks(current().stage);
  const round = roundState();
  if (tasks.every(item => round.tasks[item.id]?.status)) {
    round.status = tasks.every(item => round.tasks[item.id].status === "correct") ? "correct" : "missed";
  }
  save();
  render();
  if (state.status) {
    const next = $(".nav-right button", panel);
    next?.focus({ preventScroll: true });
    announce(correct ? "Correct." : "Answer revealed.");
  }
}

function checkTask(task, state) {
  if (task.kind === "choice" && state.selection !== undefined) {
    const correct = state.selection === task.correct;
    if (!correct) {
      (state.incorrect ??= []).push(state.selection);
      state.selection = undefined;
    }
    resolveTask(task, state, correct, "That choice is incorrect. Try again.");
  } else if (task.kind === "rank") {
    resolveTask(task, state, state.order.every((value, index) => value === task.correct[index]), "That order is incorrect. Rearrange the list and try again.");
  } else if (task.kind === "pin" && state.point) {
    const region = answer();
    const bounds = region.viewBox.split(/\s+/).map(Number);
    const threshold = Math.max(2, Math.min(95, Math.max(bounds[2], bounds[3]) * geography.mapKmPerUnit * .10));
    state.error = Math.hypot(state.point.x - region.capitalX, state.point.y - region.capitalY) * geography.mapKmPerUnit;
    resolveTask(task, state, state.error <= threshold, `Your pin is about ${distanceLabel(state.error)} away. Get within ${distanceLabel(threshold)}.`);
  } else if (task.kind === "bearing") {
    const guess = Number($("#round-range", panel).value);
    state.selection = guess;
    const difference = Math.abs((guess - task.correct + 540) % 360 - 180);
    resolveTask(task, state, difference <= 36, `Your bearing is ${Math.round(difference)}° off. Try again.`);
  } else if (task.kind === "distance") {
    const guess = Number($("#round-range", panel).value) / task.unitFactor;
    state.selection = guess;
    const off = Math.abs(guess - task.correct) / task.correct;
    resolveTask(task, state, off <= .10, `Your estimate is ${guess < task.correct ? "too low" : "too high"}. Try again.`);
  }
}

document.querySelector("#game-panel").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const tasks = roundTasks(current().stage);
  const round = roundState();
  const index = round.step ?? 0;
  const task = tasks[index];
  if (!task) return;
  const state = taskState(task.id);
  if (action === "step" || action === "next") {
    round.step = action === "step" ? Number(button.dataset.value) : index + 1;
    save();
    render();
    $(".task-tabs [aria-current=step]", panel)?.focus({ preventScroll: true });
    return;
  }
  if (state.status) return;
  if (action === "select") {
    state.selection = button.dataset.value;
    for (const option of panel.querySelectorAll("[data-action=select]")) option.setAttribute("aria-pressed", String(option === button));
    $("[data-action=check]", panel).disabled = false;
    save();
  } else if (action === "move") {
    const from = Number(button.dataset.value);
    const to = from + Number(button.dataset.delta);
    [state.order[from], state.order[to]] = [state.order[to], state.order[from]];
    save();
    render();
    const preferred = `[data-action=move][data-value="${to}"][data-delta="${button.dataset.delta}"]:not(:disabled)`;
    ($(preferred, panel) ?? $(`[data-action=move][data-value="${to}"]:not(:disabled)`, panel))?.focus({ preventScroll: true });
  } else if (action === "check") {
    checkTask(task, state);
  } else if (action === "reveal") {
    resolveTask(task, state, false, "", true);
  }
});
