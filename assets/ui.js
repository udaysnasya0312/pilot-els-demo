/*
 * Shared UI behaviour for the demo pages (plain JS; modals use Bootstrap 4 + jQuery, both local).
 *
 *   data-toggle="modal" data-target="#id"   Bootstrap modal (as on the real site)
 *   [data-toast="msg"]                      SweetAlert success message — demo stand-in for the CGI response
 *   [data-reveal="inputId"]                 show / hide a password field
 *
 *   Confirmations (SweetAlert, same call as the real app: "Are you sure? … Yes, Turn Off"):
 *     <input type=checkbox data-confirm-when="off|on" data-confirm-title data-confirm-text data-confirm-ok>
 *     <button data-confirm-title … >        (buttons always confirm)
 *
 *   Unsaved changes:
 *     [data-form]        an editable area (section / channel / modal). Its fields are tracked.
 *     [data-save]        Save button of that area — enabled only when something changed and all fields are valid
 *     [data-reset]       Cancel — restores the last saved values
 *     [data-dirty-flag]  element shown while the area has unsaved changes
 *     [data-save-all]    page-level "Save Settings" — saves every changed area
 *     Leaving the page with unsaved changes asks for confirmation.
 *
 *   Validation (on demand, while typing): data-validate="required | ipv4 | email | port | numeric | alnum |
 *     maxlen16 | number | phone | password | daterange | range | optional"  (range uses min / max;
 *     daterange uses data-after="<start input id>"; data-hint overrides the hint text)
 */
