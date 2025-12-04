#!/usr/bin/env node
/**
 * Generate ./config/$STAGE.api.resolved.yml from ./config/$STAGE.api.template.yml
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const STAGE = process.env.STAGE;
const moduleName = 'api';
const rootDir = path.join(__dirname, '..', '..');
const configTemplateName = path.join('.config', `${STAGE}.${moduleName}.template.yml`);
const configName = path.join('.config', `${STAGE}.${moduleName}.resolved.yml`);
const configTemplatePath = path.join(rootDir, configTemplateName);

if (!STAGE) {
  console.error('STAGE is required');
  process.exit(1);
}

if (fs.existsSync(configTemplatePath) === false) {
  console.error(`Config template not found: ${configTemplateName}`);
  process.exit(1);
}

const configTemplate = fs.readFileSync(configTemplatePath, 'utf8');

// callback replace all ${} with process.env
const config = configTemplate.replace(/\$\{([^}]+)}/g, (_, match) => {

  const [command, value] = match.split(':');
  switch (command) {
    case 'func':
      switch (value) {
        case 'stage':
          return STAGE;
        case 'timestamp':
          return new Date().toISOString();
        case 'release':
          // return git sha
          return process.env.RELEASE || require('child_process').execSync('git rev-parse HEAD').toString().trim();
        default:
          throw new Error(`Unknown function: ${value}`);
      }
    case 'env':
      return process.env[value];
    default:
      throw new Error(`Unknown command: ${command}`);
  }
});

fs.writeFileSync(path.join(rootDir, configName), config);

// console.log(`Generated ${configTemplateName}`);
