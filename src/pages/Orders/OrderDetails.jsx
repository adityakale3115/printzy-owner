import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../context/AuthContext";
import "./Orders.css";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        // Get owner's shopId dynamically
        const shopDocs = await getDocs(collection(db, "ownerShops"));
        const shopDoc = shopDocs.docs.find(doc => doc.id === currentUser.uid);
        if (!shopDoc) throw new Error("Shop not found");
        const shopId = shopDoc.id;
        setShopId(shopId);

        // Fetch order
        const orderRef = doc(db, "shops", shopId, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder(orderSnap.data());
        } else {
          throw new Error("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) fetchOrder();
  }, [currentUser, orderId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!shopId || !order) return;

    try {
      await updateDoc(doc(db, "shops", shopId, "orders", orderId), { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "20px" }}>Loading order details...</p>;
  if (error) return <p style={{ textAlign: "center", marginTop: "20px", color: "red" }}>{error}</p>;

  return (
    <div className="order-details">
      <h2>Order Details</h2>
      <p><strong>User ID:</strong> {order.userId || "N/A"}</p>
      <p>
        <strong>File:</strong>{" "}
        {order.fileURL ? (
          <a href={order.fileURL} target="_blank" rel="noreferrer">
            {order.fileName || "Download"}
          </a>
        ) : "N/A"}
      </p>
      <p>
        <strong>Options:</strong>{" "}
        {order.options
          ? `${order.options.color || "N/A"}, ${order.options.copies || 1} copies, ${order.options.sides || "Single"}`
          : "N/A"}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <select value={order.status || "Pending"} onChange={handleStatusChange}>
          <option value="Pending">Pending</option>
          <option value="Printing">Printing</option>
          <option value="Completed">Completed</option>
        </select>
      </p>
      <button onClick={() => navigate("/orders")}>Back to Orders</button>
    </div>
  );
}

export default OrderDetails;
