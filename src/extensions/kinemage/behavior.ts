/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 * 
 * Based on ../mvs/behavior.ts
 */

//import { KinemageData } from '../../mol-io/reader/kin/schema';
import { CustomModelProperty } from '../../mol-model-props/common/custom-model-property';
import { CustomStructureProperty } from '../../mol-model-props/common/custom-structure-property';
import { DataFormatProvider } from '../../mol-plugin-state/formats/provider';
import { PluginDragAndDropHandler } from '../../mol-plugin-state/manager/drag-and-drop';
import { LociLabelProvider } from '../../mol-plugin-state/manager/loci-label';
import { PluginBehavior } from '../../mol-plugin/behavior/behavior';
import { PluginContext } from '../../mol-plugin/context';
//import { Structure } from '../../mol-model/structure';
import { StructureRepresentationProvider } from '../../mol-repr/structure/representation';
import { StateAction } from '../../mol-state';
import { Task } from '../../mol-task';
import { ColorTheme } from '../../mol-theme/color';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
import { KinRepresentationProvider } from './kin-repr';
import { KinemageInfo } from './prop';
import { shapeFromKin, KinData, KinShapeParams, createKinShapeParams } from '../../mol-model-formats/shape/kin';
import { UpdateTarget } from '../mvs/load-generic';
import { StructureRepresentation3D } from '../../mol-plugin-state/transforms/representation';
import { ShapeProvider } from '../../mol-model/shape/provider';
import { Lines } from '../../mol-geo/geometry/lines/lines';
import { StructureFromModel } from '../../mol-plugin-state/transforms/model'; // add near other imports
//import { StateTransformer } from '../../mol-state';

/** Global KinemageInfo that is used to display */
let g_kinemageInfo: KinemageInfo = {kinemages: [], activeKinemage: -1};

/** Collection of things that can be registered/unregistered in a plugin */
interface Registerables {
  customModelProperties?: CustomModelProperty.Provider<any, any>[],
  customStructureProperties?: CustomStructureProperty.Provider<any, any>[],
  representations?: StructureRepresentationProvider<any>[],
  colorThemes?: ColorTheme.Provider[],
  lociLabels?: LociLabelProvider[],
  dragAndDropHandlers?: DragAndDropHandler[],
  dataFormats?: { name: string, provider: DataFormatProvider }[],
  actions?: StateAction[],
}

