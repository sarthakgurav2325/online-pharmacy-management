
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  LogOut,
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
  CheckCircle,
  ClipboardList,
  CalendarDays,
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
axios.defaults.withCredentials = true;
const LOW_STOCK_LIMIT = 10;

const emptyForm = {
  name: "",
  description: "",
  manufacturer: "",
  batchNumber: "",
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

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return "Unknown";

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) return "Unknown";
  if (expiry < today) return "Expired";

  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);

  if (days <= 30) return "Expiring Soon";
  return "Valid";
}

function getStockStatus(medicine) {
  const stock = Number(medicine.stock || 0);

  if (stock <= 0) return "Out of Stock";
  if (stock <= LOW_STOCK_LIMIT) return "Low Stock";

  return "Available";
}

function App() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");

  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");

  const [authLoading, setAuthLoading] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
const [showCustomerOrderHistory, setShowCustomerOrderHistory] = useState(false);
const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);

// PRESCRIPTION MANAGEMENT STATE
const [prescriptions, setPrescriptions] = useState([]);
const [prescriptionSearch, setPrescriptionSearch] = useState("");
const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState("ALL");
const [prescriptionFile, setPrescriptionFile] = useState(null);
const [prescriptionCustomer, setPrescriptionCustomer] = useState("");
const [prescriptionMedicine, setPrescriptionMedicine] = useState("");
const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerSaving, setCustomerSaving] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ORDER MANAGEMENT STATE
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);



