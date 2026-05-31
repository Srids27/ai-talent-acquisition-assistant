import "./Btn.css";

export default function Btn({ children, onClick, disabled, style, variant = "primary", className = "" }) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
