const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withNavBarContrast(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const resources = styles.resources;

    let appTheme = resources.style?.find(
      (s) => s.$.name === 'AppTheme' || s.$.name === 'Theme.App'
    );

    if (!appTheme) {
      if (!resources.style) resources.style = [];
      appTheme = { $: { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' }, item: [] };
      resources.style.push(appTheme);
    }

    if (!appTheme.item) appTheme.item = [];

    const existing = appTheme.item.find((i) => i.$.name === 'android:enforceNavigationBarContrast');
    if (existing) {
      existing._ = 'false';
    } else {
      appTheme.item.push({ $: { name: 'android:enforceNavigationBarContrast' }, _: 'false' });
    }

    return config;
  });
};