/** Registers everything needed for loading Kinemage files */
export const Kinemage = PluginBehavior.create<{ autoAttach: boolean }>({
  name: 'kinemage',
  category: 'misc',
  display: {
    name: 'Kinemage',
    description: 'Kinemage extension',
  },
  ctor: class extends PluginBehavior.Handler<{ autoAttach: boolean }> {
    private readonly registerables: Registerables = {
      customModelProperties: [
        //IsMVSModelProvider,
        //MVSAnnotationsProvider,
      ],
      customStructureProperties: [
        //CustomTooltipsProvider,
        //MVSAnnotationTooltipsProvider,
      ],
      representations: [
        KinRepresentationProvider,
        //CustomLabelRepresentationProvider,
        //MVSAnnotationLabelRepresentationProvider,
      ],
      colorThemes: [
        //MVSAnnotationColorThemeProvider,
        //makeMultilayerColorThemeProvider(this.ctx.representation.structure.themes.colorThemeRegistry),
      ],
      lociLabels: [
        //CustomTooltipsLabelProvider,
        //MVSAnnotationTooltipsLabelProvider,
      ],
      dragAndDropHandlers: [
        KINDragAndDropHandler,
      ],
      dataFormats: [
      //  { name: 'MVSJ', provider: MVSJFormatProvider },
      //  { name: 'MVSX', provider: MVSXFormatProvider },
      ],
      actions: [
      //  LoadMvsData,
      ]
    };

    // Keep track of all of the KinemageData objects that have been loaded
    //private kinemageInfo: KinemageInfo;

    register(): void {
      for (const prop of this.registerables.customModelProperties ?? []) {
        this.ctx.customModelProperties.register(prop, this.params.autoAttach);
      }
      for (const prop of this.registerables.customStructureProperties ?? []) {
        this.ctx.customStructureProperties.register(prop, this.params.autoAttach);
      }
      for (const repr of this.registerables.representations ?? []) {
        this.ctx.representation.structure.registry.add(repr);
      }
      for (const theme of this.registerables.colorThemes ?? []) {
        this.ctx.representation.structure.themes.colorThemeRegistry.add(theme);
      }
      for (const provider of this.registerables.lociLabels ?? []) {
        this.ctx.managers.lociLabels.addProvider(provider);
      }
      for (const handler of this.registerables.dragAndDropHandlers ?? []) {
        this.ctx.managers.dragAndDrop.addHandler(handler.name, handler.handle);
      }
      for (const format of this.registerables.dataFormats ?? []) {
        this.ctx.dataFormats.add(format.name, format.provider);
      }
      for (const action of this.registerables.actions ?? []) {
        this.ctx.state.data.actions.add(action);
      }
    }
    update(p: { autoAttach: boolean }) {
      const updated = this.params.autoAttach !== p.autoAttach;
      this.params.autoAttach = p.autoAttach;
      for (const prop of this.registerables.customModelProperties ?? []) {
        this.ctx.customModelProperties.setDefaultAutoAttach(prop.descriptor.name, this.params.autoAttach);
      }
      for (const prop of this.registerables.customStructureProperties ?? []) {
        this.ctx.customStructureProperties.setDefaultAutoAttach(prop.descriptor.name, this.params.autoAttach);
      }
      return updated;
    }
    unregister() {
      for (const prop of this.registerables.customModelProperties ?? []) {
        this.ctx.customModelProperties.unregister(prop.descriptor.name);
      }
      for (const prop of this.registerables.customStructureProperties ?? []) {
        this.ctx.customStructureProperties.unregister(prop.descriptor.name);
      }
      for (const repr of this.registerables.representations ?? []) {
        this.ctx.representation.structure.registry.remove(repr);
      }
      for (const theme of this.registerables.colorThemes ?? []) {
        this.ctx.representation.structure.themes.colorThemeRegistry.remove(theme);
      }
      for (const labelProvider of this.registerables.lociLabels ?? []) {
        this.ctx.managers.lociLabels.removeProvider(labelProvider);
      }
      for (const handler of this.registerables.dragAndDropHandlers ?? []) {
        this.ctx.managers.dragAndDrop.removeHandler(handler.name);
      }
      for (const format of this.registerables.dataFormats ?? []) {
        this.ctx.dataFormats.remove(format.name);
      }
      for (const action of this.registerables.actions ?? []) {
        this.ctx.state.data.actions.remove(action);
      }
    }
  },
  params: () => ({
    autoAttach: PD.Boolean(false),
  })
});

/** Registerable method for handling dragged-and-dropped files */
interface DragAndDropHandler {
  name: string,
  handle: PluginDragAndDropHandler,
}

/** Reproducing what loadMVS() did in the MVS function to try and get geometry drawn.
async function loadMVSClone(plugin: PluginContext, data: KinemageData) {
  // This calls loadMolstartTree() after converting input data to a different format, parameter 'tree'\
  // This calls loadTree(), passing it MolstartLoadingActions function as a parameter; loadTree() is from load-generic.ts
  // This calls loadTreeInUpdate() passing the function as loadingActions, then calls UpdateTarget.commit(updateRoot)
  // This calls loadingAction, passing it updateParent, node, context and then sets various maps to the returned node
  // @todo It is not clear how this path ends up calling the primitives() method in MolstarLoadingActions
  // ... and that is responsible for filling in the UpdateTarget-typed updateParent parameter.

  // applyPrimitiveVisuals() updates its input UpdateTarget "data" parameter with the new ShapeRepresentation3D elements
  // UpdateTarget is an interface defined in load-generic.ts that takes a PluginContext in its constructor and does the work
  //    Its apply() method is what does the actual work of applying the changes to the plugin state using StateBuilder.Root
  //    Its setMvsDependencies() method is as follows:
  //      setMvsDependencies(target: UpdateTarget, refs: string[] | Set<string>): UpdateTarget {
  //        refs.forEach(ref => target.mvsDependencyRefs.add(ref));
  //        return target;
  //      }
  //    Here is what it sets:
  //      readonly mvsDependencyRefs: Set<string>
}
*/

