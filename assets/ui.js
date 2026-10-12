/*
 * Small UI helpers shared by the demo pages (plain JS; modals use Bootstrap 4).
 *   data-toggle="modal" data-target="#id"  Bootstrap modal (as on the real site)
 *   [data-toast="msg"]       toast — demo stand-in for the CGI response
 *   [data-reveal="inputId"]  toggles a password field's visibility
 */
(function () {
  function toast(msg) {
    var wrap = document.querySelector(".pp-toasts");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "pp-toasts"; document.body.appendChild(wrap); }
    var el = document.createElement("div");
    el.className = "pp-toast";
    el.innerHTML = '<i class="fas fa-check-circle"></i>' + msg;
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-toast],[data-reveal]");
    if (!t) return;
    if (t.hasAttribute("data-toast")) toast(t.getAttribute("data-toast") || "Updated Successfully!");
    if (t.hasAttribute("data-reveal")) {
      var inp = document.getElementById(t.getAttribute("data-reveal"));
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      var i = t.querySelector("i"); if (i) i.className = "far " + (show ? "fa-eye-slash" : "fa-eye");
    }
  });

  window.ui = { toast: toast };
})();
