import { createScaffolding, TsMorphModule } from '@povio/scaffold';
import { SyntaxKind } from '@povio/scaffold/dist/plugins/ts-morph';
import { z } from '@povio/scaffold/dist/plugins/zod';

const ModuleActivateParams = z.object({
  module: z.string(),
  fileImports: z.array(z.tuple([z.string(), z.string()])).optional(),
  imports: z.array(z.string()).optional(),
  providers: z.array(z.string()).optional(),
  controllers: z.array(z.string()).optional(),
  exports: z.array(z.string()).optional(),
});

export default createScaffolding({
  name: 'nest-module',

  init: async ({ modules }, { addExecutor }) => {
    await addExecutor({
      match: 'nest-module:activate',
      description: 'inject into a module',
      init: async (task, { addMessage }) => {
        const { module, fileImports, imports, providers, exports, controllers } = ModuleActivateParams.parse(
          task.request.value,
        );

        let changes = false;

        await (modules['ts-morph'] as TsMorphModule).withTsMorph(async ({ project }) => {
          const moduleClass = project
            .getSourceFiles()
            .filter((sf) => sf.getFilePath().includes('.module.ts'))
            .flatMap((sf) => sf.getClasses())
            .find((c) => c.getName() === module);

          if (!moduleClass) {
            addMessage('error', `${module} not found`);
            task.status = 'errored';
            return;
          }

          const moduleFile = moduleClass.getSourceFile();

          if (fileImports) {
            for (const [importName, importPath] of fileImports) {
              const existingImport = moduleFile.getImportDeclaration(importPath);
              if (existingImport) {
                if (!existingImport.getNamedImports().some((x) => x.getName() == importName)) {
                  existingImport.addNamedImport(importName);
                  changes = true;
                }
              } else {
                moduleFile.addImportDeclaration({
                  namedImports: [importName],
                  moduleSpecifier: importPath,
                });
                changes = true;
              }
            }
          }
          if (imports || providers || exports) {
            const moduleArguments = moduleClass?.getDecorator('Module')!.getArguments()[0];
            const addArrayProp = (name: string, values: string[]) => {
              if (!moduleArguments) {
                addMessage('error', `${module}->Module arguments not found`);
                task.status = 'errored';
                return;
              }
              const array = moduleArguments
                ?.getDescendants()
                .find(
                  (d) =>
                    d.getKind() === SyntaxKind.PropertyAssignment && (d.compilerNode as any).name.getText() === name,
                )
                ?.getFirstChildByKindOrThrow(SyntaxKind.ArrayLiteralExpression);
              if (!array) {
                addMessage('error', `${name} not found in ${module}->@Module`);
                task.status = 'errored';
                return;
              }
              for (const value of values || []) {
                if (!array.getElements().some((e) => e.getText().startsWith(value))) {

                  if (value.endsWith('(')) {
                    array.addElement(`${value})`);
                  } else {
                    array.addElement(value);
                  }

                  changes = true;
                }
              }
            };
            if (providers?.length) addArrayProp('providers', providers);
            if (exports?.length) addArrayProp('exports', exports);
            if (imports?.length) addArrayProp('imports', imports);
            if (controllers?.length) addArrayProp('controllers', controllers);
          }
        });

        task.status = changes ? 'queued' : 'conforming';
      },
      exec: async () => {},
    });
  },
});
