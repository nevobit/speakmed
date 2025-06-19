import { Button, Modal, useModal } from '@repo/design-system/web';

function App() {
  const { openModal, closeModal } = useModal();
  const openFirstModal = () => {
    openModal(
      <>
        <Modal.Window isOpen={true} onClose={closeModal}>
          <Modal.Header>Primer Modal</Modal.Header>
          <Modal.Body>
            <p>Este es el contenido del primer modal.</p>
            <button>Abrir Segundo Modal</button>
          </Modal.Body>
          <Modal.Footer>
            <button onClick={closeModal}>Cerrar</button>
          </Modal.Footer>
        </Modal.Window>
      </>,
    );
  };
  return (
    <>
      <h1>Hola</h1>
      <span>{}</span>
      <Button onClick={openFirstModal}>Hola</Button>
    </>
  );
}

export default App;
