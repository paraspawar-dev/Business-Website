module.exports = {
  apps: [
    {
      name: "caliber-link-server",
      script: "./server/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      log_file: "./server/logs/pm2-combined.log",
      error_file: "./server/logs/pm2-error.log",
      out_file: "./server/logs/pm2-out.log",
      time: true
    }
  ]
};