/** Minimal holder transform descriptor — must include `isDecorator`. */
/*
const KinemageDataCreateTransform = {
  id: 'kinemage.data.create',
  display: { name: 'Create Kinemage Data' },

  // 'action' provides the state builder (action.update / action.selector)
  apply: (action: any, params: { data?: any, label?: string }) => {
    // Reuse existing transformer to create a real child structure node.
    const created = action.update.to(action.selector).apply(
      StructureFromModel as any,
      { type: { name: 'model', params: {} } }
    );
    return created.selector;
  },

  // this transform decorates existing state rather than replacing it
  isDecorator: true,
  // @todo Check if this should be true or false
  isOptional: true
} as unknown as StateTransformer;
*/

// Provide minimal params getter for Kinemage shapes.
// Return params based on the currently active kinemage when available,
// otherwise fall back to the generic KinShapeParams.
// We don't call the async `shapeFromKin` here because getParams must be synchronous.
function getKinShapeParams(): PD.Params {
  const active = g_kinemageInfo.activeKinemage;
  if (active !== -1) {
    const kin = g_kinemageInfo.kinemages[active];
    if (kin) return PD.clone(createKinShapeParams(kin) as any);
  }
  return PD.clone(KinShapeParams as any);
}

/** DragAndDropHandler handler for `.kin` files */
const KINDragAndDropHandler: DragAndDropHandler = {
  name: 'kin',
  /** Load .kin files. Append to previous plugin state.
   * If multiple files are provided, append them all.
   * Select the last-loaded one from the list.
   * Return `true` if at least one file has been loaded. */
  async handle(files: File[], plugin: PluginContext): Promise<boolean> {
    let applied = false;
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.kin')) {
        const task = Task.create('Load KIN file', async ctx => {
          console.log('XXX loading KIN file ', file.name);  /// @todo Remove when done debugging
          const kinInfo = await KinemageInfo.open(file);
          for (const kinData of kinInfo.kinemages) {
            g_kinemageInfo.kinemages.push(kinData);
            g_kinemageInfo.activeKinemage = g_kinemageInfo.kinemages.length - 1;
          }
          console.log('XXX accumulated Kinemages size ', g_kinemageInfo.kinemages.length, ', active is ', g_kinemageInfo.activeKinemage);
          /// @todo See what loadMVS() ... LoadMolstarTree() ... MolstarLoadingActions().primitives() ... applyPrimitiveVisuals() does

          // Build a ShapeProvider from the KinemageData
          // The ShapeProvider can then be used in a Representation to display the geometry
          // Alternatively, we may need to build a custom Representation that knows how to get the Shape from the KinemageData
          // This is similar to how the KinRepresentationProvider works.
          const spTask = shapeFromKin(g_kinemageInfo.kinemages[g_kinemageInfo.activeKinemage], {});
          const shapeProvider = await spTask.runInContext(ctx) as ShapeProvider<KinData, Lines, KinShapeParams>;

          console.log('XXX UpdateTarget.create()');
          // Build an update target and apply the representation transform
          const updateRoot = UpdateTarget.create(plugin, /* ReplaceExisting @todo consider using true here */ false);

          console.log('XXX structureTarget = UpdateTarget.apply()');
          // create an empty structure node (uses existing registered transform)
          const structureTarget = UpdateTarget.apply(
            updateRoot,
            StructureFromModel as any,
            { type: { name: 'model', params: {} } }
          );

          console.log('XXX UpdateTarget.apply()');
          // attach the Kinemage representation to the created structure node
          UpdateTarget.apply(structureTarget, StructureRepresentation3D as any, {
            type: KinRepresentationProvider,
            params: PD.getDefaultValues(getKinShapeParams() as any),
            data: shapeProvider
          });

          console.log('XXX UpdateTarget.commit()');
          // single commit for the whole update
          await UpdateTarget.commit(updateRoot);
        });
        await plugin.runTask(task);
        applied = true;
      }
    }
    return applied;
  },
};
