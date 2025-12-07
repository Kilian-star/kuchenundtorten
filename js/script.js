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

// =======================
// Kategorien
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
// Tags
// =======================
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

// =======================
// Filtern
// =======================
function filterRecipes() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const category = document.getElementById("categorySelect").value;
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

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

document.getElementById("searchInput").addEventListener("input", filterRecipes);
document.getElementById("categorySelect").addEventListener("change", filterRecipes);

// =======================
// Favoriten + Puff
// =======================
function toggleFavorite(e) {
  const btn = e.target;
  const title = btn.dataset.title;

  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");

  const isFav = favs.includes(title);

  if (isFav) {
    favs = favs.filter(t => t !== title);
  } else {
    favs.push(title);
    createPuffEffect(btn);
  }

  localStorage.setItem("favorites", JSON.stringify(favs));
  filterRecipes();
}

function isFavorite(title) {
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  return favs.includes(title);
}

// Puff Effekt
function createPuffEffect(button) {
  for (let i = 0; i < 8; i++) {
    const puff = document.createElement("div");
    puff.classList.add("puff");

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 20;

    const dx = Math.cos(angle) * distance + "px";
    const dy = Math.sin(angle) * distance + "px";

    puff.style.setProperty("--dx", dx);
    puff.style.setProperty("--dy", dy);

    puff.style.left = "50%";
    puff.style.top = "50%";

    button.appendChild(puff);

    setTimeout(() => puff.remove(), 600);
  }
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
// Darkmode
// =======================
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkmode", document.body.classList.contains("dark") ? "1" : "0");
});

if (localStorage.getItem("darkmode") === "1") {
  document.body.classList.add("dark");
}

// =======================
// Start
// =======================
loadRecipes();
