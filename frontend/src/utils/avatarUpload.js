const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export async function prepareAvatarUpload(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const longestSide = Math.max(image.naturalWidth || image.width || 0, image.naturalHeight || image.height || 0) || 1;
  const scale = Math.min(1, 512 / longestSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not process this image");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  if (file.type === "image/png") {
    return canvas.toDataURL("image/png");
  }

  return canvas.toDataURL("image/jpeg", 0.82);
}
