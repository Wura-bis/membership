import { useEffect, useState } from "react";
import MainLayout from "../../components/mainlayout";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/notifications", {
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load notifications.");
        setLoading(false);
      });
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.NotificationID === id ? { ...n, IsRead: true } : n))
        );
      }
    } catch {
      alert("Failed to mark as read.");
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Notifications</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((n) => (
              <li
                key={n.NotificationID}
                className={`border rounded p-4 ${n.IsRead ? "bg-gray-100" : "bg-yellow-50"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{n.Message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.DateCreated).toLocaleString()}
                    </p>
                  </div>
                  {!n.IsRead && (
                    <button
                      onClick={() => markAsRead(n.NotificationID)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
