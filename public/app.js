const form = document.querySelector("#ingredient-form");
const pantryText = document.querySelector("#pantry-text");
const dietaryNotes = document.querySelector("#dietary-notes");
const results = document.querySelector("#recipe-results");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const subtitle = document.querySelector("#results-subtitle");
const submitButton = form.querySelector("button[type='submit']");

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pantryDescription = pantryText.value.trim();

  if (!pantryDescription) {
    emptyState.classList.add("hidden");
    showError("Tell me what ingredients you have first.");
    return;
  }

  setBusy(true);

  try {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pantryText: pantryDescription,
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

refreshIcons();
