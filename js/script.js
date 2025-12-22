// ============================
// Globale Variablen
// ============================
let recipes = [];
let activeTags = new Set();
let showOnlyFavorites = false;

// ============================
// DOM Elemente
// ============================
const resultsEl = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const tagContainer = document.getElementById("tagContainer");
const showFavoritesBtn = document.getElementById("showFavorites");

// ============================
// Rezepte laden
// ============================
async function loadRecipes() {
  try {
    const res = await fetch("rezepte.json");
    recipes = await res.json();
    buildTags();
    renderRecipes();
  } catch (err) {
    console.error("Fehler beim Laden der Rezepte:", err);
  }
}

// ============================
// Tags erzeugen
// ============================
function buildTags() {
  const tags = new Set();
  recipes.forEach(r => r.tags.forEach(t => tags.add(t)));

  tagContainer.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "tag";
    btn.textContent = tag;

    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      btn.classList.contains("active")
        ? activeTags.add(tag)
        : activeTags.delete(tag);
      renderRecipes();
    });

    tagContainer.appendChild(btn);
  });
}

// ============================
// Favoriten (localStorage)
// ============================
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function isFavorite(title) {
  return getFavorites().includes(title);
}

function toggleFavorite(title) {
  let favs = getFavorites();
  if (favs.includes(title)) {
    favs = favs.filter(t => t !== title);
  } else {
    favs.push(title);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
  renderRecipes();
}

// ============================
// Rezepte filtern & anzeigen
// ============================
function renderRecipes() {
  resultsEl.innerHTML = "";

  const search = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const favorites = getFavorites();

  const filtered = recipes.filter(r => {
    const matchSearch =
      r.title.toLowerCase().includes(search) ||
      r.ingredients.toLowerCase().includes(search);

    const matchCategory =
      category === "Alle" || r.category === category;

    const matchTags =
      activeTags.size === 0 ||
      r.tags.some(t => activeTags.has(t));

    const matchFav =
      !showOnlyFavorites || favorites.includes(r.title);

    return matchSearch && matchCategory && matchTags && matchFav;
  });

  if (filtered.length === 0) {
    resultsEl.innerHTML = "<p style='text-align:center;'>Keine Rezepte gefunden 🍰</p>";
    return;
  }

  filtered.forEach(recipe => {
    resultsEl.appendChild(renderRecipeCard(recipe));
  });
}

// ============================
// Rezeptkarte (mit Weiterlesen)
// ============================
function renderRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";

  const maxLength = 120;
  const longText = recipe.instructions.length > maxLength;
  const shortText = longText
    ? recipe.instructions.substring(0, maxLength) + "..."
    : recipe.instructions;

  card.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}">
    <div class="recipe-content">
      <h2>${recipe.title}</h2>

      <div class="tags">
        ${recipe.tags.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>

      <p><strong>Zutaten:</strong><br>${recipe.ingredients}</p>

      <p class="instructions">
        <span class="short-text">${shortText}</span>
        ${
          longText
            ? `<span class="full-text" style="display:none;">${recipe.instructions}</span>
               <button class="read-more-btn">Weiterlesen</button>`
            : ""
        }
      </p>

      <button class="fav-btn ${isFavorite(recipe.title) ? "active" : ""}">
        ${isFavorite(recipe.title) ? "⭐ Favorit" : "☆ Als Favorit"}
      </button>
    </div>
  `;

  // Weiterlesen Button
  const readBtn = card.querySelector(".read-more-btn");
  if (readBtn) {
    readBtn.addEventListener("click", () => {
      const shortTextEl = card.querySelector(".short-text");
      const fullTextEl = card.querySelector(".full-text");

      if (fullTextEl.style.display === "none") {
        shortTextEl.style.display = "none";
        fullTextEl.style.display = "inline";
        readBtn.textContent = "Weniger anzeigen";
      } else {
        shortTextEl.style.display = "inline";
        fullTextEl.style.display = "none";
        readBtn.textContent = "Weiterlesen";
      }
    });
  }

  // Favorit Button
  card.querySelector(".fav-btn").addEventListener("click", () => {
    toggleFavorite(recipe.title);
  });

  return card;
}

// ============================
// Events
// ============================
searchInput.addEventListener("input", renderRecipes);
categorySelect.addEventListener("change", renderRecipes);

showFavoritesBtn.addEventListener("click", () => {
  showOnlyFavorites = !showOnlyFavorites;
  showFavoritesBtn.classList.toggle("active");
  showFavoritesBtn.textContent = showOnlyFavorites
    ? "⭐ Alle anzeigen"
    : "⭐ Nur Favoriten";
  renderRecipes();
});

// ============================
// Start
// ============================
loadRecipes();
