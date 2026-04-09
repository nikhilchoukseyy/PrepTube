import axios from "axios";
import { API_URL, authHeaders } from "./auth";

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

async function buildUploadPayload(file, { maxDimension = 1600, quality = 0.86 } = {}) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const longestSide = Math.max(image.naturalWidth || image.width || 0, image.naturalHeight || image.height || 0) || 1;
  const scale = Math.min(1, maxDimension / longestSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not process this image");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/webp", quality);
}

async function uploadImageAsset(file, endpoint, { withAuth = false, maxDimension } = {}) {
  const fileData = await buildUploadPayload(file, { maxDimension });
  const response = await axios.post(
    `${API_URL}${endpoint}`,
    { fileData },
    { headers: withAuth ? authHeaders() : undefined }
  );

  return response.data?.url || "";
}

export async function prepareImageUpload(file) {
  return uploadImageAsset(file, "/admin/reviews/upload-image", {
    withAuth: true,
    maxDimension: 1800,
  });
}

export async function prepareAvatarUpload(file, options = {}) {
  return uploadImageAsset(file, "/users/avatar-upload", {
    withAuth: Boolean(options.withAuth),
    maxDimension: 1024,
  });
}
