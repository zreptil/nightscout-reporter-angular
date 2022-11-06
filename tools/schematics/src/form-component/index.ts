import {strings} from '@angular-devkit/core';
import {apply, applyTemplates, chain, mergeWith, move, Rule, SchematicContext, Source, Tree, url} from '@angular-devkit/schematics';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';

export function formComponent(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    options.baseId = dasherize(options.className).replace(/-/g, '');
    options.className = classify(`Print${options.className}`);
    console.log(options);
    const rule = chain([
      createFile(options)
    ]);
    return rule(tree, context);
  };
}

function createFile(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const source: Source = url('../assets/templates/form-component');
    const templateSource = apply(source, [
      applyTemplates({
          ...options,
          ...strings
        }
      ), move(source.name, `/src/app/forms/nightscout/${source.name}`)
    ]);
    const rule = mergeWith(templateSource);
    // const modulePath = findModuleFromOptions(tree, options);
    // if (modulePath != null) {
    //   const importPath = `/src/app/forms/nightscout/${dasherize(options.className)}.component`;
    //   const src = '/src/app';
    //   const srcFile = ts.createSourceFile('', src, ts.ScriptTarget.Latest, true);
    // const changes = addDeclarationToModule(srcFile, modulePath, `${options.className}Component`, importPath);
    // const declarationRecorder = tree.beginUpdate(modulePath);
    // for (const change of changes) {
    //   if (change instanceof InsertChange) {
    //     declarationRecorder.insertLeft(change.pos, change.toAdd);
    //   }
    // }
    // tree.commitUpdate(declarationRecorder);
    // }
    return rule(tree, context);
  };
}
