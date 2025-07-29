// src/pages/members/expired.jsx
import { useEffect, useState } from "react";

export default function ExpiredMembers() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/members/expired", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMembers(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Expired Members</h1>
      <div className="bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Surname</th>
              <th className="p-3">First Name</th>
              <th className="p-3">Membership End</th>
              <th className="p-3">County</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{m.lastName}</td>
                <td className="p-3">{m.firstName}</td>
                <td className="p-3">{m.membershipEndDate}</td>
                <td className="p-3">{m.county}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
