// ============================
// Rezepte laden
// ============================
async function loadRecipes() {
  try {
    const res = await fetch("rezepte.json");
    const recipes = await res.json();

    window.allRecipes = recipes;

    fillCategories(recipes);
    fillTags(recipes);
    renderRecipes(recipes);
  } catch (err) {
    console.error("Rezepte konnten nicht geladen werden:", err);
  }
}

// ============================
// Rendering
// ============================
function renderRecipes(recipes) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!recipes.length) {
    container.innerHTML = "<p>Keine Rezepte gefunden.</p>";
    return;
  }

  recipes.forEach(recipe => {
    const isFav = isFavorite(recipe.title);

    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <img src="${recipe.image}" />
      <div class="recipe-content">
        <h2>${recipe.title}</h2>

        <div class="tags">
          ${recipe.tags.map(t => `<span class="tag">${t}</span>`).join("")}
        </div>

        <p><strong>Zutaten:</strong> ${recipe.ingredients}</p>
        <p><strong>Anleitung:</strong> ${recipe.instructions}</p>

        <button class="fav-btn ${isFav ? "active" : ""}" data-title="${recipe.title}">
          ${isFav ? "⭐ Favorit" : "☆ Als Favorit"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".fav-btn").forEach(btn => {
    btn.addEventListener("click", toggleFavorite);
  });
}

// ============================
// Kategorien
// ============================
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

// ============================
// Tags
// ============================
function fillTags(recipes) {
  const tagContainer = document.getElementById("tagContainer");

  const allTags = [...new Set(recipes.flatMap(r => r.tags))];

  allTags.forEach(tag => {
    const el = document.createElement("button");
    el.className = "tag";
    el.textContent = tag;

    el.addEventListener("click", () => {
      el.classList.toggle("active");
      filterRecipes();
    });

    tagContainer.appendChild(el);
  });
}

// ============================
// Filter
// ============================
function filterRecipes() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categorySelect").value;
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

  const filtered = window.allRecipes.filter(r => {
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

// Event Listener
document.getElementById("searchInput").addEventListener("input", filterRecipes);
document.getElementById("categorySelect").addEventListener("change", filterRecipes);

// ============================
// Favoriten
// ============================
function toggleFavorite(e) {
  const btn = e.target;
  const title = btn.dataset.title;

  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

  const isFav = favs.includes(title);

  if (isFav) {
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

// ============================
// Dark Mode
// ============================
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkmode", document.body.classList.contains("dark") ? "1" : "0");
});

if (localStorage.getItem("darkmode") === "1") {
  document.body.classList.add("dark");
}

// ============================
// Start
// ============================
loadRecipes();
