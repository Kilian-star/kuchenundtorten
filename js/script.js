// complete script.js — robust, defensive, ready-to-copy
// Features: load recipes, search, categories, tags, favorites, showFavorites button, clear, darkmode

// ---------- Helper: determine base path for fetch (works with GitHub Pages subpaths) ----------
function getBasePath() {
  try {
    const path = window.location.pathname; // e.g. "/username/reponame/" or "/"
    // If running on github pages (username.github.io/repo/), keep that path as base
    if (window.location.hostname.endsWith("github.io")) {
      // If path is root ("/"), base = "/"
      if (path === "/" || path === "") return "/";
      // ensure trailing slash
      return path.replace(/\/$/, "") + "/";
    }
    // otherwise (local dev), use "/"
    return "/";
  } catch (e) {
    return "/";
  }
}
const BASE = getBasePath(); // will be "/" or "/username/repo/"

// ---------- Load recipes ----------
async function loadRecipes() {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = "Rezepte werden geladen…";

  try {
    // Try a couple fetch strategies for maximum robustness
    const candidates = [
      `${BASE}rezepte.json`,
      "rezepte.json",
      "./rezepte.json"
    ];

    let res = null;
    let lastErr = null;
    for (const url of candidates) {
      try {
        res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        break;
      } catch (e) {
        lastErr = e;
        res = null;
      }
    }

    if (!res) throw lastErr || new Error("Could not fetch rezepte.json");

    const recipes = await res.json();
    if (!Array.isArray(recipes)) throw new Error("rezepte.json is not an array");

    window.allRecipes = recipes;
    if (statusEl) statusEl.textContent = "";

    fillCategories(recipes);
    fillTags(recipes);
    renderRecipes(recipes);
  } catch (err) {
    console.error("Fehler beim Laden der Rezepte:", err);
    if (statusEl) statusEl.textContent = "Fehler beim Laden der Rezepte. Open console (F12).";
  }
}

