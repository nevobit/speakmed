import { Meta, StoryObj } from '@storybook/react';
import { Modal, useModal } from '.'; // Asegúrate de que la ruta sea correcta

const meta: Meta<typeof Modal.Window> = {
  title: 'Components/Modal',
  component: Modal.Window,
  decorators: [(Story) => <Modal>{Story()}</Modal>],
  argTypes: {
    children: <></>,
    isOpen: { control: 'boolean' },
    onClose: { action: 'closed' },
  },
};

export default meta;

type Story = StoryObj<typeof Modal.Window>;

export const Default: Story = {
  args: {
    isOpen: true,
    children: (
      <>
        <Modal.Header>Título del Modal</Modal.Header>
        <Modal.Body>
          <p>Este es el contenido del modal.</p>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => {}}>Cerrar</button>
        </Modal.Footer>
      </>
    ),
  },
};

export const LargeModal: Story = {
  args: {
    isOpen: true,
    children: (
      <>
        <Modal.Header>Modal Grande</Modal.Header>
        <Modal.Body>
          <p>
            Este es un modal con mucho contenido para mostrar cómo se ve un
            modal grande.
          </p>
          <p>
            Puedes añadir más contenido aquí para hacer el modal más grande.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button>Acción Primaria</button>
          <button>Acción Secundaria</button>
        </Modal.Footer>
      </>
    ),
  },
};

export const ConfirmationModal: Story = {
  args: {
    isOpen: true,
    children: (
      <>
        <Modal.Header>Confirmar Acción</Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que quieres realizar esta acción?</p>
        </Modal.Body>
        <Modal.Footer>
          <button>Cancelar</button>
          <button>Confirmar</button>
        </Modal.Footer>
      </>
    ),
  },
};

const NestedModalExample = () => {
  const { openModal, closeModal } = useModal();

  const openFirstModal = () => {
    openModal(
      <Modal.Window isOpen={true} onClose={closeModal}>
        <Modal.Header>Primer Modal</Modal.Header>
        <Modal.Body>
          <p>Este es el contenido del primer modal.</p>
          <button onClick={() => openSecondModal()}>Abrir Segundo Modal</button>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={closeModal}>Cerrar</button>
        </Modal.Footer>
      </Modal.Window>,
    );
  };

  const openSecondModal = () => {
    openModal(
      <Modal.Window isOpen={true} onClose={closeModal}>
        <Modal.Header>Segundo Modal</Modal.Header>
        <Modal.Body>
          <p>Este es el contenido del segundo modal.</p>
          <input type="text" placeholder="holita" />
        </Modal.Body>
        <Modal.Footer>
          <button onClick={closeModal}>Cerrar</button>
        </Modal.Footer>
      </Modal.Window>,
    );
  };

  return <button onClick={openFirstModal}>Abrir Primer Modal</button>;
};

export const NestedModals: Story = {
  render: () => <NestedModalExample />,
};
