import React, { useState, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { toPng } from "html-to-image";
import Barcode from "react-barcode";
import '../stockform.css';

const StockForm = () => {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('IN');
  const [category, setCategory] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // hidden barcode ref
  const barcodeRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1️⃣ Add stock to Firestore
      const docRef = await addDoc(collection(db, 'inventory'), {
        item,
        qty: Number(qty),
        type,
        category,
        remarks,
        date: Timestamp.now()
      });

      // 2️⃣ Wait until hidden barcode is rendered, then convert to PNG
      setTimeout(async () => {
        if (barcodeRef.current) {
          try {
            const dataUrl = await toPng(barcodeRef.current);

            // 3️⃣ Upload barcode image to Firebase Storage
            const storage = getStorage();
            const storageRef = ref(storage, `barcodes/${docRef.id}.png`);
            await uploadString(storageRef, dataUrl, "data_url");

            // 4️⃣ Save barcodeUrl in Firestore
            const url = await getDownloadURL(storageRef);
            await updateDoc(doc(db, "inventory", docRef.id), { barcodeUrl: url });

            console.log("✅ Barcode saved:", url);
          } catch (err) {
            console.error("❌ Error generating barcode:", err);
          }
        }
      }, 500);

      // Reset form
      setMessage('✅ Stock added successfully with barcode!');
      setItem('');
      setQty('');
      setCategory('');
      setRemarks('');
    } catch (error) {
      console.error("❌ Error adding document: ", error);
      setMessage('❌ Failed to add stock.');
    }

    setLoading(false);
  };

  return (
    <div className="stockform-container">
      <h2>Add Inventory</h2>
      <form onSubmit={handleSubmit} className="stockform-form">
        <input
          type="text"
          placeholder="Item name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          required
          className="input-field"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
          className="input-field"
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="input-field"
        />

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : 'Add Stock'}
          </button>
          <button
            type="button"
            onClick={() => {
              setItem('');
              setQty('');
              setCategory('');
              setRemarks('');
              setMessage('');
            }}
            className="clear-btn"
          >
            Clear Form
          </button>
        </div>

        {message && (
          <p className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </form>

      {/* 🔹 Hidden barcode renderer (not visible to user) */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={barcodeRef}>
          <Barcode value={item || "temp"} text={item || "item"} />
        </div>
      </div>
    </div>
  );
};

export default StockForm;
