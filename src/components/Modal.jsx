export default function Modal({ title, subtitle = null, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
        {children}
      </div>
    </div>
  );
}
