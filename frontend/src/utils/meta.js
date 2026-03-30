function ensureMeta(selector, attributeName, attributeValue) {
  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  return element;
}

export function setPageMeta({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
}) {
  if (title) {
    document.title = title;
  }

  if (description) {
    ensureMeta("description", "name", "description").setAttribute("content", description);
  }

  ensureMeta("og:type", "property", "og:type").setAttribute("content", "website");
  ensureMeta("twitter:card", "name", "twitter:card").setAttribute("content", "summary_large_image");
  ensureMeta("og:title", "property", "og:title").setAttribute("content", ogTitle || title || "PrepTube");
  ensureMeta("og:description", "property", "og:description").setAttribute(
    "content",
    ogDescription || description || "Study YouTube playlists together on PrepTube."
  );
  ensureMeta("og:image", "property", "og:image").setAttribute("content", ogImage);
  ensureMeta("twitter:title", "name", "twitter:title").setAttribute("content", ogTitle || title || "PrepTube");
  ensureMeta("twitter:description", "name", "twitter:description").setAttribute(
    "content",
    ogDescription || description || "Study YouTube playlists together on PrepTube."
  );
  ensureMeta("twitter:image", "name", "twitter:image").setAttribute("content", ogImage);
}

