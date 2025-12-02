/* FINAL script.js - Elegant-Pastell edition */
const el = id => document.getElementById(id);

let recipes = [];
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
let activeTags = new Set();
let allTags = new Set();

async function loadRecipes(){
  try{
    const res = await fetch('rezepte.json');
    if(!res.ok) throw new Error('Could not load recipes');
    recipes = await res.json();
    collectTags();
    populateCategories();
    populateTags();
    renderRecipes(recipes);
  }catch(err){
    console.error(err);
    el('status').textContent = 'Fehler beim Laden der Rezepte.';
  }
}

function collectTags(){
  recipes.forEach(r => (r.tags||[]).forEach(t => allTags.add(t)));
}

function populateCategories(){
  const sel = el('categorySelect');
  const cats = new Set(['all', ...recipes.map(r => r.category || 'Unkategorisiert')]);
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c === 'all' ? 'Alle Kategorien' : c;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', applyFilters);
}

function populateTags(){
  const container = el('tagContainer');
  allTags.forEach(tag => {
    const b = document.createElement('button');
    b.className = 'but';
    b.textContent = tag;
    b.onclick = () => {
      if(activeTags.has(tag)){ activeTags.delete(tag); b.style.boxShadow = 'none'; }
      else { activeTags.add(tag); b.style.boxShadow = 'inset 0 0 0 2px rgba(127,76,204,0.18)'; }
      applyFilters();
    };
    container.appendChild(b);
  });
}

function applyFilters(){
  const q = el('searchInput').value.trim().toLowerCase();
  const cat = el('categorySelect').value;
  const filtered = recipes.filter(r => {
    const txt = (r.title + ' ' + (r.ingredients||'') + ' ' + (r.instructions||'')).toLowerCase();
    const matchText = !q || txt.includes(q);
    const matchCat = cat === 'all' || r.category === cat;
    const matchTags = [...activeTags].every(t => (r.tags||[]).includes(t));
    return matchText && matchCat && matchTags;
  });
  renderRecipes(filtered);
}

function renderRecipes(list){
  const container = el('results'); container.innerHTML = '';
  if(!list || list.length === 0){
    el('status').textContent = 'Keine Rezepte gefunden.';
    return;
  }
  el('status').textContent = `${list.length} Rezept(e) gefunden`;
  list.forEach(r => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div style="position:relative">
        <button class="fav ${favorites.has(r.title)?'active':''}" aria-label="Favorit">${favorites.has(r.title)?'★':'☆'}</button>
        <img src="${r.image || 'img/placeholder.jpg'}" alt="${r.title}">
      </div>
      <h3>${r.title}</h3>
      <div class="meta">${r.category || ''} · ${(r.tags||[]).join(', ')}</div>
      <details>
        <summary>Zutaten & Zubereitung</summary>
        <p><strong>Zutaten:</strong><br>${r.ingredients}</p>
        <p><strong>Zubereitung:</strong><br>${r.instructions}</p>
      </details>
    `;
    card.querySelector('.fav').addEventListener('click', ()=>{
      toggleFavorite(r.title, card.querySelector('.fav'));
    });
    container.appendChild(card);
  });
}

function toggleFavorite(title, btn){
  if(favorites.has(title)){ favorites.delete(title); btn.classList.remove('active'); btn.textContent='☆'; }
  else { favorites.add(title); btn.classList.add('active'); btn.textContent='★'; }
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

el('searchInput').addEventListener('input', ()=>{
  const q = el('searchInput').value.trim().toLowerCase();
  if(!q){ el('suggestionsBox').style.display='none'; applyFilters(); return; }
  const suggestions = recipes.filter(r => r.title.toLowerCase().includes(q)).slice(0,6);
  const box = el('suggestionsBox'); box.innerHTML = '';
  if(suggestions.length === 0){ box.style.display='none'; applyFilters(); return; }
  suggestions.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s.title;
    b.onclick = ()=>{ el('searchInput').value = s.title; box.style.display='none'; applyFilters(); };
    box.appendChild(b);
  });
  box.style.display='block';
  applyFilters();
});

el('clearButton').addEventListener('click', ()=>{
  el('searchInput').value=''; activeTags.clear(); el('categorySelect').value='all'; applyFilters();
});
el('showFavorites').addEventListener('click', ()=> {
  const favList = recipes.filter(r => favorites.has(r.title)); renderRecipes(favList);
});
el('themeToggle').addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark')?'dark':'light');
});
(function(){ if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark'); })();

window.onload = loadRecipes;
