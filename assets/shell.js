/*
 * App shell: dark-navy left sidebar + white top bar, injected into every
 * system/*.html page so navigation is defined in ONE place.
 * Styling: assets/pilot-theme.css (on Bootstrap 4.0). Plain JS, no deps.
 *
 * Page contract:
 *   <body class="shell-pending" data-page="status">
 *     <main id="page" class="page"> ...page content... </main>
 *     <script src="../assets/shell.js"></script>
 *
 * Navigation = the real menus (Administration / Status / SetUp / Support) with their
 * sub-pages shown inside each menu, plus Dashboard on top. Same real page files.
 */
(function () {
  // Real menus with their sub-pages (names as on the real site). Same page files.
  var NAV = [
    { key: "dashboard", label: "Dashboard", icon: "fa-th-large", href: "index.html", id: "dashboard" },
    { key: "administration", label: "Administration", icon: "fa-server", children: [
      { id: "administration", label: "Hardware Admin", href: "administration.html" },
    ]},
    { key: "status", label: "Status", icon: "fa-tachometer-alt", children: [
      { id: "status", label: "Current Settings", href: "status.html" },
      { id: "view-logs", label: "View Logs", href: "view-logs.html" },
    ]},
    { key: "setup", label: "SetUp", icon: "fa-tools", children: [
      { id: "setup", label: "Connection", href: "setup.html" },
      { id: "module-control", label: "Module Control", href: "module-control.html" },
      { id: "calibration", label: "Calibration", href: "calibration.html" },
      { id: "debug", label: "Debug", href: "debug.html" },
    ]},
    { key: "support", label: "Support", icon: "fa-life-ring", href: "support.html", id: "support" },
  ];
  var LOCKED = (window.PILOT_STATE && window.PILOT_STATE.locked) || [];

  // Breadcrumb: "Adoption-ELS › <menu> › <page>"
  var TITLES = { userProfile: "My Profile", dashboard: "Dashboard", support: "Support" };
  var PARENT_OF = { userProfile: { label: "Account" } };
  NAV.forEach(function (m) {
    (m.children || []).forEach(function (c) {
      c.locked = LOCKED.indexOf(c.id) !== -1;
      TITLES[c.id] = c.label; PARENT_OF[c.id] = m;
    });
    m.firstHref = m.href || (m.children.filter(function (c) { return !c.locked; })[0] || {}).href;
  });

  var body = document.body;
  var current = body.getAttribute("data-page") || "";
  var page = document.getElementById("page");

  var nav = NAV.map(function (m) {
    if (!m.children) {
      var on = m.id === current;
      return '<a href="' + m.href + '" title="' + m.label + '"' + (on ? ' class="is-active" aria-current="page"' : "") + '>' +
        '<i class="fas ' + m.icon + '"></i><span class="app-label">' + m.label + "</span></a>";
    }
    var here = m.children.some(function (c) { return c.id === current; });
    return '<div class="app-nav-item' + (here ? " is-open is-here" : "") + '">' +
      '<button type="button" class="app-nav-parent" data-first="' + m.firstHref + '" title="' + m.label + '" aria-expanded="' + here + '">' +
        '<i class="fas ' + m.icon + '"></i><span class="app-label">' + m.label + '</span><i class="fas fa-chevron-down app-nav-chev"></i></button>' +
      '<div class="app-sub">' + m.children.map(function (c) {
        if (c.locked) return '<span class="app-sub-link is-locked" title="' + c.label + ' \u2014 not available">' + c.label + '</span>';
        var on = c.id === current;
        return '<a href="' + c.href + '" class="app-sub-link' + (on ? " is-active" : "") + '"' + (on ? ' aria-current="page"' : "") + ">" + c.label + "</a>";
      }).join("") + "</div></div>";
  }).join("");

  function userMenuItems() {
    return '<a href="userProfile.html"><i class="fas fa-user-circle"></i>My Profile</a>' +
      '<a href="../login.html" class="is-danger"><i class="fas fa-sign-out-alt"></i>Logout</a>';
  }

  var sidebar =
    '<aside id="app-sidebar" class="app-sidebar">' +
      '<a href="index.html" class="app-brand"><img src="../assets/img/logo-home.svg" alt="Pilot Photonics"></a>' +
      '<nav class="app-nav">' + nav + "</nav>" +
      '<div class="app-user">' +
        '<button type="button" data-menu="user-menu-side" class="app-user-btn" title="admin">' +
          '<span class="app-avatar"><i class="fas fa-user"></i></span>' +
          '<span class="app-user-text"><span class="app-user-name">admin</span><span class="app-user-sub">Adoption-ELS</span></span>' +
          '<i class="fas fa-ellipsis-v app-user-more"></i></button>' +
        '<div id="user-menu-side" class="app-menu menu-up">' + userMenuItems() + "</div>" +
      "</div>" +
    "</aside>" +
    '<div id="app-backdrop" class="app-backdrop"></div>';

  var parent = PARENT_OF[current];
  var crumb = '<a href="index.html" class="hide-md" title="Dashboard">Adoption-ELS</a><i class="fas fa-chevron-right hide-md"></i>' +
    (parent ? (parent.firstHref ? '<a href="' + parent.firstHref + '" class="hide-sm">' + parent.label + "</a>" : '<span class="hide-sm">' + parent.label + "</span>") +
      '<i class="fas fa-chevron-right hide-sm"></i>' : "") +
    '<span class="is-current">' + (TITLES[current] || "") + "</span>";

  var ZONES = ["Asia/Calcutta", "Europe/Dublin", "UTC", "America/New_York"];
  var topbar =
    '<header class="app-topbar">' +
      '<button type="button" id="app-burger" class="app-burger" aria-label="Toggle sidebar" title="Toggle sidebar"><i class="fas fa-bars"></i></button>' +
      '<div class="app-crumb">' + crumb + "</div>" +
      '<div class="app-tools">' +
        '<div class="app-tool">' +
          '<button type="button" data-menu="tz-menu" class="app-clock"><i class="far fa-clock text-muted"></i><span id="app-clock" class="app-clock-text"></span><i class="fas fa-caret-down text-muted"></i></button>' +
          '<div id="tz-menu" class="app-menu menu-down tz-menu"><div class="tz-head">Select Timezone</div>' +
            '<div class="tz-search"><i class="fas fa-search"></i><input id="tz-q" type="text" placeholder="Search Timezone" autocomplete="off" /></div>' +
            '<div id="tz-list" class="tz-list"></div>' +
          "</div></div></div>" +
        '<button type="button" id="app-jump-btn" class="app-jump-btn" title="Quick jump (Ctrl+K)"><i class="fas fa-search"></i><span class="app-jump-text">Jump to…</span><kbd>Ctrl K</kbd></button>' +
        '<div class="app-tool">' +
          '<button type="button" data-menu="alert-menu" class="app-icon-btn" title="Alerts"><i class="far fa-bell"></i><span id="app-alert-count" class="app-alert-count"></span></button>' +
          '<div id="alert-menu" class="app-menu menu-down app-alerts"></div>' +
        "</div>" +
        '<div class="app-tool">' +
          '<button type="button" data-menu="user-menu-top" class="app-user-top">' +
            '<span class="app-avatar is-navy"><i class="fas fa-user"></i></span>' +
            '<span class="app-user-top-name">admin</span><i class="fas fa-caret-down text-muted" style="font-size:12px"></i></button>' +
          '<div id="user-menu-top" class="app-menu menu-down">' +
            '<div class="app-menu-head">Device: <b>Adoption-ELS</b></div>' + userMenuItems() + "</div>" +
        "</div>" +
      "</div>" +
    "</header>";

  var footer =
    '<footer class="app-footer">' +
      "<span>&copy; Pilot Photonics &middot; Adoption-ELS</span>" +
      '<span>Follow us' +
        '<a href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a>' +
        '<a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>' +
        '<a href="#" aria-label="Google+"><i class="fab fa-google-plus"></i></a>' +
      "</span></footer>";

  // Build layout: sidebar | (topbar / page / footer)
  var wrap = document.createElement("div");
  wrap.className = "app-wrap";
  body.insertAdjacentHTML("afterbegin", sidebar);
  body.appendChild(wrap);
  wrap.insertAdjacentHTML("beforeend", topbar);
  if (page) wrap.appendChild(page);
  wrap.insertAdjacentHTML("beforeend", footer);

  // Menus with sub-pages: click to open / close (the current page's menu starts open)
  document.querySelectorAll(".app-nav-parent").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (body.classList.contains("sidebar-collapsed") && window.matchMedia("(min-width: 992px)").matches) {
        location.href = btn.getAttribute("data-first"); return;
      }
      var item = btn.parentNode, open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open);
    });
  });

  // Sidebar open / close
  //   desktop (>= 992px): full 240px <-> 64px icon rail; choice remembered per browser
  //   mobile: slides in over the page with a backdrop
  var side = document.getElementById("app-sidebar");
  var backdrop = document.getElementById("app-backdrop");
  var desktop = window.matchMedia("(min-width: 992px)");
  var KEY = "pp-sidebar-collapsed";
  function setCollapsed(on) {
    body.classList.toggle("sidebar-collapsed", on);
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
  }
  function setMobileOpen(open) { side.classList.toggle("is-open", open); backdrop.classList.toggle("is-open", open); }
  try { if (localStorage.getItem(KEY) === "1") body.classList.add("sidebar-collapsed"); } catch (e) {}
  document.getElementById("app-burger").addEventListener("click", function () {
    if (desktop.matches) setCollapsed(!body.classList.contains("sidebar-collapsed"));
    else setMobileOpen(!side.classList.contains("is-open"));
  });
  backdrop.addEventListener("click", function () { setMobileOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMobileOpen(false); });
  desktop.addListener(function () { setMobileOpen(false); });
  // enable the width animation only after first paint (no slide-in on page load)
  requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.add("sidebar-anim"); }); });

  // Dropdowns (data-menu="<id>")
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-menu]");
    var openId = btn ? btn.getAttribute("data-menu") : null;
    document.querySelectorAll(".app-menu").forEach(function (m) {
      if (m.contains(e.target)) return;
      m.classList.toggle("is-open", m.id === openId && !m.classList.contains("is-open"));
    });
  });

  // Live clock — same format as the real header: "Oct 12, 2026, 15:46 Asia/Calcutta"
  // Time zone picker: one panel — search + every zone with its current time (as in the real app)
  var ALL_TZ = (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ZONES).slice();
  if (ALL_TZ.indexOf("Asia/Calcutta") === -1) ALL_TZ.push("Asia/Calcutta");
  ALL_TZ.sort();
  var currentTz = "Asia/Calcutta";
  try { currentTz = localStorage.getItem("pp-tz") || currentTz; } catch (e) {}
  var tzQ = document.getElementById("tz-q"), tzList = document.getElementById("tz-list");
  function hm(tz) { try { return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date()); } catch (e) { return ""; } }
  function renderTz() {
    var q = tzQ.value.trim().toLowerCase();
    var list = ALL_TZ.filter(function (z) { return !q || z.toLowerCase().indexOf(q) !== -1; });
    tzList.innerHTML = list.length ? list.map(function (z) {
      return '<button type="button" class="tz-item' + (z === currentTz ? " is-sel" : "") + '" data-tz="' + z + '"><span>' + z.replace(/_/g, " ") + '</span><span class="mono">' + hm(z) + "</span></button>";
    }).join("") : '<div class="tz-empty">No matching timezone</div>';
  }
  tzQ.addEventListener("input", renderTz);
  tzList.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tz]"); if (!b) return;
    currentTz = b.getAttribute("data-tz");
    try { localStorage.setItem("pp-tz", currentTz); } catch (err) {}
    document.getElementById("tz-menu").classList.remove("is-open"); tick();
  });
  document.querySelector('[data-menu="tz-menu"]').addEventListener("click", function () {
    tzQ.value = ""; renderTz();
    setTimeout(function () { tzQ.focus(); var sel = tzList.querySelector(".is-sel"); if (sel) sel.scrollIntoView({ block: "center" }); }, 30);
  });
  var clock = document.getElementById("app-clock");
  function tick() {
    var tz = currentTz, txt;
    try {
      txt = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
    } catch (err) { txt = new Date().toLocaleString(); }
    clock.textContent = txt + " " + tz;
  }
  tick();
  setInterval(tick, 30000);

  /* ---------- Alerts (bell): derived from the appliance state, each links to its page ---------- */
  var alerts = window.PILOT_ALERTS ? window.PILOT_ALERTS() : [];
  var countEl = document.getElementById("app-alert-count");
  countEl.textContent = alerts.length || "";
  countEl.className = "app-alert-count" + (alerts.some(function (a) { return a.level === "bad"; }) ? " is-bad" : alerts.length ? " is-warn" : "");
  // Bell = "Active now" (derived from live status) + "Recent alerts" (appliance history: read_CCMAlerts)
  var LEVEL = { Alert: "bad", Warning: "warn", Info: "info" };
  function renderBell(recent) {
    document.getElementById("alert-menu").innerHTML =
      '<div class="app-menu-head d-flex justify-content-between"><b>Alerts</b><span>' + alerts.length + " active</span></div>" +
      '<div class="app-alert-group">Active now</div>' +
      (alerts.length ? alerts.map(function (a) {
        return '<a href="' + a.href + '" class="app-alert"><span class="pp-dot ' + a.level + '"></span>' +
          '<span class="flex-1"><span class="d-block">' + a.title + '</span><span class="app-alert-sub">' + a.detail + "</span></span>" +
          '<i class="fas fa-chevron-right" style="font-size:10px"></i></a>';
      }).join("") : '<div class="app-menu-body text-muted small-13">No active alerts</div>') +
      '<div class="app-alert-group">Recent alerts <span>read_CCMAlerts</span></div>' +
      (recent === null ? '<div class="app-menu-body text-muted small-13"><i class="fas fa-circle-notch fa-spin mr-2"></i>Loading…</div>'
        : recent.length ? recent.slice(0, 4).map(function (r) {
          return '<a href="view-logs.html#alerts" class="app-alert"><span class="app-alert-lvl is-' + (LEVEL[r.sate] || "info") + '">' + r.sate + "</span>" +
            '<span class="flex-1"><span class="d-block">' + r.message + '</span><span class="app-alert-sub">' + r.element + " · " + r.elementname + " · " + r.datetime + "</span></span></a>";
        }).join("") : '<div class="app-menu-body text-muted small-13">No alerts recorded</div>') +
      '<a href="view-logs.html#alerts" class="app-alert-all">View all alerts<i class="fas fa-arrow-right"></i></a>';
  }
  renderBell(null);
  if (window.PILOT_FETCH_ALERTS) window.PILOT_FETCH_ALERTS(renderBell);

  /* ---------- Quick jump (Ctrl+K or "/"): every screen + key sections, one keystroke away ---------- */
  var JUMP = [
    { t: "Dashboard", g: "Overview", h: "index.html", i: "fa-th-large" },
    { t: "Hardware Admin", g: "Administration", h: "administration.html", i: "fa-server" },
    { t: "Upload OS Package", g: "Administration \u203a Hardware Admin", h: "administration.html#upload", i: "fa-file-archive" },
    { t: "Firmware Boot Image", g: "Administration \u203a Hardware Admin", h: "administration.html#firmware", i: "fa-microchip" },
    { t: "Factory Reset", g: "Administration \u203a Hardware Admin", h: "administration.html#factory-reset", i: "fa-undo-alt" },
    { t: "Current Settings", g: "Status", h: "status.html", i: "fa-tachometer-alt" },
    { t: "Laser Current", g: "Status \u203a Current Settings", h: "status.html#lasers", i: "fa-bolt" },
    { t: "TEC status", g: "Status \u203a Current Settings", h: "status.html#tec", i: "fa-snowflake" },
    { t: "Temp / PSU / Ethernet / Disk charts", g: "Status \u203a Current Settings", h: "status.html#charts", i: "fa-chart-line" },
    { t: "View Logs", g: "Status", h: "view-logs.html", i: "fa-file-alt" },
    { t: "Console Logs", g: "Status \u203a View Logs", h: "view-logs.html#console", i: "fa-terminal" },
    { t: "Tec Results", g: "Status \u203a View Logs", h: "view-logs.html#tec", i: "fa-snowflake" },
    { t: "Alerts (appliance alert history)", g: "Status \u203a View Logs", h: "view-logs.html#alerts", i: "fa-bell" },
    { t: "Connection", g: "SetUp", h: "setup.html", i: "fa-tools" },
    { t: "Ethernet (IP Address, Subnet, Gateway, DNS)", g: "SetUp \u203a Connection", h: "setup.html#ethernet", i: "fa-network-wired" },
    { t: "Serial", g: "SetUp \u203a Connection", h: "setup.html#serial-card", i: "fa-plug" },
    { t: "Remote Storage", g: "SetUp \u203a Connection", h: "setup.html#storage-card", i: "fa-database" },
    { t: "Enable SSH / Reverse SSH", g: "SetUp \u203a Connection", h: "setup.html#ssh-card", i: "fa-terminal" },
    { t: "Set Up Email", g: "SetUp \u203a Connection", h: "setup.html#email", i: "fa-envelope" },
    { t: "Module Control (TEC + Laser)", g: "SetUp", h: "module-control.html", i: "fa-sliders-h" },
    { t: "Turn Off All Lasers & TECs", g: "SetUp \u203a Module Control", h: "module-control.html#safety", i: "fa-power-off" },
    { t: "Turn All Outputs OFF / Turn Module OFF", g: "Status \u203a Current Settings", h: "status.html#outputs", i: "fa-power-off" },
    { t: "Calibration", g: "SetUp", h: "calibration.html", i: "fa-crosshairs" },
    { t: "Debug \u2014 iDAC / vDAC", g: "SetUp", h: "debug.html", i: "fa-bug" },
    { t: "Support", g: "Support", h: "support.html", i: "fa-life-ring" },
    { t: "Self Test", g: "Support", h: "support.html#self-test", i: "fa-vial" },
    { t: "Send Logs", g: "Support", h: "support.html#send-logs", i: "fa-paper-plane" },
    { t: "My Profile", g: "Account", h: "userProfile.html", i: "fa-user-circle" },
    { t: "Logout", g: "Account", h: "../login.html", i: "fa-sign-out-alt" },
  ];
  body.insertAdjacentHTML("beforeend",
    '<div id="app-jump" class="app-jump" role="dialog" aria-modal="true" aria-label="Quick jump">' +
      '<div class="app-jump-box">' +
        '<div class="app-jump-input"><i class="fas fa-search"></i><input id="app-jump-q" type="text" placeholder="Jump to a screen or section…" autocomplete="off" /><kbd>Esc</kbd></div>' +
        '<div id="app-jump-list" class="app-jump-list"></div>' +
        '<div class="app-jump-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>' +
      "</div></div>");
  var jump = document.getElementById("app-jump"), jq = document.getElementById("app-jump-q"), jl = document.getElementById("app-jump-list");
  var jSel = 0, jItems = [];
  function jRender() {
    var q = jq.value.trim().toLowerCase();
    var locked = (window.PILOT_STATE && window.PILOT_STATE.locked) || [];
    JUMP.forEach(function (x) { x.locked = locked.indexOf(x.h.split("#")[0].replace(".html", "")) !== -1; });
    jItems = JUMP.filter(function (x) { return !q || (x.t + " " + x.g).toLowerCase().indexOf(q) !== -1; });
    jSel = Math.min(jSel, Math.max(jItems.length - 1, 0));
    jl.innerHTML = jItems.length ? jItems.map(function (x, k) {
      return '<a href="' + x.h + '" class="app-jump-item' + (k === jSel ? " is-sel" : "") + (x.locked ? " is-locked" : "") + '" data-k="' + k + '">' +
        '<i class="fas ' + x.i + '"></i><span class="flex-1">' + x.t + "</span>" +
        (x.locked ? '<span class="app-jump-group"><i class="fas fa-lock" style="width:auto;margin-right:4px"></i>Locked</span>' : '<span class="app-jump-group">' + x.g + "</span>") + "</a>";
    }).join("") : '<div class="app-jump-empty">No matches</div>';
    var sel = jl.querySelector(".is-sel"); if (sel) sel.scrollIntoView({ block: "nearest" });
  }
  function jOpen() { jump.classList.add("is-open"); jq.value = ""; jSel = 0; jRender(); setTimeout(function () { jq.focus(); }, 0); }
  function jClose() { jump.classList.remove("is-open"); }
  function jGo(h) { jClose(); if (h.split("#")[0] === location.pathname.split("/").pop()) { location.hash = h.split("#")[1] || ""; goToHash(); } else location.href = h; }
  document.getElementById("app-jump-btn").addEventListener("click", jOpen);
  jump.addEventListener("click", function (e) {
    if (e.target === jump) { jClose(); return; }
    var a = e.target.closest(".app-jump-item"); if (a) { e.preventDefault(); if (!a.classList.contains("is-locked")) jGo(a.getAttribute("href")); }
  });
  jq.addEventListener("input", function () { jSel = 0; jRender(); });
  jl.addEventListener("mousemove", function (e) { var a = e.target.closest("[data-k]"); if (a && +a.dataset.k !== jSel) { jSel = +a.dataset.k; jRender(); } });
  jq.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { jSel = Math.min(jSel + 1, jItems.length - 1); jRender(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { jSel = Math.max(jSel - 1, 0); jRender(); e.preventDefault(); }
    else if (e.key === "Enter" && jItems[jSel]) { e.preventDefault(); if (!jItems[jSel].locked) jGo(jItems[jSel].h); }
  });
  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "");
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (jump.classList.contains("is-open")) jClose(); else jOpen(); }
    else if (e.key === "/" && !typing && !jump.classList.contains("is-open")) { e.preventDefault(); jOpen(); }
    else if (e.key === "Escape") jClose();
  });

  /* ---------- Deep links: page.html#section scrolls to it and highlights it briefly ---------- */
  function goToHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    document.dispatchEvent(new CustomEvent("pp:section", { detail: id }));   // pages may open a tab / group first
    var el = document.getElementById(id);
    if (!el) return;
    setTimeout(function () {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.remove("pp-flash"); void el.offsetWidth; el.classList.add("pp-flash");
    }, 80);
  }
  window.addEventListener("hashchange", goToHash);
  window.addEventListener("load", goToHash);

  body.classList.remove("shell-pending");
})();
