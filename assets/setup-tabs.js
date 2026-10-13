/*
 * SetUp tab bar + Previous / Next pager (as on the real SetUp pages).
 * Usage: <div id="setup-tabs"></div> ... <div id="setup-pager"></div>
 *        <script src="../assets/setup-tabs.js"></script>   (after shell.js)
 */
(function () {
  var TABS = [
    { id: "setup", label: "Connection", icon: "fa-tools", href: "setup.html" },
    { id: "module-control", label: "Module Control", icon: "fa-sliders-h", href: "module-control.html" },
    { id: "calibration", label: "Calibration", icon: "fa-crosshairs", href: "calibration.html" },
    { id: "debug", label: "Debug", icon: "fa-bug", href: "debug.html" },
  ];
  var LOCKED = (window.PILOT_STATE && window.PILOT_STATE.locked) || [];
  TABS.forEach(function (t) { t.locked = LOCKED.indexOf(t.id) !== -1; });
  var current = document.body.getAttribute("data-page");
  // Opening a locked screen directly (typed URL / old bookmark) goes back to Module Control
  if (LOCKED.indexOf(current) !== -1) { location.replace("module-control.html"); return; }
  var idx = -1;
  TABS.forEach(function (t, k) { if (t.id === current) idx = k; });

  var bar = document.getElementById("setup-tabs");
  if (bar) {
    bar.className = "pp-tabs-wrap";
    bar.innerHTML = '<nav class="pp-tabs">' + TABS.map(function (t) {
      var on = t.id === current;
      if (t.locked) return '<span class="is-locked" aria-disabled="true" title="Not available"><i class="fas ' + t.icon + '"></i>' + t.label + '<i class="fas fa-lock pp-lock"></i></span>';
      return '<a href="' + t.href + '"' + (on ? ' class="is-active" aria-current="page"' : "") + '><i class="fas ' + t.icon + '"></i>' + t.label + "</a>";
    }).join("") + "</nav>";
  }

  var pager = document.getElementById("setup-pager");
  if (pager) {
    var prev = TABS[idx - 1], next = TABS[idx + 1];
    pager.className = "d-flex gap-2";
    pager.innerHTML =
      (prev ? '<a href="' + prev.href + '" class="btn btn-default"><i class="fas fa-arrow-left"></i>Previous</a>'
            : '<span class="btn btn-default disabled"><i class="fas fa-arrow-left"></i>Previous</span>') +
      (next && !next.locked ? '<a href="' + next.href + '" class="btn btn-primary">Next<i class="fas fa-arrow-right"></i></a>'
            : '<span class="btn btn-primary disabled">Next<i class="fas fa-arrow-right"></i></span>');
  }
})();
