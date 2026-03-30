export const DEFAULT_PLAYLIST_TOPICS = [
  "JEE",
  "Physics",
  "Maths",
  "Chemistry",
  "NEET",
  "UPSC",
  "SSC",
  "Class 12",
  "Class 10",
  "Engineering",
  "Civil",
  "Mechanical",
  "IT",
  "CSE",
  "Electrical",
  "Video Editing",
  "AI Learning",
  "ML",
  "Web Development",
  "App Development",
  "Data Science",
  "Programming",
  "Placement Prep",
  "GATE",
  "CAT",
  "Biology",
  "English",
  "History",
  "Geography",
  "Commerce",
];

export const MAX_PLAYLIST_TOPICS = 12;
export const MAX_PLAYLIST_TOPIC_LENGTH = 40;

const DEFAULT_TOPIC_LOOKUP = new Map(
  DEFAULT_PLAYLIST_TOPICS.map((topic) => [topic.toLowerCase(), topic])
);

function sanitizeTopic(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYLIST_TOPIC_LENGTH);
}

export function normalizePlaylistTopics(topics = []) {
  if (!Array.isArray(topics)) return [];

  const normalizedTopics = [];
  const seenTopics = new Set();

  for (const rawTopic of topics) {
    const sanitizedTopic = sanitizeTopic(rawTopic);
    if (!sanitizedTopic) continue;

    const canonicalTopic =
      DEFAULT_TOPIC_LOOKUP.get(sanitizedTopic.toLowerCase()) || sanitizedTopic;
    const topicKey = canonicalTopic.toLowerCase();

    if (seenTopics.has(topicKey)) continue;

    seenTopics.add(topicKey);
    normalizedTopics.push(canonicalTopic);

    if (normalizedTopics.length >= MAX_PLAYLIST_TOPICS) break;
  }

  return normalizedTopics;
}

export function buildAvailablePlaylistTopics(playlists = []) {
  const orderedTopics = [];
  const seenTopics = new Set();

  for (const topic of DEFAULT_PLAYLIST_TOPICS) {
    const topicKey = topic.toLowerCase();
    if (seenTopics.has(topicKey)) continue;
    seenTopics.add(topicKey);
    orderedTopics.push(topic);
  }

  const extraTopics = [];
  for (const playlist of playlists) {
    for (const topic of normalizePlaylistTopics(playlist?.topics || [])) {
      const topicKey = topic.toLowerCase();
      if (seenTopics.has(topicKey)) continue;
      seenTopics.add(topicKey);
      extraTopics.push(topic);
    }
  }

  extraTopics.sort((left, right) => left.localeCompare(right));
  return [...orderedTopics, ...extraTopics];
}
