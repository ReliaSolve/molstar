/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author ReliaSolve <russ@reliasolve.com>
 * 
 * Based on ui.tsx from ../assembly-symmetry.ts
 */

import { CollapsableState, CollapsableControls } from '../../mol-plugin-ui/base';
import { ApplyActionControl } from '../../mol-plugin-ui/state/apply-action';
import { ParameterControls } from '../../mol-plugin-ui/controls/parameters';
import { ParamDefinition as PD } from '../../mol-util/param-definition';
import { ExtensionSvg, CheckSvg } from '../../mol-plugin-ui/controls/icons';
import { StateAction, StateSelection } from '../../mol-state';
import { KinemageInfo } from './prop';

interface KinemageControlState extends CollapsableState {
    isBusy: boolean
}

export class KinemageControls extends CollapsableControls<{}, KinemageControlState> {
    protected defaultState(): KinemageControlState {
        return {
            header: 'Kinemage',
            isCollapsed: false,
            isBusy: false,
            isHidden: false,
            brand: { accent: 'cyan', svg: ExtensionSvg }
        };
    }

    get pivot() {
        return this.plugin.managers.structure.hierarchy.selection.structures[0];
    }

    canEnable() {
      return true;
    }

    renderEnable() {
        const pivot = this.pivot;
        if (!pivot.cell.parent) return null;
        return <ApplyActionControl state={pivot.cell.parent} action={EnableKinemage3D} initiallyCollapsed={true} nodeRef={pivot.cell.transform.ref} simpleApply={{ header: 'Enable', icon: CheckSvg }} />;
    }

    renderNoKinemages() {
        return <div className='msp-row-text'>
            <div>No Kinemages loaded</div>
        </div>;
    }

  get params() {
        const structure = this.pivot.cell.obj?.data;
        const params = PD.clone(structure ? KinemageProvider.getParams(structure) : KinemageProvider.defaultParams);
        params.serverType.isHidden = true;
        params.serverUrl.isHidden = true;
        return params;
    }

    get values() {
      /*
        const structure = this.pivot.cell.obj?.data;
        if (structure) {
            return KinemageProvider.props(structure);
        } else {
            return { ...PD.getDefaultValues(KinemageProvider.defaultParams), symmetryIndex: -1 };
        }
        */
       return undefined;
    }

    /*
    async updateKinemage(values: KinemageProps) {
        const s = this.pivot;
        const currValues = KinemageProvider.props(s.cell.obj!.data);
        if (PD.areEqual(KinemageProvider.defaultParams, currValues, values)) return;

        if (s.properties) {
            const b = this.plugin.state.data.build();
            b.to(s.properties.cell).update(old => {
                old.properties[KinemageProvider.descriptor.name] = values;
            });
            await b.commit();
        } else {
            const pd = this.plugin.customStructureProperties.getParams(s.cell.obj?.data);
            const params = PD.getDefaultValues(pd);
            params.properties[KinemageProvider.descriptor.name] = values;
            await this.plugin.builders.structure.insertStructureProperties(s.cell, params);
        }

        for (const components of this.plugin.managers.structure.hierarchy.currentComponentGroups) {
            if (values.symmetryIndex === -1) {
                const name = components[0]?.representations[0]?.cell.transform.params?.colorTheme.name;
                if (name === KinemageData.Tag.Cluster) {
                    await this.plugin.managers.structure.component.updateRepresentationsTheme(components, { color: 'default' });
                }
            } else {
                tryCreateKinemage(this.plugin, s.cell);
                if (getKinemageConfig(this.plugin).ApplyColors) {
                    await this.plugin.managers.structure.component.updateRepresentationsTheme(components, { color: KinemageData.Tag.Cluster as any });
                }
            }
        }
    }
    */

    /*
    paramsOnChange = (options: KinemageProps) => {
        this.updateKinemage(options);
    };
    */

    get hasKinemage3D() {
        return !this.pivot.cell.parent || !!StateSelection.findTagInSubtree(this.pivot.cell.parent.tree, this.pivot.cell.transform.ref, KinemageInfo.Tag.Representation);
    }

    get enable() {
      /*
        return !this.hasKinemage3D && this.values.symmetryIndex !== -1;
        */
      return false;
    }

    get noKinemages() {
      /*
        const structure = this.pivot.cell.obj?.data;
        const data = structure && KinemageDataProvider.get(structure).value;
        return data && data.filter(sym => sym.symbol !== 'C1').length === 0;
        */
       return true;
    }

    renderParams() {
        return <>
            <ParameterControls params={this.params} values={this.values} onChangeValues={this.paramsOnChange} />
        </>;
    }

    renderControls() {
        if (!this.pivot) return null;
        if (this.noKinemages) return this.renderNoKinemages();
        if (this.enable) return this.renderEnable();
        return this.renderParams();
    }

}

const EnableKinemage3D = StateAction.build(
  {
    from: PluginStateObject.Molecule.Structure,
})(({ a, ref, state }, plugin: PluginContext) => Task.create('Enable Assembly Symmetry', async ctx => {
    const presetParams = KinemagePreset.params?.(a, plugin) as PD.Params | undefined;
    const presetProps = presetParams ? PD.getDefaultValues(presetParams) : Object.create(null);
    await KinemagePreset.apply(ref, presetProps, plugin);
})
);