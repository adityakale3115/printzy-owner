import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./context/AuthContext";

function Transactions() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!currentUser?.uid) return;
    try {
      const shopId = currentUser.uid; // ownerShops id = owner uid
      const txSnap = await getDocs(collection(db, "shops", shopId, "transactions"));
      const txList = txSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(txList);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUser]);

  // group transactions by date
  const totalsByDate = transactions.reduce((acc, tx) => {
    if (!tx.createdAt?.seconds) return acc;
    const date = new Date(tx.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    acc[date] = (acc[date] || 0) + (tx.amount || 0);
    return acc;
  }, {});

  return (
    <div className="transactions">
      <h2>💰 Income Report</h2>
      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="transactions-table" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Income (₹)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(totalsByDate).map(([date, total]) => (
              <tr key={date}>
                <td>{date}</td>
                <td>₹{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transactions;
