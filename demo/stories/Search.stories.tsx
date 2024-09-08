import 'react-tailwind-select/styles/core.css';
import 'react-tailwind-select/styles/select.css';
import type {Meta, StoryObj} from '@storybook/react';
import {SearchBar}           from 'react-tailwind-select';
import {useState}            from 'react';

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
};

// eslint-disable-next-line arca/no-default-export
export default meta;

export const Simple: StoryObj = {
  args: {
    className: `classic`,
    placeholder: `Click to select a value...`,
  },
  render: props => {
    return <SearchBar/>;
  },
};
