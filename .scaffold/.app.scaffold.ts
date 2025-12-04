import { createScaffolding, TsMorphModule } from '@povio/scaffold';
import { SourceFile } from '@povio/scaffold/dist/plugins/ts-morph';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { join } from 'node:path';

const ActivateParams = z.object({
  fileImports: z.array(z.tuple([z.string(), z.string()])).optional(),
  position: z.string(),
  statement: z.string(),
});

const appPipesPath = join(__dirname, '..', 'src', 'app.pipes.ts');
const mainPath = join(__dirname, '..', 'src', 'main.ts');

export default createScaffolding({
  name: '~app.module',

  init: async ({ modules }, { addExecutor }) => {
    await addExecutor({
      match: '~app.pipes:activate',
      description: 'inject into the main app pipes file',
      init: async (task, { addMessage }) => {
        const { fileImports, position, statement } = ActivateParams.parse(task.request.value);

        let changes = false;

        await (modules['ts-morph'] as TsMorphModule).withTsMorph(async ({ project }) => {
          const sourceFile = project.getSourceFile(appPipesPath);

          if (!sourceFile) {
            addMessage('error', `${appPipesPath} does not exist`);
            task.status = 'errored';
            return;
          }

          changes = handleImports(fileImports, sourceFile, addMessage) || changes;

          const requestPipe = sourceFile.getFunction('requestPipes');
          if (!requestPipe) {
            addMessage('error', `requestPipes function not found`);
            task.status = 'errored';
            return;
          }

          if (!requestPipe.getStatements().some((s) => s.getText() === statement)) {
            // find the position comment
            const positionLine = requestPipe
              .getStatementsWithComments()
              .find((s) => s.getText() === `// hook: ${position}`);

            if (!positionLine) {
              addMessage('error', `position "${position}" not found`);
              task.status = 'errored';
              return;
            }

            // insert statement after the position comment
            positionLine.replaceWithText(`${positionLine.getText()}\n\n${statement}`);

            changes = true;
          }
        });

        task.status = changes ? 'queued' : 'conforming';
      },
      exec: async () => {},
    });

    await addExecutor({
      match: '~main:activate',
      description: 'inject into the main app file',
      init: async (task, { addMessage }) => {
        const { fileImports, position, statement } = ActivateParams.parse(task.request.value);

        let changes = false;

        await (modules['ts-morph'] as TsMorphModule).withTsMorph(async ({ project }) => {
          const sourceFile = project.getSourceFile(mainPath);

          if (!sourceFile) {
            addMessage('error', `${mainPath} does not exist`);
            task.status = 'errored';
            return;
          }

          changes = handleImports(fileImports, sourceFile, addMessage) || changes;

          for (const scope of [sourceFile, sourceFile.getFunction('bootstrap')]) {
            if (scope && !scope.getStatements().some((s) => s.getText() === statement)) {
              // find the position comment
              const positionLine = scope
                .getStatementsWithComments()
                .find((s) => s.getText() === `// hook: ${position}`);

              if (!positionLine) {
                continue;
              }

              // insert statement after the position comment
              positionLine.replaceWithText(`${positionLine.getText()}\n\n${statement}`);

              changes = true;
            }
          }
        });

        task.status = changes ? 'queued' : 'conforming';
      },
      exec: async () => {},
    });
  },
});

function handleImports(
  fileImports: [string, string][] | undefined,
  appPipes: SourceFile,
  addMessage: (level: 'info' | 'error' | 'warning', a: string) => void,
) {
  let changes = false;
  for (const [importName, importPath] of fileImports || []) {
    const existingImport = appPipes.getImportDeclaration(importPath);

    if (existingImport) {
      if (!existingImport.getNamedImports().some((x) => x.getName() == importName)) {
        addMessage('info', `adding ${importName} from ${importPath}`);
        existingImport.addNamedImport(importName);
        changes = true;
      }
    } else {
      addMessage('info', `adding ${importName} from ${importPath}`);
      appPipes.addImportDeclaration({
        namedImports: [importName],
        moduleSpecifier: importPath,
      });
      changes = true;
    }
  }
  return changes;
}
