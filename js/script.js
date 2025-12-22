const maxLength = 100; // Anzahl Zeichen, die zuerst angezeigt werden

function renderRecipeCard(recipe) {
  const isFav = isFavorite(recipe.title);

  const container = document.createElement("div");
  container.className = "recipe-card";

  // Text kürzen
  let instructionsShort = recipe.instructions;
  let isLong = false;
  if (recipe.instructions.length > maxLength) {
    instructionsShort = recipe.instructions.substring(0, maxLength) + "...";
    isLong = true;
  }

  container.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}">
    <div class="recipe-content">
      <h2>${recipe.title}</h2>
      <div class="tags">${recipe.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      <p><strong>Zutaten:</strong> ${recipe.ingredients}</p>
      <p class="instructions">
        ${instructionsShort}
        ${isLong ? `<span class="more-text" style="display:none;">${recipe.instructions.substring(maxLength)}</span>
        <button class="read-more-btn">Weiterlesen</button>` : ""}
      </p>
      <button class="fav-btn ${isFav ? "active" : ""}" data-title="${recipe.title}">
        ${isFav ? "⭐ Favorit" : "☆ Als Favorit"}
      </button>
    </div>
  `;

  // Event für „Weiterlesen“
  const btn = container.querySelector(".read-more-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const more = container.querySelector(".more-text");
      if (more.style.display === "none") {
        more.style.display = "inline";
        btn.textContent = "Weniger anzeigen";
      } else {
        more.style.display = "none";
        btn.textContent = "Weiterlesen";
      }
    });
  }

  return container;
}
