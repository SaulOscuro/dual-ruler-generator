# Dual Ruler Generator

Static browser app for generating centered dual-scale ruler mask artwork as JPG.

The default design draws a black and white mask with centimeter ticks on one
side and inch ticks on the other. The centimeter side defaults to exactly 15 cm.
The inch side defaults to exactly 6 inches. Both scales are centered on the same
midpoint, so the inch side extends 1.2 mm farther at each end.

## Features

- Live preview matches exported JPG render.
- Export square masks at 1024x1024, 2048x2048, or 4096x4096 px.
- Separate controls for centimeter and inch tick sizes, including inch quarter ticks.
- Separate number size, number format, and unit label controls per side.
- Editable mask height and typography.

## Run Locally

Open `index.html` in a browser.

## Attribution

This project was inspired by Robb Godshaw's VectorRuler:
https://github.com/Robbbb/VectorRuler

VectorRuler is MIT licensed. This app is a new canvas-first implementation.
