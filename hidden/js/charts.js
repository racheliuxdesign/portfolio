/* ============================================================================
   AEGIS — lightweight SVG charts (zero dependencies).
   Each builder returns an SVG string. Styling driven by CSS currentColor and
   inline gradients so charts inherit theme accents.
   ========================================================================== */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function uid() { return "g" + Math.random().toString(36).slice(2, 8); }

  /* Stacked-area / line activity chart -------------------------------------- */
  function area(series, opts) {
    opts = opts || {};
    var w = opts.w || 720, h = opts.h || 220, pad = 8;
    var keys = opts.keys || ["whatsapp"];
    var colors = opts.colors || ["#3DDC97"];
    var max = 0;
    series.forEach(function (d) {
      var sum = 0; keys.forEach(function (k) { sum += d[k] || 0; });
      if (sum > max) max = sum;
    });
    max = max * 1.12 || 1;
    var n = series.length;
    function x(i) { return pad + (i * (w - pad * 2)) / (n - 1); }
    function y(v) { return h - pad - (v / max) * (h - pad * 2); }

    // build cumulative stacked bands top-down
    var stacks = series.map(function () { return 0; });
    var bands = "";
    var gid = uid();
    for (var ki = keys.length - 1; ki >= 0; ki--) {
      var k = keys[ki];
      var top = [], bot = [];
      for (var i = 0; i < n; i++) {
        var base = stacks[i];
        var val = base + (series[i][k] || 0);
        top.push([x(i), y(val)]);
        bot.push([x(i), y(base)]);
        stacks[i] = val;
      }
      var path = "M" + top.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
      var pathClose = path + " L" + bot.reverse().map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L") + " Z";
      var line = "M" + top.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
      bands += '<path d="' + pathClose + '" fill="' + colors[ki] + '" opacity="0.16"/>'
        + '<path d="' + line + '" fill="none" stroke="' + colors[ki] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }

    // x labels (sparse)
    var labels = "";
    var step = Math.ceil(n / 6);
    for (var li = 0; li < n; li += step) {
      labels += '<text x="' + x(li).toFixed(1) + '" y="' + (h - 1) + '" class="chart-x">' + series[li].label + "</text>";
    }
    // baseline grid
    var grid = "";
    for (var g = 1; g <= 3; g++) {
      var gy = pad + ((h - pad * 2) * g) / 4;
      grid += '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + gy + '" y2="' + gy + '" class="chart-grid"/>';
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" class="chart chart-area" role="img">'
      + grid + bands + labels + "</svg>";
  }

  /* Hour x weekday heatmap --------------------------------------------------- */
  function heatmap(grid, opts) {
    opts = opts || {};
    var color = opts.color || "61,220,151";
    var dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var html = '<div class="heatmap">';
    html += '<div class="heatmap-hours">';
    for (var h = 0; h < 24; h += 3) html += '<span style="grid-column:' + (h + 2) + '">' + h + "</span>";
    html += "</div>";
    grid.forEach(function (row, di) {
      html += '<div class="heatmap-row"><span class="heatmap-day">' + dayNames[di] + "</span>";
      row.forEach(function (v, hi) {
        var a = (0.06 + v * 0.94).toFixed(2);
        html += '<i class="heatmap-cell" style="background:rgba(' + color + "," + a + ')" '
          + 'title="' + dayNames[di] + " " + hi + ":00 · " + Math.round(v * 100) + '%"></i>';
      });
      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  /* Donut ------------------------------------------------------------------- */
  function donut(parts, opts) {
    opts = opts || {};
    var size = opts.size || 160, sw = opts.stroke || 16, r = (size - sw) / 2, c = size / 2;
    var circ = 2 * Math.PI * r;
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    var off = 0, arcs = "";
    parts.forEach(function (p) {
      var frac = p.value / total;
      var len = frac * circ;
      arcs += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + p.color
        + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(2) + " " + (circ - len).toFixed(2)
        + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + c + " " + c + ')" stroke-linecap="butt"/>';
      off += len;
    });
    return '<svg viewBox="0 0 ' + size + " " + size + '" class="donut" width="' + size + '" height="' + size + '">'
      + '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="' + sw + '"/>'
      + arcs
      + '<text x="' + c + '" y="' + (c - 2) + '" class="donut-num">' + (opts.centerTop || total) + "</text>"
      + '<text x="' + c + '" y="' + (c + 16) + '" class="donut-sub">' + (opts.centerSub || "") + "</text>"
      + "</svg>";
  }

  /* Sparkline --------------------------------------------------------------- */
  function spark(values, opts) {
    opts = opts || {};
    var w = opts.w || 120, h = opts.h || 34, pad = 2;
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var rng = (max - min) || 1, n = values.length;
    function x(i) { return pad + (i * (w - pad * 2)) / (n - 1); }
    function y(v) { return h - pad - ((v - min) / rng) * (h - pad * 2); }
    var pts = values.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1); });
    var line = "M" + pts.join(" L");
    var fill = line + " L" + x(n - 1).toFixed(1) + "," + (h - pad) + " L" + x(0).toFixed(1) + "," + (h - pad) + " Z";
    var col = opts.color || "currentColor";
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="spark" preserveAspectRatio="none">'
      + '<path d="' + fill + '" fill="' + col + '" opacity="0.14"/>'
      + '<path d="' + line + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
      + "</svg>";
  }

  /* Horizontal bar (platform breakdown) ------------------------------------- */
  function bars(items, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var html = '<div class="hbars">';
    items.forEach(function (it) {
      var pct = Math.round((it.value / max) * 100);
      html += '<div class="hbar-row">'
        + '<div class="hbar-head"><span>' + it.label + (it.sub ? ' <em>' + it.sub + "</em>" : "") + "</span><b>" + it.value.toLocaleString() + "</b></div>"
        + '<div class="hbar-track"><i style="width:' + pct + "%;background:" + it.color + '"></i></div>'
        + "</div>";
    });
    html += "</div>";
    return html;
  }

  window.CHARTS = { area: area, heatmap: heatmap, donut: donut, spark: spark, bars: bars };
})();
