import { Meta, StoryObj } from '@storybook/react';
import { Button } from '.';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    size: {
      options: ['micro', 'slim', 'medium', 'large'],
      control: { type: 'select' },
    },
    textAlign: {
      options: ['left', 'right', 'center', 'start', 'end'],
      control: { type: 'select' },
    },
    fullWidth: {
      control: { type: 'boolean' },
    },
    disclosure: {
      options: ['down', 'up', 'select', true, false],
      control: { type: 'select' },
    },
    tone: {
      options: ['critical', 'success'],
      control: { type: 'select' },
    },
    variant: {
      options: ['plain', 'primary', 'secondary', 'tertiary', 'monochromePlain'],
      control: { type: 'select' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Confirmar",
    size: 'medium',
    variant: 'primary',
    textAlign: "left"
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
};

export const WithIcon: Story = {
  args: {
    ...Default.args,
    icon: <span>🔍</span>, // Ejemplo simple de icono
  },
};

export const FullWidth: Story = {
  args: {
    ...Default.args,
    fullWidth: true,
  },
};

export const Critical: Story = {
  args: {
    ...Default.args,
    tone: 'critical',
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    tone: 'success',
  },
};
