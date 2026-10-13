/*
 * Demo appliance state — ONE place for the dummy values that several screens share
 * (stand-in for the real CGI responses: cgi_Index, cgi_statusPageManager, read_temp_status).
 * Port-back: replace with the real ajax responses; PILOT_ALERTS() keeps working on the same shape.
 */
(function () {
  var tec = [], lasers = [];
  for (var i = 1; i <= 16; i++) {
    tec.push({ id: i, name: "TEC " + i, connected: false });          // Status page: TEC Disconnected (real screenshot)
    lasers.push({ id: i, name: "Laser" + i, current: 0 });             // Current(mA) = 0 (real screenshot)
  }

  window.PILOT_STATE = {
    device: "Adoption-ELS",
    softwareVersion: "2.05",
    buildVersion: "fw110126",
    bootTime: null,                 // real dashboard: "Not Available !!"
    uptime: "up 10 wk(s) 2 day(s) 4 hr(s) 27 min(s)",   // cgi_Index: systemTime
    health: true, software: true,                      // cgi_Index: health_status / software_status
    freeSpace: { data: 10.98, xdata: 10.98 },          // GB  (cgi_Index)
    memory: { total: 4, used: 1.02, free: 2.8 },       // GB  (cgi_Index)
    cpuTemp: 52.6,                                     // °C  (cgi_statusPageManager: CPU Temperature)
    coreVoltage: 0.86,                                 // V   (core_voltage)
    disks: [{ name: "Root Disk", used: 25 }, { name: "Boot Disk", used: 21 }],   // %
    ethernet: [{ name: "eth0", up: true }],
    rockerSwitch: false,            // real: Rocker Switch OFF
    keySwitch: false,               // real: Key Switch OFF
    tec: tec,
    lasers: lasers,
    // SetUp screens shown but not openable (real site: Calibration / Debug tabs disabled).
    // To unlock one, remove it from this list.
    locked: ["calibration", "debug"],
    cgi: false,                     // true on the real box: alert history comes from read_CCMAlerts
  };

  /* ---------- Appliance alert history: cgi_CCMLogs.py  request_Type = "read_CCMAlerts" ----------
     Response (real): { logsData: [{ datetime, element, elementname, loglevel, sate, action, message }], headers, propetyName }
     "sate" carries the type: Info / Warning / Alert (same levels as Set Up Email).
     PILOT_STATE.cgi = true  -> real call (same GET pattern as CCMLogs.js CallPythonService)
     PILOT_STATE.cgi = false -> demo rows below, in the exact response shape. */
  var DEMO_CCM_ALERTS = { headers: ["Date Time", "Element", "Element Name", "Log Level", "State", "Action", "Message"],
    propetyName: ["datetime", "element", "elementname", "loglevel", "sate", "action", "message"],
    logsData: [
      { datetime: "Oct 13, 2026, 13:40:12", element: "TEC", elementname: "TEC 1", loglevel: "1", sate: "Alert", action: "get", message: "TEC Disconnected" },
      { datetime: "Oct 13, 2026, 13:40:12", element: "TEC", elementname: "TEC 2", loglevel: "1", sate: "Alert", action: "get", message: "TEC Disconnected" },
      { datetime: "Oct 13, 2026, 13:30:02", element: "SYSTEM", elementname: "Rocker Switch", loglevel: "2", sate: "Warning", action: "get", message: "Rocker switch is OFF" },
      { datetime: "Oct 13, 2026, 13:30:02", element: "SYSTEM", elementname: "Key Switch", loglevel: "2", sate: "Warning", action: "get", message: "Key switch is OFF" },
      { datetime: "Oct 13, 2026, 09:12:47", element: "SYSTEM", elementname: "Boot Time", loglevel: "3", sate: "Info", action: "get", message: "Boot time not available" },
      { datetime: "Oct 12, 2026, 18:20:33", element: "SYSTEM", elementname: "Firmware", loglevel: "3", sate: "Info", action: "set", message: "Activated AdopELS_110126" },
    ] };
  window.PILOT_FETCH_ALERTS = function (done) {
    if (window.PILOT_STATE.cgi && window.jQuery) {
      $.ajax({ type: "Get", url: "../cgi/cgi_CCMLogs.py", contentType: "application/json", dataType: "json",
        data: { request_Type: "read_CCMAlerts", startDate: "", endDate: "", maxLogLevel: "", logType: "All", uuid: window.uuid },
        success: function (r) { done((r && r.logsData) || []); }, error: function () { done([]); } });
    } else setTimeout(function () { done(DEMO_CCM_ALERTS.logsData.slice()); }, 0);
  };

  // Alerts are DERIVED from the state above — nothing invented.
  window.PILOT_ALERTS = function () {
    var s = window.PILOT_STATE, out = [];
    var tecDown = s.tec.filter(function (t) { return !t.connected; }).length;
    if (tecDown) out.push({ level: "bad", title: tecDown + " TEC" + (tecDown > 1 ? "s" : "") + " disconnected",
      detail: "Status › Current Settings › TEC", href: "status.html#tec" });
    if (!s.rockerSwitch) out.push({ level: "warn", title: "Rocker Switch is OFF", detail: "Status › Current Settings", href: "status.html#switches" });
    if (!s.keySwitch) out.push({ level: "warn", title: "Key Switch is OFF", detail: "Status › Current Settings", href: "status.html#switches" });
    if (!s.bootTime) out.push({ level: "warn", title: "Boot Time not available", detail: "Dashboard › System", href: "index.html#system" });
    return out;
  };
})();
