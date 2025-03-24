/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 */

//import { Structure, Unit } from '../../../mol-model/structure';
//import { CustomModelProperty } from '../../../mol-model-props/common/custom-model-property';
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
//import { Model } from '../../mol-model/structure/model';
//import { CustomProperty } from '../../mol-model-props/common/custom-property';
//import { CustomPropertyDescriptor } from '../../mol-model/custom-property';
//import { CustomModelProperty } from '../../mol-model-props/common/custom-model-property';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
import { Task } from '../../mol-task';
//import { PluginContext } from '../../mol-plugin/context';
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

const FileSourceParams = {
  input: PD.File({ accept: '.kin', multiple: false })
};
type FileSourceProps = PD.Values<typeof FileSourceParams>

export const KinemageInfoParams = {
  source: PD.Group(FileSourceParams, { label: 'File', isFlat: true })
};
export type KinemageInfoParams = typeof KinemageInfoParams
export type KinemageInfoProps = PD.Values<KinemageInfoParams>

/** Provider for custom model property "KinemageInfo" */
/*
export const KinemageInfoProvider: CustomModelProperty.Provider<KinemageInfoParams, KinemageInfo> = CustomModelProperty.createProvider({
  label: 'Kinemage data',
  descriptor: CustomPropertyDescriptor({
    name: 'kin-data',
  }),
  type: 'static',
  defaultParams: KinemageInfoParams,
  getParams: (data: Model) => KinemageInfoParams,
  isApplicable: (data: Model) => true,
  obtain: async (ctx: CustomProperty.Context, data: Model, props: Partial<KinemageInfoProps>) => {
    if (!props.source) throw new Error('KinemageInfo: Missing source');
    return await KinemageInfo.open(props.source);
  }
});
*/

namespace KinemageInfo {

    export enum Tag {
      Cluster = 'kinemage-cluster',
      Representation = 'kinemage-3d'
    }

    async function loadKinemageData(data: string): Promise<KinemageData[]> {
      const task = parseKin(data);
      const result = await task.run();
      if (result.isError) {
        throw new Error('Failed to parse KIN data');
      }
      return result.result;
    }

    export async function open(file: FileSourceProps | File): Promise<KinemageInfo> {

      let fileToRead: File;

      if (file instanceof File) {
        fileToRead = file;
      } else if (file && file.input && file.input.file) {
        fileToRead = file.input.file;
      } else {
        throw new Error('No file given');
      }

      const task = Task.create('Load KIN file', async ctx => {
        const data = await fileToRead.text();
        const kinData = await loadKinemageData(data);
        return kinData;
      });

      const kinData = await task.run();
      const activeKinemage = kinData.length - 1;
      return { kinemages: kinData, activeKinemage };
    }

}
