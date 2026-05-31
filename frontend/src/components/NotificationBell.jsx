import { useState, useEffect, useRef } from "react";
import * as api from "../utils/api";
import "./NotificationBell.css";

export default function NotificationBell({ googleId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const refresh = () => {
    if (!googleId) return;
    api.getMyNotifications(googleId).then(setNotifications).catch(() => {});
  };

  useEffect(() => { refresh(); const iv = setInterval(refresh, 8000); return () => clearInterval(iv); }, [googleId]);

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async () => {
    await api.markNotificationsRead(googleId).catch(() => {});
    refresh();
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={bellRef} className="notif-bell">
      <button onClick={() => setOpen(!open)} className={`notif-bell__btn ${open ? "notif-bell__btn--active" : ""}`}>
        🔔
        {unread > 0 && <div className="notif-bell__badge">{unread}</div>}
      </button>
      {open && (
        <div className="notif-bell__dropdown">
          <div className="notif-bell__header">
            <div>
              <p className="notif-bell__title">Notifications</p>
              <p className="notif-bell__subtitle">{unread > 0 ? `${unread} unread` : "All caught up!"}</p>
            </div>
            {unread > 0 && (
              <button onClick={handleMarkRead} className="notif-bell__mark-btn">Mark all read</button>
            )}
          </div>
          <div className="notif-bell__list">
            {notifications.length === 0 ? (
              <div className="notif-bell__empty">
                <div className="notif-bell__empty-icon">🔕</div>
                <p className="notif-bell__empty-title">No notifications yet</p>
                <p className="notif-bell__empty-desc">You'll be notified when HR reviews your application</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`notif-bell__item ${!n.is_read ? "notif-bell__item--unread" : ""}`}>
                <div className={`notif-bell__item-icon ${n.type === "shortlisted" ? "notif-bell__item-icon--shortlisted" : "notif-bell__item-icon--default"}`}>
                  {n.type === "shortlisted" ? "🎉" : "📅"}
                </div>
                <div className="notif-bell__item-body">
                  <p className="notif-bell__item-title">{n.title}</p>
                  <p className="notif-bell__item-message">{n.message}</p>
                  <p className="notif-bell__item-time">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="notif-bell__dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
