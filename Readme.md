# ✂️ PixFit — Batch Image Resizer

> Resize once. Get every size.

Upload one image, define as many dimensions as you need, and download them all in a single ZIP — instantly, right in your browser. No servers. No uploads. No accounts. Your images never leave your device.

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀%20Try%20Live%20Demo-pranayy1.github.io%2Fpixfit-D96B3A?style=for-the-badge)](https://pranayy1.github.io/pixfit/)

</div>

---

## ✨ Features

- 🖼️ **Drag & Drop Upload** — Drop any image or click to browse (PNG, JPG, WEBP, GIF)
- 📐 **3-Mode Dimension Lock** — Free / Square / Ratio, cycle with one button
- ⚡ **Quick-Add Presets** — 8 common sizes built in from 16×16 up to 1920×1080
- ⌨️ **Keyboard Friendly** — Press `Enter` in any input to instantly add a dimension
- 📦 **ZIP Download** — All resized images packed into one ZIP, one click
- 📊 **Progress Overlay** — Animated progress bar while images process
- 🔁 **Replace Image** — Hover the preview and click to swap anytime
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile
- 🚫 **100% Client-Side** — Nothing ever leaves your browser

---

## 🔗 The 3-Mode Lock Button

The small button between Width and Height cycles through three modes:

| Mode | Icon | Color | Best for |
|---|---|---|---|
| **Free** | ⛓️‍💥 | Gray | Fully independent W and H |
| **Square** | ⬛ | Indigo | Icon sets — type width, height matches automatically |
| **Ratio** | ✂️ | Orange | Photos — height auto-calculates from original proportions |

---

## 🗂️ File Structure

```
pixfit/
├── index.html    ← App markup
├── style.css     ← All styles and animations
├── app.js        ← All logic (upload, resize, ZIP, progress)
└── README.md     ← This file
```

---

## 🚀 Run Locally

No build step needed. Just open `index.html` in any modern browser.

```bash
git clone https://github.com/pranayy1/pixfit.git
cd pixfit
open index.html
```

---

<div align="center">
  Made with ♥ by <a href="https://github.com/pranayy1">pranayy1</a>
</div>