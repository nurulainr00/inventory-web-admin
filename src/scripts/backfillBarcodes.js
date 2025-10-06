import { db } from "../firebase/config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import JsBarcode from "jsbarcode";

export async function backfillBarcodes() {
  try {
    const snapshot = await getDocs(collection(db, "inventory"));

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // ✅ Create canvas for barcode
      const canvas = document.createElement("canvas");

      // ✅ Generate barcode with Firestore ID + Item name
      JsBarcode(canvas, docSnap.id, {
        format: "CODE128",
        displayValue: true, // show text below barcode
        text: `${docSnap.id} | ${data.item || "Unnamed Item"}`, // ID + name
        fontSize: 14,
        margin: 10,
      });

      // Convert to PNG
      const barcodeUrl = canvas.toDataURL("image/png");

      // ✅ Always update Firestore (overwrite existing barcodeUrl)
      await updateDoc(doc(db, "inventory", docSnap.id), { barcodeUrl });

      console.log(`✅ Barcode regenerated for ${data.item} (${docSnap.id})`);
    }
  } catch (err) {
    console.error("❌ Error in backfillBarcodes:", err);
  }
}
