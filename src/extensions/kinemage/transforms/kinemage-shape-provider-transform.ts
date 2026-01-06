/**
 * Runtime state-transform that creates an SO.Shape.Provider from a runtime ShapeProvider.
 * Uses a registry to retrieve the runtime provider by string key (providerRef).
 */

import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { PluginStateObject as SO } from '../../../mol-plugin-state/objects';
import { ShapeProvider } from '../../../mol-model/shape/provider';
import { KinData, KinShapeParams } from '../../../mol-model-formats/shape/kin';
//import { Task } from '../../../mol-task';

// Registry for runtime providers keyed by shapeRef
export const RuntimeProviderRegistry: Record<string, ShapeProvider<KinData, any, KinShapeParams> | undefined> = Object.create(null);

// Export a transformer-shaped object the builder/runtime accepts.
export const RuntimeShapeProviderTransform: any = {
  id: 'kin.shape.from-runtime',
  display: { name: 'Kinemage (runtime shape provider)' },

  definition: {
    params: (a?: any) => ({
      // use a serializable string ref instead of the provider object
      providerRef: PD.Text('', { description: 'Runtime provider reference (module registry key)' }),
      label: PD.Optional(PD.Text('', { isHidden: true }))
    }),
    // must be an array of allowed parent types
    from: [SO.Root],
    to: SO.Shape.Provider,
    isDecorator: false,

    // create the state object from runtime params by looking up the provider in registry
    apply(args: { a?: any, params?: any } | { providerRef?: string, label?: string }) {
      // Handle both invocation shapes:
      // 1) builder/runtime may call with wrapper: { a, params, cache, ... } -> use args.params
      // 2) builder may call the transform directly with params object -> treat args as params
      const raw: any = args ?? {};
      const params = (raw && (raw.providerRef !== undefined || raw.label !== undefined))
        ? raw
        : (raw.params ?? {});

      const ref = params.providerRef;
      if (!ref) throw new Error('RuntimeShapeProviderTransform: missing providerRef parameter');
      const provider = RuntimeProviderRegistry[ref];
      if (!provider) throw new Error(`RuntimeShapeProviderTransform: no provider registered for ref '${ref}'`);
      const props = { label: params.label || provider.label || 'Kinemage Shape' };
      // return the Shape.Provider state object synchronously
      // The SO.Shape.Provider constructor is typed with no parameters in our local declaration,
      // but at runtime it accepts (provider, props). Cast the constructor to `any` so we can
      // pass runtime args while keeping TypeScript happy.
      return new (SO.Shape.Provider as any)(provider as any, props);
    },

    update: undefined,
    dispose: undefined
  },

  // top-level apply delegates to definition.apply
  // Accept either the single-wrapper object or positional args (a, params, cache, ...)
  apply(this: any, ...args: any[]) {
    if (args.length > 1) {
      const [a, params, cache, spine, dependencies] = args;
      return (RuntimeShapeProviderTransform.definition.apply as any).call(this, { a, params, cache, spine, dependencies });
    }
    return (RuntimeShapeProviderTransform.definition.apply as any).call(this, args[0]);
  },

  // top-level metadata mirror
  isDecorator: false,
  from: [SO.Root],
  to: SO.Shape.Provider
};
