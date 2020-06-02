module.exports = {
  apps: [
    {
      name: "arrestee-form",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster"
    }
  ]
}