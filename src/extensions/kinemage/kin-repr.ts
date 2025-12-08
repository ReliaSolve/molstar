/**
 * Representation provider for Kinemage (kin) Shape
 *
 * Creates a Representation provider that wraps the `shapeFromKin` ShapeProvider
 * implemented in `kin.ts`.
 */

import { ParamDefinition as PD } from '../../mol-util/param-definition';
import { Color } from '../../mol-util/color';
import { ShapeProvider } from '../../mol-model/shape/provider';
import { Shape } from '../../mol-model/shape';
import { Lines } from '../../mol-geo/geometry/lines/lines';
import { KinShapeParams, shapeFromKin } from '../../mol-model-formats/shape/kin';
import { RepresentationContext, RepresentationParamsGetter, Representation } from '../../mol-repr/representation';
import { StructureRepresentationProvider, StructureRepresentation } from '../../mol-repr/structure/representation';
// Use RepresentationProvider exported from '../../mol-repr/representation'
//import { RepresentationProvider } from '../../mol-repr/representation';
import { GraphicsRenderObject } from '../../mol-gl/render-object';
import { WebGLContext } from '../../mol-gl/webgl/context';
import { Task } from '../../mol-task';
import { Subject } from 'rxjs';
import { Theme } from '../../mol-theme/theme';
import { Structure } from '../../mol-model/structure';


// Provide minimal params wrapper so the representation system can ask for parameters
export function getKinShapeParams(): PD.Params {
    return PD.clone(KinShapeParams as any);
}

// Default appearance
const defaultColor = Color(0x7F7F7F);
const defaultSize = 1;

/*
 Note: We register this as a StructureRepresentationProvider so the structure registry accepts it.
 The factory's getParams type is relaxed to `any` and we cast the returned wrapper to
 `StructureRepresentation<PD.Params>` to satisfy the type system. This keeps your concrete
 wrapper implementation intact while letting the registry accept it.

 Long-term you may want to provide a true Structure-based visual or a dedicated Shape provider
 registration path; this is a pragmatic fix to make the current wrapper compile and register.
*/
export const KinRepresentationProvider = StructureRepresentationProvider({
    name: 'kin-lines',
    label: 'Kinemage (kin)',
    description: 'Render Kinemage vector lists as simple lines',
    // Relaxed getParams type to satisfy StructureRepresentationProvider signature
    factory: (ctx: RepresentationContext, getParams: RepresentationParamsGetter<any, PD.Params>) => {
        console.log('XXX KinRepresentationProvider.factory called');
        // innerRepresentation wraps the renderObject-based representation once the lines are generated
        let innerRepr: Representation.Any | undefined = undefined;
        let currentRenderObject: GraphicsRenderObject | undefined = undefined;
        // keep current theme in a mutable local (Representation.theme is readonly)
        let currentTheme: Theme = Theme.createEmpty();

        // Helper: convert Lines geometry to a GraphicsRenderObject.
        // Implement using your Lines visual/render utilities.
        function createLinesRenderObject(webgl: WebGLContext | undefined, lines: Lines, props: PD.Values<PD.Params>): GraphicsRenderObject {
            /// @todo Implement using your Lines visual utilities
            throw new Error('createLinesRenderObject() not implemented - implement using your Lines visual utilities');
        }

        // Representation that delegates to innerRepr if available
        const wrapper: Representation.Any = {
            label: 'Kinemage',
            updated: new Subject<number>(),
            groupCount: 0,
            renderObjects: [],
            geometryVersion: -1,
            props: {} as any,
            params: {} as any,
            // keep theme as a getter so we satisfy the readonly `theme` on Representation
            get theme() { return currentTheme; },
            state: Representation.createState ? Representation.createState() : (Representation as any).Empty.state,
            createOrUpdate: (props: any = {}, data?: ShapeProvider<any, Lines, any>) => {
                return Task.create(`Kinemage lines createOrUpdate`, async runtime => {
                    // Prefer using a ShapeProvider if the caller passed one
                    let provider: any = undefined;
                    if (data && (data as any).getShape) {
                        provider = data;
                    } else {
                        // Otherwise try to build a ShapeProvider from a raw source using shapeFromKin().
                        // The source might be passed directly or wrapped as data.source (ShapeProvider-like).
                        const source = (data && (data as any).data && (data as any).data.source) ? (data as any).data.source : data;
                        if (source) {
                            // shapeFromKin returns a Task<ShapeProvider>; run it to get the provider instance.
                            const task = shapeFromKin(source, props);
                            provider = task ? await task.runInContext(runtime) : undefined;
                        }
                    }

                    let linesShape: Shape<Lines> | undefined = undefined;
                    if (provider && provider.getShape) {
                        // provider.getShape is the function produced by makeShapeGetter() in kin.ts
                        linesShape = await provider.getShape(runtime, provider.data, props, undefined);
                    }

                     if (!linesShape) {
                         if (innerRepr) { innerRepr.destroy(); innerRepr = undefined; currentRenderObject = undefined; }
                         return;
                     }

                    const webgl = ctx.webgl as WebGLContext | undefined;
                    const ro = createLinesRenderObject(webgl, linesShape.geometry, props);

                    if (!currentRenderObject || currentRenderObject !== ro) {
                        if (innerRepr) innerRepr.destroy();
                        currentRenderObject = ro;
                        innerRepr = Representation.fromRenderObject('Kinemage-lines', ro);
                        if (innerRepr.setState) innerRepr.setState(wrapper.state as any);
                        if (innerRepr.setTheme) innerRepr.setTheme(currentTheme);
                    }

                    if (innerRepr) await innerRepr.createOrUpdate(props, currentRenderObject).runInContext(runtime);

                    wrapper.updated.next((Date.now() % 1000000));
                });
            },
            setState: (s: any) => { if (innerRepr) innerRepr.setState(s); Representation.updateState(wrapper.state as any, s); },
            setTheme: (t: Theme) => { currentTheme = t; if (innerRepr) innerRepr.setTheme(t); },
            getLoci: (pickingId: any) => innerRepr ? innerRepr.getLoci(pickingId) : Representation.Empty.getLoci(pickingId),
            getAllLoci: () => innerRepr ? innerRepr.getAllLoci() : [],
            eachLocation: (cb: any) => { if (innerRepr) innerRepr.eachLocation(cb); },
            mark: (loci: any, action: any) => innerRepr ? innerRepr.mark(loci, action) : false,
            destroy: () => { if (innerRepr) innerRepr.destroy(); innerRepr = undefined; if (currentRenderObject && (currentRenderObject as any).destroy) (currentRenderObject as any).destroy(); currentRenderObject = undefined; }
        };

        // Cast wrapper to StructureRepresentation to satisfy StructureRepresentationProvider signature.
        // The wrapper will be used as an adapter that renders Kinemage lines; keep the cast narrow and intentional.
        return wrapper as unknown as StructureRepresentation<PD.Params>;
    },
    getParams: (ctx) => getKinShapeParams(),
    defaultValues: PD.getDefaultValues(KinShapeParams as any),
    defaultColorTheme: { name: 'uniform', props: { value: defaultColor } },
    defaultSizeTheme: { name: 'uniform', props: { value: defaultSize } },
    isApplicable: (structure: Structure) => false,  ///< This is not a structure-based representation
});
