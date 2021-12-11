module.exports = {
  apps: [
    {
      name: 'ytc-bot',
      namespace: 'bot',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
