export default {
  components: { source: '@/components/ui', preset: 'html' },
  defaults: { mode: 'submit', ui: 'html' },
  schemas: { userSchema: { name: 'UserForm' } },
  variants: {
    edit: { schemas: { userSchema: { name: 'UserEditForm' } } },
    create: { schemas: { userSchema: { name: 'UserCreateForm' } } }
  }
};
