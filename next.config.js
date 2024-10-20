/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // This might help with some caching issues
    forceSwcTransforms: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore specific file types
    config.module.rules.push({
      test: /\.(md|txt|LICENSE)$/,
      type: 'asset/resource',
    });

    // Ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }

    // Ignore specific problematic modules
    config.externals = [
      ...(config.externals || []),
      function({ context, request }, callback) {
        if (/^@libsql\//.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ];

    // Disable caching for development
    config.cache = false;

    return config;
  },
  // This can help with some build issues
  swcMinify: false,
};

module.exports = nextConfig;