// ---------- Render ----------
function renderRecipes(recipes) {
  const container = document.getElementById("results");
  if (!container) {
    console.error("Kein #results Element gefunden in HTML");
    return;
  }
  container.innerHTML = "";

  if (!recipes || recipes.length === 0) {
    container.innerHTML = "<p>Keine Rezepte gefunden.</p>";
    return;
  }

  // create fragment for performance
  const frag = document.createDocumentFragment();

  recipes.forEach(recipe => {
    const isFav = isFavorite(recipe.title);

    const card = document.createElement("div");
    card.className = "recipe-card";

    // sanitize strings minimally for safety when injecting (basic)
    const safe = s => (s == null ? "" : String(s));

    card.innerHTML = `
      <img src="cake.png" alt="Kuchen" loading="lazy">
      <div class="recipe-content">
        <h2>${escapeHtml(safe(recipe.title))}</h2>

        <div class="tags">
          ${Array.isArray(recipe.tags) ? recipe.tags.map(t => `<span class="tag" title="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join("") : ""}
        </div>

        <p><strong>Zutaten:</strong> ${escapeHtml(safe(recipe.ingredients))}</p>
        <p><strong>Anleitung:</strong> ${escapeHtml(safe(recipe.instructions))}</p>

        <button class="fav-btn ${isFav ? "active" : ""}" data-title="${escapeAttr(recipe.title)}">
          ${isFav ? "⭐ Favorit" : "☆ Als Favorit"}
        </button>
      </div>
    `;

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// small helpers to avoid accidental HTML injection (keeps UI simple)
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function escapeAttr(str) {
  return String(str).replaceAll('"', "&quot;");
}

// ---------- Categories ----------
function fillCategories(recipes) {
  const select = document.getElementById("categorySelect");
  if (!select) return;

  // clear existing (except first "all" option if present)
  const keepFirst = select.querySelector("option");
  select.innerHTML = "";
  if (keepFirst) {
    // recreate default option
    const opt = document.createElement("option");
    opt.value = "all";
    opt.textContent = "Alle Kategorien";
    select.appendChild(opt);
  }

  const categories = [...new Set(recipes.map(r => r.category || "Unbekannt"))].sort();
  categories.forEach(cat => {
    const op = document.createElement("option");
    op.value = cat;
    op.textContent = cat;
    select.appendChild(op);
  });
}

// ---------- Tags ----------
function fillTags(recipes) {
  const tagContainer = document.getElementById("tagContainer");
  if (!tagContainer) return;
  tagContainer.innerHTML = "";

  const allTags = [...new Set((recipes.flatMap ? recipes.flatMap(r => r.tags || []) : [].concat(...recipes.map(r => r.tags || []))))];
  allTags.sort();

  allTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag";
    btn.type = "button";
    btn.textContent = tag;
    btn.title = tag;
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      filterRecipes();
    });
    tagContainer.appendChild(btn);
  });
}

// ---------- Filter (search + category + tags) ----------
function filterRecipes() {
  if (!window.allRecipes) return;
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  const category = document.getElementById("categorySelect")?.value || "all";
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

  const filtered = window.allRecipes.filter(r => {
    const title = (r.title || "").toLowerCase();
    const ing = (r.ingredients || "").toLowerCase();

    const matchesSearch = !search || title.includes(search) || ing.includes(search);
    const matchesCategory = category === "all" || (r.category === category);
    const matchesTags = activeTags.length === 0 || activeTags.every(tag => (r.tags || []).includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });

  renderRecipes(filtered);
}

// ---------- Favorites (card-level) ----------
function toggleFavoriteFromButton(buttonEl) {
  const title = buttonEl.dataset.title;
  if (!title) return;

  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (favs.includes(title)) {
    favs = favs.filter(t => t !== title);
  } else {
    favs.push(title);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
  // rerender with current filters
  filterRecipes();
}

// returns true if favorite
function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favs.includes(title);
}

// ---------- Show only favorites (button at top) ----------
function showFavoritesOnly() {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!window.allRecipes) return;
  const filtered = window.allRecipes.filter(r => favs.includes(r.title));
  renderRecipes(filtered);
}

// ---------- Clear/reset ----------
function resetFilters() {
  const s = document.getElementById("searchInput");
  if (s) s.value = "";
  const sel = document.getElementById("categorySelect");
  if (sel) sel.value = "all";
  document.querySelectorAll(".tag.active").forEach(t => t.classList.remove("active"));
  renderRecipes(window.allRecipes || []);
}

// ---------- Dark mode ----------
function initDarkMode() {
  const stored = localStorage.getItem("darkmode");
  if (stored === "1") document.body.classList.add("dark");
}

// ---------- Event Delegation (robust) ----------
document.addEventListener("click", (e) => {
  const el = e.target;

  // fav btn inside card
  if (el.closest && el.closest(".fav-btn")) {
    // if clicked an inner element (like icon/text) inside the button, ensure we get the button element
    const btn = el.closest(".fav-btn");
    toggleFavoriteFromButton(btn);
    return;
  }

  // fallback: direct class check
  if (el.classList && el.classList.contains("fav-btn")) {
    toggleFavoriteFromButton(el);
    return;
  }

  // top "show favorites" button
  if (el.id === "showFavorites" || el.closest && el.closest("#showFavorites")) {
    showFavoritesOnly();
    return;
  }

  // clear
  if (el.id === "clearButton" || el.closest && el.closest("#clearButton")) {
    resetFilters();
    return;
  }

  // theme toggle
  if (el.id === "themeToggle" || el.closest && el.closest("#themeToggle")) {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkmode", document.body.classList.contains("dark") ? "1" : "0");
    return;
  }
});

// direct input listeners
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "searchInput") filterRecipes();
});

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "categorySelect") filterRecipes();
});

// ---------- Safety: ensure required UI elements exist; if not, log helpful message ----------
function verifyUI() {
  const needed = ["searchInput", "categorySelect", "tagContainer", "results", "clearButton", "themeToggle", "showFavorites"];
  const missing = needed.filter(id => !document.getElementById(id));
  if (missing.length) {
    console.warn("Einige erwartete UI-Elemente fehlen in deiner HTML:", missing);
    // we won't abort — script will still attempt to work with available elements
  }
}

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", () => {
  verifyUI();
  initDarkMode();
  loadRecipes();
});

