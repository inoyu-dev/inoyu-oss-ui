/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');
const path = require('path');
const nextConfig = {
  i18n,
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'jsx', 'js'],
  webpack: (config) => {
    config.resolve.alias['@styles'] = path.join(__dirname, 'src/styles');
    return config;
  },
  env: {
    TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN_KEY: process.env.TWITTER_ACCESS_TOKEN_KEY,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    // AI provider configuration
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID,
    UNOMI_URL: process.env.UNOMI_URL || 'http://localhost:8181',
    NEXT_PUBLIC_UNOMI_URL: process.env.NEXT_PUBLIC_UNOMI_URL || 'http://localhost:8181',
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
    FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID,

    INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME,
    INSTAGRAM_PASSWORD: process.env.INSTAGRAM_PASSWORD,
    INSTAGRAM_HASHTAG: process.env.INSTAGRAM_HASHTAG,

    TWITTER_CLIENT_KEY: process.env.TWITTER_CLIENT_KEY,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,

    SESSION_SECRET: process.env.SESSION_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    SECRET_COOKIE_PASSWORD: process.env.SECRET_COOKIE_PASSWORD,

    UNOMI_CALLBACK_BASE_URL: process.env.UNOMI_CALLBACK_BASE_URL,
    UNOMI_CALLBACK_API_KEY: process.env.UNOMI_CALLBACK_API_KEY,
    UNOMI_VERSION: process.env.UNOMI_VERSION,
    // Note: UNOMI_PUBLIC_API_KEY and UNOMI_PRIVATE_API_KEY are no longer used
    // API keys are now dynamically resolved from Unomi at startup
    UNOMI_TENANT_ID: process.env.UNOMI_TENANT_ID, // Still needed as input to identify which tenant to use
    UNOMI_CALLBACK_ALLOWED_ENDPOINTS: process.env.UNOMI_CALLBACK_ALLOWED_ENDPOINTS,
    
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID,

    ZENDESK_SUBDOMAIN: process.env.ZENDESK_SUBDOMAIN,
    ZENDESK_EMAIL: process.env.ZENDESK_EMAIL,
    ZENDESK_API_TOKEN: process.env.ZENDESK_API_TOKEN,
    ZENDESK_CLIENT_ID: process.env.ZENDESK_CLIENT_ID,
    ZENDESK_CLIENT_SECRET: process.env.ZENDESK_CLIENT_SECRET,
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/unomi/tracker.js',
        destination: '/api/proxy/unomi/tracker',
      },
    ];
  },
};

module.exports = nextConfig;
