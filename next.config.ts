const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
    unoptimized: true, // 👈 evita procesado innecesario durante desarrollo
  },
};

export default nextConfig;
