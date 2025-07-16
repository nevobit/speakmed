import { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '.';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Loaders/Spinner',
  component: Spinner,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};
