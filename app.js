const MM_PER_INCH = 25.4;
const MASK_FOREGROUND = "#ffffff";
const MASK_BACKGROUND = "#000000";

const canvas = document.getElementById("rulerCanvas");
const ctx = canvas.getContext("2d");

const fields = [
  "exportSize",
  "jpgQuality",
  "plateHeightMm",
  "borderWidthMm",
  "fontFamily",
  "customFontFamily",
  "cmLength",
  "cmMajorTick",
  "cmMediumTick",
  "cmMinorTick",
  "cmNumberSize",
  "cmNumberFormat",
  "cmLabel",
  "inchLength",
  "inchMajorTick",
  "inchMediumTick",
  "inchQuarterTick",
  "inchMinorTick",
  "inchNumberSize",
  "inchNumberFormat",
  "inchLabel",
  "centerText",
  "centerTextSize",
];

const controls = Object.fromEntries(
  fields.map((id) => [id, document.getElementById(id)])
);

function numberValue(id) {
  return Number.parseFloat(controls[id].value) || 0;
}

function fontFamilyValue() {
  const selected = controls.fontFamily.value;
  const custom = controls.customFontFamily.value.trim();
  if (selected === "custom" && custom) {
    return `"${custom.replaceAll('"', '\\"')}", Arial, Helvetica, sans-serif`;
  }
  return selected === "custom" ? "Arial, Helvetica, sans-serif" : selected;
}

function getSettings() {
  return {
    exportSize: Math.round(numberValue("exportSize")),
    jpgQuality: Math.min(1, Math.max(0.7, numberValue("jpgQuality"))),
    rulerHeightMm: numberValue("plateHeightMm"),
    borderWidthMm: numberValue("borderWidthMm"),
    fontFamily: fontFamilyValue(),
    cm: {
      lengthMm: numberValue("cmLength") * 10,
      majorTickMm: numberValue("cmMajorTick"),
      mediumTickMm: numberValue("cmMediumTick"),
      minorTickMm: numberValue("cmMinorTick"),
      numberSizeMm: numberValue("cmNumberSize"),
      numberFormat: controls.cmNumberFormat.value,
      label: controls.cmLabel.value,
    },
    inch: {
      lengthMm: numberValue("inchLength") * MM_PER_INCH,
      lengthInches: numberValue("inchLength"),
      majorTickMm: numberValue("inchMajorTick"),
      mediumTickMm: numberValue("inchMediumTick"),
      quarterTickMm: numberValue("inchQuarterTick"),
      minorTickMm: numberValue("inchMinorTick"),
      numberSizeMm: numberValue("inchNumberSize"),
      numberFormat: controls.inchNumberFormat.value,
      label: controls.inchLabel.value,
    },
    centerText: controls.centerText.value,
    centerTextSizeMm: numberValue("centerTextSize"),
  };
}

function getGeometry(settings) {
  const rulerLengthMm = Math.max(settings.cm.lengthMm, settings.inch.lengthMm);
  const pxPerMm = settings.exportSize / rulerLengthMm;
  const rulerHeightPx = settings.rulerHeightMm * pxPerMm;
  return {
    rulerLengthMm,
    rulerHeightPx,
    pxPerMm,
    sizePx: settings.exportSize,
    centerXPx: settings.exportSize / 2,
    topYPx: (settings.exportSize - rulerHeightPx) / 2,
    bottomYPx: (settings.exportSize + rulerHeightPx) / 2,
  };
}

function mmToPx(mm, geometry) {
  return geometry.centerXPx + mm * geometry.pxPerMm;
}

function sizePx(mm, geometry) {
  return mm * geometry.pxPerMm;
}

function formatNumber(value, format) {
  if (format === "hide-zero" && value === 0) {
    return "";
  }
  if (format === "leading-zero" && value >= 0 && value < 10) {
    return String(value).padStart(2, "0");
  }
  return String(value);
}

function setTextStyle(context, size, settings, weight = 700) {
  context.font = `${weight} ${size}px ${settings.fontFamily}`;
  context.fillStyle = MASK_FOREGROUND;
  context.textBaseline = "middle";
}

function textAlignForX(x, geometry) {
  const edgeBuffer = sizePx(2.2, geometry);
  if (x < edgeBuffer) {
    return "left";
  }
  if (x > geometry.sizePx - edgeBuffer) {
    return "right";
  }
  return "center";
}

function drawText(context, text, x, y, size, settings, geometry, weight = 700) {
  if (!text) {
    return;
  }
  context.save();
  setTextStyle(context, size, settings, weight);
  context.textAlign = textAlignForX(x, geometry);
  context.fillText(text, x, y);
  context.restore();
}

function drawTick(context, x, edgeY, tickLengthPx, fromTop) {
  context.beginPath();
  context.moveTo(x, edgeY);
  context.lineTo(x, fromTop ? edgeY + tickLengthPx : edgeY - tickLengthPx);
  context.stroke();
}

