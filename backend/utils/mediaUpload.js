import crypto from "crypto";

export async function uploadBase64Media(fileData, { folder, resourceType = "image" }) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Media storage is not configured");
    error.status = 503;
    error.body = { message: "Media uploads are not configured on the server yet" };
    throw error;
  }

  if (typeof fileData !== "string" || !fileData.trim()) {
    const error = new Error("fileData is required");
    error.status = 400;
    error.body = { message: "fileData is required" };
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");
  const normalizedFileData = fileData.trim().replace(
    /^(data:[a-zA-Z]+\/[a-zA-Z0-9.+-]+)[^,]*(,)/,
    "$1;base64$2"
  );
  const form = new FormData();
  form.append("file", normalizedFileData);
  form.append("folder", folder);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Failed to upload media");
    error.status = response.status;
    error.body = { message: payload?.error?.message || "Failed to upload media" };
    throw error;
  }

  return payload.secure_url;
}
