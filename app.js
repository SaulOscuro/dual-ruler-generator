const MM_PER_INCH = 25.4;
const canvas = document.getElementById("rulerCanvas");
const ctx = canvas.getContext("2d");

const fields = [
  "exportSize",
  "jpgQuality",
  "plateHeightMm",
  "endMarginMm",
  "cornerRadiusMm",
  "holeDiameterMm",
  "holeOffsetMm",
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

function getSettings() {
  return {
    exportSize: Math.round(numberValue("exportSize")),
    jpgQuality: Math.min(1, Math.max(0.7, numberValue("jpgQuality"))),
    plateHeightMm: numberValue("plateHeightMm"),
    endMarginMm: numberValue("endMarginMm"),
    cornerRadiusMm: numberValue("cornerRadiusMm"),
    holeDiameterMm: numberValue("holeDiameterMm"),
    holeOffsetMm: numberValue("holeOffsetMm"),
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
  const longestRulerMm = Math.max(settings.cm.lengthMm, settings.inch.lengthMm);
  const plateLengthMm = longestRulerMm + settings.endMarginMm * 2;
  const pxPerMm = settings.exportSize / plateLengthMm;
  return {
    plateLengthMm,
    pxPerMm,
    widthPx: settings.exportSize,
    heightPx: Math.round(settings.plateHeightMm * pxPerMm),
    centerXPx: settings.exportSize / 2,
  };
}

function mmToPx(mm, geometry) {
  return geometry.centerXPx + mm * geometry.pxPerMm;
}

function sizePx(mm, geometry) {
  return mm * geometry.pxPerMm;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
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

function drawRotatedText(context, text, x, y, size, rotateUp = true) {
  if (!text) {
    return;
  }
  context.save();
  context.translate(x, y);
  context.rotate(rotateUp ? -Math.PI / 2 : Math.PI / 2);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${size}px Arial, Helvetica, sans-serif`;
  context.fillText(text, 0, 0);
  context.restore();
}

function drawTick(context, x, edgeY, tickLengthPx, fromTop) {
  context.beginPath();
  context.moveTo(x, edgeY);
  context.lineTo(x, fromTop ? edgeY + tickLengthPx : edgeY - tickLengthPx);
  context.stroke();
}

function drawCmSide(context, settings, geometry) {
  const half = settings.cm.lengthMm / 2;
  const topY = 0;
  const labelY = sizePx(settings.cm.majorTickMm + settings.cm.numberSizeMm + 1.8, geometry);
  const unitY = sizePx(settings.cm.majorTickMm + settings.cm.numberSizeMm * 2.6, geometry);
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
      const value = Math.round(i / 10);
      drawRotatedText(
        context,
        formatNumber(value, settings.cm.numberFormat),
        x,
        labelY,
        sizePx(settings.cm.numberSizeMm, geometry),
        true
      );
    }
  }

  drawRotatedText(
    context,
    settings.cm.label,
    mmToPx(-half + settings.cm.lengthMm * 0.08, geometry),
    unitY,
    sizePx(settings.cm.numberSizeMm * 0.82, geometry),
    true
  );
}

function drawInchSide(context, settings, geometry) {
  const half = settings.inch.lengthMm / 2;
  const bottomY = geometry.heightPx;
  const labelY = bottomY - sizePx(settings.inch.majorTickMm + settings.inch.numberSizeMm + 1.8, geometry);
  const unitY = bottomY - sizePx(settings.inch.majorTickMm + settings.inch.numberSizeMm * 2.6, geometry);
  const tickCount = Math.round(settings.inch.lengthInches * 16);

  for (let i = 0; i <= tickCount; i += 1) {
    const mm = -half + (i / 16) * MM_PER_INCH;
    const x = mmToPx(mm, geometry);
    const isMajor = i % 16 === 0;
    const isMedium = i % 8 === 0;
    const tickMm = isMajor
      ? settings.inch.majorTickMm
      : isMedium
        ? settings.inch.mediumTickMm
        : settings.inch.minorTickMm;
    drawTick(context, x, bottomY, sizePx(tickMm, geometry), false);

    if (isMajor) {
      const value = Math.round(i / 16);
      drawRotatedText(
        context,
        formatNumber(value, settings.inch.numberFormat),
        x,
        labelY,
        sizePx(settings.inch.numberSizeMm, geometry),
        false
      );
    }
  }

  drawRotatedText(
    context,
    settings.inch.label,
    mmToPx(half - settings.inch.lengthMm * 0.08, geometry),
    unitY,
    sizePx(settings.inch.numberSizeMm * 0.82, geometry),
    false
  );
}

function drawCenterText(context, settings, geometry) {
  if (!settings.centerText) {
    return;
  }
  const x = geometry.centerXPx;
  const y = geometry.heightPx / 2;
  context.save();
  context.translate(x, y);
  context.rotate(-Math.PI / 2);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 ${sizePx(settings.centerTextSizeMm, geometry)}px Arial, Helvetica, sans-serif`;
  context.fillText(settings.centerText, 0, 0);
  context.restore();
}

function render() {
  const settings = getSettings();
  const geometry = getGeometry(settings);
  canvas.width = geometry.widthPx;
  canvas.height = geometry.heightPx;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  roundedRect(
    ctx,
    0,
    0,
    canvas.width,
    canvas.height,
    sizePx(settings.cornerRadiusMm, geometry)
  );
  ctx.fillStyle = "#242b32";
  ctx.fill();

  if (settings.holeDiameterMm > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(
      canvas.width - sizePx(settings.holeOffsetMm, geometry),
      canvas.height / 2,
      sizePx(settings.holeDiameterMm / 2, geometry),
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(
      canvas.width - sizePx(settings.holeOffsetMm, geometry),
      canvas.height / 2,
      sizePx(settings.holeDiameterMm / 2, geometry),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  ctx.strokeStyle = "#f5f7f8";
  ctx.fillStyle = "#f5f7f8";
  ctx.lineWidth = Math.max(1, Math.round(sizePx(0.16, geometry)));
  ctx.lineCap = "square";

  drawCmSide(ctx, settings, geometry);
  drawInchSide(ctx, settings, geometry);
  drawCenterText(ctx, settings, geometry);

  document.getElementById("scaleReadout").textContent =
    `1 mm = ${geometry.pxPerMm.toFixed(2)} px`;
  document.getElementById("dimensionReadout").textContent =
    `${geometry.widthPx} x ${geometry.heightPx} px | ${geometry.plateLengthMm.toFixed(2)} x ${settings.plateHeightMm.toFixed(2)} mm`;
}

function exportJpg() {
  render();
  const settings = getSettings();
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", settings.jpgQuality);
  link.download = `dual-ruler-${settings.exportSize}px.jpg`;
  link.click();
}

fields.forEach((id) => {
  controls[id].addEventListener("input", render);
  controls[id].addEventListener("change", render);
});

document.getElementById("exportButton").addEventListener("click", exportJpg);
render();
