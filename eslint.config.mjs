import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

// eslint-config-next 16 ships a flat config, so the FlatCompat bridge that used
// to wrap `next/core-web-vitals` is gone (it crashed the legacy validator).
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'supabase/.temp/**']),
  {
    rules: {
      // eslint-plugin-react-hooks 7 promoted this to an error. The remaining
      // offenders are pre-existing hydration/animation patterns
      // (ThemeProvider, Header, TypewriterEffect and the admin page's mount and
      // debounce effects) that need a real refactor rather than a silent
      // suppression, so they stay visible as warnings until then.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

export default eslintConfig;
