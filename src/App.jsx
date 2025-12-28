import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, User, IndianRupee, X, Check, Undo2 } from "lucide-react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deletedEntry, setDeletedEntry] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef(null);

  // Fetch entries from Supabase when component mounts
  useEffect(() => {
    fetchEntries();
  }, []);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Convert amount from string to number for display
      const formattedData = data.map((entry) => ({
        ...entry,
        amount: parseFloat(entry.amount),
      }));

      setEntries(formattedData);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Failed to load entries. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from("entries")
        .insert([
          {
            name,
            amount: parseFloat(amount),
            status: activeTab,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add the new entry to the list
      const newEntry = {
        ...data,
        amount: parseFloat(data.amount),
      };
      setEntries([newEntry, ...entries]);
      setName("");
      setAmount("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding entry:", err);
      setError("Failed to save entry. Please try again.");
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from("entries")
        .update({ status: "paid" })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update the entry in the local state
      setEntries(
        entries.map((entry) =>
          entry.id === id ? { ...entry, status: "paid" } : entry
        )
      );
    } catch (err) {
      console.error("Error updating entry:", err);
      setError("Failed to update entry. Please try again.");
    }
  };

  const handleDelete = (id) => {
    // Find the entry to delete
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      setEntryToDelete(entry);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from("entries")
        .delete()
        .eq("id", entryToDelete.id);

      if (deleteError) throw deleteError;

      // Store deleted entry for undo
      setDeletedEntry(entryToDelete);

      // Remove the entry from the local state
      setEntries(entries.filter((entry) => entry.id !== entryToDelete.id));

      // Close confirmation modal
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);

      // Show undo button for 5 seconds
      setShowUndo(true);

      // Clear any existing timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Hide undo button after 5 seconds
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndo(false);
        setDeletedEntry(null);
      }, 5000);
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Failed to delete entry. Please try again.");
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleUndo = async () => {
    if (!deletedEntry) return;

    try {
      setError(null);
      // Re-insert the deleted entry
      const { data, error: insertError } = await supabase
        .from("entries")
        .insert([
          {
            name: deletedEntry.name,
            amount: deletedEntry.amount,
            status: deletedEntry.status,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add the entry back to the list
      const restoredEntry = {
        ...data,
        amount: parseFloat(data.amount),
      };
      setEntries([restoredEntry, ...entries]);

      // Hide undo button and clear timeout
      setShowUndo(false);
      setDeletedEntry(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    } catch (err) {
      console.error("Error undoing delete:", err);
      setError("Failed to restore entry. Please try again.");
    }
  };

  const filteredEntries = entries.filter((entry) => entry.status === activeTab);

  const totalAmount = filteredEntries.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-orange-100 relative">
      <div className="max-w-md mx-auto px-4 py-8 pb-24">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Oraadz Payment Tracker
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center mb-8">
          <div className="bg-orange-50/50 p-1 rounded-full inline-flex border border-orange-100 shadow-sm w-full max-w-xs justify-between">
            {["pending", "paid", "debit"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 py-2 rounded-full text-xs font-bold transition-all duration-300 ease-out capitalize
                  ${
                    activeTab === tab
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                      : "text-slate-500 hover:text-orange-400 bg-transparent"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Undo Button */}
        {showUndo && deletedEntry && (
          <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
            <span className="text-orange-700 text-sm font-medium">
              Entry deleted: {deletedEntry.name} - ₹
              {deletedEntry.amount.toFixed(2)}
            </span>
            <button
              onClick={handleUndo}
              className="ml-3 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </button>
          </div>
        )}

        {/* Table/List Area with Visible Borders */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 bg-orange-50 border-b-2 border-slate-200 text-xs font-bold text-orange-900 uppercase tracking-wider">
            <div className="col-span-6">
              {activeTab === "debit" ? "Debtor" : "Customer"}
            </div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-3"></div>
          </div>

          {/* Table Body */}
          <div className="divide-y-2 divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Loading entries...
              </div>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 gap-2 p-4 items-center bg-white hover:bg-orange-50/20 transition-colors border-b border-slate-100 last:border-0"
                >
                  <div className="col-span-6 font-medium text-slate-800 text-sm truncate border-r border-slate-100 pr-2">
                    {entry.name}
                  </div>
                  <div className="col-span-3 text-right font-bold text-slate-900 text-sm">
                    ₹{entry.amount.toFixed(2)}
                  </div>
                  <div className="col-span-3 flex justify-end gap-2">
                    {entry.status === "pending" && (
                      <button
                        onClick={() => handleMarkAsPaid(entry.id)}
                        className="p-1 bg-slate-50 border-2 border-slate-200 text-slate-400 rounded-md hover:bg-slate-500 hover:text-white hover:border-slate-500 transition-all shadow-sm"
                        title="Mark as Paid"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {entry.status === "paid" && (
                      <button
                        className="p-1 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-md shadow-sm cursor-default"
                        title="Paid"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No {activeTab} records found.
              </div>
            )}
          </div>

          {/* Table Footer / Summary */}
          {filteredEntries.length > 0 && (
            <div className="bg-slate-900 text-white p-4 grid grid-cols-12 gap-2 items-center border-t-2 border-slate-200">
              <div className="col-span-6 text-xs font-medium text-slate-300">
                Total
              </div>
              <div className="col-span-6 text-right font-bold text-base text-orange-400">
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all duration-300 z-10"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Add Entry Modal Popup */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Add to{" "}
                  <span className="capitalize text-orange-500">
                    {activeTab}
                  </span>
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                {/* Name Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-orange-300" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeTab === "debit" ? "Debtor Name" : "Customer Name"
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all placeholder:text-slate-400 text-base font-medium"
                  />
                </div>

                {/* Amount Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-orange-300" />
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-orange-500 rounded-xl outline-none transition-all placeholder:text-slate-400 text-base font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!name || !amount}
                  className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white py-3.5 rounded-xl font-bold transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                >
                  <Plus className="h-5 w-5" />
                  <span>Save Entry</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && entryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Delete Entry?
                </h2>
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setEntryToDelete(null);
                  }}
                  className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-slate-600 text-sm mb-2">
                  Are you sure you want to delete this entry?
                </p>
                <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-100">
                  <div className="font-medium text-slate-900 mb-1">
                    {entryToDelete.name}
                  </div>
                  <div className="text-orange-600 font-bold">
                    ₹{entryToDelete.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setEntryToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
