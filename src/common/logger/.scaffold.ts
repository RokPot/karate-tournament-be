import { createScaffolding, TsMorphModule } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { join } from 'node:path';

let hasMultipleRequests = false;

const BasicLoggerScaffoldOptions = z.object({
  provider: z.string().default('basic'),
});

export default createScaffolding({
  name: '~common/logger',

  configSchema: BasicLoggerScaffoldOptions,

  init: async ({ modules }, { addExecutor, addRequest }) => {
    for (const value of [
      // luxon
      { pkg: 'luxon@^3.5.0' },
      { pkg: '@types/luxon@^3.4.2', dev: true },
    ]) {
      await addRequest({
        match: 'package.json:dependency',
        value,
      });
    }

    await addExecutor({
      match: `~common/logger:activate`,
      description: 'inject module into the main app',
      init: async (task, { addMessage }) => {
        if (hasMultipleRequests) {
          throw new Error('Multiple loggers not supported');
        }
        hasMultipleRequests = true;

        let changed = false;
        const apply = async (targetPath: string, targetAlias: string, sourceName: string, sourcePath: string) => {
          await (modules['ts-morph'] as TsMorphModule).withTsMorph(async ({ project }) => {
            const targetModule = project.getSourceFile(join(__dirname, targetPath));
            if (!targetModule) {
              throw new Error(`${targetPath} not found`);
            }

            const exportDeclaration = targetModule.getExportDeclaration(
              (d) =>
                d.hasNamedExports() &&
                // match by alias name
                d.getNamedExports().some((e) => e.getAliasNode()?.getText() === targetAlias),
            );
            if (!exportDeclaration) {
              changed = true;
              addMessage('info', `adding export ${targetAlias} to ${sourcePath} to ${targetPath}`);
              targetModule
                .addExportDeclaration({
                  moduleSpecifier: sourcePath,
                })
                .addNamedExport({
                  name: sourceName,
                  alias: targetAlias,
                });
            } else {
              if (exportDeclaration.getModuleSpecifier()?.getText().replace(/["']/g, '') !== sourcePath) {
                changed = true;
                addMessage('info', `updating export ${targetAlias} to be from ${sourcePath}`);
                exportDeclaration.setModuleSpecifier(sourcePath);
              }
              exportDeclaration.getNamedExports().forEach((e) => {
                if (e.getAliasNode()?.getText() === targetAlias && e.getName() !== sourceName) {
                  changed = true;
                  addMessage('info', `updating export ${targetAlias} to ${sourcePath} from ${targetPath}`);
                  e.setName(sourceName);
                }
              });
            }
          });
        };

        const { LoggerService } = task.request.value!;

        await apply('logger.service.ts', 'LoggerService', LoggerService[0], LoggerService[1]);

        if (changed) {
          task.status = 'delegated';
        }
      },
    });
  },
});
