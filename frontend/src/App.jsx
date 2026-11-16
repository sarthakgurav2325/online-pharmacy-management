
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Pill,
  Tags,
  Package,
  AlertTriangle,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  X,
  Menu,
  TrendingUp,
  IndianRupee,
  CalendarDays,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:8080/api";
const LOW_STOCK_LIMIT = 10;

const emptyForm = {
  name: "",
  description: "",
  manufacturer: "",
  price: "",
  stock: "",
  expiryDate: "",
  prescriptionRequired: false,
  categoryId: "",
};

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.value)) return data.value;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [medicineResponse, categoryResponse] = await Promise.all([
        axios.get(`${API}/medicines`),
        axios.get(`${API}/categories`),
      ]);

      setMedicines(getArray(medicineResponse.data));
      setCategories(getArray(categoryResponse.data));
    } catch (err) {
      console.error("Unable to load pharmacy data:", err);
      setError(
        "Could not connect to the backend. Make sure Spring Boot is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  const fetchData = async () => {
    await loadData();
  };

  fetchData();
}, [loadData]);

  const totalMedicines = medicines.length;
  const totalCategories = categories.length;

  const lowStockMedicines = medicines.filter(
    (medicine) => Number(medicine.stock) <= LOW_STOCK_LIMIT
  );

  const inventoryValue = medicines.reduce(
    (total, medicine) =>
      total +
      Number(medicine.price || 0) * Number(medicine.stock || 0),
    0
  );

  const filteredMedicines = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return medicines;

    return medicines.filter((medicine) => {
      const categoryName =
        medicine.category?.categoryName ||
        medicine.category?.name ||
        "";

      return [
        medicine.name,
        medicine.manufacturer,
        medicine.description,
        categoryName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [medicines, search]);

  const navigate = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setSearch("");
    setError("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ? String(categories[0].id) : "",
    });
    setShowForm(true);
  };

  const editMedicine = (medicine) => {
    setEditingId(medicine.id);
    setForm({
      name: medicine.name || "",
      description: medicine.description || "",
      manufacturer: medicine.manufacturer || "",
      price: medicine.price ?? "",
      stock: medicine.stock ?? "",
      expiryDate: medicine.expiryDate || "",
      prescriptionRequired: Boolean(medicine.prescriptionRequired),
      categoryId: medicine.category?.id
        ? String(medicine.category.id)
        : "",
    });
    setShowForm(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveMedicine = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!form.categoryId) {
      setError("Please select a medicine category.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      manufacturer: form.manufacturer.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      expiryDate: form.expiryDate,
      prescriptionRequired: form.prescriptionRequired,
      categoryId: Number(form.categoryId),
    };

    try {
      if (editingId !== null) {
        await axios.put(`${API}/medicines/${editingId}`, payload);
      } else {
        await axios.post(`${API}/medicines`, payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      console.error("Unable to save medicine:", err);
      setError(
        err.response?.data?.message ||
          "Unable to save medicine. Please check your backend API and form details."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicine = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await axios.delete(`${API}/medicines/${id}`);
      await loadData();
    } catch (err) {
      console.error("Unable to delete medicine:", err);
      setError("Unable to delete this medicine. Please try again.");
    }
  };

  const pageTitles = {
    dashboard: "Dashboard",
    medicines: "Medicines",
    categories: "Categories",
    inventory: "Inventory",
  };

  const getCategoryName = (medicine) =>
    medicine.category?.categoryName ||
    medicine.category?.name ||
    "Uncategorized";

  const renderMedicineTable = (items) => (
    <div className="table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Category</th>
            <th>Manufacturer</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((medicine) => {
            const isLowStock =
              Number(medicine.stock) <= LOW_STOCK_LIMIT;

            return (
              <tr key={medicine.id}>
                <td>
                  <div className="medicine-name-cell">
                    <div className="medicine-avatar">
                      <Pill size={18} />
                    </div>
                    <div>
                      <strong>{medicine.name}</strong>
                      <small>ID: {medicine.id}</small>
                    </div>
                  </div>
                </td>

                <td>{getCategoryName(medicine)}</td>
                <td>{medicine.manufacturer || "—"}</td>
                <td>₹{Number(medicine.price || 0).toFixed(2)}</td>
                <td>
                  <strong>{medicine.stock}</strong>
                </td>
                <td>{medicine.expiryDate || "—"}</td>

                <td>
                  <span
                    className={`status-badge ${
                      isLowStock ? "status-low" : "status-available"
                    }`}
                  >
                    {isLowStock ? "Low Stock" : "Available"}
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="icon-button edit-button"
                      title="Edit medicine"
                      onClick={() => editMedicine(medicine)}
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-button delete-button"
                      title="Delete medicine"
                      onClick={() => deleteMedicine(medicine.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan="8" className="empty-state">
                No medicines found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="app-layout">
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Pill size={25} />
          </div>
          <div>
            <h2>PharmaCare</h2>
            <span>Management System</span>
          </div>
          <button
            type="button"
            className="close-sidebar"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MAIN MENU</p>

          <button
            type="button"
            className={`nav-link ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-link ${
              activePage === "medicines" ? "active" : ""
            }`}
            onClick={() => navigate("medicines")}
          >
            <Pill size={19} />
            <span>Medicines</span>
          </button>

          <button
            type="button"
            className={`nav-link ${
              activePage === "categories" ? "active" : ""
            }`}
            onClick={() => navigate("categories")}
          >
            <Tags size={19} />
            <span>Categories</span>
          </button>

          <button
            type="button"
            className={`nav-link ${
              activePage === "inventory" ? "active" : ""
            }`}
            onClick={() => navigate("inventory")}
          >
            <Package size={19} />
            <span>Inventory</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">
            <CheckCircle size={20} />
          </div>
          <div>
            <strong>System Status</strong>
            <span>Pharmacy dashboard</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-button"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="breadcrumb">PharmaCare / {pageTitles[activePage]}</p>
              <h1>{pageTitles[activePage]}</h1>
            </div>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </header>

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={28} />
            <p>Loading pharmacy data...</p>
          </div>
        ) : (
          <>
            {activePage === "dashboard" && (
              <>
                <section className="welcome-banner">
                  <div className="welcome-content">
                    <span className="welcome-tag">PHARMACY OVERVIEW</span>
                    <h2>Welcome to PharmaCare</h2>
                    <p>
                      Manage your medicines, categories and stock from one
                      simple dashboard.
                    </p>
                    <button
                      type="button"
                      className="welcome-button"
                      onClick={() => navigate("medicines")}
                    >
                      View Medicines <TrendingUp size={16} />
                    </button>
                  </div>
                  <div className="welcome-decoration">
                    <Pill size={100} strokeWidth={1.1} />
                  </div>
                </section>

                <section className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon green-icon">
                        <Pill size={22} />
                      </div>
                      <span className="stat-caption">All records</span>
                    </div>
                    <p>Total Medicines</p>
                    <h3>{totalMedicines}</h3>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon purple-icon">
                        <Tags size={22} />
                      </div>
                      <span className="stat-caption">Organized groups</span>
                    </div>
                    <p>Total Categories</p>
                    <h3>{totalCategories}</h3>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon orange-icon">
                        <AlertTriangle size={22} />
                      </div>
                      <span className="stat-caption">Needs attention</span>
                    </div>
                    <p>Low Stock Items</p>
                    <h3>{lowStockMedicines.length}</h3>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon blue-icon">
                        <IndianRupee size={22} />
                      </div>
                      <span className="stat-caption">Stock value</span>
                    </div>
                    <p>Inventory Value</p>
                    <h3>₹{inventoryValue.toLocaleString("en-IN")}</h3>
                  </div>
                </section>

                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <h2>Recent Medicines</h2>
                      <p>Your current medicine records</p>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => navigate("medicines")}
                    >
                      View all
                    </button>
                  </div>

                  {renderMedicineTable(medicines.slice(0, 5))}
                </section>
              </>
            )}

            {activePage === "medicines" && (
              <section className="content-card">
                <div className="section-heading page-section-heading">
                  <div>
                    <h2>Medicine Management</h2>
                    <p>Add, update, search and delete medicines</p>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={openAddForm}
                  >
                    <Plus size={18} /> Add Medicine
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search medicine, manufacturer or category..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <span className="result-count">
                    {filteredMedicines.length} medicines
                  </span>
                </div>

                {renderMedicineTable(filteredMedicines)}
              </section>
            )}

            {activePage === "categories" && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Medicine Categories</h2>
                    <p>All categories available in your pharmacy</p>
                  </div>
                  <span className="category-count">
                    {categories.length} Categories
                  </span>
                </div>

                <div className="category-grid">
                  {categories.map((category) => {
                    const medicineCount = medicines.filter(
                      (medicine) =>
                        Number(medicine.category?.id) === Number(category.id)
                    ).length;

                    return (
                      <div className="category-card" key={category.id}>
                        <div className="category-card-top">
                          <div className="stat-icon green-icon">
                            <Tags size={22} />
                          </div>
                          <span className="category-id">
                            ID: {category.id}
                          </span>
                        </div>
                        <h3>{category.categoryName || category.name}</h3>
                        <p>
                          {medicineCount}{" "}
                          {medicineCount === 1 ? "medicine" : "medicines"}
                        </p>
                      </div>
                    );
                  })}

                  {categories.length === 0 && (
                    <div className="empty-state">
                      No categories available.
                    </div>
                  )}
                </div>
              </section>
            )}

            {activePage === "inventory" && (
              <>
                <section className="stats-grid inventory-stats">
                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon green-icon">
                        <Package size={22} />
                      </div>
                    </div>
                    <p>Total Stock Units</p>
                    <h3>
                      {medicines.reduce(
                        (sum, medicine) => sum + Number(medicine.stock || 0),
                        0
                      )}
                    </h3>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon orange-icon">
                        <AlertTriangle size={22} />
                      </div>
                    </div>
                    <p>Low Stock Medicines</p>
                    <h3>{lowStockMedicines.length}</h3>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <div className="stat-icon blue-icon">
                        <ClipboardList size={22} />
                      </div>
                    </div>
                    <p>Inventory Records</p>
                    <h3>{totalMedicines}</h3>
                  </div>
                </section>

                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <h2>Stock Inventory</h2>
                      <p>Monitor available stock and low-stock medicines</p>
                    </div>
                  </div>

                  <div className="inventory-alert">
                    <AlertTriangle size={19} />
                    <span>
                      Low stock means {LOW_STOCK_LIMIT} or fewer units.
                    </span>
                  </div>

                  {renderMedicineTable(medicines)}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="medicine-modal">
            <div className="modal-heading">
              <div>
                <h2>{editingId ? "Edit Medicine" : "Add New Medicine"}</h2>
                <p>Enter the medicine information below</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveMedicine}>
              <div className="form-grid">
                <label>
                  Medicine Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Paracetamol 500mg"
                    required
                  />
                </label>

                <label>
                  Manufacturer *
                  <input
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleFormChange}
                    placeholder="Manufacturer name"
                    required
                  />
                </label>

                <label>
                  Category *
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryName || category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price (₹) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="Enter price"
                    required
                  />
                </label>

                <label>
                  Stock Quantity *
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleFormChange}
                    placeholder="Enter stock"
                    required
                  />
                </label>

                <label>
                  Expiry Date *
                  <input
                    name="expiryDate"
                    type="date"
                    value={form.expiryDate}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Enter medicine description"
                  />
                </label>

                <label className="checkbox-label full-width">
                  <input
                    type="checkbox"
                    name="prescriptionRequired"
                    checked={form.prescriptionRequired}
                    onChange={handleFormChange}
                  />
                  Prescription required
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || categories.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Medicine"
                    : "Save Medicine"}
                </button>
              </div>

              {categories.length === 0 && (
                <p className="form-note">
                  Add a category before adding a medicine.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
