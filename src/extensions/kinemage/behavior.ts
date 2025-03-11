/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 * 
 * Based on ../mvs/behavior.ts
 */

import { CustomModelProperty } from '../../mol-model-props/common/custom-model-property';
import { CustomStructureProperty } from '../../mol-model-props/common/custom-structure-property';
import { DataFormatProvider } from '../../mol-plugin-state/formats/provider';
import { PluginDragAndDropHandler } from '../../mol-plugin-state/manager/drag-and-drop';
import { LociLabelProvider } from '../../mol-plugin-state/manager/loci-label';
import { PluginBehavior } from '../../mol-plugin/behavior/behavior';
import { PluginContext } from '../../mol-plugin/context';
import { StructureRepresentationProvider } from '../../mol-repr/structure/representation';
import { StateAction } from '../../mol-state';
import { Task } from '../../mol-task';
import { ColorTheme } from '../../mol-theme/color';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
//import { MVSAnnotationColorThemeProvider } from './components/annotation-color-theme';
//import { MVSAnnotationLabelRepresentationProvider } from './components/annotation-label/representation';
//import { MVSAnnotationsProvider } from './components/annotation-prop';
//import { MVSAnnotationTooltipsLabelProvider, MVSAnnotationTooltipsProvider } from './components/annotation-tooltips-prop';
//import { CustomLabelRepresentationProvider } from './components/custom-label/representation';
//import { CustomTooltipsLabelProvider, CustomTooltipsProvider } from './components/custom-tooltips-prop';
//import { LoadMvsData, MVSJFormatProvider, MVSXFormatProvider, loadMVSX } from './components/formats';
//import { IsMVSModelProvider } from './components/is-mvs-model-prop';
//import { makeMultilayerColorThemeProvider } from './components/multilayer-color-theme';
//import { parseKin } from '../../mol-io/reader/kin/parser';
//import { KinemageData } from '../../mol-io/reader/kin/schema';
import { KinemageInfo } from './prop';

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

/** Registers everything needed for loading MolViewSpec files */
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
          console.log('XXX the accumulated Kinemages size ', kinInfo.value.kinemages.length, ', active is ', kinInfo.value.activeKinemage);  /// @todo Remove when done debugging
          //await loadMVS(plugin, mvsData, { sanityChecks: true, replaceExisting: !applied, sourceUrl: undefined });
        });
        await plugin.runTask(task);
        applied = true;
      }
    }
    return applied;
  },
};
