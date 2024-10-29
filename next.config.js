/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HUGGINGFACE_API_TOKEN: process.env.HUGGINGFACE_API_TOKEN
  },
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
        ...config.resolve.alias,
        "sharp$": false,
        "onnxruntime-node$": false,
    }
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      loader: 'worker-loader',
      options: {
        filename: 'static/[hash].worker.js',
      },
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
    
  },
};

module.exports = nextConfig;