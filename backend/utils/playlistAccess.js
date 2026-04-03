function resolveActorId(actor) {
  return String(actor?._id || actor?.id || actor || "");
}

export function isAdminUser(actor) {
  return actor?.role === "admin";
}

export function isPlaylistOwner(playlist, actor) {
  return String(playlist?.owner?._id || playlist?.owner) === resolveActorId(actor);
}

export function isPlaylistMember(playlist, actor) {
  const actorId = resolveActorId(actor);
  return (playlist?.members || []).some((member) => String(member?._id || member) === actorId);
}

export function canModeratePublicPlaylist(playlist, actor) {
  return Boolean(playlist?.isPublic) && isAdminUser(actor);
}

export function canViewPlaylist(playlist, actor) {
  return isPlaylistOwner(playlist, actor) || isPlaylistMember(playlist, actor) || canModeratePublicPlaylist(playlist, actor);
}

export function canAccessPlaylist(playlist, actor) {
  return isPlaylistOwner(playlist, actor) || isPlaylistMember(playlist, actor);
}
