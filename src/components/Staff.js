import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const AdminApproveStaffWeb = () => {
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      const querySnapshot = await getDocs(collection(db, "staff"));
      setStaffList(
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    };

    fetchStaff();
  }, []);

  const updateStaffStatus = async (docId, status) => {
    try {
      const docRef = doc(db, "staff", docId);
      await updateDoc(docRef, { active: status === "approved" });

      setStaffList(prev =>
        prev.map(staff =>
          staff.id === docId
            ? { ...staff, status: status }
            : staff
        )
      );
    } catch (err) {
      console.error("Error updating staff status:", err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { color: "white", backgroundColor: "green", padding: "0.2rem 0.5rem", borderRadius: "5px" };
      case "rejected":
        return { color: "white", backgroundColor: "red", padding: "0.2rem 0.5rem", borderRadius: "5px" };
      default:
        return { color: "black", backgroundColor: "#f0ad4e", padding: "0.2rem 0.5rem", borderRadius: "5px" };
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Staff Approval</h1>

      {staffList.length === 0 ? (
        <p>No staff records found</p>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#4390e3ff", color: "white", textAlign: "center" }}>
              <th style={{ padding: "0.75rem" }}>Name</th>
              <th style={{ padding: "0.75rem" }}>Email</th>
              <th style={{ padding: "0.75rem" }}>Role</th>
              <th style={{ padding: "0.75rem" }}>Created At</th>
              <th style={{ padding: "0.75rem" }}>Status</th>
              <th style={{ padding: "0.75rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, index) => (
              <tr
                key={staff.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                  transition: "background-color 0.2s",
                  cursor: "default"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e8f0fe"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white"}
              >
                <td style={{ padding: "0.75rem" , textAlign: "center"}}>{staff.name}</td>
                <td style={{ padding: "0.75rem" , textAlign: "center"}}>{staff.email}</td>
                <td style={{ padding: "0.75rem", textTransform: "capitalize" , textAlign: "center"}}>{staff.role}</td>
                <td style={{ padding: "0.75rem" , textAlign: "center"}}>
                  {staff.createdAt?.toDate
                    ? staff.createdAt.toDate().toLocaleString()
                    : staff.createdAt
                  }
                </td>
                <td style={{ padding: "0.75rem", textAlign: "center" }}>
                  <span
    style={{
      display: "inline-block",
      width: "16px",
      height: "16px",
      borderRadius: "50%", // makes it a circle
      backgroundColor:
        staff.status === "approved" || staff.active
          ? "green"
          : staff.status === "rejected"
          ? "red"
          : "#f0ad4e", // pending
    }}
  ></span>
                </td>
                <td style={{ padding: "0.75rem" , textAlign: "center"}}>
                  <button
                    onClick={() => updateStaffStatus(staff.id, "approved")}
                    disabled={staff.status === "approved" || staff.status === "rejected" || staff.active}
                    style={{
                      marginRight: "0.5rem",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStaffStatus(staff.id, "rejected")}
                    disabled={staff.status === "approved" || staff.status === "rejected" || staff.active}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminApproveStaffWeb;
