import {Preview}                          from '@storybook/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

import './globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    Story => (
      <QueryClientProvider client={new QueryClient()}>
        <Story/>
      </QueryClientProvider>
    ),
  ],
};

// eslint-disable-next-line arca/no-default-export
export default preview;
