# Dual Ruler Generator

Static browser app for generating centered dual-scale ruler artwork as JPG.

The default design draws a black ruler plate with white centimeter ticks on one
side and inch ticks on the other. The centimeter side defaults to exactly 15 cm.
The inch side defaults to exactly 6 inches. Both scales are centered on the same
midpoint, so the inch side extends 1.2 mm farther at each end.

## Features

- Live preview matches exported JPG render.
- Export long edge at 1024, 2048, or 4096 px.
- Separate controls for centimeter and inch tick sizes.
- Separate number size, number format, and unit label controls per side.
- Editable plate height, margins, corners, and hole.

## Run Locally

Open `index.html` in a browser.

## Attribution

This project was inspired by Robb Godshaw's VectorRuler:
https://github.com/Robbbb/VectorRuler

VectorRuler is MIT licensed. This app is a new canvas-first implementation.
