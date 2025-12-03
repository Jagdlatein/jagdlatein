/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
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

export default nextConfig;