function drawBorder(context, settings, geometry) {
  const borderWidthPx = sizePx(settings.borderWidthMm, geometry);
  if (borderWidthPx <= 0) {
    return;
  }
  const halfStroke = borderWidthPx / 2;
  const leftX = mmToPx(-geometry.rulerLengthMm / 2, geometry) + halfStroke;
  const rightX = mmToPx(geometry.rulerLengthMm / 2, geometry) - halfStroke;
  const topY = geometry.topYPx + halfStroke;
  const bottomY = geometry.bottomYPx - halfStroke;

  context.save();
  context.lineWidth = borderWidthPx;
  context.strokeStyle = MASK_FOREGROUND;
  context.strokeRect(leftX, topY, rightX - leftX, bottomY - topY);
  context.restore();
}

function drawCmSide(context, settings, geometry) {
  const half = settings.cm.lengthMm / 2;
  const topY = geometry.topYPx;
  const labelY = topY + sizePx(
    settings.cm.majorTickMm + settings.cm.numberSizeMm * 0.55,
    geometry
  );
  const count = Math.round(settings.cm.lengthMm);

  for (let i = 0; i <= count; i += 1) {
    const mm = -half + i;
    const x = mmToPx(mm, geometry);
    const isMajor = i % 10 === 0;
    const isMedium = i % 5 === 0;
    const tickMm = isMajor
      ? settings.cm.majorTickMm
      : isMedium
        ? settings.cm.mediumTickMm
        : settings.cm.minorTickMm;
    drawTick(context, x, topY, sizePx(tickMm, geometry), true);

    if (isMajor) {
      drawText(
        context,
        formatNumber(Math.round(i / 10), settings.cm.numberFormat),
        x,
        labelY,
        sizePx(settings.cm.numberSizeMm, geometry),
        settings,
        geometry
      );
    }
  }

  drawText(
    context,
    settings.cm.label,
    mmToPx(-half + Math.min(5, settings.cm.lengthMm * 0.08), geometry),
    labelY,
    sizePx(settings.cm.numberSizeMm * 0.82, geometry),
    settings,
    geometry
  );
}

function drawInchSide(context, settings, geometry) {
  const half = settings.inch.lengthMm / 2;
  const bottomY = geometry.bottomYPx;
  const labelY = bottomY - sizePx(
    settings.inch.majorTickMm + settings.inch.numberSizeMm * 0.55,
    geometry
  );
  const tickCount = Math.round(settings.inch.lengthInches * 8);

  for (let i = 0; i <= tickCount; i += 1) {
    const mm = -half + (i / 8) * MM_PER_INCH;
    const x = mmToPx(mm, geometry);
    const isMajor = i % 8 === 0;
    const isHalf = i % 4 === 0;
    const isQuarter = i % 2 === 0;
    const tickMm = isMajor
      ? settings.inch.majorTickMm
      : isHalf
        ? settings.inch.mediumTickMm
        : isQuarter
          ? settings.inch.quarterTickMm
          : settings.inch.minorTickMm;
    drawTick(context, x, bottomY, sizePx(tickMm, geometry), false);

    if (isMajor) {
      drawText(
        context,
        formatNumber(Math.round(i / 8), settings.inch.numberFormat),
        x,
        labelY,
        sizePx(settings.inch.numberSizeMm, geometry),
        settings,
        geometry
      );
    }
  }

  drawText(
    context,
    settings.inch.label,
    mmToPx(half - settings.inch.lengthMm * 0.08, geometry),
    labelY,
    sizePx(settings.inch.numberSizeMm * 0.82, geometry),
    settings,
    geometry
  );
}

function drawCenterText(context, settings, geometry) {
  drawText(
    context,
    settings.centerText,
    geometry.centerXPx,
    (geometry.topYPx + geometry.bottomYPx) / 2,
    sizePx(settings.centerTextSizeMm, geometry),
    settings,
    geometry,
    800
  );
}

function render() {
  const settings = getSettings();
  const geometry = getGeometry(settings);
  canvas.width = geometry.sizePx;
  canvas.height = geometry.sizePx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = MASK_BACKGROUND;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = MASK_FOREGROUND;
  ctx.fillStyle = MASK_FOREGROUND;
  ctx.lineWidth = Math.max(1, Math.round(sizePx(0.16, geometry)));
  ctx.lineCap = "square";

  drawBorder(ctx, settings, geometry);
  drawCmSide(ctx, settings, geometry);
  drawInchSide(ctx, settings, geometry);
  drawCenterText(ctx, settings, geometry);

  document.getElementById("scaleReadout").textContent =
    `1 mm = ${geometry.pxPerMm.toFixed(2)} px`;
  document.getElementById("dimensionReadout").textContent =
    `${geometry.sizePx} x ${geometry.sizePx} px | ruler ${geometry.rulerLengthMm.toFixed(2)} x ${settings.rulerHeightMm.toFixed(2)} mm`;
}

function exportJpg() {
  render();
  const settings = getSettings();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", settings.jpgQuality);
  link.download = `dual-ruler-mask-${settings.exportSize}px.jpg`;
  link.click();
}

fields.forEach((id) => {
  controls[id].addEventListener("input", render);
  controls[id].addEventListener("change", render);
});

document.getElementById("exportButton").addEventListener("click", exportJpg);
render();
