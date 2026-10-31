const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidLocalNetwork(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) {
      throw new Error("AndroidManifest.xml is missing the application element.");
    }

    application.$["android:usesCleartextTraffic"] = "true";

    return config;
  });
};
