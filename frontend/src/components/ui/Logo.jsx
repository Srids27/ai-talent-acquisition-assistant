import "./Logo.css";

export default function Logo({ size = "md" }) {
  return (
    <div className="logo">
      <div className={`logo__icon logo__icon--${size}`}>A</div>
      <span className={`logo__text logo__text--${size}`}>ARIA</span>
    </div>
  );
}
