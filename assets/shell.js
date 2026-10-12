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
 * Sidebar = the real top-nav menus (Administration / Status / SetUp / Support).
 * Sub-pages (View Logs, SetUp tabs) highlight their parent menu.
 */
(function () {
  var NAV = [
    { id: "administration", label: "Administration", icon: "fa-server", href: "administration.html" },
    { id: "status", label: "Status", icon: "fa-tachometer-alt", href: "status.html", children: ["view-logs"] },
    { id: "setup", label: "SetUp", icon: "fa-tools", href: "setup.html", children: ["module-control", "calibration", "debug"] },
    { id: "support", label: "Support", icon: "fa-life-ring", href: "support.html" },
  ];

  // Page titles for the top-bar breadcrumb
  var TITLES = {
    dashboard: "Dashboard", userProfile: "My Profile", "view-logs": "View Logs", setup: "Connection",
    "module-control": "Module Control", calibration: "Calibration", debug: "Debug",
  };
  var GROUP_OF = {};
  NAV.forEach(function (i) {
    if (!TITLES[i.id]) TITLES[i.id] = i.label;
    if (i.id === "setup") GROUP_OF.setup = i.label;
    (i.children || []).forEach(function (c) { GROUP_OF[c] = i.label; });
  });

  var body = document.body;
  var current = body.getAttribute("data-page") || "";
  var page = document.getElementById("page");

  var nav = NAV.map(function (i) {
    var active = i.id === current || (i.children || []).indexOf(current) !== -1;
    return '<a href="' + i.href + '" title="' + i.label + '"' + (active ? ' class="is-active" aria-current="page"' : "") + '>' +
      '<i class="fas ' + i.icon + '"></i><span class="app-label">' + i.label + "</span></a>";
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

  var group = GROUP_OF[current];
  var crumb = '<span class="hide-md">Adoption-ELS</span><i class="fas fa-chevron-right hide-md"></i>' +
    (group ? '<span class="hide-sm">' + group + '</span><i class="fas fa-chevron-right hide-sm"></i>' : "") +
    '<span class="is-current">' + (TITLES[current] || "") + "</span>";

  var ZONES = ["Asia/Calcutta", "Europe/Dublin", "UTC", "America/New_York"];
  var topbar =
    '<header class="app-topbar">' +
      '<button type="button" id="app-burger" class="app-burger" aria-label="Toggle sidebar" title="Toggle sidebar"><i class="fas fa-bars"></i></button>' +
      '<div class="app-crumb">' + crumb + "</div>" +
      '<div class="app-tools">' +
        '<div class="app-tool">' +
          '<button type="button" data-menu="tz-menu" class="app-clock"><i class="far fa-clock text-muted"></i><span id="app-clock" class="app-clock-text"></span><i class="fas fa-caret-down text-muted"></i></button>' +
          '<div id="tz-menu" class="app-menu menu-down"><div class="app-menu-body">' +
            '<label class="pp-label muted" for="app-tz" style="text-transform:uppercase;letter-spacing:.05em;font-size:11px;font-weight:600">Time zone</label>' +
            '<select id="app-tz" class="form-control sm">' + ZONES.map(function (z) { return "<option>" + z + "</option>"; }).join("") + "</select>" +
          "</div></div></div>" +
        '<button type="button" class="app-icon-btn" title="Alarms"><i class="far fa-bell"></i></button>' +
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
  var tzSel = document.getElementById("app-tz");
  var clock = document.getElementById("app-clock");
  function tick() {
    var tz = tzSel.value, txt;
    try {
      txt = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
    } catch (err) { txt = new Date().toLocaleString(); }
    clock.textContent = txt + " " + tz;
  }
  tzSel.addEventListener("change", tick);
  tick();
  setInterval(tick, 30000);

  body.classList.remove("shell-pending");
})();
