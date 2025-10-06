import React, { useEffect, useState, useRef } from 'react';
import Barcode from "react-barcode";
import { FiDownload } from "react-icons/fi";
import { toPng } from "html-to-image";
import { db } from '../firebase/config';
import { backfillBarcodes } from "../scripts/backfillBarcodes";
import '../dashboard.css';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalQty, setTotalQty] = useState(0);
  const [totalThreshold, setTotalThreshold] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ item: '', qty: '', threshold: 0 });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [alerts, setAlerts] = useState([]);
  const alertedItemsRef = useRef(new Set()); // track items already emailed

  // Fetch inventory data
useEffect(() => {
  const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
    const items = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    setData(items);
    applyFilter(items, filterMonth, filterYear);
    setCurrentPage(1);
  });
  return () => unsub(); // cleanup
}, []);

  // Run barcode backfill ONCE when Dashboard mounts
  useEffect(() => {
    backfillBarcodes();
  }, []);

  // Real-time listener for low stock alerts
useEffect(() => {
  const unsub = onSnapshot(
    query(collection(db, "inventory"), where("lowStock", "==", true)),
    (snapshot) => {
      const lowStockItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlerts(lowStockItems);

      lowStockItems.forEach((item) => {
        if (!alertedItemsRef.current.has(item.id)) {
          sendLowStockEmail(item);
          alertedItemsRef.current.add(item.id);

          // ✅ Popup alert
          window.alert(`⚠ Low stock: ${item.item} (${item.qty} left)`);
        }
      });
    }
  );
  return () => unsub();
}, []);


  // Function to send low stock email
  const sendLowStockEmail = async (item) => {
    try {
      const response = await fetch("https://email-backend-1goy.onrender.com/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "nurulainr00@gmail.com",
          subject: `⚠️ Low Stock Alert: ${item.item}`,
          html: `
            <h2>Inventory Alert 🚨</h2>
            <p>The following item is low on stock:</p>
            <ul>
              <li><b>Item:</b> ${item.item}</li>
              <li><b>Current Quantity:</b> ${item.qty}</li>
              <li><b>Threshold:</b> ${item.threshold}</li>
            </ul>
            <p>Please reorder soon to avoid shortages.</p>
          `,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Email sent for ${item.item}`);
      } else {
        console.error(`❌ Failed to send email for ${item.item}:`, result.error);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
    }
  };

  const applyFilter = (items, month, year) => {
    const filtered = items.filter(entry => {
      const date = entry.date.toDate();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear().toString();
      const matchMonth = !month || m === month;
      const matchYear = !year || y === year;
      return matchMonth && matchYear;
    });

    let qtySum = 0;
    let stockOutSum = 0;

    filtered.forEach(d => {
      const qty = d.qty || 0;
      const threshold = d.threshold || 0;
      qtySum += qty;

      if (qty < threshold) {
        stockOutSum += (threshold - qty);
      }
    });

    setFilteredData(filtered);
    setTotalQty(qtySum);
    setTotalThreshold(stockOutSum);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "inventory", id));
  };

  const handleEditClick = (entry) => {
    setEditId(entry.id);
    setEditData({
      item: entry.item,
      qty: entry.qty,
      threshold: 0
    });
  };

  const handleUpdate = async () => {
    const oldQty = Number(editData.qty);
    const thresholdVal = Number(editData.threshold) || 0;

    const finalQty = oldQty - thresholdVal < 0 ? 0 : oldQty - thresholdVal;

    await updateDoc(doc(db, "inventory", editId), {
      item: editData.item,
      qty: finalQty,
      threshold: thresholdVal,
      lowStock: finalQty <= thresholdVal
    });

    setEditId(null);
  };

  const handleFilterChange = (month, year) => {
    setFilterMonth(month);
    setFilterYear(year);
    applyFilter(data, month, year);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const changePage = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
  };

   // Download barcode function
  const downloadBarcode = (itemId, itemName) => {
    const node = document.getElementById(`barcode-${itemId}`);
    if (!node) return;

    toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `${itemName}-barcode.png`;
      link.href = dataUrl;
      link.click();
    });
  };


  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* Low Stock Alerts Panel */}
      {alerts.length > 0 && (
        <div className="alert-panel">
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              ⚠ Low stock: {alert.item} ({alert.qty} left)
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <label>
          Month:
          <select
            value={filterMonth}
            onChange={e => handleFilterChange(e.target.value, filterYear)}
          >
            <option value="">All</option>
            {[
              'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
            ].map((monthName, index) => (
              <option key={index} value={(index + 1).toString().padStart(2, '0')}>
                {monthName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <input
            type="text"
            placeholder="e.g. 2025"
            value={filterYear}
            onChange={e => handleFilterChange(filterMonth, e.target.value)}
          />
        </label>
      </div>

      {/* Totals */}
      <div className="totals">
        <div className="total-box total-in">
          <p>Total Quantity</p>
          <p className="total-number">{totalQty}</p>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Total Quantity</th>
              <th>Stock Out</th>
              <th>Date </th>
              <th>Actions</th>
              <th>Item Barcode</th>
            </tr>
          </thead>
          <tbody>
  {paginatedData.map(entry => (
    <tr key={entry.id} className={editId === entry.id ? 'editing-row' : ''}>
      {editId === entry.id ? (
        <>
          <td>
            <input
              value={editData.item}
              onChange={e => setEditData({ ...editData, item: e.target.value })}
            />
          </td>
          <td>
            <input
              type="number"
              value={editData.qty}
              onChange={e => setEditData({ ...editData, qty: e.target.value })}
            />
          </td>
          <td>
            <input
              type="number"
              value={editData.threshold}
              onChange={e => setEditData({ ...editData, threshold: e.target.value })}
            />
          </td>
          <td>{entry.date.toDate().toLocaleDateString()}</td>
          <td>
            <button className="btn save" onClick={handleUpdate}>Save</button>
            <button className="btn cancel" onClick={() => setEditId(null)}>Cancel</button>
          </td>
          <td>
            {/* Barcode preview in edit mode */}
            <div id={`barcode-${entry.id}`}>
              <Barcode
                value={entry.id}
                displayValue={true}
                format="CODE128"
                fontSize={14}
                height={80}
                width={2}
              />
            </div>
          </td>
        </>
      ) : (
        <>
          <td>{entry.item}</td>
          <td>{entry.qty}</td>
          <td>{entry.threshold || 0}</td>
          <td>{entry.date.toDate().toLocaleDateString()}</td>
          <td>
            <button className="btn edit" onClick={() => handleEditClick(entry)}>Edit</button>
            <button className="btn delete" onClick={() => handleDelete(entry.id)}>Delete</button>
          </td>
          <td>
            <div id={`barcode-${entry.id}`}>
              <Barcode
              value={`${entry.id}`}  
              text={`${entry.item}`}  
              displayValue={true}
              format="CODE128"
              fontSize={10}
              height={50}
              width={1.5}
              />

            </div>
            <button
    className="btn download"
    onClick={() => downloadBarcode(entry.id, entry.item)}
    title="Download Barcode"
    style={{ background: "none", border: "none", cursor: "pointer" }}
  >
    <FiDownload size={20} color="#333" />
  </button>
          </td>
        </>
      )}
    </tr>
  ))}
</tbody>

        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn cancel"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ marginRight: '10px' }}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                className="btn"
                onClick={() => changePage(pageNum)}
                style={{
                  marginRight: '8px',
                  backgroundColor: currentPage === pageNum ? '#4299e1' : '#a0aec0',
                  color: currentPage === pageNum ? 'white' : '#2d3748',
                  fontWeight: currentPage === pageNum ? '700' : '600',
                  cursor: 'pointer',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="btn cancel"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ marginLeft: '10px' }}
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
