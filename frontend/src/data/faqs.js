export const faqs = [
  {
    question: "What exactly is PrepTube?",
    answer:
      "PrepTube turns a YouTube playlist into a collaborative study room. Instead of sharing links in chat and learning in separate tabs, members can join the same room, track progress, discuss lessons live, and stay accountable together.",
  },
  {
    question: "How do I import a playlist?",
    answer:
      "On the Courses page, paste any valid YouTube playlist URL. PrepTube extracts the YouTube playlist id, pulls the playlist metadata and video list from the YouTube Data API, calculates durations, and creates a room around that playlist.",
  },
  {
    question: "Can I use PrepTube for free?",
    answer:
      "Yes. The free plan lets you import playlists, track progress and streaks, use live chat, and invite up to 5 collaborators to a room, which means 6 total people including the owner.",
  },
  {
    question: "Are my notes visible to other members?",
    answer:
      "No. Video notes are private per user. Other room members can see the shared playlist, progress-related stats, and chat, but they cannot read your private notes for a video.",
  },
  {
    question: "How are streaks calculated?",
    answer:
      "Streaks are tracked per user and per playlist. PrepTube logs active study time from the workspace, and a day counts toward the streak once you reach at least 30 minutes on that playlist for that date in the Asia/Kolkata timezone.",
  },
  {
    question: "How do public playlists and the Public feed work?",
    answer:
      "The room owner can mark a playlist as public after selecting at least one topic. Public rooms appear in the Public feed and can be filtered by topic. Users still join the room before entering the full workspace.",
  },
  {
    question: "What if I do not renew my premium after 1 month?",
    answer:
      "Your account falls back to the free plan when the premium period ends. Existing room members keep their access, but new joins will follow the free plan member limit until you renew premium again.",
  },
  {
    question: "Do chat messages stay saved?",
    answer:
      "Yes. Text, image, and voice messages are stored so recent room chat can be loaded again when members reopen the workspace. Media uploads depend on Cloudinary being configured on the backend.",
  },
];
