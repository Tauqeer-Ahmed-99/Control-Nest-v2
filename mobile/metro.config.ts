import { getDefaultConfig } from "expo/metro-config";

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { resolver, transformer } = config;

  config.transformer = {
    ...(transformer as any),
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };

  return config;
})();
