const ingredientList = document.querySelector("#ingredient-list");
const addRowButton = document.querySelector("#add-row");
const form = document.querySelector("#ingredient-form");
const dietaryNotes = document.querySelector("#dietary-notes");
const results = document.querySelector("#recipe-results");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const subtitle = document.querySelector("#results-subtitle");
const submitButton = form.querySelector("button[type='submit']");

const units = ["", "cups", "tbsp", "tsp", "oz", "lb", "g", "kg", "count", "cans", "cloves", "slices"];

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function addIngredientRow(defaults = {}) {
  const row = document.createElement("div");
  row.className = "ingredient-row";
  row.innerHTML = `
    <input aria-label="Ingredient name" class="ingredient-name" placeholder="Ingredient" value="${defaults.name || ""}" />
    <input aria-label="Quantity" class="ingredient-quantity" placeholder="Qty" value="${defaults.quantity || ""}" />
    <select aria-label="Unit" class="ingredient-unit">
      ${units.map((unit) => `<option value="${unit}">${unit || "unit"}</option>`).join("")}
    </select>
    <button class="remove-row" type="button" aria-label="Remove ingredient" title="Remove ingredient">${icon("x")}</button>
  `;

  row.querySelector(".ingredient-unit").value = defaults.unit || "";
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (ingredientList.children.length > 1) {
      row.remove();
    } else {
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      row.querySelector("select").value = "";
    }
  });

  ingredientList.append(row);
  refreshIcons();
}

function getIngredients() {
  return [...ingredientList.querySelectorAll(".ingredient-row")]
    .map((row) => ({
      name: row.querySelector(".ingredient-name").value.trim(),
      quantity: row.querySelector(".ingredient-quantity").value.trim(),
      unit: row.querySelector(".ingredient-unit").value.trim(),
    }))
    .filter((item) => item.name);
}

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  loadingState.classList.toggle("hidden", !isBusy);
  emptyState.classList.add("hidden");
  errorState.classList.add("hidden");
  if (isBusy) {
    results.innerHTML = "";
    subtitle.textContent = "Checking your ingredients...";
  }
}

function showError(message) {
  errorState.textContent = message;
  errorState.classList.remove("hidden");
  subtitle.textContent = "Something needs attention.";
}

function renderRecipes(recipes) {
  results.innerHTML = "";
  subtitle.textContent = `${recipes.length} recipe matches found.`;

  recipes.forEach((recipe, index) => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <button class="recipe-toggle" type="button" aria-expanded="false">
        <div>
          <h3>${escapeHtml(recipe.title)}</h3>
          <p>${escapeHtml(recipe.summary)}</p>
        </div>
        <span class="score-pill">${recipe.matchScore}% fit</span>
      </button>
      <div class="recipe-details">
        <div class="meta-row">
          <span>${recipe.timeMinutes} min</span>
          <span>${recipe.servings} servings</span>
        </div>
        <div class="tag-row">
          ${recipe.uses.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        ${
          recipe.missingBasics.length
            ? `<p><strong>Helpful extras:</strong> ${escapeHtml(recipe.missingBasics.join(", "))}</p>`
            : "<p><strong>Helpful extras:</strong> pantry basics only</p>"
        }
        <ol>
          ${recipe.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
    `;

    const toggle = card.querySelector(".recipe-toggle");
    toggle.addEventListener("click", () => {
      const isOpen = card.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    if (index === 0) {
      card.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }

    results.append(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

addRowButton.addEventListener("click", () => addIngredientRow());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const ingredients = getIngredients();

  if (!ingredients.length) {
    emptyState.classList.add("hidden");
    showError("Add at least one ingredient first.");
    return;
  }

  setBusy(true);

  try {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        dietaryNotes: dietaryNotes.value.trim(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Recipe generation failed.");
    }
    renderRecipes(data.recipes || []);
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(false);
  }
});

[
  { name: "eggs", quantity: "6", unit: "count" },
  { name: "spinach", quantity: "2", unit: "cups" },
  { name: "cheddar", quantity: "4", unit: "oz" },
].forEach(addIngredientRow);

refreshIcons();
