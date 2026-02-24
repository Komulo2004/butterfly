(function () {
  const welcomeTitle = document.getElementById("welcomeTitle");
  const bagBoard = document.getElementById("bagBoard");
  const dashboardShops = document.getElementById("dashboardShops");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const maxPriceInput = document.getElementById("maxPriceInput");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const saveBoardBtn = document.getElementById("saveBoardBtn");

  const BOARD_STORAGE_KEY = "butterfly_board_order";

  let allProducts = [];
  let visibleProducts = [];
  let draggedId = null;

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function showShops(shops) {
    dashboardShops.innerHTML = shops
      .map(
        (shop) => `
          <article class="card shop-card">
            <h3>${shop.name}</h3>
            <div class="shop-city">${shop.city}, ${shop.country}</div>
            <div>${shop.address}</div>
            <a class="shop-link" href="${shop.mapLink}" target="_blank" rel="noopener noreferrer">Open in Maps</a>
          </article>
        `
      )
      .join("");
  }

  function cardTemplate(item) {
    return `
      <article class="card bag-card drag-card" draggable="true" data-id="${item.id}">
        <div class="bag-card-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="bag-card-body">
          <span class="card-chip">${item.line}</span>
          <div class="bag-name">${item.name}</div>
          <div class="bag-meta">
            <span>${item.color}</span>
            <span class="price">${formatPrice(item.price)}</span>
          </div>
          <div>${item.description}</div>
        </div>
      </article>
    `;
  }

  function attachDragHandlers() {
    const cards = bagBoard.querySelectorAll(".drag-card");

    cards.forEach((card) => {
      card.addEventListener("dragstart", () => {
        draggedId = card.dataset.id;
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
        draggedId = null;
        card.classList.remove("dragging");
        cards.forEach((candidate) => candidate.classList.remove("drag-over"));
      });

      card.addEventListener("dragover", (event) => {
        event.preventDefault();
        card.classList.add("drag-over");
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });

      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("drag-over");

        if (!draggedId || draggedId === card.dataset.id) {
          return;
        }

        const fromIndex = visibleProducts.findIndex((item) => item.id === draggedId);
        const toIndex = visibleProducts.findIndex((item) => item.id === card.dataset.id);

        if (fromIndex < 0 || toIndex < 0) {
          return;
        }

        const [moved] = visibleProducts.splice(fromIndex, 1);
        visibleProducts.splice(toIndex, 0, moved);

        renderBoard();
      });
    });
  }

  function renderBoard() {
    bagBoard.innerHTML = visibleProducts.map(cardTemplate).join("");
    attachDragHandlers();
  }

  function applySavedOrder(products) {
    try {
      const saved = localStorage.getItem(BOARD_STORAGE_KEY);
      if (!saved) return products;

      const savedIds = JSON.parse(saved);
      if (!Array.isArray(savedIds)) return products;

      const map = new Map(products.map((item) => [item.id, item]));
      const ordered = [];

      savedIds.forEach((id) => {
        if (map.has(id)) {
          ordered.push(map.get(id));
          map.delete(id);
        }
      });

      return [...ordered, ...Array.from(map.values())];
    } catch (error) {
      return products;
    }
  }

  function filterProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const maxPrice = Number(maxPriceInput.value || 0);

    visibleProducts = allProducts.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.line.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query);

      const matchesPrice = !maxPrice || item.price <= maxPrice;

      return matchesQuery && matchesPrice;
    });

    renderBoard();
  }

  async function init() {
    if (!window.Api.getToken()) {
      window.location.replace("/");
      return;
    }

    try {
      const [mePayload, dashboardPayload, productPayload] = await Promise.all([
        window.Api.request("/api/auth/me"),
        window.Api.request("/api/private/dashboard"),
        window.Api.request("/api/products")
      ]);

      welcomeTitle.textContent = `Welcome, ${mePayload.user.name}`;
      showShops(dashboardPayload.shops);

      allProducts = applySavedOrder(productPayload.products);
      visibleProducts = [...allProducts];
      renderBoard();
    } catch (error) {
      window.Api.clearToken();
      window.location.replace("/");
    }
  }

  saveBoardBtn?.addEventListener("click", () => {
    const orderedIds = visibleProducts.map((item) => item.id);
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(orderedIds));
    saveBoardBtn.textContent = "Saved";
    setTimeout(() => {
      saveBoardBtn.textContent = "Save Board";
    }, 900);
  });

  searchInput?.addEventListener("input", filterProducts);
  maxPriceInput?.addEventListener("input", filterProducts);

  resetFiltersBtn?.addEventListener("click", () => {
    searchInput.value = "";
    maxPriceInput.value = "";
    visibleProducts = [...allProducts];
    renderBoard();
  });

  logoutBtn?.addEventListener("click", () => {
    window.Api.clearToken();
    window.location.replace("/");
  });

  init();
})();
