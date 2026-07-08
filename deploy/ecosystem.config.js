module.exports = {
  apps: [
    {
      name: "caliber-link-public",
      script: "./server/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ADMIN_PORT: 4000
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "300M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      time: true
    }
  ]
};
