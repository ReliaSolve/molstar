/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 */

//import { ParamDefinition as PD } from '../../../mol-util/param-definition';
//import { Structure, Unit } from '../../../mol-model/structure';
//import { CustomModelProperty } from '../../../mol-model-props/common/custom-model-property';
//import { Model, ElementIndex, ResidueIndex } from '../../../mol-model/structure/model';
//import { IntAdjacencyGraph } from '../../../mol-math/graph';
//import { CustomStructureProperty } from '../../../mol-model-props/common/custom-structure-property';
//import { InterUnitGraph } from '../../../mol-math/graph/inter-unit-graph';
//import { UnitIndex } from '../../../mol-model/structure/structure/element/element';
//import { IntMap, SortedArray } from '../../../mol-data/int';
//import { arrayMax } from '../../../mol-util/array';
//import { equalEps } from '../../../mol-math/linear-algebra/3d/common';
//import { Vec3 } from '../../../mol-math/linear-algebra';
//import { QuerySymbolRuntime } from '../../../mol-script/runtime/query/compiler';
//import { CustomPropSymbol } from '../../../mol-script/language/symbol';
//import { Type } from '../../../mol-script/language/type';
//import { Asset } from '../../../mol-util/assets';
//import { CustomPropertyDescriptor } from '../../../mol-model/custom-property';
//import { CustomProperty } from '../../mol-model-props/common/custom-property';
import { Task } from '../../mol-task';
import { PluginContext } from '../../mol-plugin/context';
import { parseKin } from '../../mol-io/reader/kin/parser';
import { KinemageData } from '../../mol-io/reader/kin/schema';

export { KinemageInfo };

interface KinemageInfo {
    /**
     * List of Kinemages read from one or more files.
     */
    kinemages: KinemageData[]

    /**
     * Index of the active KinemageData
     */
    activeKinemage: number
}

namespace KinemageInfo {

    async function loadKinemageData(data: string, plugin: PluginContext): Promise<KinemageData[]> {
      const task = parseKin(data);
      const result = await plugin.runTask(task);
      if (result.isError) {
        throw new Error('Failed to parse KIN data');
      }
      return result.result;
    }

    /// @todo Does this need to be a Promise<CustomProperty.Data<KinemageInfo>>?
    export async function open(file: File, plugin: PluginContext): Promise<KinemageInfo> {
      if (file === null) throw new Error('No file given');
      const task = Task.create('Load KIN file', async ctx => {
        const data = await file.text();
        const kinData = await loadKinemageData(data, plugin);
        return kinData;
      });
      const kinData = await plugin.runTask(task);
      const activeKinemage = kinData.length - 1;
      return { kinemages:kinData, activeKinemage };
    }

}
