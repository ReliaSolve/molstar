/*
import { StateTransformer } from '../../../mol-state';
import { StructureFromModel } from '../../../mol-plugin-state/transforms/model';

///
/// Minimal StateTransformer that creates an empty structure node (uses existing StructureFromModel).
/// Export a proper object so UpdateTarget.apply() can read .definition/.isDecorator at runtime.
///
/// This transform does not need registration in many Mol* setups — importing and passing the exported
/// object to UpdateTarget.apply(...) is sufficient. If your app requires explicit registration, register
/// this module during plugin initialization.

// Avoid strict branded-id typing by casting the whole object to the framework type.
// This prevents "string is not assignable to id" TypeScript error while keeping runtime shape intact.
export const KinemageDataCreateTransform: any = {
  id: 'kinemage.data.create',
  display: { name: 'Create Kinemage Data' },

  // action: { update, selector, ... } — use action.update.to(action.selector).apply(...) to create a child node
  apply: (action: any, params: { data?: any, label?: string }) => {
    // Reuse the registered StructureFromModel transform to create a real structure child node.
    const created = action.update.to(action.selector).apply(
      StructureFromModel as any,
      { type: { name: 'model', params: {} } }
    );
    // Return the created selector so UpdateTarget.apply(...) returns a child UpdateTarget.
    return created.selector;
  },

  // This transform creates a child node (not a pure decorator)
  isDecorator: false,
  // Optional in some flows
  isOptional: true
};
*/