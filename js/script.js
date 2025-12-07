// =======================
// Rezepte laden
// =======================
async function loadRecipes() {
  try {
    const res = await fetch("rezepte.json");
    const recipes = await res.json();
    window.allRecipes = recipes;

    fillCategories(recipes);
    fillTags(recipes);
    renderRecipes(recipes);
  } catch (err) {
    console.error("Fehler beim Laden der Rezepte:", err);
    document.getElementById("status").textContent =
      "❗ Fehler beim Laden der Rezepte.";
  }
}


// =======================
// Rezepte anzeigen
// =======================
function renderRecipes(recipes) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!recipes.length) {
    container.innerHTML = "<p>Keine Rezepte gefunden.</p>";
    return;
  }

  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const isFav = isFavorite(recipe.title);

    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}">
      <div class="recipe-content">
        <h2>${recipe.title}</h2>

        <div class="tags">
          ${recipe.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>

        <p><strong>Zutaten:</strong> ${recipe.ingredients}</p>
        <p><strong>Anleitung:</strong> ${recipe.instructions}</p>

        <button class="fav-btn" data-title="${recipe.title}">
          ${isFav ? "⭐ Favorit" : "☆ Als Favorit"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Listener für Favoriten
  document.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", toggleFavorite);
  });
}


// =======================
// Kategorien füllen
// =======================
function fillCategories(recipes) {
  const select = document.getElementById("categorySelect");

  const categories = [...new Set(recipes.map(r => r.category))];

  categories.forEach(cat => {
    const op = document.createElement("option");
    op.value = cat;
    op.textContent = cat;
    select.appendChild(op);
  });
}


// =======================
// Tags füllen
// =======================
function fillTags(recipes) {
  const tagContainer = document.getElementById("tagContainer");

  const allTags = [...new Set(recipes.flatMap(r => r.tags))];

  allTags.forEach(tag => {
    const el = document.createElement("button");
    el.className = "tag";
    el.textContent = tag;
    el.addEventListener("click", () => {
      filterRecipes();
    });
    tagContainer.appendChild(el);
  });
}


// =======================
// Filterfunktion (Suche + Kategorie + Tags)
// =======================
function filterRecipes() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categorySelect").value;

  const activeTags = [...document.querySelectorAll(".tag.active")].map(
    el => el.textContent
  );

  let filtered = window.allRecipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search) ||
      r.ingredients.toLowerCase().includes(search);

    const matchesCategory =
      category === "all" || r.category === category;

    const matchesTags =
      activeTags.length === 0 ||
      activeTags.every(tag => r.tags.includes(tag));

    return matchesSearch && matchesCategory && matchesTags;
  });

  renderRecipes(filtered);
}


// =======================
// Tag Klick
// =======================
document.addEventListener("click", e => {
  if (e.target.classList.contains("tag")) {
    e.target.classList.toggle("active");
    filterRecipes();
  }
});


// =======================
// Suche
// =======================
document.getElementById("searchInput").addEventListener("input", filterRecipes);


// =======================
// Kategorie Dropdown
// =======================
document
  .getElementById("categorySelect")
  .addEventListener("change", filterRecipes);


// =======================
// Favoriten speichern
// =======================
function toggleFavorite(e) {
  const title = e.target.dataset.title;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

  if (favs.includes(title)) {
    favs = favs.filter(t => t !== title);
  } else {
    favs.push(title);
  }

  localStorage.setItem("favorites", JSON.stringify(favs));
  filterRecipes();
}

function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favs.includes(title);
}

document.getElementById("showFavorites").addEventListener("click", () => {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  const filtered = window.allRecipes.filter(r => favs.includes(r.title));
  renderRecipes(filtered);
});

document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.querySelectorAll(".tag.active").forEach(t => t.classList.remove("active"));
  document.getElementById("categorySelect").value = "all";
  renderRecipes(window.allRecipes);
});


// =======================
// Dark Mode
// =======================
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "darkmode",
    document.body.classList.contains("dark") ? "1" : "0"
  );
});

// Dark Mode laden
if (localStorage.getItem("darkmode") === "1") {
  document.body.classList.add("dark");
}


// =======================
// Start
// =======================
loadRecipes();