const loadData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    // Load medicines and categories for both admin and customer
    const [medicineResponse, categoryResponse] = await Promise.all([
      axios.get(`${API}/medicines`),
      axios.get(`${API}/categories`),
    ]);

    setMedicines(getArray(medicineResponse.data));
    setCategories(getArray(categoryResponse.data));

    // Load management data only for admin
    if (authUser?.role === "ROLE_ADMIN") {
      const [
        customerResponse,
        orderResponse,
        prescriptionResponse,
      ] = await Promise.all([
        axios.get(`${API}/customers`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/prescriptions`),
      ]);

      setCustomers(getArray(customerResponse.data));
      setOrders(getArray(orderResponse.data));
      setPrescriptions(getArray(prescriptionResponse.data));
    }

  } catch (err) {
    console.error(err);
    setError("Unable to load data. Please check your backend connection.");
  } finally {
    setLoading(false);
  }
}, [authUser]);



 useEffect(() => {
  axios
    .get(`${API}/auth/me`)
    .then((response) => {
      setAuthUser(response.data);
    })
    .catch(() => {
      setAuthUser(null);
    })
    .finally(() => {
      setAuthChecked(true);
    });
}, []);

useEffect(() => {
  const fetchData = async () => {
    if (
      authChecked &&
      (authUser?.role === "ROLE_ADMIN" ||
       authUser?.role === "ROLE_CUSTOMER")
    ) {
      await loadData();
    }
  };

  fetchData();
}, [authChecked, authUser, loadData]);


  const totalMedicines = medicines.length;
  const totalCategories = categories.length;

  const lowStockMedicines = medicines.filter(
    (m) => getStockStatus(m) === "Low Stock"
  );

  const outOfStockMedicines = medicines.filter(
    (m) => getStockStatus(m) === "Out of Stock"
  );

  const expiredMedicines = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "Expired"
  );

  const expiringSoonMedicines = medicines.filter(
    (m) => getExpiryStatus(m.expiryDate) === "Expiring Soon"
  );

  const inventoryValue = medicines.reduce(
    (total, m) => total + Number(m.price || 0) * Number(m.stock || 0),
    0
  );

  const totalStock = medicines.reduce(
    (total, m) => total + Number(m.stock || 0),
    0
  );

  const filteredMedicines = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return medicines;

    return medicines.filter((medicine) => {
      const category =
        medicine.category?.categoryName || medicine.category?.name || "";

      return [
        medicine.name,
        medicine.manufacturer,
        medicine.description,
        category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [medicines, search]);

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [customers, customerSearch]);

  const filteredOrders = useMemo(() => {
  const term = orderSearch.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesSearch =
      !term ||
      [
        order.id,
        order.customer?.fullName,
        order.status,
        order.shippingAddress,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        );

    const matchesStatus =
      orderStatusFilter === "ALL" ||
      order.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });
}, [orders, orderSearch, orderStatusFilter]);

  const navigate = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setSearch("");
    setCustomerSearch("");
    setOrderSearch("");
    setError("");
    setSuccess("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ? String(categories[0].id) : "",
    });
    setError("");
    setShowForm(true);
  };

  const editMedicine = (medicine) => {
    setEditingId(medicine.id);

    setForm({
      name: medicine.name || "",
      description: medicine.description || "",
      manufacturer: medicine.manufacturer || "",
      batchNumber: medicine.batchNumber || "",
      price: medicine.price ?? "",
      stock: medicine.stock ?? "",
      expiryDate: medicine.expiryDate || "",
      prescriptionRequired: Boolean(medicine.prescriptionRequired),
      categoryId: medicine.category?.id
        ? String(medicine.category.id)
        : "",
    });

    setError("");
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

    if (!form.categoryId) {
      setError("Please select a medicine category.");
      return;
    }

    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      setError("Price and stock cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      manufacturer: form.manufacturer.trim(),
      batchNumber: form.batchNumber.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      expiryDate: form.expiryDate,
      prescriptionRequired: form.prescriptionRequired,
      categoryId: Number(form.categoryId),
    };

    try {
      if (editingId !== null) {
        await axios.put(`${API}/medicines/${editingId}`, payload);
        setSuccess("Medicine updated successfully.");
      } else {
        await axios.post(`${API}/medicines`, payload);
        setSuccess("Medicine added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Unable to save medicine. Check the backend API."
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
    setSuccess("");

    try {
      await axios.delete(`${API}/medicines/${id}`);
      setSuccess("Medicine deleted successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete medicine.");
    }
  };

  const openCustomerForm = (customer = null) => {
    setEditingCustomerId(customer?.id ?? null);
    setCustomerForm({
      fullName: customer?.fullName || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
    });
    setError("");
    setShowCustomerForm(true);
  };

  const handleCustomerFormChange = (event) => {
    const { name, value } = event.target;
    setCustomerForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveCustomer = async (event) => {
    event.preventDefault();

    if (!customerForm.fullName.trim() || !customerForm.phone.trim()) {
      setError("Customer name and phone number are required.");
      return;
    }

    setCustomerSaving(true);
    setError("");
    setSuccess("");

    const payload = {
  fullName: customerForm.fullName.trim(),
  email: customerForm.email.trim(),
  phone: customerForm.phone.trim(),
  address: customerForm.address.trim(),
};

    try {
      if (editingCustomerId !== null) {
        await axios.put(`${API}/customers/${editingCustomerId}`, payload);
        setSuccess("Customer updated successfully.");
      } else {
        await axios.post(`${API}/customers`, payload);
        setSuccess("Customer added successfully.");
      }

      setShowCustomerForm(false);
      setEditingCustomerId(null);
      setCustomerForm({
        fullName: "",
        email: "",
        phone: "",
        address: "",
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Unable to save customer. Please check the details."
      );
    } finally {
      setCustomerSaving(false);
    }
  };

  const deleteCustomer = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await axios.delete(`${API}/customers/${id}`);
      setSuccess("Customer deleted successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete customer.");
    }
  };

  // ORDER MANAGEMENT FUNCTIONS

  const openOrderForm = () => {
    setSelectedCustomer("");
    setShippingAddress("");
    setCart([]);
    setSelectedMedicine("");
    setSelectedQuantity(1);
    setError("");
    setShowOrderForm(true);
  };

  const addToCart = () => {
    const medicine = medicines.find(
      (m) => Number(m.id) === Number(selectedMedicine)
    );

    const quantity = Number(selectedQuantity);

    if (!medicine) {
      setError("Please select a medicine.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    if (getExpiryStatus(medicine.expiryDate) === "Expired") {
      setError("Expired medicines cannot be ordered.");
      return;
    }

    const existing = cart.find(
      (item) => Number(item.medicineId) === Number(medicine.id)
    );

    const newQuantity = (existing?.quantity || 0) + quantity;

    const availableStock = existing
      ? Number(existing.stock || 0)
      : Number(medicine.stock || 0);

    if (newQuantity > availableStock) {
      setError(`Only ${availableStock} units of ${medicine.name} are available.`);
      return;
    }

    if (existing) {
      setCart((previous) =>
        previous.map((item) =>
          Number(item.medicineId) === Number(medicine.id)
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
          setCart((previous) => [
           ...previous,
          {
            medicineId: medicine.id,
            name: medicine.name,
            batchNumber: medicine.batchNumber || "—",
            price: Number(medicine.price || 0),
            quantity,
            stock: Number(medicine.stock || 0),
          },
        ]);
      }

    setSelectedMedicine("");
    setSelectedQuantity(1);
    setError("");
  };

  const removeCartItem = (medicineId) => {
    setCart((previous) =>
      previous.filter(
        (item) => Number(item.medicineId) !== Number(medicineId)
      )
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );


const createOrder = async (event) => {
  event.preventDefault();

  if (!selectedCustomer) {
    setError("Please select a customer.");
    return;
  }

  if (cart.length === 0) {
    setError("Please add at least one medicine.");
    return;
  }

  setOrderSaving(true);
  setError("");

  const payload = {
    customer: {
      id: Number(selectedCustomer),
    },
    shippingAddress: shippingAddress.trim(),
    items: cart.map((item) => ({
      medicineId: Number(item.medicineId),
      quantity: Number(item.quantity),
    })),
  };

  try {
    if (editingOrderId) {
      await axios.put(`${API}/orders/${editingOrderId}`, payload);
    } else {
      await axios.post(`${API}/orders`, payload);
    }

    setShowOrderForm(false);
    setCart([]);
    setSelectedCustomer("");
    setShippingAddress("");
    setEditingOrderId(null);

    setSuccess(
      editingOrderId
        ? "Order updated successfully!"
        : "Order placed successfully!"
    );

    await loadData();
  } catch (err) {
    console.error(err);
    setError(
      err.response?.data?.message ||
      (editingOrderId
        ? "Unable to update order. Please check medicine stock and customer."
        : "Unable to place order. Please check medicine stock and customer.")
    );
  } finally {
    setOrderSaving(false);
  }
};


const editOrder = async (orderId) => {
  try {
    setError("");
    setSuccess("");

    const orderResponse = await axios.get(`${API}/orders/${orderId}`);
    const itemsResponse = await axios.get(`${API}/orders/${orderId}/items`);

    const order = orderResponse.data;
    const items = itemsResponse.data;

    setEditingOrderId(orderId);
    setSelectedCustomer(String(order.customer?.id || ""));
    setShippingAddress(order.shippingAddress || "");

    const updatedCart = items.map((item) => {
      const medicine = item.medicine;
      const quantity = Number(item.quantity || 0);

      return {
        medicineId: medicine.id,
        name: medicine.name,
        batchNumber: medicine.batchNumber || "—",
        price: Number(item.price || medicine.price || 0),
        quantity,
        stock: Number(medicine.stock || 0) + quantity,
      };
    });

    setCart(updatedCart);
    setShowOrderForm(true);
  } catch (err) {
    console.error(err);
    setError("Unable to load order details for editing.");
  }
};


  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API}/orders/${id}/status`, { status });
      setSuccess("Order status updated successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to update order status.");
    }
  };

  const loadCustomerOrderHistory = async (customerId) => {
  try {
    const response = await axios.get(
      `${API}/orders/customer/${customerId}`
    );

    const data = response.data;
    setCustomerOrders(Array.isArray(data) ? data : []);

    setSelectedHistoryCustomer(customerId);
    setShowCustomerOrderHistory(true);
    setError("");
  } catch (err) {
    console.error("Unable to load customer orders:", err);
    setError("Unable to load customer order history.");
  }
};

  const deleteOrder = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order? Medicine stock will be restored."
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API}/orders/${id}`);
      setSuccess("Order deleted successfully.");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete order.");
    }
  };

  const uploadPrescription = async (event) => {
    event.preventDefault();

    if (!prescriptionCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (!prescriptionFile) {
      setError("Please select a prescription file.");
      return;
    }

    if (prescriptionFile.size > 5 * 1024 * 1024) {
      setError("Prescription file must be 5 MB or smaller.");
      return;
    }

    setPrescriptionSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("customerId", prescriptionCustomer);
    if (prescriptionMedicine) {
      formData.append("medicineId", prescriptionMedicine);
    }
    formData.append("file", prescriptionFile);

    try {
      await axios.post(`${API}/prescriptions/upload`, formData);
      setSuccess("Prescription uploaded successfully.");
      setPrescriptionFile(null);
      setPrescriptionCustomer("");
      setPrescriptionMedicine("");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Unable to upload prescription. Please check the backend."
      );
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const reviewPrescription = async (id, status) => {
    const remarks = window.prompt(
      `Enter remarks for ${status.toLowerCase()}:`,
      ""
    );

    if (remarks === null) return;

    try {
      await axios.put(`${API}/prescriptions/${id}/review`, {
        status,
        remarks,
      });
      setSuccess(`Prescription ${status.toLowerCase()} successfully.`);
      setError("");
      await loadData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Unable to review prescription."
      );
    }
  };

  const getCategoryName = (medicine) =>
    medicine.category?.categoryName ||
    medicine.category?.name ||
    "Uncategorized";

  const pageTitles = {
    dashboard: "Dashboard",
    medicines: "Medicines",
    customers: "Customers",
    orders: "Orders",
    prescriptions: "Prescriptions",
    categories: "Categories",
    inventory: "Inventory",
  };

  const renderMedicineTable = (items) => (
    <div className="table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Category</th>
            <th>Manufacturer</th>
            <th>Batch Number</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((medicine) => {
            const stockStatus = getStockStatus(medicine);
            const expiryStatus = getExpiryStatus(medicine.expiryDate);

            const status =
              expiryStatus === "Expired"
                ? "Expired"
                : stockStatus === "Out of Stock"
                ? "Out of Stock"
                : stockStatus === "Low Stock"
                ? "Low Stock"
                : expiryStatus === "Expiring Soon"
                ? "Expiring Soon"
                : "Available";

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
                <td>
                  {medicine.batchNumber ? (
                    <span className="batch-number">
                      {medicine.batchNumber}
                      </span>
                    ) : (
                    "—"
                  )}
                </td>
                <td>₹{Number(medicine.price || 0).toFixed(2)}</td>
                <td><strong>{medicine.stock}</strong></td>
                <td>{medicine.expiryDate || "—"}</td>
                <td>
                  <span className={`status-badge ${
                    status === "Available"
                      ? "status-available"
                      : status === "Expiring Soon"
                      ? "status-warning"
                      : "status-low"
                  }`}>
                    {status}
                  </span>
                </td>

                <td>
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
                </td>

              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan="9" className="empty-state">
                No medicines found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );


  const handleAuthSubmit = async (e) => {
  e.preventDefault();
  setAuthError("");
  setAuthLoading(true);

  try {
    if (authMode === "register") {
      await axios.post(`${API}/auth/register`, {
        fullName: authName,
        email: authEmail,
        password: authPassword,
        phone: authPhone,
      });

      setAuthMode("login");
      setAuthName("");
      setAuthPhone("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthError("Registration successful! Please log in.");
    } else {
      const response = await axios.post(`${API}/auth/login`, {
        email: authEmail,
        password: authPassword,
      });

      const user = {
  email: response.data.email,
  role: response.data.role,
};

if (
  currentPath === "/admin-login" &&
  user.role !== "ROLE_ADMIN"
) {
  setAuthError("This account is not an admin account.");
  return;
}

if (
  currentPath === "/customer-login" &&
  user.role !== "ROLE_CUSTOMER"
) {
  setAuthError("This account is not a customer account.");
  return;
}

setAuthUser(user);
setAuthPassword("");

if (user.role === "ROLE_ADMIN") {
  routerNavigate("/admin");
} else if (user.role === "ROLE_CUSTOMER") {
  routerNavigate("/customer");
} else {
  setAuthError("Invalid user role.");
}

      setAuthUser(user);
      setAuthPassword("");

      if (user.role === "ROLE_ADMIN") {
        routerNavigate("/admin");
      } else if (user.role === "ROLE_CUSTOMER") {
        routerNavigate("/customer");
      } else {
        setAuthError("Invalid user role.");
      }
    }
  } catch (err) {
    console.error("Authentication error:", err);

    setAuthError(
      authMode === "register"
        ? "Registration failed. Please check your details."
        : "Invalid email or password."
    );
  } finally {
    setAuthLoading(false);
  }
};

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch {
      console.error("Logout failed");
    } finally {
      setAuthUser(null);
      setAuthEmail("");
      setAuthPassword("");
      setActivePage("dashboard");
    }
  };


  if (!authChecked) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-icon">
          <Pill size={30} />
        </div>
        <h2>PharmaCare</h2>
        <p>Loading your account...</p>
      </div>
    </div>
  );
}

// Redirect users who are not logged in
if (!authUser && currentPath === "/admin") {
  return <Navigate to="/admin-login" replace />;
}

if (
  !authUser &&
  (currentPath === "/" || currentPath === "/customer")
) {
  return <Navigate to="/customer-login" replace />;
}

// Redirect logged-in users to their correct dashboard
if (authUser?.role === "ROLE_ADMIN" &&
    currentPath !== "/admin") {
  return <Navigate to="/admin" replace />;
}

if (authUser?.role === "ROLE_CUSTOMER" &&
    currentPath !== "/customer") {
  return <Navigate to="/customer" replace />;
}


if (!authUser) {
  const isAdminLogin = currentPath === "/admin-login";

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-icon">
          <Pill size={30} />
        </div>

        <h2>PharmaCare</h2>

        <p>
          {isAdminLogin
            ? "Admin Login"
            : authMode === "login"
            ? "Customer Login"
            : "Create your customer account"}
        </p>

        <form onSubmit={handleAuthSubmit}>
          {!isAdminLogin && authMode === "register" && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {authError && (
            <p className="auth-error">{authError}</p>
          )}

          <button type="submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "register"
              ? "Register"
              : "Login"}
          </button>
        </form>

        {!isAdminLogin && (
          <p>
            {authMode === "login"
              ? "New customer?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setAuthError("");
              }}
            >
              {authMode === "login"
                ? "Create Account"
                : "Login"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}




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
          <div className="brand-icon"><Pill size={25} /></div>
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

          {[
            ["dashboard", LayoutDashboard, "Dashboard"],
            ["medicines", Pill, "Medicines"],
            ["customers", Users, "Customers"],
            ["orders", ShoppingCart, "Orders"],
            ["prescriptions", ClipboardList, "Prescriptions"],
            ["categories", Tags, "Categories"],
            ["inventory", Package, "Inventory"],
          ].map(([page, Icon, label]) => (
            <button
              key={page}
              type="button"
              className={`nav-link ${activePage === page ? "active" : ""}`}
              onClick={() => navigate(page)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
  type="button"
  className="nav-link"
  onClick={handleLogout}
>
  <LogOut size={19} />
  <span>Logout</span>
</button>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon"><CheckCircle size={20} /></div>
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
            <button type="button" onClick={() => setError("")}><X size={17} /></button>
          </div>
        )}

        {success && (
          <div className="success-message">
            <CheckCircle size={18} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}><X size={17} /></button>
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
                    <p>Manage medicines, stock and categories from one simple dashboard.</p>
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
                  <StatCard icon={<Pill size={22} />} color="green-icon" label="Total Medicines" value={totalMedicines} />
                  <StatCard icon={<Tags size={22} />} color="purple-icon" label="Total Categories" value={totalCategories} />
                  <StatCard icon={<AlertTriangle size={22} />} color="orange-icon" label="Low Stock Items" value={lowStockMedicines.length} />
                  <StatCard icon={<IndianRupee size={22} />} color="blue-icon" label="Inventory Value" value={`₹${inventoryValue.toLocaleString("en-IN")}`} />
                </section>

                <section className="stats-grid">
                  <StatCard icon={<Package size={22} />} color="green-icon" label="Total Stock Units" value={totalStock} />
                  <StatCard icon={<AlertTriangle size={22} />} color="orange-icon" label="Out of Stock" value={outOfStockMedicines.length} />
                  <StatCard icon={<CalendarDays size={22} />} color="purple-icon" label="Expired Medicines" value={expiredMedicines.length} />
                  <StatCard icon={<CalendarDays size={22} />} color="blue-icon" label="Expiring Within 30 Days" value={expiringSoonMedicines.length} />
                </section>

                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <h2>Recent Medicines</h2>
                      <p>Your current medicine records</p>
                    </div>
                    <button type="button" className="text-button" onClick={() => navigate("medicines")}>View all</button>
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
                  <button type="button" className="primary-button" onClick={openAddForm}>
                    <Plus size={18} /> Add Medicine
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      placeholder="Search medicine, manufacturer or category..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                   <select
    value={orderStatusFilter}
    onChange={(event) => setOrderStatusFilter(event.target.value)}
  >
    <option value="ALL">All Orders</option>
    <option value="PENDING">Pending</option>
    <option value="PROCESSING">Processing</option>
    <option value="COMPLETED">Completed</option>
    <option value="CANCELLED">Cancelled</option>
  </select>
                  <span className="result-count">{filteredMedicines.length} medicines</span>
                </div>
                {renderMedicineTable(filteredMedicines)}
              </section>
            )}

            {activePage === "customers" && (
              <section className="content-card">
                <div className="section-heading page-section-heading">
                  <div>
                    <h2>Customer Management</h2>
                    <p>Add, update, search and delete customers</p>
                  </div>
                  <button type="button" className="primary-button" onClick={() => openCustomerForm()}>
                    <UserPlus size={18} /> Add Customer
                  </button>
                </div>

                <div className="toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      placeholder="Search by name, email, phone or address..."
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                    />
                  </div>
                  <span className="result-count">{filteredCustomers.length} customers</span>
                </div>

                <div className="table-wrapper">
                  <table className="medicine-table">
                    <thead>
                      <tr>
                        <th>Customer</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="medicine-name-cell">
                              <div className="medicine-avatar"><Users size={18} /></div>
                              <div><strong>{customer.fullName}</strong><small>ID: {customer.id}</small></div>
                            </div>
                          </td>
                          <td>{customer.email ? <span className="customer-detail"><Mail size={15} /> {customer.email}</span> : "—"}</td>
                          <td><span className="customer-detail"><Phone size={15} /> {customer.phone}</span></td>
                          <td>{customer.address ? <span className="customer-detail"><MapPin size={15} /> {customer.address}</span> : "—"}</td>
                          <td>

<div className="table-actions">
  <button
    type="button"
    className="secondary-button"
    title="View customer orders"
    onClick={() => {
      setActivePage("orders");
      loadCustomerOrderHistory(customer.id);
    }}
  >
    View Orders
  </button>

  <button
    type="button"
    className="icon-button edit-button"
    title="Edit customer"
    onClick={() => openCustomerForm(customer)}
  >
    <Edit size={16} />
  </button>

  <button
    type="button"
    className="icon-button delete-button"
    title="Delete customer"
    onClick={() => deleteCustomer(customer.id)}
  >
    <Trash2 size={16} />
  </button>
</div>

                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr><td colSpan="5" className="empty-state">No customers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ORDERS PAGE */}
            {activePage === "orders" && (
              <>
                <section className="stats-grid">
                  <StatCard icon={<ShoppingCart size={22} />} color="blue-icon" label="Total Orders" value={orders.length} />
                  <StatCard icon={<ClipboardList size={22} />} color="orange-icon" label="Pending Orders" value={orders.filter(o => o.status === "PENDING").length} />
                  <StatCard icon={<CheckCircle size={22} />} color="green-icon" label="Completed Orders" value={orders.filter(o => o.status === "COMPLETED").length} />
                  <StatCard icon={<IndianRupee size={22} />} color="purple-icon" label="Order Revenue" value={`₹${orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0).toLocaleString("en-IN")}`} />
                </section>

                <section className="content-card">
                  <div className="section-heading page-section-heading">
                    <div>
                      <h2>Order Management</h2>
                      <p>Create orders and manage customer purchases</p>
                    </div>
                    <button type="button" className="primary-button" onClick={openOrderForm}>
                      <Plus size={18} /> Create Order
                    </button>
                  </div>

                  <div className="toolbar">
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        placeholder="Search by order ID, customer or status..."
                        value={orderSearch}
                        onChange={(event) => setOrderSearch(event.target.value)}
                      />
                    </div>
                    <span className="result-count">{filteredOrders.length} orders</span>
                  </div>

                  <div className="table-wrapper">
                    <table className="medicine-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Order Date</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Shipping Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td><strong>#{order.id}</strong></td>
                            <td>{order.customer?.fullName || "Customer"}</td>
                            <td>{order.orderDate ? new Date(order.orderDate).toLocaleString("en-IN") : "—"}</td>
                            <td><strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong></td>
                            <td>

                            <select
                              className={`order-status-select status-${(order.status || "PENDING").toLowerCase()}`}
                              value={order.status || "PENDING"}
                              onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                            >
                              <option value="PENDING">● Pending</option>
                              <option value="PROCESSING">● Processing</option>
                              <option value="COMPLETED">● Completed</option>
                              <option value="CANCELLED">● Cancelled</option>
                            </select>

                            </td>
                            <td>{order.shippingAddress || "—"}</td>
                            <td>
                              <button
                                type="button"
                                className="icon-button edit-button"
                                title="Edit order"
                                onClick={() => editOrder(order.id)}
                              >
                                <Edit size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button delete-button"
                                title="Delete order"
                                onClick={() => deleteOrder(order.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                              </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr><td colSpan="7" className="empty-state">No orders found. Create your first order.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </section>

                <button
  type="button"
  className="clear-filter-button"
  onClick={() => {
    setOrderSearch("");
    setOrderStatusFilter("ALL");
  }}
>
  Clear Filters
</button>

                {showCustomerOrderHistory && (
                  <section className="content-card">
                    <div className="section-heading">
                      <div>
                        <h2>Customer Order History</h2>
                        <p>Customer ID: {selectedHistoryCustomer}</p>
                      </div>

                      <button
                        type="button"
                        className="close-history-button"
                        onClick={() => setShowCustomerOrderHistory(false)}
                      >
                        Close History
                      </button>
                    </div>

                    {customerOrders.length === 0 ? (
                      <p className="empty-state">
                        No orders found for this customer.
                      </p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="medicine-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Order Date</th>
                              <th>Total Amount</th>
                              <th>Status</th>
                              <th>Shipping Address</th>
                            </tr>
                          </thead>

                          <tbody>
                            {customerOrders.map((order) => (
                              <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>
                                  {order.orderDate
                                    ? new Date(order.orderDate).toLocaleString("en-IN")
                                    : "—"}
                                </td>
                                <td>
                                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                                </td>
                                <td>
  <span className={`order-status-badge ${String(order.status || "").toLowerCase()}`}>
    {order.status}
  </span>
</td>
                                <td>{order.shippingAddress || "—"}</td>
                              </tr>
                            ))}

                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}


            {activePage === "prescriptions" && (
              <>
                <section className="stats-grid">
                  <StatCard
                    icon={<ClipboardList size={22} />}
                    color="blue-icon"
                    label="Total Prescriptions"
                    value={prescriptions.length}
                  />

                  <StatCard
                    icon={<AlertTriangle size={22} />}
                    color="orange-icon"
                    label="Pending Review"
                    value={prescriptions.filter(p => p.status === "PENDING").length}
                  />

                  <StatCard
                    icon={<CheckCircle size={22} />}
                    color="green-icon"
                    label="Approved"
                    value={prescriptions.filter(p => p.status === "APPROVED").length}
                  />

                  <StatCard
                    icon={<X size={22} />}
                    color="purple-icon"
                    label="Rejected"
                    value={prescriptions.filter(p => p.status === "REJECTED").length}
                  />
                </section>

                <section className="content-card">
                  <div className="section-heading page-section-heading">
                    <div>
                      <h2>Prescription Management</h2>
                      <p>Upload, view and review customer prescriptions</p>
                    </div>
                  </div>

                  <form className="prescription-upload-form" onSubmit={uploadPrescription}>
                    <div className="form-grid">
                      <label>
                        Select Customer *
                        <select
                          value={prescriptionCustomer}
                          onChange={(event) => setPrescriptionCustomer(event.target.value)}
                          required
                        >
                          <option value="">Choose customer</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.fullName} - {customer.phone}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Select Medicine (Optional)
                        <select
                          value={prescriptionMedicine}
                          onChange={(event) => setPrescriptionMedicine(event.target.value)}
                        >
                          <option value="">Choose medicine</option>
                          {medicines.map((medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="full-width">
                        Prescription File (PDF, JPG, PNG) *
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={(event) => setPrescriptionFile(event.target.files?.[0] || null)}
                          required
                        />
                        <small>Maximum file size: 5 MB</small>
                      </label>
                    </div>
                    <div className="modal-actions">
                      <button
                        type="submit"
                        className="primary-button"
                        disabled={prescriptionSaving || customers.length === 0}
                      >
                        {prescriptionSaving ? "Uploading..." : "Upload Prescription"}
                      </button>
                    </div>
                  </form>

                  <div className="toolbar">
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        placeholder="Search by customer or status..."
                        value={prescriptionSearch}
                        onChange={(event) => setPrescriptionSearch(event.target.value)}
                      />
                    </div>
                    <select
                      value={prescriptionStatusFilter}
                      onChange={(event) => setPrescriptionStatusFilter(event.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    <button
  type="button"
  className="secondary-button"
  onClick={() => {
    setPrescriptionSearch("");
    setPrescriptionStatusFilter("ALL");
  }}
>
  Clear Filters
</button>
                   <span className="result-count">
  {
    prescriptions.filter((p) => {
      const matchesSearch = [
        p.customer?.fullName,
        p.status,
        p.fileName,
        p.medicine?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(
            prescriptionSearch.toLowerCase()
          )
        );

      const matchesStatus =
        prescriptionStatusFilter === "ALL" ||
        p.status === prescriptionStatusFilter;

      return matchesSearch && matchesStatus;
    }).length
  } prescriptions
</span>
                  </div>

                  <div className="table-wrapper">
                    <table className="medicine-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Customer</th>
                          <th>Medicine</th>
                          <th>File Name</th>
                          <th>Upload Date</th>
                          <th>Status</th>
                          <th>Remarks</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {prescriptions
                          .filter((p) => {
  const matchesSearch = [
    p.customer?.fullName,
    p.status,
    p.fileName,
    p.medicine?.name,
  ]
    .filter(Boolean)
    .some((value) =>
      String(value).toLowerCase().includes(
        prescriptionSearch.toLowerCase()
      )
    );

  const matchesStatus =
    prescriptionStatusFilter === "ALL" ||
    p.status === prescriptionStatusFilter;

  return matchesSearch && matchesStatus;
})
                          .map((prescription) => (
                            <tr key={prescription.id}>
                              <td>#{prescription.id}</td>
                              <td>{prescription.customer?.fullName || "Customer"}</td>
                              <td>{prescription.medicine?.name || "Not specified"}</td>
                              <td>{prescription.fileName}</td>
                              <td>
                                {prescription.uploadedAt
                                  ? new Date(prescription.uploadedAt).toLocaleString("en-IN")
                                  : "—"}
                              </td>
                              <td>
  <span className={`status-badge ${prescription.status.toLowerCase()}`}>
    {prescription.status}
  </span>
</td>
                              <td>{prescription.pharmacistRemarks || "—"}</td>

                              <td>
                                <div className="table-actions">
                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        window.open(
                                          `${API}/prescriptions/${prescription.id}/file`,
                                          "_blank",
                                          "noopener,noreferrer"
                                        )
                                      }
                                    >
                                      View
                                    </button>

                                    {prescription.status === "PENDING" && (
                                      <>
                                        <button
                                          type="button"
                                          className="secondary-button"
                                          onClick={() =>
                                            reviewPrescription(prescription.id, "APPROVED")
                                          }
                                        >
                                          Approve
                                        </button>

                                        <button
                                          type="button"
                                          className="icon-button delete-button"
                                          title="Reject prescription"
                                          onClick={() =>
                                            reviewPrescription(prescription.id, "REJECTED")
                                          }
                                        >
                                          <X size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>

                            </tr>
                          ))}

                        {prescriptions.filter((p) =>
                          [p.customer?.fullName, p.status, p.fileName, p.medicine?.name]
                            .filter(Boolean)
                            .some((value) => String(value).toLowerCase().includes(prescriptionSearch.toLowerCase()))
                        ).length === 0 && (
                          <tr>
                            <td colSpan="8" className="empty-state">
                              {prescriptions.length === 0 ? "No prescriptions uploaded yet." : "No matching prescriptions found."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}


            {activePage === "categories" && (
              <section className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Medicine Categories</h2>
                    <p>All categories available in your pharmacy</p>
                  </div>
                  <span className="category-count">{categories.length} Categories</span>
                </div>

                <div className="category-grid">
                  {categories.map((category) => {
                    const count = medicines.filter(
                      (m) => Number(m.category?.id) === Number(category.id)
                    ).length;

                    return (
                      <div className="category-card" key={category.id}>
                        <div className="category-card-top">
                          <div className="stat-icon green-icon"><Tags size={22} /></div>
                          <span className="category-id">ID: {category.id}</span>
                        </div>
                        <h3>{category.categoryName || category.name}</h3>
                        <p>{count} {count === 1 ? "medicine" : "medicines"}</p>
                      </div>
                    );
                  })}
                  {categories.length === 0 && <div className="empty-state">No categories available.</div>}
                </div>
              </section>
            )}

            {activePage === "inventory" && (
              <>
                <section className="stats-grid inventory-stats">
                  <StatCard icon={<Package size={22} />} color="green-icon" label="Total Stock Units" value={totalStock} />
                  <StatCard icon={<AlertTriangle size={22} />} color="orange-icon" label="Low Stock Medicines" value={lowStockMedicines.length} />
                  <StatCard icon={<ClipboardList size={22} />} color="blue-icon" label="Inventory Records" value={totalMedicines} />
                  <StatCard icon={<CalendarDays size={22} />} color="purple-icon" label="Expired Medicines" value={expiredMedicines.length} />
                </section>

                <section className="content-card">
                  <div className="section-heading">
                    <div><h2>Stock Inventory</h2><p>Monitor available stock and expiry dates</p></div>
                  </div>
                  <div className="inventory-alert">
                    <AlertTriangle size={19} />
                    <span>Low stock: {LOW_STOCK_LIMIT} or fewer units. Expiring soon: within 30 days.</span>
                  </div>
                  {renderMedicineTable(medicines)}
                </section>
              </>
            )}
          </>
        )}



      </main>

      {/* MEDICINE FORM */}
      {showForm && (
        <div className="modal-backdrop">
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
                  <input name="name" value={form.name} onChange={handleFormChange} required />
                </label>

                <label>
                  Manufacturer *
                  <input name="manufacturer" value={form.manufacturer} onChange={handleFormChange} required />
                </label>

                <label>Batch Number *
                <input
                  type="text"
                  id="batchNumber"
                  name="batchNumber"
                  value={form.batchNumber}
                  onChange={handleFormChange}
                  placeholder="Enter batch number"
                  required
                />
                </label>

                <label>
                  Category *
                  <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required>
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
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFormChange} required />
                </label>

                <label>
                  Stock Quantity *
                  <input name="stock" type="number" min="0" value={form.stock} onChange={handleFormChange} required />
                </label>

                <label>
                  Expiry Date *
                  <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleFormChange} required />
                </label>

                <label className="full-width">
                  Description
                  <textarea name="description" rows="3" value={form.description} onChange={handleFormChange} />
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
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Medicine" : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER FORM */}
      {showCustomerForm && (
        <div className="modal-backdrop">
          <div className="medicine-modal">
            <div className="modal-heading">
              <div>
                <h2>{editingCustomerId !== null ? "Edit Customer" : "Add New Customer"}</h2>
                <p>Enter customer information below</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowCustomerForm(false)}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveCustomer}>
              <div className="form-grid">
                <label className="full-width">
                  Full Name *
                  <input name="fullName" value={customerForm.fullName} onChange={handleCustomerFormChange} required />
                </label>

                <label>
                  Email Address
                  <input name="email" type="email" value={customerForm.email} onChange={handleCustomerFormChange} />
                </label>

                <label>
                  Phone Number *
                  <input name="phone" value={customerForm.phone} onChange={handleCustomerFormChange} required />
                </label>

                <label className="full-width">
                  Address
                  <textarea name="address" rows="3" value={customerForm.address} onChange={handleCustomerFormChange} />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowCustomerForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={customerSaving}>
                  {customerSaving ? "Saving..." : editingCustomerId !== null ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ORDER FORM */}
      {showOrderForm && (
        <div className="modal-backdrop">
          <div className="medicine-modal order-modal">
            <div className="modal-heading">
              <div>
                <h2>{editingOrderId ? "Edit Order" : "Create New Order"}</h2>
                <p>
                {editingOrderId
                  ? "Update customer, medicines and order details"
                  : "Select a customer and add medicines"}
                </p>
              </div>

              <button type="button" className="modal-close" onClick={() => setShowOrderForm(false)}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={createOrder}>
              <div className="form-grid">
                <label className="full-width">
                  Select Customer *
                  <select
                    value={selectedCustomer}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSelectedCustomer(id);
                      const customer = customers.find(
                        (item) => Number(item.id) === Number(id)
                      );
                      setShippingAddress(customer?.address || "");
                    }}
                    required
                  >
                    <option value="">Choose customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full-width">
                  Shipping Address
                  <textarea
                    rows="2"
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    placeholder="Enter delivery address"
                  />
                </label>

                <label>
                  Select Medicine
                  <select
                    value={selectedMedicine}
                    onChange={(event) => setSelectedMedicine(event.target.value)}
                  >
                    <option value="">Choose medicine</option>
                    {medicines
                      .filter((medicine) =>
                        Number(medicine.stock) > 0 &&
                        getExpiryStatus(medicine.expiryDate) !== "Expired"
                      )
                      .map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} — ₹{medicine.price} (Stock: {medicine.stock})
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(event.target.value)}
                  />
                </label>
              </div>

              <button type="button" className="primary-button" onClick={addToCart}>
                <Plus size={17} /> Add to Order
              </button>

              <div className="order-cart">
                <h3>Order Items</h3>

                <div className="table-wrapper">
                  <table className="medicine-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Batch Number</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.medicineId}>
                          <td>{item.name}</td>
                          <td>
                            <span className="batch-number">
                              {item.batchNumber || "—"}
                            </span>
                          </td>
                          <td>₹{item.price.toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="icon-button delete-button"
                              onClick={() => removeCartItem(item.medicineId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {cart.length === 0 && (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            No medicines added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="order-total">
                  <span>Total Amount</span>
                  <strong>₹{cartTotal.toFixed(2)}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowOrderForm(false);
                    setEditingOrderId(null);
                    setCart([]);
                    setSelectedCustomer("");
                    setShippingAddress("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={orderSaving || cart.length === 0 || !selectedCustomer}
                >
                  {orderSaving
                    ? editingOrderId ? "Updating Order..." : "Placing Order..."
                    : editingOrderId ? "Update Order" : "Place Order"}
                </button>
              </div>

              {customers.length === 0 && (
                <p className="form-note">Add a customer before creating an order.</p>
              )}
            </form>
          </div>
        </div>
      )}
        </div>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <span className="stat-caption">Overview</span>
      </div>
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}


export default App;