(function () {
  /* ---------- Messages: the real Pilot's SweetAlert (v1), restyled ----------
     success -> auto-closing "success" alert (real: swal(response.description, "", "success"))
     info    -> auto-closing "info" alert
     warning -> swal("Warning", text, "warning")  (real pattern)                         */
  var AUTO_CLOSE = 4500;   // alerts with no confirmation / input close by themselves
  function toast(msg, kind) {
    if (kind === "warning") { swal({ title: "Warning", text: msg, type: "warning", timer: AUTO_CLOSE }); return; }
    swal({ title: msg, text: "", type: kind === "info" ? "info" : "success", timer: AUTO_CLOSE, confirmButtonText: "OK" });
  }
  // Bootstrap info dialogs marked data-autoclose (e.g. Support "Not Implemented") close after 4.5 s too
  if (window.jQuery) $(document).on("shown.bs.modal", "[data-autoclose]", function () {
    var m = this; clearTimeout(m._ppAuto); m._ppAuto = setTimeout(function () { $(m).modal("hide"); }, AUTO_CLOSE);
  });

  /* ---------- Remembered UI choices (per browser; safe if storage is blocked) ---------- */
  function remember(key, value) {
    try {
      if (value === undefined) return localStorage.getItem("pp-" + key);
      localStorage.setItem("pp-" + key, value);
    } catch (e) { return null; }
  }

  /* ---------- Confirm dialog: real pattern from module-control.js ----------
     swal({ title: "Are you sure?", text, type: "warning", showCancelButton: true,
            confirmButtonText: "Yes, Turn Off", cancelButtonText: "Cancel", customClass: "danger-swal" }, cb) */
  function confirmDialog(o) {
    swal({
      title: o.title || "Are you sure?",
      text: o.text || "",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: o.ok || "Yes",
      cancelButtonText: "Cancel",
      closeOnConfirm: true,
      customClass: o.danger === false ? "" : "danger-swal",
    }, function (confirmed) { if (o.done) o.done(!!confirmed); });
  }
  function confirmOpts(el) {
    return { title: el.getAttribute("data-confirm-title"), text: el.getAttribute("data-confirm-text"),
      ok: el.getAttribute("data-confirm-ok"), danger: el.getAttribute("data-confirm-danger") !== "false" };
  }

  // Checkbox switches: intercept the change before the page's own handlers run
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el.matches || !el.matches("input[type=checkbox][data-confirm-when]")) return;
    if (el._ppConfirmed) { el._ppConfirmed = false; return; }
    var when = el.getAttribute("data-confirm-when");
    if ((when === "off" && el.checked) || (when === "on" && !el.checked)) return;
    e.stopImmediatePropagation();
    el.checked = !el.checked;                                  // undo until confirmed
    var o = confirmOpts(el);
    o.done = function (yes) { if (!yes) return; el._ppConfirmed = true; el.checked = !el.checked; el.dispatchEvent(new Event("change", { bubbles: true })); };
    confirmDialog(o);
  }, true);

  // Buttons with data-confirm-title: confirm first, then run the normal click
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[data-confirm-title]");
    if (!b || b.disabled) return;
    if (b._ppConfirmed) { b._ppConfirmed = false; return; }
    e.preventDefault(); e.stopImmediatePropagation();
    var o = confirmOpts(b);
    o.done = function (yes) { if (yes) { b._ppConfirmed = true; b.click(); } };
    confirmDialog(o);
  }, true);

  /* ---------- Validation: on demand (as the user types) ----------
     Rules mirror the real devScripts/validation.js where one exists:
       numeric  = numericValidate      (digits only, max 12)
       alnum    = alphaNumericValidate (letters / digits, max 26)
       password = passwordValidation   (8+ chars, upper, lower, number, special)
       maxlen16 = checkLength          (max 16 chars)
     Behaviour: nothing red on page load; a grey hint while the field has focus;
     red message as soon as what is typed is wrong; green border when it is right. */
  var PW = [
    { t: "At least 8 characters", re: /^.{8,}$/ },
    { t: "An uppercase letter", re: /[A-Z]/ },
    { t: "A lowercase letter", re: /[a-z]/ },
    { t: "A number", re: /[0-9]/ },
    { t: "A special character", re: /[\W_]/ },
  ];
  var RULES = {
    required: function (v) { return v.trim() !== "" || "This field is required"; },
    ipv4: function (v) { return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(v) || "Enter a valid IPv4 address (e.g. 172.31.0.1)"; },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email (e.g. name@company.com)"; },
    port: function (v) { return !v || (/^\d+$/.test(v) && +v >= 1 && +v <= 65535) || "Port must be a number from 1 to 65535"; },
    numeric: function (v) { return !v || /^\d{1,12}$/.test(v) || "Numbers only (max 12 digits)"; },
    alnum: function (v) { return !v || /^[A-Za-z0-9]{1,26}$/.test(v) || "Letters and numbers only (max 26)"; },
    maxlen16: function (v) { return v.length <= 16 || "Maximum 16 characters"; },
    number: function (v) { return (v !== "" && !isNaN(+v)) || "Enter a number"; },
    phone: function (v) { return !v || (/^[\d ]+$/.test(v) && v.replace(/\D/g, "").length >= 6 && v.replace(/\D/g, "").length <= 15) || "Digits only, 6 – 15"; },
    password: function (v) { return PW.every(function (r) { return r.re.test(v); }) || "Password does not meet all the rules"; },
    daterange: function (v, el) {
      var start = document.getElementById(el.getAttribute("data-after"));
      return !v || !start || !start.value || v >= start.value || "End Date must be on or after Start Date";
    },
    range: function (v, el) {
      var min = parseFloat(el.min), max = parseFloat(el.max), n = parseFloat(v);
      if (v === "" || isNaN(n)) return "Enter a number";
      return (n >= min && n <= max) || ("Allowed range " + el.min + " – " + el.max);
    },
  };
  var HINTS = {
    required: "Required", ipv4: "Format: 0-255.0-255.0-255.0-255 (e.g. 172.31.0.1)", email: "Example: name@company.com",
    port: "Number from 1 to 65535", numeric: "Numbers only, up to 12 digits", alnum: "Letters and numbers only, up to 26",
    maxlen16: "Up to 16 characters", number: "Any number", phone: "Digits only, 6 – 15", daterange: "On or after the Start Date",
  };
  function rulesOf(el) { return (el.getAttribute("data-validate") || "").split(" ").filter(Boolean); }
  function check(el) {
    var rules = rulesOf(el);
    if (!rules.length || el.disabled) return true;
    if (rules.indexOf("optional") !== -1 && el.value === "") return true;
    return rules.reduce(function (acc, r) { return acc === true && RULES[r] ? RULES[r](el.value, el) : acc; }, true);
  }
  function hintOf(el) {
    if (el.getAttribute("data-hint")) return el.getAttribute("data-hint");
    var rules = rulesOf(el).filter(function (r) { return r !== "required" && r !== "optional"; });
    var r = rules[rules.length - 1] || "required";
    if (r === "range") return "Allowed: " + el.min + " – " + el.max;
    return HINTS[r] || "";
  }
  function holderOf(el) {
    var h = el.closest(".pp-control, .pp-dac-row, .pp-field") || el.parentElement;
    if (h.matches(".pp-input-reveal, .pp-input-icon, .d-flex")) h = h.parentElement;
    return h;
  }
  function render(el) {
    var res = check(el);
    el.setAttribute("data-invalid", res === true ? "" : "1");
    var focused = document.activeElement === el, touched = !!el._touched;
    var bad = touched && res !== true;
    el.classList.toggle("is-invalid", bad);
    el.classList.toggle("is-valid", touched && res === true && el.value !== "" && !el.readOnly);

    if (!el._msg) { el._msg = document.createElement("div"); el._msg.className = "pp-field-msg"; holderOf(el).appendChild(el._msg); }
    var m = el._msg, isPw = rulesOf(el).indexOf("password") !== -1;
    if (isPw && (focused || bad)) {                       // live checklist for passwords
      m.className = "pp-field-msg pp-pw-rules";
      m.innerHTML = PW.map(function (r) {
        var ok = r.re.test(el.value);
        return '<span class="' + (ok ? "ok" : "") + '"><i class="fas ' + (ok ? "fa-check-circle" : "fa-circle") + '"></i>' + r.t + "</span>";
      }).join("");
    } else if (bad) {
      m.className = "pp-field-msg is-error"; m.innerHTML = '<i class="fas fa-exclamation-circle"></i>' + res;
    } else if (focused && hintOf(el)) {
      m.className = "pp-field-msg is-hint"; m.innerHTML = '<i class="fas fa-info-circle"></i>' + hintOf(el);
    } else { m.className = "pp-field-msg"; m.innerHTML = ""; }
    return res === true;
  }
  // used by pages / reset: show the result now
  function validate(el) { el._touched = true; return render(el); }
  function clearValidation(el) { el._touched = false; render(el); }

  document.addEventListener("focusin", function (e) { if (e.target.hasAttribute && e.target.hasAttribute("data-validate")) render(e.target); });
  document.addEventListener("focusout", function (e) { if (e.target.hasAttribute && e.target.hasAttribute("data-validate")) render(e.target); });
  // a Start Date change re-checks its End Date
  document.addEventListener("change", function (e) {
    if (!e.target.id) return;
    document.querySelectorAll('[data-after="' + e.target.id + '"]').forEach(function (end) { if (end._touched || end.value) validate(end); });
  });

  /* ---------- Unsaved-changes tracking ---------- */
  function fields(form) {
    return [].slice.call(form.querySelectorAll("input, select, textarea")).filter(function (el) {
      return el.type !== "file" && !el.hasAttribute("data-no-track") && el.closest("[data-form]") === form;
    });
  }
  function valueOf(el) { return el.type === "checkbox" || el.type === "radio" ? String(el.checked) : el.value; }
  function snapshot(form) { fields(form).forEach(function (el) { el.setAttribute("data-base", valueOf(el)); }); refresh(form); }
  function refresh(form) {
    var dirty = fields(form).some(function (el) { return el.getAttribute("data-base") !== null && valueOf(el) !== el.getAttribute("data-base"); });
    var valid = fields(form).every(function (el) { return el.getAttribute("data-invalid") !== "1"; });
    form.classList.toggle("is-dirty", dirty);
    form.querySelectorAll("[data-dirty-flag]").forEach(function (f) { if (f.closest("[data-form]") === form) f.hidden = !dirty; });
    form.querySelectorAll("[data-save]").forEach(function (b) { if (b.closest("[data-form]") === form) b.disabled = !dirty || !valid; });
    form.querySelectorAll("[data-reset]").forEach(function (b) { if (b.closest("[data-form]") === form) b.disabled = !dirty; });
  }
  /* ---------- Modern range sliders: filled track + value bubble while dragging ---------- */
  function paintRange(r) {
    var min = parseFloat(r.min) || 0, max = parseFloat(r.max) || 100, v = parseFloat(r.value) || 0;
    var p = max > min ? (v - min) / (max - min) * 100 : 0;
    r.style.setProperty("--p", p + "%");
    if (r._bubble) { r._bubble.textContent = r.value; r._bubble.style.left = "calc(" + p + "% + " + (10 - p * 0.2) + "px)"; }
  }
  function initRanges(root) {
    (root || document).querySelectorAll("input[type=range].pp-range").forEach(function (r) {
      if (!r._bubble) {
        var wrap = document.createElement("span"); wrap.className = "pp-range-wrap";
        r.parentNode.insertBefore(wrap, r); wrap.appendChild(r);
        r._bubble = document.createElement("span"); r._bubble.className = "pp-range-bubble"; wrap.appendChild(r._bubble);
      }
      paintRange(r);
    });
  }
  document.addEventListener("input", function (e) {
    if (e.target.matches && e.target.matches("input[type=range].pp-range")) paintRange(e.target);
    else if (e.target.id) { var r = document.querySelector('[data-sync="' + e.target.id + '"]') || document.getElementById("sl" + e.target.id.slice(2)); if (r && r.matches && r.matches(".pp-range")) setTimeout(function () { paintRange(r); }, 0); }
  });
  document.addEventListener("change", function (e) { if (e.target.getAttribute && e.target.getAttribute("data-range")) setTimeout(function () { initRanges(); }, 0); });

  function initForms(root) {
    initRanges(root);
    (root || document).querySelectorAll("[data-validate]").forEach(function (el) { if (!el._touched) render(el); });   // silent: nothing red on load
    (root || document).querySelectorAll("[data-form]").forEach(snapshot);
  }
  function onEdit(e) {
    var el = e.target, form = el.closest && el.closest("[data-form]");
    if (el.hasAttribute && el.hasAttribute("data-validate")) validate(el);
    if (form) refresh(form);
  }
  document.addEventListener("input", onEdit);
  document.addEventListener("change", onEdit);

  document.addEventListener("click", function (e) {
    var save = e.target.closest && e.target.closest("[data-save]");
    if (save && !save.disabled) { var f = save.closest("[data-form]"); if (f) setTimeout(function () { snapshot(f); }, 0); }

    var reset = e.target.closest && e.target.closest("[data-reset]");
    if (reset && !reset.disabled) {
      var rf = reset.closest("[data-form]");
      fields(rf).forEach(function (el) {
        var base = el.getAttribute("data-base"); if (base === null) return;
        if (el.type === "checkbox" || el.type === "radio") el.checked = base === "true"; else el.value = base;
        el.dispatchEvent(new Event("input", { bubbles: true }));   // keeps sliders / Set Value in sync
        if (el.hasAttribute("data-validate")) clearValidation(el);
      });
      refresh(rf);
    }

    var all = e.target.closest && e.target.closest("[data-save-all]");
    if (all) {
      var dirtyForms = [].slice.call(document.querySelectorAll("[data-form].is-dirty"));
      var bad = dirtyForms.filter(function (f) { return f.querySelector('[data-invalid="1"]'); });
      bad.forEach(function (f) { f.querySelectorAll('[data-invalid="1"]').forEach(validate); });
      if (bad.length) { bad[0].scrollIntoView({ behavior: "smooth", block: "center" }); toast("Please fix the highlighted fields first.", "warning"); return; }
      dirtyForms.forEach(snapshot);
      toast(dirtyForms.length ? "Updated Successfully!" : "No changes to save", dirtyForms.length ? "" : "info");
    }
  });

  window.addEventListener("beforeunload", function (e) {
    if (document.querySelector("[data-form].is-dirty")) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- Toasts + password reveal ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-toast],[data-reveal]");
    if (!t || t.disabled) return;
    if (t.hasAttribute("data-toast")) toast(t.getAttribute("data-toast") || "Updated Successfully!");
    if (t.hasAttribute("data-reveal")) {
      var inp = document.getElementById(t.getAttribute("data-reveal"));
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      var i = t.querySelector("i"); if (i) i.className = "far " + (show ? "fa-eye-slash" : "fa-eye");
    }
  });

  // set up forms as soon as the page is parsed (not after images), and again on load for late content
  document.addEventListener("DOMContentLoaded", function () { initForms(); });
  window.addEventListener("load", function () { initForms(); });
  window.ui = { toast: toast, confirm: confirmDialog, initForms: initForms, remember: remember, validate: validate, check: check };
})();
