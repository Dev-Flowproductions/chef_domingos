const { withAndroidManifest } = require('@expo/config-plugins');

// Play Store treats these as required when they are only implied by the
// portrait activity or the camera permission. They are not required to install.
const OPTIONAL_FEATURES = [
  'android.hardware.screen.portrait',
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function markOptional(features, name) {
  const existing = features.find((item) => item.$['android:name'] === name);
  if (existing) {
    existing.$['android:required'] = 'false';
    return;
  }
  features.push({
    $: {
      'android:name': name,
      'android:required': 'false',
    },
  });
}

function withOptionalAndroidFeatures(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = asArray(manifest['uses-feature']);
    for (const name of OPTIONAL_FEATURES) {
      markOptional(features, name);
    }
    manifest['uses-feature'] = features;
    return config;
  });
}

module.exports = withOptionalAndroidFeatures;
