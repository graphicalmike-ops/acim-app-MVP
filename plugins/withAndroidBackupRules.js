const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Explicitly pins Android's default "back everything up" behavior so it survives
// `expo prebuild` regenerating android/ (gitignored, not committed) with a future
// Expo/OS template that might change the default.

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="database" path="." />
        <include domain="sharedpref" path="." />
        <include domain="file" path="." />
    </cloud-backup>
    <device-transfer>
        <include domain="database" path="." />
        <include domain="sharedpref" path="." />
        <include domain="file" path="." />
    </device-transfer>
</data-extraction-rules>
`;

const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="database" path="." />
    <include domain="sharedpref" path="." />
    <include domain="file" path="." />
</full-backup-content>
`;

function withBackupXmlFiles(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'data_extraction_rules.xml'),
        DATA_EXTRACTION_RULES_XML
      );
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), BACKUP_RULES_XML);
      return config;
    },
  ]);
}

function withBackupManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$['android:allowBackup'] = 'true';
    application.$['android:fullBackupContent'] = '@xml/backup_rules';
    application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    return config;
  });
}

module.exports = function withAndroidBackupRules(config) {
  config = withBackupXmlFiles(config);
  config = withBackupManifest(config);
  return config;
};
