<div align="center">

# 🪐 CodeOrbit

### *Development doesn't have to be boring.*

<br>

> Most platforms teach programming like a **textbook**.
> CodeOrbit teaches it like the **internet**.

<br>

[![Discover Tools](https://img.shields.io/badge/🛠_Discover-Tools-19D3E6?style=for-the-badge&labelColor=000000)](#-discover-developer-tools)
[![Steal Snippets](https://img.shields.io/badge/⚡_Steal-Snippets-FF3D9A?style=for-the-badge&labelColor=000000)](#-steal-useful-code-snippets)
[![Watch Videos](https://img.shields.io/badge/▶_Watch-Videos-FFE43A?style=for-the-badge&labelColor=000000)](#-watch-video-breakdowns)
[![MemeLearn](https://img.shields.io/badge/😂_Explore-MemeLearn-19D3E6?style=for-the-badge&labelColor=000000)](#-learn-through-memelearn)

</div>

---

## 🌌 What Is CodeOrbit?

CodeOrbit is your shortcut to becoming a better developer — **without the suffering**.

No 30-page chapters. No 4-hour video courses. No forgetting everything by tomorrow.

Just tools, snippets, videos, and knowledge you'll actually use — served the way you browse the internet: fast, bold, and genuinely interesting.

---

## ✨ What's Inside?

### 🛠 Discover Developer Tools

Hand-picked utilities that make a real difference:

| What you want | What CodeOrbit helps you find |
|---|---|
| 🏗️ Build faster | Frameworks, boilerplates, starters |
| 🐛 Debug smarter | Debuggers, loggers, inspectors |
| 🎨 Design better | UI kits, color tools, icon sets |
| 🤖 Automate boring work | CLI tools, scripts, bots |
| 📈 Boost productivity | Dev utilities, extensions, shortcuts |

No endless Googling. No rabbit holes. Just **tools worth knowing**, filed by category and tagged so one good find leads to the next.

---

### ⚡ Steal Useful Code Snippets

Stop rewriting code you've already written ten times.

CodeOrbit's snippet library is built for **real-world use** — not textbook examples. Every snippet is something you can:

- Copy with one click and drop into your project today
- Learn from and tweak to fit your needs
- Understand without a PhD in Computer Science

From tiny utility functions to full-blown patterns — it's all here, in windows styled like the terminal you actually work in.

---

### ▶ Watch Video Breakdowns

Sometimes reading isn't enough — you need to *see* it happen.

CodeOrbit curates short, focused videos that get straight to the point: no 40-minute intros, no rambling, just the concept explained and shipped.

---

### 😂 Learn Through MemeLearn

Some programming concepts are *unnecessarily complicated*.

**MemeLearn fixes that.**

Instead of dense theory, we break things down using:

- 🐸 Panel comics that actually explain the concept
- 👁️ Visuals that click instantly
- 🌍 Real-world analogies you already recognize
- 😅 Developer humor (because why not)

Because *understanding something* shouldn't feel like a punishment.

---

### 📖 Read the Blog

Articles with an actual point of view — not SEO filler. Every post ends by surfacing the tools, snippets, and videos that go with it, so one good read turns into a whole afternoon well spent.

---

## 🎯 Who Is CodeOrbit For?

You belong here if you're:

- 🌱 **Just starting out** — learning to code without getting overwhelmed
- 🔨 **Building side projects** — and need tools + resources fast
- 💼 **Prepping for interviews** — and want to sharpen practical knowledge
- 📚 **Exploring new tech** — and want a smarter way to discover things
- 🧰 **Looking for developer resources** — without the noise

Whether you code for fun or for a living, **CodeOrbit is built for curious people like you**.

---

## 🔥 Why CodeOrbit Instead Of... Everything Else?

| The Old Way | The CodeOrbit Way |
|---|---|
| Read 30 pages | Browse, discover, learn |
| Watch 4-hour videos | Get to the point, fast |
| Forget everything | Actually remember (and use) it |
| Overwhelming courses | Bite-sized, practical knowledge |
| Boring tutorials | Memes + humor + real examples |
| Generic SaaS UI | A site with an actual visual point of view |

---

## 🌍 Our Mission

> *To make developer learning feel less like studying and more like discovering cool things on the internet.*

No boring tutorials.
No information overload.
Just practical knowledge, useful resources, and a little bit of chaos — wrapped in a design that doesn't look like everything else.

---

## 🧱 Under the Hood

CodeOrbit is server-rendered on purpose — fast, simple, and easy to keep alive.

```
server.js            app setup, security headers, sessions
src/db.js             SQLite schema and data access (one `content` table, typed rows)
src/seed.js           starter content, inserted on first run
src/routes/public.js  public pages, search, sitemap, robots
src/routes/admin.js   login, CSRF, content CRUD (mounted at a secret path)
src/views/            EJS pages + partials, one per content type
public/css, js        styles and small client script
scripts/hash.js       admin password hash generator
```

**Stack:** Node · Express · EJS · SQLite (via `better-sqlite3`) · Helmet · bcrypt — no build step, no framework lock-in.

### Running it locally

```bash
npm install
cp .env.example .env                        # then fill it in
npm run hash -- "a long password"           # paste the output into ADMIN_PASSWORD_HASH
npm start
```

Admin lives at your secret `ADMIN_PATH` — it's never linked from the public site.

### Before going live

- Set `NODE_ENV=production`, serve over HTTPS, and set the real `SITE_URL`.
- Swap the default in-memory session store for something persistent (e.g. `connect-sqlite3`).
- Back up `data.db` on a schedule — it's the whole database.

---

## 🚀 Enter The Orbit

```
Discover tools.
Learn faster.
Laugh occasionally.
Become a better developer.
```

**Welcome to CodeOrbit. 🪐**

---

## 📜 License & Copyright

[![License](https://img.shields.io/badge/license-Proprietary-FF3D9A?style=for-the-badge&labelColor=000000)](#-license--copyright)
[![Copyright](https://img.shields.io/badge/copyright-CodeOrbit_2026-FFE43A?style=for-the-badge&labelColor=000000)](#-license--copyright)

**CodeOrbit is proprietary software. All rights reserved.**

All content, code, design, branding, tools, snippets, and features within CodeOrbit are the exclusive intellectual property of **CodeOrbit © 2026**.

You may **not** copy, modify, distribute, or use any part of this project for commercial purposes without explicit written permission from the owner.

> 🔒 Unauthorized use, reproduction, or distribution of this project or its contents — in whole or in part — is strictly prohibited and may result in legal action.

For licensing inquiries or permissions, please contact the CodeOrbit team directly.

See the full [`LICENSE`](./LICENSE) file for complete terms.

---

<div align="center">

*Made with ☕ and questionable commit messages.*

**© 2026 CodeOrbit. All Rights Reserved.**

</div>