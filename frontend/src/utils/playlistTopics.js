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

export function normalizeTopicLabel(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function dedupePlaylistTopics(topics = []) {
  if (!Array.isArray(topics)) return [];

  const normalizedTopics = [];
  const seenTopics = new Set();

  for (const rawTopic of topics) {
    const topic = normalizeTopicLabel(rawTopic);
    if (!topic) continue;

    const key = topic.toLowerCase();
    if (seenTopics.has(key)) continue;

    seenTopics.add(key);
    normalizedTopics.push(topic);

    if (normalizedTopics.length >= MAX_PLAYLIST_TOPICS) break;
  }

  return normalizedTopics;
}

export function sameTopicSet(left = [], right = []) {
  const leftTopics = dedupePlaylistTopics(left).map((topic) => topic.toLowerCase()).sort();
  const rightTopics = dedupePlaylistTopics(right).map((topic) => topic.toLowerCase()).sort();

  if (leftTopics.length !== rightTopics.length) return false;
  return leftTopics.every((topic, index) => topic === rightTopics[index]);
}

export function buildPlaylistTopicOptions(topics = []) {
  const orderedTopics = [];
  const seenTopics = new Set();

  for (const topic of DEFAULT_PLAYLIST_TOPICS) {
    const key = topic.toLowerCase();
    if (seenTopics.has(key)) continue;
    seenTopics.add(key);
    orderedTopics.push(topic);
  }

  const extraTopics = [];
  for (const topic of dedupePlaylistTopics(topics)) {
    const key = topic.toLowerCase();
    if (seenTopics.has(key)) continue;
    seenTopics.add(key);
    extraTopics.push(topic);
  }

  extraTopics.sort((left, right) => left.localeCompare(right));
  return [...orderedTopics, ...extraTopics];
}
