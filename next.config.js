/** @type {import('next').NextConfig} */
const nextConfig = {
  // Public release identifier only. Never forward the remaining deployment env.
  env: {
    NEXT_PUBLIC_JL_RELEASE_ID: /^dpl_[A-Za-z0-9]{8,80}$/.test(process.env.VERCEL_DEPLOYMENT_ID || "")
      ? process.env.VERCEL_DEPLOYMENT_ID
      : /^[a-f0-9]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA || "") ? process.env.VERCEL_GIT_COMMIT_SHA : "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },

  async headers() {
    return [{
      source: "/:path*",
      headers: [
        // Controls who may embed Jagdlatein, not the video/PDF frames it loads.
        { key: "Content-Security-Policy", value: "frame-ancestors 'self';" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }, {
      source: "/werbung/jagdlatein-15s-2026-11-01.mp4",
      has: [{ type: "query", key: "download", value: "1" }],
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-15s.mp4"' },
      ],
    }, {
      source: "/werbung/jagdlatein-15s-2026-11-01.zip",
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-15s-Werbepaket.zip"' },
      ],
    }, {
      source: "/werbung/jagdlatein-reel-30s-2026-11-01.mp4",
      has: [{ type: "query", key: "download", value: "1" }],
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Reel-30s.mp4"' },
      ],
    }, {
      source: "/werbung/jagdlatein-reel-30s-2026-11-01.zip",
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Reel-30s-Paket.zip"' },
      ],
    }, {
      source: "/werbung/jagdlatein-story-2026-11-07-30s.mp4",
      has: [{ type: "query", key: "download", value: "1" }],
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Story-30s.mp4"' },
      ],
    }, {
      source: "/werbung/jagdlatein-story-2026-11-07-15s.mp4",
      has: [{ type: "query", key: "download", value: "1" }],
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Story-15s.mp4"' },
      ],
    }, {
      source: "/werbung/jagdlatein-story-2026-11-07.zip",
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Story-Paket.zip"' },
      ],
    }, {
      source: "/werbung/jagdlatein-wildkunde-quiz-2026-11-12.mp4",
      has: [{ type: "query", key: "download", value: "1" }],
      headers: [
        { key: "Content-Disposition", value: 'attachment; filename="Jagdlatein-Wildkunde-Quiz.mp4"' },
      ],
    }];
  },

  async redirects() {
    return [
      {
        source: "/quiz",
        destination: "/quiz-app",
        permanent: true,
      },
      {
        source: "/quiz/run",
        destination: "/quiz-app/run",
        permanent: true,
      },
      {
        source: "/quiz/leaderboard",
        destination: "/quiz-app/leaderboard",
        permanent: true,
      },
      {
        source: "/quiz/stats",
        destination: "/quiz-app/stats",
        permanent: true,
      },
      {
        source: "/quiz/username",
        destination: "/quiz-app/username",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
