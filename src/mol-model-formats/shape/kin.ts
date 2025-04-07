/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 */

import { RuntimeContext, Task } from '../../mol-task';
import { ShapeProvider } from '../../mol-model/shape/provider';
import { Color } from '../../mol-util/color';
import { Kinemage, VectorList } from '../../mol-io/reader/kin/schema';
import { Lines } from '../../mol-geo/geometry/lines/lines';
import { LinesBuilder } from '../../mol-geo/geometry/lines/lines-builder';
import { Mesh } from '../../mol-geo/geometry/mesh/mesh';
import { Shape } from '../../mol-model/shape';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
//import { ValueCell } from '../../mol-util/value-cell';
import { Mat4 } from '../../mol-math/linear-algebra/3d/mat4';

/// @todo Fill in geometry and coloring information

export type KinData = {
    source: Kinemage,
    transforms?: Mat4[],
}

function createKinLinesParams(kinemage?: Kinemage) {

    return {
        ...Lines.Params,
    };
}

export const KinLinesParams = createKinLinesParams();
export type KinLinesParams = typeof KinLinesParams

function createKinMeshParams(kinemage?: Kinemage) {

  return {
    ...Mesh.Params,
  };
}

export const KinMeshParams = createKinMeshParams();
export type KinMeshParams = typeof KinMeshParams

async function getLines(ctx: RuntimeContext, vectorLists: VectorList[]) {
  const builderState = LinesBuilder.create();

  for (let i = 0; i < vectorLists.length; i++) {
    const vertices = vectorLists[i];
    const position1Array = vertices.position1Array;
    const position2Array = vertices.position2Array;

    /// @todo Update in chunks of 100000 like the Ply files do rather than all at once like we do here.

    const group = i;  /// @todo Base this on something in the file instead?
    const numLines = position1Array.length / 3
    for (let i = 0; i < numLines; i++) {
      builderState.add(position1Array[3 * i + 0], position1Array[3 * i + 1], position1Array[3 * i + 2],
        position2Array[3 * i + 0], position2Array[3 * i + 1], position2Array[3 * i + 2],
        group);

      if (ctx.shouldUpdate && (i % 10000 == 0)) {
        await ctx.update({ message: 'adding kin line vertices', current: i, max: numLines });
      }
    }
  }

  return builderState.getLines();
}

function makeLinesGetter() {

    const getShape = async (ctx: RuntimeContext, kinData: KinData, props: PD.Values<KinLinesParams>, shape?: Shape<Lines>) => {
        console.log(`XXX Number of vector lists: ${kinData.source.vectorLists.length}`);

        // Get our lines, adding them from all of the entries in the vector lists
        const _lines = await getLines(ctx, kinData.source.vectorLists);

        let _shape: Shape<Lines>;
        _shape = Shape.create<Lines>(
          'kin-lines',
          kinData.source,
          _lines,
          () => Color(0x7F7F7F),  // @todo color function
          () => 1,                // size function
          () => ''                // @todo label function
        );
        return _shape;
    };
    return getShape;
}

function makeMeshGetter() {

  const getShape = async (ctx: RuntimeContext, kinData: KinData, props: PD.Values<KinMeshParams>, shape?: Shape<Mesh>) => {
    console.log(`XXX Number of ribbonLists: ${kinData.source.ribbonLists.length}`);

    // Create an empty Mesh
    const mesh = Mesh.createEmpty();
    /// @todo

    // Create an empty Shape with the empty Mesh
    const emptyShape = Shape.create(
      'Empty Shape', // id
      kinData,      // source data
      mesh,         // geometry
      () => Color(0xFFFFFF), // color function
      () => 1,      // size function
      () => ''      // label function
    );

    return emptyShape;
  };
  return getShape;
}

export function linesFromKin(source: Kinemage, params?: { transforms?: Mat4[] }) {
    return Task.create<ShapeProvider<KinData, Lines, KinLinesParams>>('Shape Provider', async ctx => {
        return {
            label: 'Lines',
            data: { source, transforms: params?.transforms },
            params: createKinLinesParams(source),
            getShape: makeLinesGetter(),
            geometryUtils: Lines.Utils
        };
    });
}
export function meshFromKin(source: Kinemage, params?: { transforms?: Mat4[] }) {
    return Task.create<ShapeProvider<KinData, Mesh, KinMeshParams>>('Shape Provider', async ctx => {
        return {
            label: 'Mesh',
            data: { source, transforms: params?.transforms },
            params: createKinMeshParams(source),
            getShape: makeMeshGetter(),
            geometryUtils: Mesh.Utils
        };
    });
}