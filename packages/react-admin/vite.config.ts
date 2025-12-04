import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  // const STAGE = process.env.STAGE;
  // const stage = STAGE && existsSync(`.env.${STAGE}`) ? STAGE : mode;
  // const env = loadEnv(stage, process.cwd());

  return {
    base: '/admin/panel',
    plugins: [react(), tsconfigPaths()],
  };
});
