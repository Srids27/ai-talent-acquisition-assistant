import "./Input.css";

export default function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="input">
      <span className="input__label">{label}</span>
      <input
        className="input__field"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}
