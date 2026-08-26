document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/affiliate-programs.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const programs = await response.json();

    if (!Array.isArray(programs)) {
      throw new Error("affiliate-programs.json must be an array");
    }

    const programMap = new Map();

    programs.forEach((program) => {
      if (program && program.brand) {
        programMap.set(normalize(program.brand), program);
      }
    });

    document.querySelectorAll("[data-tool-slug]").forEach((card) => {
      const slug = card.dataset.toolSlug;
      const brand = slugToBrand(slug);
      const program = programMap.get(normalize(brand));

      if (!program) {
        console.warn(`Affiliate program not found: ${brand}`);
        return;
      }

      const cta = card.querySelector(".cta-slot");
      const button = card.querySelector(".btn");

      if (!cta || !button) {
        return;
      }

      const affiliateUrl =
        cleanUrl(program.affiliateUrl) ||
        cleanUrl(program.website);

      if (!affiliateUrl) {
        return;
      }

      const status = cta.querySelector("span");

      if (status) {
        status.textContent = program.affiliateUrl
          ? "affiliate_link: ready"
          : "affiliate_link: website";
      }

      button.href = affiliateUrl;
      button.target = "_blank";
      button.rel = "noopener noreferrer sponsored";

      button.classList.remove("is-placeholder");
      button.removeAttribute("aria-disabled");

      button.textContent = "Visit site";
    });

  } catch (error) {
    console.error(
      "Affiliate program loading failed:",
      error
    );
  }
});


function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ");
}


function cleanUrl(value) {
  if (!value) {
    return "";
  }

  let url = String(value).trim();

  const markdownMatch = url.match(
    /\]\((https?:\/\/[^)]+)\)/
  );

  if (markdownMatch) {
    url = markdownMatch[1];
  } else {
    const plainUrlMatch = url.match(
      /(https?:\/\/[^\s,)]+)/i
    );

    if (plainUrlMatch) {
      url = plainUrlMatch[1];
    }
  }

  url = url
    .replace(/^["']|["']$/g, "")
    .replace(/[,\s]+$/g, "");

  return /^https?:\/\/.+/i.test(url)
    ? url
    : "";
}


function slugToBrand(slug) {
  const brands = {
    "jasper": "Jasper",
    "writesonic": "Writesonic",
    "grammarly": "Grammarly",
    "copy-ai": "Copy.ai",

    "semrush": "Semrush",
    "surfer-seo": "Surfer SEO",
    "frase": "Frase",
    "ahrefs": "Ahrefs",
    "mangools": "Mangools",

    "systeme-io": "Systeme.io",
    "getresponse": "GetResponse",

    "synthesia": "Synthesia",
    "invideo": "InVideo",
    "veed": "Veed.io",
    "heygen": "HeyGen",
    "descript": "Descript",

    "elevenlabs": "ElevenLabs",
    "murf": "Murf",

    "hubspot": "HubSpot"
  };

  return brands[slug] || slug;
}