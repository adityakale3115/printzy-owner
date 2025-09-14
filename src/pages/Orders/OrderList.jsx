import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./Orders.css";

function OrderList() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [printingOrder, setPrintingOrder] = useState(null);

  // 🔹 Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("🔎 Fetching orders for user:", currentUser?.uid);

        // Get owner's shop
        const shopDocs = await getDocs(collection(db, "ownerShops"));
        const shopDoc = shopDocs.docs.find((doc) => doc.id === currentUser.uid);

        if (!shopDoc) {
          console.warn("⚠️ No shop found for owner:", currentUser.uid);
          setOrders([]);
          setLoading(false);
          return;
        }

        const shopId = shopDoc.id;

        // Fetch orders (no timestamp)
        const ordersSnap = await getDocs(collection(db, "shops", shopId, "orders"));
        const orderList = ordersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📦 Orders fetched:", orderList);
        setOrders(orderList);
      } catch (err) {
        console.error("❌ Error fetching orders:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) fetchOrders();
  }, [currentUser]);

  // 🔹 Fetch printers from backend
  const fetchPrinters = async () => {
    try {
      const res = await fetch("http://localhost:5000/printers");
      const data = await res.json();
      setPrinters(data);
    } catch (err) {
      console.error("Error fetching printers:", err);
      alert("Failed to load printers.");
    }
  };

  // 🔹 Handle Print button click
  const handlePrintClick = async (order) => {
    setPrintingOrder(order);
    setSelectedPrinter("");
    await fetchPrinters();
  };

// 🔹 Confirm print
const handleConfirmPrint = async () => {
  if (!selectedPrinter || !printingOrder) return;
  try {
    // 1. Send print job to backend
    await fetch("http://localhost:5000/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        printerId: selectedPrinter,
       order: printingOrder,
       order: {
         ...printingOrder,
         duplex: printingOrder.options?.sides === "Double", // 👈 pass duplex info
       },
      }),
    });


      // 2. Delete order from Firestore
      const shopDocs = await getDocs(collection(db, "ownerShops"));
      const shopDoc = shopDocs.docs.find((doc) => doc.id === currentUser.uid);

      if (shopDoc) {
        const shopId = shopDoc.id;
        const orderRef = doc(db, "shops", shopId, "orders", printingOrder.id);
        await deleteDoc(orderRef);
        console.log("✅ Deleted order:", printingOrder.id);
      }

      // 3. Delete file from Firebase Storage
      if (printingOrder.filePath) {
        const storage = getStorage();
        const fileRef = ref(storage, printingOrder.filePath);
        await deleteObject(fileRef);
        console.log("✅ Deleted file:", printingOrder.filePath);
      }

      alert("✅ Print job completed!");
      setPrintingOrder(null);

      // Refresh orders
      const shopDocsAfter = await getDocs(collection(db, "ownerShops"));
      const shopDocAfter = shopDocsAfter.docs.find((doc) => doc.id === currentUser.uid);
      if (shopDocAfter) {
        const shopId = shopDocAfter.id;
        const ordersSnap = await getDocs(collection(db, "shops", shopId, "orders"));
        setOrders(ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    } catch (err) {
      console.error("Error completing print job:", err);
      alert("❌ Failed to complete print job.");
    }
  };

  // 🔹 UI Rendering
  if (loading) return <p className="status">Loading orders...</p>;
  if (error) return <p className="status error">{error}</p>;
  if (orders.length === 0) return <p className="status">No orders yet.</p>;

  return (
    <div className="order-list">
      <h2>Incoming Orders</h2>
      <table className="order-table">
        <thead>
          <tr>
            <th>User</th>
            <th>File</th>
            <th>Options</th>
            <th>Status</th>
            <th>Details</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.email || "N/A"}</td>
              <td>
                <a href={order.fileURL} target="_blank" rel="noreferrer">
                  {order.fileName || "N/A"}
                </a>
              </td>
              <td>
                {order.options
                  ? `${order.options.color || "B/W"}, ${order.options.copies || 1
                    } copies, ${order.options.sides || "Single"}`
                  : "N/A"}
              </td>
              <td>
                <span className={`status-badge ${order.status || "pending"}`}>
                  {order.status || "Pending"}
                </span>
              </td>
              <td>
                <Link to={`/orders/${order.id}`} className="link">View</Link>
              </td>
              <td>
                <button
                  className="btn primary"
                  onClick={() => handlePrintClick(order)}
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔹 Printer Selection Modal */}
      {printingOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Select Printer</h3>
            {printers.length === 0 ? (
              <p>Loading printers...</p>
            ) : (
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
              >
                <option value="">-- Select Printer --</option>
                {printers.map((p) => (
                  <option key={p.deviceId} value={p.deviceId}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <div className="modal-actions">
              <button
                className="btn success"
                disabled={!selectedPrinter}
                onClick={handleConfirmPrint}
              >
                Confirm Print
              </button>
              <button className="btn danger" onClick={() => setPrintingOrder(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderList;
