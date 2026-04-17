import axios from "axios";
import { API_URL, authHeaders } from "./auth";

const PENDING_PLAYLIST_URL_KEY = "pendingPlaylistUrl";

export function getPendingPlaylistUrl() {
  return localStorage.getItem(PENDING_PLAYLIST_URL_KEY) || "";
}

export function setPendingPlaylistUrl(playlistUrl) {
  localStorage.setItem(PENDING_PLAYLIST_URL_KEY, playlistUrl);
}

export function clearPendingPlaylistUrl() {
  localStorage.removeItem(PENDING_PLAYLIST_URL_KEY);
}

export async function createPlaylistFromUrl(playlistUrl) {
  const response = await axios.post(
    `${API_URL}/playlists/create`,
    { playlistUrl },
    { headers: authHeaders() }
  );

  return response.data;
}
