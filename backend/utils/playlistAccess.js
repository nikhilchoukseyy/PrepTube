export function isPlaylistOwner(playlist, userId) {
  return String(playlist?.owner?._id || playlist?.owner) === String(userId);
}

export function isPlaylistMember(playlist, userId) {
  return (playlist?.members || []).some((member) => String(member?._id || member) === String(userId));
}

export function canAccessPlaylist(playlist, userId) {
  return isPlaylistOwner(playlist, userId) || isPlaylistMember(playlist, userId);
}

