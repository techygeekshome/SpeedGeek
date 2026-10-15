# SpeedGeek: Video Speed Controller

Speed up or slow down any video or audio in your browser, from 0.1x to 16x, with a key press or a click. SpeedGeek remembers the speed you like for each site and puts it back when a site tries to change it.

**Download and full guide:** https://techygeekshome.info/browser-extensions/speedgeek/

## What it does

- **Any video or audio, any site**: from 0.1x to 16x, including videos added after the page loads, videos inside shadow DOM players and videos in frames on the same site.
- **Keyboard shortcuts** on the page: **S** slower, **D** faster, **R** back to 1x, **G** your preferred speed (press again for 1x), **Z** back 10 seconds, **X** forward 10 seconds, **V** hide or show the speed box. Change any of them in the options.
- **A small speed box** on the video that fades out on its own. Hover it for slower, faster, back and forward buttons, and drag it out of the way. You can turn it off.
- **Quick menu** with 1x, 1.25x, 1.5x, 1.75x, 2x, 2.5x and 3x buttons, plus a slider from 0.1x to 16x.
- **Remembers your speed for each site** (you can turn this off) and shows it on the toolbar icon.
- **Keeps your speed** when a site puts it back to 1x, for example when the next video starts.
- **Never run on these sites**: a list of sites where SpeedGeek does nothing, plus a one-click "Turn off on this site".

## What it won't do

- It cannot change videos inside browser pages (settings, the add-on store) or inside frames from other sites unless you have allowed every site.
- It does not download videos, skip adverts or change what a site shows you.
- Some browsers turn the sound off at very low or very high speeds (Firefox does below 0.25x and above 4x). That is the browser, not SpeedGeek.

## Two ways to run it

When you install SpeedGeek, it opens a short welcome page and asks you to pick:

- **On every site (recommended).** SpeedGeek adds a small script to the pages you visit, so your keys and the speed box are ready straight away and remembered speeds are put back as the page opens. Your browser calls this "read and change data on all websites". The script only looks for video and audio and listens for your speed keys. It reads nothing else and sends nothing anywhere.
- **Only when I click the icon.** SpeedGeek has no access to any site until you click its icon on a tab. Then it works on that tab, keys included, until the page reloads.

You can switch at any time in the options. Site access is asked for only when you choose "every site", and is removed again if you switch back.

## Install

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

## Use

1. Open any page with a video and press **D** to speed it up or **S** to slow it down. The speed box on the video shows the new speed.
2. Or click the SpeedGeek icon and pick a speed, or drag the slider.
3. Next time you open that site, your speed is put back by itself.
4. To change the keys, the step size or the preferred speed, open **Options** from the menu.

## How it works

- `content.js` is the page script. It finds `<video>` and `<audio>` elements (also inside open shadow roots and ones added later), sets their `playbackRate`, listens for your keys (not while you are typing in a box) and draws the speed box in its own shadow root. When the site changes the speed back, it sets it again.
- `background.js` keeps the speed for each tab, passes changes to every frame in the tab, remembers speeds per site and shows the speed on the icon. In "every site" mode it registers the page script with `scripting.registerContentScripts`; in "click" mode the menu adds it to the current tab only.
- No libraries, no remote code, no network requests.

## Privacy

SpeedGeek has no account, no analytics and sends nothing anywhere. The only things it stores, on your own computer, are your settings and the speed you chose for each site.

## Licence

GPL-3.0. Free for everyone, including commercial use.

SpeedGeek is an independent tool made by [TechyGeeksHome](https://techygeekshome.info).
