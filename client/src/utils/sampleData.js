/**
 * Static Sample Videos for Phase 1 Layout Demonstration
 * Clearly labelled as static mock data to demonstrate the YouTube exact UI layout.
 */
export const SAMPLE_VIDEOS = [
  {
    id: 'sample-vid-01',
    title: 'Building a Full-Stack YouTube Replica from Scratch with React 19 & Express',
    description: 'Learn how to architect a production-grade video platform with Mongoose, Cloudinary, and Tailwind CSS.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    duration: 1845, // 30:45
    views: 482900,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Web Development',
    channel: {
      name: 'VidTube Academy',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-02',
    title: 'React 19 Complete Masterclass: Actions, useOptimistic, and Server Functions',
    description: 'The definitive breakdown of all groundbreaking features introduced in React 19 with real-world examples.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    duration: 2530, // 42:10
    views: 1250000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'React',
    channel: {
      name: 'Modern Dev Tips',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-03',
    title: 'Designing High-Performance Node.js & Express REST APIs in 2026',
    description: 'Best practices for scalability, security headers, rate limiting, and database indexing.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    duration: 1210, // 20:10
    views: 94300,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Node.js',
    channel: {
      name: 'Backend Architecture',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80',
      isVerified: false
    }
  },
  {
    id: 'sample-vid-04',
    title: 'Lofi Chill Beats for Coding, Focus, and Deep Work 🎧 (24/7 Live Stream)',
    description: 'Relaxing ambient and instrumental tracks to help you code and concentrate.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    duration: 7200, // 2:00:00
    views: 3410000,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Music',
    channel: {
      name: 'Chill Coding Beats',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-05',
    title: 'MongoDB Indexing & Aggregation Pipelines: From Slow Queries to Microseconds',
    description: 'Deep dive into compound indexes, explain plans, and aggregation pipelines.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    duration: 980, // 16:20
    views: 67200,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Computer Science',
    channel: {
      name: 'Data Engineering Pro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-06',
    title: 'Tailwind CSS Tips You Probably Never Used — Advanced Layout Techniques',
    description: 'Master grid template areas, arbitrary properties, container queries, and animations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    duration: 840, // 14:00
    views: 182000,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Web Development',
    channel: {
      name: 'Frontend Wizard',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-07',
    title: 'Top 10 Video Games of 2026 That Push Unreal Engine 5.4 to the Absolute Limit',
    description: 'Next-gen graphics, physics simulations, and open-world gameplay showcase.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
    duration: 1425, // 23:45
    views: 890000,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Gaming',
    channel: {
      name: 'GamerVerse Central',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  },
  {
    id: 'sample-vid-08',
    title: 'AI Engineering in 2026: Building Autonomous Agentic Workflows with Claude & Gemini',
    description: 'Hands-on guide to multi-agent architectures, tool calling, and MCP server integrations.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    duration: 2120, // 35:20
    views: 520000,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category: 'Artificial Intelligence',
    channel: {
      name: 'AI Frontier',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      isVerified: true
    }
  }
];

export const SAMPLE_CHANNELS = [
  { id: 'ch-1', name: 'VidTube Academy', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', isLive: true },
  { id: 'ch-2', name: 'Modern Dev Tips', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', hasNewVideo: true },
  { id: 'ch-3', name: 'Chill Coding Beats', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', isLive: false },
  { id: 'ch-4', name: 'Backend Architecture', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=80&q=80', hasNewVideo: true },
  { id: 'ch-5', name: 'GamerVerse Central', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=80&q=80', hasNewVideo: false }
];

export const SAMPLE_SHORTS = [
  {
    id: 'sample-short-01',
    title: 'Top 3 React 19 tricks every developer needs to know! 🚀 #react #webdev',
    description: 'Quick React 19 performance optimizations and useOptimistic breakdown in under 30 seconds!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=720&h=1280&q=80',
    duration: 15,
    views: 342900,
    likesCount: 18400,
    commentsCount: 382,
    soundTitle: 'VidTube Coding Beats - Original',
    channel: {
      name: 'Modern Dev Tips',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      subscribersCount: 245000
    }
  },
  {
    id: 'sample-short-02',
    title: 'Tailwind CSS hidden feature you are probably not using 👀 #css #frontend',
    description: 'Arbitrary variants and group hover animations explained quickly!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=720&h=1280&q=80',
    duration: 22,
    views: 890400,
    likesCount: 42100,
    commentsCount: 654,
    soundTitle: 'Trending Lo-Fi Vibes',
    channel: {
      name: 'VidTube Academy',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      subscribersCount: 520000
    }
  },
  {
    id: 'sample-short-03',
    title: 'How Senior Engineers structure Express API microservices ⚡ #nodejs #backend',
    description: 'Clean architectural boundaries and error middlewares in 60s.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=720&h=1280&q=80',
    duration: 28,
    views: 125000,
    likesCount: 9300,
    commentsCount: 142,
    soundTitle: 'Clean Tech Synth Wave',
    channel: {
      name: 'Backend Architecture',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80',
      isVerified: false,
      subscribersCount: 88000
    }
  },
  {
    id: 'sample-short-04',
    title: 'Insane AI Tool that writes full-stack tests automatically 🔥 #ai #coding',
    description: 'Automating testing pipelines with autonomous agent benchmarks.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=720&h=1280&q=80',
    duration: 35,
    views: 650000,
    likesCount: 38200,
    commentsCount: 512,
    soundTitle: 'Future Beats 2026',
    channel: {
      name: 'AI Frontier',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      subscribersCount: 310000
    }
  }
];
