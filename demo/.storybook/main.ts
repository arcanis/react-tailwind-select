import {StorybookConfig} from '@storybook/react-vite';
import {join, dirname}   from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, `package.json`)));
}

console.log(dirname(getAbsolutePath(`sql.js`)));

const config: StorybookConfig = {
  stories: [
    `../stories/**/*.mdx`,
    `../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)`,
  ],
  staticDirs: [
    dirname(getAbsolutePath(`sql.js`)),
    `../public`,
  ],
  addons: [
    getAbsolutePath(`@storybook/addon-onboarding`),
    getAbsolutePath(`@storybook/addon-links`),
    getAbsolutePath(`@storybook/addon-essentials`),
    getAbsolutePath(`@chromatic-com/storybook`),
    getAbsolutePath(`@storybook/addon-interactions`),
  ],
  framework: {
    name: getAbsolutePath(`@storybook/react-vite`),
    options: {},
  },
};

// eslint-disable-next-line arca/no-default-export
export default config;
