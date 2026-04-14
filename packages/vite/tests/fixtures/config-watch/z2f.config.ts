// Auto-discovered z2f.config.ts for config-watch integration test.
// Declares a base config + two variants (edit + create) so the test can
// verify per-variant compilation + cache invalidation on config edits.
export default {
  componentName: 'UserForm',
  mode: 'submit',
  ui: 'html',
  variants: {
    edit: { componentName: 'UserEditForm' },
    create: { componentName: 'UserCreateForm' }
  }
};
