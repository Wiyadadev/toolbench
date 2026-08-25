/* ============================================================
   TOOLBENCH ADMIN
   Affiliate Program Manager + Local Copilot
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ==========================================================
     CONFIG
     ========================================================== */

  const DATA_URL = "../data/affiliate-programs.json";


  /* ==========================================================
     STATE
     ========================================================== */

  let programs = [];
  let filteredPrograms = [];
  let copilotPrograms = [];

  let editingIndex = null;
  let toastTimer = null;


  /* ==========================================================
     DOM ELEMENTS
     ========================================================== */

  const elements = {

    /* Admin */

    grid:
      document.getElementById("programGrid"),

    search:
      document.getElementById("searchInput"),

    category:
      document.getElementById("categoryFilter"),

    status:
      document.getElementById("statusFilter"),

    programCount:
      document.getElementById("programCount"),

    statusText:
      document.getElementById("statusText"),

    statusDot:
      document.getElementById("statusDot"),


    /* Modal */

    modal:
      document.getElementById("editModal"),

    modalTitle:
      document.getElementById("modalTitle"),

    closeModal:
      document.getElementById("closeModal"),

    cancelModal:
      document.getElementById("cancelModal"),

    closeModalBottom:
      document.getElementById("closeModalBottom"),


    /* Form */

    form:
      document.getElementById("programForm"),


    /* Buttons */

    exportButton:
      document.getElementById("exportButton"),

    addButton:
      document.getElementById("addButton"),


    /* Toast */

    toast:
      document.getElementById("toast")

  };


  /* ==========================================================
     INIT
     ========================================================== */

  init();


  async function init() {

    bindEvents();

    await loadPrograms();

    loadCopilotData();

    bindCopilot();

  }


  /* ==========================================================
     ADMIN EVENTS
     ========================================================== */

  function bindEvents() {

    /* Search */

    if (elements.search) {

      elements.search.addEventListener(
        "input",
        applyFilters
      );

    }


    /* Category */

    if (elements.category) {

      elements.category.addEventListener(
        "change",
        applyFilters
      );

    }


    /* Status */

    if (elements.status) {

      elements.status.addEventListener(
        "change",
        applyFilters
      );

    }


    /* Export */

    if (elements.exportButton) {

      elements.exportButton.addEventListener(
        "click",
        exportJSON
      );

    }


    /* Add */

    if (elements.addButton) {

      elements.addButton.addEventListener(
        "click",
        openAddModal
      );

    }


    /* Close modal */

    if (elements.closeModal) {

      elements.closeModal.addEventListener(
        "click",
        closeModal
      );

    }


    /* Cancel */

    if (elements.cancelModal) {

      elements.cancelModal.addEventListener(
        "click",
        closeModal
      );

    }


    /* Bottom close */

    if (elements.closeModalBottom) {

      elements.closeModalBottom.addEventListener(
        "click",
        closeModal
      );

    }


    /* Form */

    if (elements.form) {

      elements.form.addEventListener(
        "submit",
        saveProgram
      );

    }


    /* Escape */

    document.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Escape") {

          closeModal();

        }

      }
    );

  }


  /* ==========================================================
     LOAD PROGRAMS
     ========================================================== */

  async function loadPrograms() {

    setStatus(
      "Loading affiliate programs...",
      false
    );


    try {

      const response =
        await fetch(
          DATA_URL,
          {
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      if (!Array.isArray(data)) {

        throw new Error(
          "affiliate-programs.json must contain an array"
        );

      }


      programs =
        data.map(
          normalizeProgram
        );


      /*
       * Keep Copilot synchronized
       * with the same dataset.
       */

      copilotPrograms =
        programs.map(
          normalizeProgram
        );


      buildCategoryFilter();

      applyFilters();

      updateCopilotStats();


      setStatus(
        `${programs.length} affiliate programs loaded`,
        false
      );


    } catch (error) {

      console.error(
        "Failed to load affiliate programs:",
        error
      );


      programs = [];

      filteredPrograms = [];

      copilotPrograms = [];


      renderPrograms();

      updateCopilotStats();


      setStatus(
        "Failed to load affiliate-programs.json",
        true
      );


      showToast(
        "Could not load affiliate-programs.json",
        true
      );

    }

  }


  /* ==========================================================
     NORMALIZE PROGRAM
     ========================================================== */

  function normalizeProgram(program) {

    return {

      brand:
        String(
          program?.brand || ""
        ).trim(),

      category:
        String(
          program?.category || ""
        ).trim(),

      website:
        String(
          program?.website || ""
        ).trim(),

      commission:
        String(
          program?.commission || ""
        ).trim(),

      cookie:
        String(
          program?.cookie || ""
        ).trim(),

      affiliateNetwork:
        String(
          program?.affiliateNetwork || ""
        ).trim(),

      applicationStatus:
        String(
          program?.applicationStatus || ""
        ).trim(),

      affiliateUrl:
        String(
          program?.affiliateUrl || ""
        ).trim(),

      notes:
        String(
          program?.notes || ""
        ).trim()

    };

  }


  /* ==========================================================
     CATEGORY FILTER
     ========================================================== */

  function buildCategoryFilter() {

    if (!elements.category) {
      return;
    }


    const currentValue =
      elements.category.value;


    const categories = [
      ...new Set(
        programs
          .map(
            (program) =>
              program.category
          )
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(b)
    );


    elements.category.innerHTML = `

      <option value="">
        All categories
      </option>

      ${categories
        .map(
          (category) => `

            <option
              value="${escapeAttribute(category)}"
            >
              ${escapeHtml(category)}
            </option>

          `
        )
        .join("")}

    `;


    if (
      categories.includes(
        currentValue
      )
    ) {

      elements.category.value =
        currentValue;

    }

  }


  /* ==========================================================
     FILTERS
     ========================================================== */

  function applyFilters() {

    const searchTerm =
      elements.search
        ? elements.search.value
            .trim()
            .toLowerCase()
        : "";


    const category =
      elements.category
        ? elements.category.value
            .trim()
            .toLowerCase()
        : "";


    const status =
      elements.status
        ? elements.status.value
            .trim()
            .toLowerCase()
        : "";


    /* ========================================================
       BRAND-FIRST SEARCH
       ======================================================== */

    if (searchTerm) {

      const brandMatches =
        programs.filter(
          (program) => {

            const brand =
              String(
                program.brand || ""
              )
                .trim()
                .toLowerCase();


            return (
              brand &&
              brand.includes(
                searchTerm
              )
            );

          }
        );


      if (
        brandMatches.length > 0
      ) {

        filteredPrograms =
          brandMatches.filter(
            (program) => {

              const matchesCategory =
                !category ||
                String(
                  program.category || ""
                )
                  .trim()
                  .toLowerCase() ===
                category;


              const matchesStatus =
                !status ||
                String(
                  program.applicationStatus || ""
                )
                  .trim()
                  .toLowerCase() ===
                status;


              return (
                matchesCategory &&
                matchesStatus
              );

            }
          );


        renderPrograms();

        return;

      }

    }


    /* ========================================================
       FULL SEARCH
       ======================================================== */

    filteredPrograms =
      programs.filter(
        (program) => {

          const searchableText = [

            program.brand,

            program.category,

            program.website,

            program.commission,

            program.cookie,

            program.affiliateNetwork,

            program.applicationStatus,

            program.affiliateUrl,

            program.notes

          ]
            .join(" ")
            .toLowerCase();


          const matchesSearch =
            !searchTerm ||
            searchableText.includes(
              searchTerm
            );


          const matchesCategory =
            !category ||
            String(
              program.category || ""
            )
              .trim()
              .toLowerCase() ===
            category;


          const matchesStatus =
            !status ||
            String(
              program.applicationStatus || ""
            )
              .trim()
              .toLowerCase() ===
            status;


          return (

            matchesSearch &&
            matchesCategory &&
            matchesStatus

          );

        }
      );


    renderPrograms();

  }


  /* ==========================================================
     RENDER PROGRAMS
     ========================================================== */

  function renderPrograms() {

    if (elements.programCount) {

      elements.programCount.textContent =
        `${filteredPrograms.length} / ${programs.length}`;

    }


    if (!elements.grid) {
      return;
    }


    if (
      !filteredPrograms.length
    ) {

      elements.grid.innerHTML = `

        <div class="empty-state">

          <h2>
            No programs found
          </h2>

          <p>
            Try another search or filter.
          </p>

        </div>

      `;

      return;

    }


    elements.grid.innerHTML =
      filteredPrograms
        .map(
          (program) => {

            const originalIndex =
              programs.indexOf(
                program
              );


            return renderProgramCard(
              program,
              originalIndex
            );

          }
        )
        .join("");


    bindCardButtons();

  }


  /* ==========================================================
     PROGRAM CARD
     ========================================================== */

  function renderProgramCard(
    program,
    index
  ) {

    const statusClass =
      getStatusClass(
        program.applicationStatus
      );


    const website =
      cleanUrl(
        program.website
      );


    const affiliateUrl =
      cleanUrl(
        program.affiliateUrl
      );


    return `

      <article
        class="program-card"
      >

        <div class="program-top">

          <div>

            <div class="program-category">

              ${escapeHtml(
                program.category ||
                "Uncategorized"
              )}

            </div>


            <h2>

              ${escapeHtml(
                program.brand ||
                "Unnamed"
              )}

            </h2>

          </div>


          <span
            class="status-badge ${statusClass}"
          >

            ${escapeHtml(
              program.applicationStatus ||
              "Unknown"
            )}

          </span>

        </div>


        <div class="program-meta">


          <!-- WEBSITE -->

          <div class="meta-row">

            <span class="meta-label">
              Website
            </span>


            <span class="meta-value">

              ${
                website

                  ? `

                    <a
                      href="${escapeAttribute(website)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>

                  `

                  : "—"
              }

            </span>

          </div>


          <!-- AFFILIATE -->

          <div class="meta-row">

            <span class="meta-label">
              Affiliate
            </span>


            <span class="meta-value">

              ${
                affiliateUrl

                  ? `

                    <a
                      href="${escapeAttribute(affiliateUrl)}"
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                    >
                      Open affiliate
                    </a>

                  `

                  : "Not set"
              }

            </span>

          </div>


          <!-- COMMISSION -->

          <div class="meta-row">

            <span class="meta-label">
              Commission
            </span>


            <span class="meta-value">

              ${escapeHtml(
                program.commission ||
                "—"
              )}

            </span>

          </div>


          <!-- COOKIE -->

          <div class="meta-row">

            <span class="meta-label">
              Cookie
            </span>


            <span class="meta-value">

              ${escapeHtml(
                program.cookie ||
                "—"
              )}

            </span>

          </div>


          <!-- NETWORK -->

          <div class="meta-row">

            <span class="meta-label">
              Network
            </span>


            <span class="meta-value">

              ${escapeHtml(
                program.affiliateNetwork ||
                "—"
              )}

            </span>

          </div>


        </div>


        ${
          program.notes

            ? `

              <div class="program-notes">

                ${escapeHtml(
                  program.notes
                )}

              </div>

            `

            : ""
        }


        <div class="program-actions">


          <button
            class="btn btn-small edit-button"
            type="button"
            data-index="${index}"
          >
            Edit
          </button>


          <button
            class="btn btn-small btn-danger delete-button"
            type="button"
            data-index="${index}"
          >
            Delete
          </button>


        </div>


      </article>

    `;

  }


  /* ==========================================================
     CARD BUTTONS
     ========================================================== */

  function bindCardButtons() {

    document
      .querySelectorAll(
        ".edit-button"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset.index
                );


              openEditModal(
                index
              );

            }
          );

        }
      );


    document
      .querySelectorAll(
        ".delete-button"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset.index
                );


              deleteProgram(
                index
              );

            }
          );

        }
      );

  }


  /* ==========================================================
     ADD PROGRAM
     ========================================================== */

  function openAddModal() {

    editingIndex = null;


    if (
      !elements.form ||
      !elements.modal
    ) {

      return;

    }


    elements.modalTitle.textContent =
      "Add Affiliate Program";


    elements.form.reset();


    const statusField =
      elements.form.elements
        .applicationStatus;


    if (statusField) {

      statusField.value =
        "Open";

    }


    elements.modal.classList.add(
      "is-open"
    );


    setTimeout(
      () => {

        const brandField =
          elements.form.elements
            .brand;


        if (brandField) {

          brandField.focus();

        }

      },
      50
    );

  }


  /* ==========================================================
     EDIT PROGRAM
     ========================================================== */

  function openEditModal(index) {

    const program =
      programs[index];


    if (!program) {
      return;
    }


    editingIndex =
      index;


    if (elements.modalTitle) {

      elements.modalTitle.textContent =
        `Edit ${program.brand}`;

    }


    fillForm(
      program
    );


    if (elements.modal) {

      elements.modal.classList.add(
        "is-open"
      );

    }


    setTimeout(
      () => {

        const brandField =
          elements.form?.elements
            ?.brand;


        if (brandField) {

          brandField.focus();

        }

      },
      50
    );

  }


  /* ==========================================================
     FILL FORM
     ========================================================== */

  function fillForm(
    program
  ) {

    if (!elements.form) {
      return;
    }


    const fields = [

      "brand",

      "category",

      "website",

      "commission",

      "cookie",

      "affiliateNetwork",

      "applicationStatus",

      "affiliateUrl",

      "notes"

    ];


    fields.forEach(
      (field) => {

        const input =
          elements.form.elements[
            field
          ];


        if (input) {

          input.value =
            program[field] || "";

        }

      }
    );

  }


  /* ==========================================================
     SAVE PROGRAM
     ========================================================== */

  function saveProgram(
    event
  ) {

    event.preventDefault();


    if (!elements.form) {
      return;
    }


    const formData =
      new FormData(
        elements.form
      );


    const program = {

      brand:
        formData
          .get("brand")
          ?.trim() || "",


      category:
        formData
          .get("category")
          ?.trim() || "",


      website:
        formData
          .get("website")
          ?.trim() || "",


      commission:
        formData
          .get("commission")
          ?.trim() || "",


      cookie:
        formData
          .get("cookie")
          ?.trim() || "",


      affiliateNetwork:
        formData
          .get("affiliateNetwork")
          ?.trim() || "",


      applicationStatus:
        formData
          .get("applicationStatus")
          ?.trim() || "",


      affiliateUrl:
        formData
          .get("affiliateUrl")
          ?.trim() || "",


      notes:
        formData
          .get("notes")
          ?.trim() || ""

    };


    if (!program.brand) {

      showToast(
        "Brand name is required",
        true
      );

      return;

    }


    /* ========================================================
       ADD
       ======================================================== */

    if (
      editingIndex === null
    ) {

      programs.push(
        program
      );


      showToast(
        `${program.brand} added`
      );

    }


    /* ========================================================
       UPDATE
       ======================================================== */

    else {

      programs[
        editingIndex
      ] = program;


      showToast(
        `${program.brand} updated`
      );

    }


    /*
     * Sync Copilot
     */

    copilotPrograms =
      programs.map(
        normalizeProgram
      );


    buildCategoryFilter();

    applyFilters();

    updateCopilotStats();

    closeModal();

  }


  /* ==========================================================
     DELETE PROGRAM
     ========================================================== */

  function deleteProgram(
    index
  ) {

    const program =
      programs[index];


    if (!program) {
      return;
    }


    const confirmed =
      window.confirm(
        `Delete "${program.brand}"?`
      );


    if (!confirmed) {
      return;
    }


    programs.splice(
      index,
      1
    );


    copilotPrograms =
      programs.map(
        normalizeProgram
      );


    buildCategoryFilter();

    applyFilters();

    updateCopilotStats();


    showToast(
      `${program.brand} deleted`
    );

  }


  /* ==========================================================
     CLOSE MODAL
     ========================================================== */

  function closeModal() {

    if (elements.modal) {

      elements.modal.classList.remove(
        "is-open"
      );

    }


    editingIndex = null;

  }


  /* ==========================================================
     EXPORT JSON
     ========================================================== */

  function exportJSON() {

    if (!programs.length) {

      showToast(
        "There are no programs to export",
        true
      );

      return;

    }


    const json =
      JSON.stringify(
        programs,
        null,
        2
      );


    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      "affiliate-programs.json";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );


    showToast(
      "affiliate-programs.json exported"
    );

  }


  /* ==========================================================
     STATUS
     ========================================================== */

  function setStatus(
    message,
    isError = false
  ) {

    if (
      elements.statusText
    ) {

      elements.statusText.textContent =
        message;

    }


    if (
      elements.statusDot
    ) {

      elements.statusDot.classList.toggle(
        "error",
        isError
      );

    }

  }


  /* ==========================================================
     TOAST
     ========================================================== */

  function showToast(
    message,
    isError = false
  ) {

    if (
      !elements.toast
    ) {

      return;

    }


    clearTimeout(
      toastTimer
    );


    elements.toast.textContent =
      message;


    elements.toast.classList.toggle(
      "error",
      isError
    );


    elements.toast.classList.add(
      "show"
    );


    toastTimer =
      setTimeout(
        () => {

          elements.toast.classList.remove(
            "show"
          );

        },
        3000
      );

  }


  /* ==========================================================
     URL CLEANER
     ========================================================== */

  function cleanUrl(
    value
  ) {

    if (!value) {
      return "";
    }


    let url =
      String(value)
        .trim();


    /*
     * Markdown:
     * [label](https://example.com)
     */

    const markdownMatch =
      url.match(
        /\]\((https?:\/\/[^)]+)\)/
      );


    if (markdownMatch) {

      url =
        markdownMatch[1];

    }


    else {

      const plainUrlMatch =
        url.match(
          /(https?:\/\/[^\s,)]+)/i
        );


      if (
        plainUrlMatch
      ) {

        url =
          plainUrlMatch[1];

      }

    }


    url =
      url
        .replace(
          /^["']|["']$/g,
          ""
        )
        .replace(
          /[,\s]+$/g,
          ""
        );


    return /^https?:\/\//i.test(
      url
    )
      ? url
      : "";

  }


  /* ==========================================================
     STATUS CLASS
     ========================================================== */

  function getStatusClass(
    status
  ) {

    const value =
      String(
        status || ""
      )
        .trim()
        .toLowerCase();


    if (
      value === "open" ||
      value === "active"
    ) {

      return "open";

    }


    if (
      value === "closed" ||
      value === "rejected"
    ) {

      return "closed";

    }


    return "pending";

  }


  /* ==========================================================
     HTML ESCAPING
     ========================================================== */

  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function escapeAttribute(
    value
  ) {

    return escapeHtml(
      value
    );

  }


  /* ============================================================
     TOOLBENCH COPILOT
     Local intelligence layer
     ============================================================ */


  /* ==========================================================
     LOAD COPILOT DATA
     ========================================================== */

  async function loadCopilotData() {

    try {

      const response =
        await fetch(
          DATA_URL,
          {
            cache: "no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      if (!Array.isArray(data)) {

        throw new Error(
          "Affiliate data must be an array"
        );

      }


      copilotPrograms =
        data.map(
          normalizeProgram
        );


      updateCopilotStats();


    } catch (error) {

      console.error(
        "Toolbench Copilot data loading failed:",
        error
      );


      /*
       * Fall back to already loaded
       * admin data.
       */

      copilotPrograms =
        programs.map(
          normalizeProgram
        );


      updateCopilotStats();

    }

  }


  /* ==========================================================
     COPILOT STATS
     ========================================================== */

  function updateCopilotStats() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;


    const programCount =
      document.getElementById(
        "copilotProgramCount"
      );


    const affiliateCount =
      document.getElementById(
        "copilotAffiliateCount"
      );


    const websiteCount =
      document.getElementById(
        "copilotWebsiteCount"
      );


    const missingCount =
      document.getElementById(
        "copilotMissingCount"
      );


    const affiliates =
      data.filter(
        (program) =>
          typeof program.affiliateUrl ===
            "string" &&
          program.affiliateUrl.trim()
      );


    const websites =
      data.filter(
        (program) =>
          typeof program.website ===
            "string" &&
          program.website.trim()
      );


    const requiredFields = [

      "brand",

      "category",

      "website",

      "commission",

      "cookie",

      "affiliateNetwork",

      "applicationStatus",

      "affiliateUrl",

      "notes"

    ];


    let missing = 0;


    data.forEach(
      (program) => {

        requiredFields.forEach(
          (field) => {

            if (
              !program[field] ||
              String(
                program[field]
              ).trim() === ""
            ) {

              missing++;

            }

          }
        );

      }
    );


    if (
      programCount
    ) {

      programCount.textContent =
        data.length;

    }


    if (
      affiliateCount
    ) {

      affiliateCount.textContent =
        affiliates.length;

    }


    if (
      websiteCount
    ) {

      websiteCount.textContent =
        websites.length;

    }


    if (
      missingCount
    ) {

      missingCount.textContent =
        missing;

    }

  }


  /* ==========================================================
     ADD COPILOT MESSAGE
     ========================================================== */

  function addCopilotMessage(
    message,
    type = "assistant"
  ) {

    const container =
      document.getElementById(
        "copilotMessages"
      );


    if (!container) {
      return;
    }


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      `copilot-message ${type}`;


    const label =
      document.createElement(
        "div"
      );


    label.className =
      "message-label";


    label.textContent =
      type === "user"
        ? "YOU"
        : "TOOLBENCH COPILOT";


    const content =
      document.createElement(
        "div"
      );


    content.innerHTML =
      message;


    wrapper.appendChild(
      label
    );


    wrapper.appendChild(
      content
    );


    container.appendChild(
      wrapper
    );


    container.scrollTop =
      container.scrollHeight;

  }


  /* ==========================================================
     COPILOT OVERVIEW
     ========================================================== */

  function copilotOverview() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const categories = {};

    data.forEach((program) => {

      const category =
        program.category ||
        "Uncategorized";

      categories[category] =
        (categories[category] || 0) + 1;

    });

    const categoryList =
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => `
          <li>
            ${escapeHtml(category)}: ${count}
          </li>
        `)
        .join("");

    const openCount =
      data.filter((program) =>
        String(program.applicationStatus || "")
          .trim()
          .toLowerCase() === "open"
      ).length;

    const affiliateCount =
      data.filter((program) =>
        Boolean(String(program.affiliateUrl || "").trim())
      ).length;

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Affiliate database overview
        </div>

        <p>
          ${data.length} affiliate programs are currently loaded.
        </p>

        <p>
          Open: <strong>${openCount}</strong><br>
          Affiliate URLs: <strong>${affiliateCount}</strong>
        </p>

        <strong>Categories</strong>
        <ul>
          ${categoryList}
        </ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT PRIORITY
     ========================================================== */

  function copilotPriority() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const candidates = data
      .filter((program) => {

        const status =
          String(program.applicationStatus || "")
            .trim()
            .toLowerCase();

        const affiliateUrl =
          String(program.affiliateUrl || "").trim();

        return status === "open" && Boolean(affiliateUrl);
      })
      .map((program) => {

        let score = 0;

        const commission =
          String(program.commission || "").toLowerCase();

        if (commission.includes("lifetime")) score += 5;
        if (commission.includes("recurring")) score += 4;
        if (commission.includes("%")) score += 2;
        if (program.affiliateUrl) score += 2;
        if (program.website) score += 1;

        return { program, score };
      })
      .sort((a, b) => b.score - a.score);

    if (!candidates.length) {
      return `
        <div class="copilot-result">
          <div class="copilot-result-title">
            No priority programs found
          </div>
        </div>
      `;
    }

    const list = candidates
      .slice(0, 10)
      .map(({ program, score }, index) => `
        <li>
          <strong>
            ${index + 1}. ${escapeHtml(program.brand)}
          </strong><br>
          Commission: ${escapeHtml(program.commission || "—")}<br>
          Priority score: ${score}
        </li>
      `)
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Recommended priority
        </div>
        <p>
          Open programs with affiliate URLs,
          ranked using the current dataset.
        </p>
        <ol>${list}</ol>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT MISSING DATA
     ========================================================== */

  function copilotMissing() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const requiredFields = [
      "brand",
      "category",
      "website",
      "commission",
      "cookie",
      "affiliateNetwork",
      "applicationStatus",
      "affiliateUrl",
      "notes"
    ];

    const problems = [];

    data.forEach((program) => {

      const missingFields = requiredFields.filter((field) =>
        !program[field] || String(program[field]).trim() === ""
      );

      if (missingFields.length) {
        problems.push({
          brand: program.brand || "Unknown",
          fields: missingFields
        });
      }
    });

    if (!problems.length) {
      return `
        <div class="copilot-result">
          <div class="copilot-result-title">
            Data check passed
          </div>
          <p>
            No required fields are missing from the current dataset.
          </p>
        </div>
      `;
    }

    const list = problems
      .map((item) => `
        <li>
          <strong>${escapeHtml(item.brand)}</strong>:
          ${item.fields.map(escapeHtml).join(", ")}
        </li>
      `)
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Missing data detected
        </div>
        <ul>${list}</ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT URL CHECK
     ========================================================== */

  function copilotUrls() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const invalid = [];

    data.forEach((program) => {

      const affiliateUrl =
        String(program.affiliateUrl || "").trim();

      if (!affiliateUrl) {
        invalid.push({
          brand: program.brand || "Unknown",
          reason: "Affiliate URL missing"
        });
        return;
      }

      if (!/^https?:\/\//i.test(affiliateUrl)) {
        invalid.push({
          brand: program.brand || "Unknown",
          reason: "URL does not start with http:// or https://"
        });
      }
    });

    if (!invalid.length) {
      return `
        <div class="copilot-result">
          <div class="copilot-result-title">
            Affiliate URL check passed
          </div>
          <p>
            All current affiliate URLs have a valid HTTP/HTTPS format.
          </p>
        </div>
      `;
    }

    const list = invalid
      .map((item) => `
        <li>
          <strong>${escapeHtml(item.brand)}</strong>:
          ${escapeHtml(item.reason)}
        </li>
      `)
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Affiliate URL issues
        </div>
        <ul>${list}</ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT CATEGORY ANALYSIS
     ========================================================== */

  function copilotCategories() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const categories = {};

    data.forEach((program) => {

      const category =
        program.category ||
        "Uncategorized";

      categories[category] =
        (categories[category] || 0) + 1;
    });

    const list = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => `
        <li>${escapeHtml(category)}: ${count}</li>
      `)
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Category analysis
        </div>
        <p>Current category distribution:</p>
        <ul>${list}</ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT OPPORTUNITIES
     ========================================================== */

  function copilotOpportunities() {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const candidates = data.filter((program) => {

      const hasAffiliate = Boolean(
        String(program.affiliateUrl || "").trim()
      );

      const isOpen =
        String(program.applicationStatus || "")
          .trim()
          .toLowerCase() === "open";

      return hasAffiliate && isOpen;
    });

    if (!candidates.length) {
      return `
        <div class="copilot-result">
          <div class="copilot-result-title">
            No affiliate opportunities found
          </div>
        </div>
      `;
    }

    const list = candidates
      .map((program) => `
        <li>
          <strong>${escapeHtml(program.brand)}</strong><br>
          ${escapeHtml(program.category || "Uncategorized")}<br>
          Commission: ${escapeHtml(program.commission || "—")}
        </li>
      `)
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Affiliate opportunities
        </div>
        <p>
          Programs marked Open with an affiliate URL:
        </p>
        <ul>${list}</ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT BRAND SEARCH
     ========================================================== */

  function copilotSearch(command) {

    const data =
      copilotPrograms.length
        ? copilotPrograms
        : programs;

    const query =
      String(command || "")
        .trim()
        .toLowerCase();

    if (!query || !data.length) {
      return null;
    }

    let matches = data.filter((program) => {

      const brand =
        String(program.brand || "")
          .trim()
          .toLowerCase();

      return brand && brand.includes(query);
    });

    if (!matches.length) {
      matches = data.filter((program) => {

        const searchableText = [
          program.brand,
          program.category,
          program.website,
          program.commission,
          program.cookie,
          program.affiliateNetwork,
          program.applicationStatus,
          program.affiliateUrl,
          program.notes
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    if (!matches.length) {
      return null;
    }

    const list = matches
      .map((program) => {

        const website = cleanUrl(program.website);
        const affiliateUrl = cleanUrl(program.affiliateUrl);

        return `
          <li>
            <strong>${escapeHtml(program.brand)}</strong><br>
            Category: ${escapeHtml(program.category || "Uncategorized")}<br>
            Status: ${escapeHtml(program.applicationStatus || "Unknown")}<br>
            Commission: ${escapeHtml(program.commission || "—")}<br>
            Network: ${escapeHtml(program.affiliateNetwork || "—")}
            ${website ? `<br>Website: <a href="${escapeAttribute(website)}" target="_blank" rel="noopener noreferrer">Open</a>` : ""}
            ${affiliateUrl ? `<br>Affiliate: <a href="${escapeAttribute(affiliateUrl)}" target="_blank" rel="noopener noreferrer sponsored">Open affiliate</a>` : ""}
          </li>
        `;
      })
      .join("");

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          Brand search
        </div>
        <p>
          Found ${matches.length} matching program${matches.length === 1 ? "" : "s"}.
        </p>
        <ul>${list}</ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT COMMAND ROUTER
     ========================================================== */

  function runCopilotCommand(command) {

    const text =
      String(command || "")
        .trim()
        .toLowerCase();

    if (!text) {
      return copilotOverview();
    }

    if (
      text.includes("missing") ||
      text.includes("ขาด") ||
      text.includes("ข้อมูลไม่ครบ") ||
      text.includes("ตรวจข้อมูล") ||
      text.includes("ข้อมูลที่ขาด")
    ) {
      return copilotMissing();
    }

    if (
      text.includes("url") ||
      text.includes("link") ||
      text.includes("ลิงก์") ||
      text.includes("ลิงค์") ||
      text.includes("ลิงค์เสีย") ||
      text.includes("ตรวจ url") ||
      text.includes("ตรวจลิงก์")
    ) {
      return copilotUrls();
    }

    if (
      text.includes("category") ||
      text.includes("categories") ||
      text.includes("หมวด") ||
      text.includes("หมวดหมู่")
    ) {
      return copilotCategories();
    }

    if (
      text.includes("priority") ||
      text.includes("priorities") ||
      text.includes("ควรทำก่อน") ||
      text.includes("ทำก่อน") ||
      text.includes("สมัครก่อน")
    ) {
      return copilotPriority();
    }

    if (
      text.includes("opportunity") ||
      text.includes("opportunities") ||
      text.includes("โอกาส") ||
      text.includes("affiliate program") ||
      text.includes("โปรแกรม") ||
      text.includes("affiliate programs")
    ) {
      return copilotOpportunities();
    }

    if (
      text === "overview" ||
      text === "summary" ||
      text.includes("ภาพรวม") ||
      text.includes("สรุป") ||
      text.includes("ทั้งหมด") ||
      text.includes("database")
    ) {
      return copilotOverview();
    }

    const brandResult = copilotSearch(command);

    if (brandResult) {
      return brandResult;
    }

    return `
      <div class="copilot-result">
        <div class="copilot-result-title">
          I can help with:
        </div>
        <ul>
          <li>Overview / ภาพรวม</li>
          <li>Missing data / ตรวจข้อมูลที่ขาด</li>
          <li>URL check / ตรวจ Affiliate URL</li>
          <li>Categories / หมวดหมู่</li>
          <li>Opportunities / โปรแกรมที่น่าสนใจ</li>
          <li>Priority / โปรแกรมที่ควรสมัครก่อน</li>
          <li>Search a brand เช่น "Jasper"</li>
        </ul>
      </div>
    `;
  }


  /* ==========================================================
     COPILOT EVENTS
     ========================================================== */

  function bindCopilot() {

    const form =
      document.getElementById("copilotForm");

    const input =
      document.getElementById("copilotInput");

    const clearButton =
      document.getElementById("clearCopilot");

    if (!form || !input) {
      return;
    }

    form.addEventListener("submit", (event) => {

      event.preventDefault();

      const command = input.value.trim();

      if (!command) {
        return;
      }

      addCopilotMessage(
        escapeHtml(command),
        "user"
      );

      const result = runCopilotCommand(command);

      setTimeout(() => {
        addCopilotMessage(result, "assistant");
      }, 150);

      input.value = "";
      input.focus();
    });

    document
      .querySelectorAll("[data-copilot-action]")
      .forEach((button) => {

        button.addEventListener("click", () => {

          const action = button.dataset.copilotAction;
          let result = "";

          if (action === "overview") {
            result = copilotOverview();
          } else if (action === "missing") {
            result = copilotMissing();
          } else if (action === "urls") {
            result = copilotUrls();
          } else if (action === "categories") {
            result = copilotCategories();
          } else if (action === "opportunities") {
            result = copilotOpportunities();
          } else if (action === "priority") {
            result = copilotPriority();
          }

          if (result) {
            addCopilotMessage(result, "assistant");
          }
        });
      });

    if (clearButton) {

      clearButton.addEventListener("click", () => {

        const messages =
          document.getElementById("copilotMessages");

        if (!messages) {
          return;
        }

        messages.innerHTML = `
          <div class="copilot-message assistant">
            <div class="message-label">
              TOOLBENCH COPILOT
            </div>
            <p>
              Workspace cleared.
              Ready for your next task.
            </p>
          </div>
        `;
      });
    }
  }


});