module.exports = {
  apps: [
    {
      name: 'portal-api',
      cwd: __dirname,
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
