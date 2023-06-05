/**
 * Copyright (c) 2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Mat4 } from '../../../../mol-math/linear-algebra/3d/mat4';
import { Structure } from '../../../../mol-model/structure';
import { PluginStateObject as SO, PluginStateTransform } from '../../../../mol-plugin-state/objects';
import { Task } from '../../../../mol-task';
import { StateObject } from '../../../../mol-state';
import { ParamDefinition as PD } from '../../../../mol-util/param-definition';
import { SymmetryOperator } from '../../../../mol-math/geometry';
import { Column } from '../../../../mol-data/db';

export { StructureFromGeneric };
type StructureFromGeneric = typeof StructureFromGeneric
const StructureFromGeneric = PluginStateTransform.BuiltIn({
    name: 'structure-from-generic',
    display: { name: 'Structure from Generic', description: 'Create a molecular structure from Generic models.' },
    from: SO.Molecule.Model,
    to: SO.Molecule.Structure,
    params: {
        transforms: PD.Value<Mat4[]>([]),
        label: PD.Optional(PD.Text('')),
    }
})({
    apply({ a, params }) {
        return Task.create('Build Structure', async ctx => {
            if (params.transforms.length === 0) return StateObject.Null;

            const model = a.data;
            const label = params.label || model.label;

            // hack to use model name as entity description
            (model as any).label = label;
            model.entities.data = {
                ...model.entities.data,
                pdbx_description: Column.asArrayColumn(model.entities.data.pdbx_description),
            };
            const entityIds = model.atomicHierarchy.chains.label_entity_id.toArray();
            for (let i = 0, il = entityIds.length; i < il; ++i) {
                const idx = model.entities.getEntityIndex(entityIds[i]);
                (model.entities.data.pdbx_description.__array as any)[idx] = [label];
            }

            const base = Structure.ofModel(a.data);
            const assembler = Structure.Builder({ label });
            for (let i = 0, il = params.transforms.length; i < il; ++i) {
                const t = params.transforms[i];
                const op = SymmetryOperator.create(`op-${i}`, t);
                for (const u of base.units) {
                    assembler.addWithOperator(u, op);
                }
            }
            const s = assembler.getStructure();

            const props = { label, description: Structure.elementDescription(s) };
            return new SO.Molecule.Structure(s, props);
        });
    },
    dispose({ b }) {
        b?.data.customPropertyDescriptors.dispose();
    }
});
