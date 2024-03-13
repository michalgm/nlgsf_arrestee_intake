module.exports = {
  apps: [
    {
      name: "arrestee-form-lsba",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        PORT: "3001",
      },
    },
  ],
};
