import type { Post, User, Comment } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    username: "sethwright",
    displayName: "Seth Wright",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    bio: "Software engineer. Writes about AI, systems, and how we build things that last.",
    followersCount: 4820,
    followingCount: 312,
    postsCount: 47,
    trustScore: 87,
    joinedAt: "2024-01-15",
    topics: ["technology", "ai", "writing"],
    isFollowing: false,
  },
  {
    id: "u2",
    username: "naomi_k",
    displayName: "Naomi Kessler",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=80&h=80&fit=crop&crop=faces",
    bio: "Researcher focused on media, culture, and how information spreads.",
    followersCount: 2941,
    followingCount: 189,
    postsCount: 33,
    trustScore: 92,
    joinedAt: "2024-03-08",
    topics: ["culture", "society", "writing"],
    isFollowing: true,
  },
  {
    id: "u3",
    username: "carlosdev",
    displayName: "Carlos Mendoza",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
    bio: "Game developer and industry critic. Honest takes on where gaming is heading.",
    followersCount: 1203,
    followingCount: 88,
    postsCount: 61,
    trustScore: 79,
    joinedAt: "2024-06-22",
    topics: ["gaming", "technology", "business"],
    isFollowing: false,
  },
  {
    id: "u4",
    username: "dr_fiona_ash",
    displayName: "Dr. Fiona Ash",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    bio: "Climate scientist. I cite my sources. Always.",
    followersCount: 9120,
    followingCount: 244,
    postsCount: 28,
    trustScore: 96,
    joinedAt: "2024-02-01",
    topics: ["science", "health", "society"],
    isFollowing: true,
  },
  {
    id: "u5",
    username: "marcus_thinks",
    displayName: "Marcus Bell",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    bio: "Economist. Sometimes contrarian. Always honest.",
    followersCount: 3356,
    followingCount: 401,
    postsCount: 55,
    trustScore: 83,
    joinedAt: "2024-04-10",
    topics: ["business", "politics", "society"],
    isFollowing: false,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    author: MOCK_USERS[1],
    content:
      "This resonates. The tools are getting better at pattern completion, but the hardest part of engineering is still deciding what to build and why.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likesCount: 44,
    userLiked: false,
    sourcesCount: 0,
  },
  {
    id: "c2",
    author: MOCK_USERS[4],
    content:
      "I'd push back slightly. The definition of repetitive work keeps expanding. Five years ago, junior dev tasks were considered creative. Now they're largely automatable. Where do we draw that line next?",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    likesCount: 78,
    userLiked: true,
    sourcesCount: 1,
  },
  {
    id: "c3",
    author: MOCK_USERS[2],
    content:
      "Agreed in principle. But I wonder if the 'creative' work will also get commoditized once models understand context well enough.",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    likesCount: 31,
    userLiked: false,
    sourcesCount: 0,
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    author: MOCK_USERS[0],
    type: "opinion",
    category: "ai",
    mainPoint: "AI won't replace developers. It will replace repetitive work.",
    explanation:
      "The assumption that AI replaces developers misunderstands what development actually is. Most of what AI can do today — boilerplate code, common patterns, documentation — is the part developers already found tedious. The hard parts — system design, understanding user needs, deciding what to build at all — are deeply human problems. If anything, AI shifts developers up the value chain toward problems that matter more.",
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=450&fit=crop",
    sources: [
      {
        id: "s1",
        title: "GitHub Copilot Impact Study — Productivity vs. Replacement",
        url: "https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/",
        type: "research",
      },
      {
        id: "s2",
        title: "McKinsey: The Developer of the Future",
        url: "https://www.mckinsey.com/featured-insights/future-of-work",
        type: "report",
      },
    ],
    moreLink: "https://medium.com",
    moreLinkLabel: "Full essay on AI and developer futures",
    reactions: {
      positive: { type: "positive", count: 1204, userReacted: false },
      negative: { type: "negative", count: 318, userReacted: false },
    },
    commentsCount: 94,
    comments: MOCK_COMMENTS,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: false,
    trending: true,
    truthPick: true,
  },
  {
    id: "p2",
    author: MOCK_USERS[2],
    type: "observation",
    category: "gaming",
    mainPoint: "Games are becoming too focused on monetization and less focused on fun.",
    explanation:
      "The shift from premium to live-service models has fundamentally changed how games are designed. Progression systems are now built around retention and spending rather than satisfaction. Battle passes, loot boxes, and FOMO mechanics are not a side feature — they're the product. Studios justify this with revenue numbers, but player sentiment surveys show a consistent drop in satisfaction across AAA titles over the last decade. The games that people still love after years are almost always the ones that were designed to be fun first.",
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=450&fit=crop",
    sources: [
      {
        id: "s3",
        title: "Steam Review Sentiment Analysis 2020–2024",
        url: "https://store.steampowered.com",
        type: "research",
      },
    ],
    reactions: {
      positive: { type: "positive", count: 2841, userReacted: true },
      negative: { type: "negative", count: 209, userReacted: false },
    },
    commentsCount: 173,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: true,
    trending: true,
    truthPick: false,
  },
  {
    id: "p3",
    author: MOCK_USERS[1],
    type: "analysis",
    category: "culture",
    mainPoint: "Small communities are more valuable than large audiences.",
    explanation:
      "We've optimized for reach. Every platform metric pushes creators toward mass scale — more followers, more views, more virality. But the communities that actually change people are small. A Discord server with 400 engaged people produces more real impact than a YouTube channel with 400,000 passive subscribers. Scale dilutes specificity. The bigger the audience, the more generic the content has to be. Tight communities can go deep. They can challenge ideas. They can hold people accountable. That's where real change happens.",
    sources: [],
    reactions: {
      positive: { type: "positive", count: 762, userReacted: false },
      negative: { type: "negative", count: 144, userReacted: false },
    },
    commentsCount: 58,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: false,
    trending: false,
    truthPick: true,
  },
  {
    id: "p4",
    author: MOCK_USERS[3],
    type: "prediction",
    category: "science",
    mainPoint:
      "We will see the first commercially viable carbon capture operation at industrial scale before 2030.",
    explanation:
      "Several converging factors make this plausible within a 5-year window: the Inflation Reduction Act's $369B in climate incentives, the rapid cost curve drop in direct air capture technology (cost per ton fell ~40% since 2020), and increasing corporate pressure on supply chain emissions. Projects like Climeworks Mammoth in Iceland show the technology is real. The question was always whether it was commercially viable, not technically possible.",
    image:
      "https://images.unsplash.com/photo-1569163139394-de4e5f43e5ca?w=800&h=450&fit=crop",
    sources: [
      {
        id: "s4",
        title: "IEA: Direct Air Capture 2023 Report",
        url: "https://www.iea.org/reports/direct-air-capture-2023",
        type: "report",
      },
      {
        id: "s5",
        title: "Climeworks Mammoth Plant Launch",
        url: "https://climeworks.com",
        type: "article",
      },
    ],
    reactions: {
      positive: { type: "positive", count: 492, userReacted: false },
      negative: { type: "negative", count: 381, userReacted: false },
    },
    commentsCount: 47,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: false,
    trending: false,
    truthPick: true,
  },
  {
    id: "p5",
    author: MOCK_USERS[4],
    type: "question",
    category: "business",
    mainPoint:
      "If remote work is more productive, why are companies still forcing people back to the office?",
    explanation:
      "Multiple studies — Stanford, Microsoft, and others — consistently show that remote work either matches or exceeds in-office productivity for knowledge workers. Yet most large employers have issued return-to-office mandates since 2022. The stated reasons involve collaboration and culture. But the timing often correlates with office lease commitments, commercial real estate pressure, and management preferences rather than actual data. What's the honest reason?",
    sources: [
      {
        id: "s6",
        title: "Stanford Study: Remote Work Productivity",
        url: "https://nbloom.people.stanford.edu/sites/g/files/sbiybj4746/f/wfhworkingpaper.pdf",
        type: "research",
      },
    ],
    reactions: {
      positive: { type: "positive", count: 3102, userReacted: false },
      negative: { type: "negative", count: 88, userReacted: false },
    },
    commentsCount: 241,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: false,
    trending: true,
    truthPick: false,
  },
  {
    id: "p6",
    author: MOCK_USERS[0],
    type: "review",
    category: "technology",
    mainPoint:
      "The Arc browser is the most thoughtful product design decision of the last decade. Nothing else comes close.",
    explanation:
      "Most browsers are still functionally the same as they were in 2010. Arc looked at how developers and knowledge workers actually use the web — dozens of tabs, context switching, research workflows — and redesigned from scratch. Spaces, boosts, split view, and the command bar aren't features bolted on. They're a coherent vision of what a browser should be in 2024. Whether Arc wins marketshare or not, it's demonstrated that the browser interface was overdue for reinvention.",
    sources: [],
    reactions: {
      positive: { type: "positive", count: 1840, userReacted: false },
      negative: { type: "negative", count: 522, userReacted: false },
    },
    commentsCount: 88,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isFollowingDiscussion: false,
    trending: false,
    truthPick: false,
  },
];
