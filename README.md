<div align="center">

<img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/icons/icon128.png" alt="SpeedGeek logo" width="96" height="96">

# SpeedGeek: Video Speed Controller

**Speed up or slow down any video or audio, 0.1x to 16x, with keys or a click. Remembers your speed per site. Free and open source.**

[![Version](https://img.shields.io/github/v/release/techygeekshome/SpeedGeek?label=version&color=4c9bff)](https://github.com/techygeekshome/SpeedGeek/releases)
[![Platform](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Firefox-0078d4)](#%EF%B8%8F-download--install)
[![License](https://img.shields.io/badge/license-GPL--3.0-3fb950)](LICENSE)
[![Made by TechyGeeksHome](https://img.shields.io/badge/made%20by-TechyGeeksHome-b191f2)](https://techygeekshome.info)
[![Support on Ko-fi](https://img.shields.io/badge/support-Ko--fi-ff5e5b)](https://ko-fi.com/techygeekshome)

[Download](#%EF%B8%8F-download--install) · [Features](#-what-it-does) · [Privacy](#-privacy) · [Full guide](https://techygeekshome.info/browser-extensions/speedgeek/) · [License](#-license)

</div>

---

## 🎬 See it in action

[![SpeedGeek demo video](https://img.youtube.com/vi/bTH-QW3aMyI/maxresdefault.jpg)](https://www.youtube.com/watch?v=bTH-QW3aMyI)

---

Speed up or slow down any video or audio in your browser, from 0.1x to 16x, with a key press or a click. SpeedGeek remembers the speed you like for each site and puts it back when a site tries to change it.

The full guide, with every step explained, is on [TechyGeeksHome](https://techygeekshome.info/browser-extensions/speedgeek/).

## 📸 Screenshots

<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-drag.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-faster.jpg" width="49%" />
</p>
<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-lesson.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-menu.jpg" width="49%" />
</p>
<p float="left">
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-options.jpg" width="49%" />
  <img src="https://raw.githubusercontent.com/techygeekshome/SpeedGeek/main/screenshots/speedgeek-remembered.jpg" width="49%" />
</p>

## ✨ What it does

- **Any video or audio, any site**: from 0.1x to 16x, including videos added after the page loads, videos inside shadow DOM players and videos in frames on the same site.
- **Keyboard shortcuts** on the page: **S** slower, **D** faster, **R** back to 1x, **G** your preferred speed (press again for 1x), **Z** back 10 seconds, **X** forward 10 seconds, **V** hide or show the speed box. Change any of them in the options.
- **A small speed box** on the video that fades out on its own. Hover it for slower, faster, back and forward buttons, and drag it out of the way. You can turn it off.
- **Quick menu** with 1x, 1.25x, 1.5x, 1.75x, 2x, 2.5x and 3x buttons, plus a slider from 0.1x to 16x.
- **Remembers your speed for each site** (you can turn this off) and shows it on the toolbar icon.
- **Keeps your speed** when a site puts it back to 1x, for example when the next video starts.
- **Never run on these sites**: a list of sites where SpeedGeek does nothing, plus a one-click "Turn off on this site".

## 🚫 What it won't do

- It cannot change videos inside browser pages (settings, the add-on store) or inside frames from other sites unless you have allowed every site.
- It does not download videos, skip adverts or change what a site shows you.
- Some browsers turn the sound off at very low or very high speeds (Firefox does below 0.25x and above 4x). That is the browser, not SpeedGeek.

## 🔀 Two ways to run it

When you install SpeedGeek, it opens a short welcome page and asks you to pick:

- **On every site (recommended).** SpeedGeek adds a small script to the pages you visit, so your keys and the speed box are ready straight away and remembered speeds are put back as the page opens. Your browser calls this "read and change data on all websites". The script only looks for video and audio and listens for your speed keys. It reads nothing else and sends nothing anywhere.
- **Only when I click the icon.** SpeedGeek has no access to any site until you click its icon on a tab. Then it works on that tab, keys included, until the page reloads.

You can switch at any time in the options. Site access is asked for only when you choose "every site", and is removed again if you switch back.

## ⬇️ Download & install

Pick the download for your browser from the [latest release](https://github.com/techygeekshome/SpeedGeek/releases/latest).

| Browser | Download |
|---|---|
| Chrome, Brave, Opera, Vivaldi | `SpeedGeek-chrome.zip` |
| Microsoft Edge | `SpeedGeek-edge.zip` |
| Firefox (142 or newer) | `SpeedGeek-firefox.zip` |

`SpeedGeek.zip` is the same package as the Chrome and Edge downloads.

### Chrome, Edge, Brave, Opera and Vivaldi

1. Unzip the download somewhere you'll keep it.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `speedgeek` folder.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and pick `SpeedGeek-firefox.zip`.

Firefox removes temporary add-ons when it closes.

### Build it yourself

The code in this repo is the Chromium version. `manifest.firefox.json` is the Firefox manifest. Run `./build.sh` to make every package in `dist/`.

## 🧭 How to use

1. Open any page with a video and press **D** to speed it up or **S** to slow it down. The speed box on the video shows the new speed.
2. Or click the SpeedGeek icon and pick a speed, or drag the slider.
3. Next time you open that site, your speed is put back by itself.
4. To change the keys, the step size or the preferred speed, open **Options** from the menu.

## ⚙️ How it works

- `content.js` is the page script. It finds `<video>` and `<audio>` elements (also inside open shadow roots and ones added later), sets their `playbackRate`, listens for your keys (not while you are typing in a box) and draws the speed box in its own shadow root. When the site changes the speed back, it sets it again.
- `background.js` keeps the speed for each tab, passes changes to every frame in the tab, remembers speeds per site and shows the speed on the icon. In "every site" mode it registers the page script with `scripting.registerContentScripts`; in "click" mode the menu adds it to the current tab only.
- No libraries, no remote code, no network requests.

## 🔒 Privacy

SpeedGeek has no account, no analytics and sends nothing anywhere. The only things it stores, on your own computer, are your settings and the speed you chose for each site.

## ☕ Support

SpeedGeek is free and always will be. If it saved you some time, you can [buy us a coffee on Ko-fi](https://ko-fi.com/techygeekshome). Welcome, but never expected.

## 🐛 Support & contributing

Found a bug or have a request? [Open an issue](https://github.com/techygeekshome/SpeedGeek/issues) or [get in touch](https://techygeekshome.info/contact/). Pull requests are welcome.

## 📄 License

GPL-3.0. Free for everyone, including commercial use.

SpeedGeek is an independent tool made by [TechyGeeksHome](https://techygeekshome.info).

© 2026 TechyGeeksHome.

---

<div align="center">

Made with ❤️ by [**TechyGeeksHome**](https://techygeekshome.info)

[Website](https://techygeekshome.info) · [YouTube](https://www.youtube.com/channel/UCtEuFj1SMLiuRoucD1hv8dA) · [X](https://x.com/TechyGeeks1) · [Instagram](https://www.instagram.com/andrewarmstrongtgh/)

</div>
