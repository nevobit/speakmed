import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Table, ColumnDef } from '.'; // Asegúrate de exportar ColumnDef desde tu archivo Table

interface SampleData {
  id: number;
  name: string;
  age: number;
  city?: string;
}

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  argTypes: {
    pageSize: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof Table<SampleData>>;

// Datos de ejemplo
const sampleData: SampleData[] = [
  { id: 1, name: 'John Doe', age: 30, city: 'New York' },
  { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
  { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' },
  { id: 4, name: 'Alice Brown', age: 28, city: 'Houston' },
  { id: 5, name: 'Charlie Davis', age: 42, city: 'Phoenix' },
  { id: 6, name: 'Eva Wilson', age: 37, city: 'Philadelphia' },
  { id: 7, name: 'Frank Miller', age: 31, city: 'San Antonio' },
  { id: 8, name: 'Grace Lee', age: 29, city: 'San Diego' },
  { id: 9, name: 'Henry Taylor', age: 45, city: 'Dallas' },
  { id: 10, name: 'Ivy Martinez', age: 33, city: 'San Jose' },
];

// Definición de columnas
const columns: ColumnDef<SampleData>[] = [
  { header: 'ID', accessor: 'id', width: '10%', sortable: true },
  { header: 'Name', accessor: 'name', width: '30%', sortable: true },
  {
    header: 'Age',
    accessor: 'age',
    width: '20%',
    sortable: true,
    Cell: ({ value }) => (
      <div style={{ color: value > 35 ? 'red' : 'green' }}>{value}</div>
    ),
  },
  { header: 'City', accessor: 'city', width: '40%', sortable: true },
];

export const Default: Story = {
  args: {
    columns: columns,
    data: sampleData,
    pageSize: 5,
  },
  render: (args) => (
    <Table<SampleData> {...args}>
      <Table.Header />
      <Table.Body />
      <Table.Footer />
    </Table>
  ),
};

export const EmptyTable: Story = {
  args: {
    ...Default.args,
    data: [],
  },
  render: (args) => (
    <Table<SampleData> {...args}>
      <Table.Header />
      <Table.Body empty={<div>No data available</div>} />
      <Table.Footer />
    </Table>
  ),
};

export const CustomCellRendering: Story = {
  args: {
    ...Default.args,
    columns: [
      ...columns,
      {
        header: 'Actions',
        accessor: (row) => row.id,
        Cell: ({ value }) => (
          <button onClick={() => alert(`Action on ID: ${value}`)}>
            Click me
          </button>
        ),
      },
    ],
  },
  render: (args) => (
    <Table<SampleData> {...args}>
      <Table.Header />
      <Table.Body />
      <Table.Footer />
    </Table>
  ),
};

export const RowSelection: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => {
    const [selectedRows, setSelectedRows] = React.useState<SampleData[]>([]);
    return (
      <>
        <Table<SampleData> {...args} onRowSelect={setSelectedRows}>
          <Table.Header />
          <Table.Body />
          <Table.Footer />
        </Table>
        <div>Selected Rows: {selectedRows.length}</div>
      </>
    );
  },
};

export const LargeDataset: Story = {
  args: {
    columns: columns,
    data: Array(100)
      .fill(null)
      .map((_, index) => ({
        id: index + 1,
        name: `Person ${index + 1}`,
        age: Math.floor(Math.random() * 50) + 20,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][
          Math.floor(Math.random() * 5)
        ],
      })),
    pageSize: 10,
  },
  render: (args) => (
    <Table<SampleData> {...args}>
      <Table.Header />
      <Table.Body />
      <Table.Footer />
    </Table>
  ),
};
