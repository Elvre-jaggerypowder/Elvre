import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminAnalytics.css";

const COLORS = ["#8B5E3C", "#f1a40f", "#4caf50", "#2196f3", "#f44336"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
  });
  const [timeRange, setTimeRange] = useState("week"); // week, month, year

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // 2. Fetch products (for top sellers)
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      // 3. Calculate summary
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalCustomers = new Set(orders.map((o) => o.email)).size;

      setSummary({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalCustomers,
      });

      // 4. Sales trend (group by date)
      const salesMap = {};
      const now = new Date();
      let startDate = new Date();
      if (timeRange === "week") startDate.setDate(now.getDate() - 7);
      else if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);
      else if (timeRange === "year") startDate.setFullYear(now.getFullYear() - 1);

      const filteredOrders = orders.filter(
        (o) => new Date(o.created_at) >= startDate
      );

      filteredOrders.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];
        if (!salesMap[date]) salesMap[date] = 0;
        salesMap[date] += order.total || 0;
      });

      const salesArray = Object.keys(salesMap).map((date) => ({
        date,
        revenue: salesMap[date],
      }));
      salesArray.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSalesData(salesArray);

      // 5. Top selling products
      const productSales = {};
      orders.forEach((order) => {
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((p) => {
            const id = p.id;
            if (!productSales[id]) {
              productSales[id] = { name: p.name, quantity: 0, revenue: 0 };
            }
            productSales[id].quantity += p.quantity || 1;
            productSales[id].revenue += (p.price || 0) * (p.quantity || 1);
          });
        }
      });

      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      setTopProducts(sortedProducts);

      // 6. Category breakdown (if products have category)
      const categoryMap = {};
      products.forEach((p) => {
        const cat = p.category || "Uncategorized";
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += 1;
      });
      const categoryArray = Object.keys(categoryMap).map((cat) => ({
        name: cat,
        count: categoryMap[cat],
      }));
      setCategoryData(categoryArray);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="time-range-selector">
          <button
            className={timeRange === "week" ? "active" : ""}
            onClick={() => setTimeRange("week")}
          >
            Week
          </button>
          <button
            className={timeRange === "month" ? "active" : ""}
            onClick={() => setTimeRange("month")}
          >
            Month
          </button>
          <button
            className={timeRange === "year" ? "active" : ""}
            onClick={() => setTimeRange("year")}
          >
            Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Revenue</div>
          <div className="card-value">₹{summary.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Total Orders</div>
          <div className="card-value">{summary.totalOrders}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Avg Order Value</div>
          <div className="card-value">₹{summary.avgOrderValue.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Unique Customers</div>
          <div className="card-value">{summary.totalCustomers}</div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="chart-container">
        <h3>Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8B5E3C" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-row">
        {/* Top Products */}
        <div className="chart-container half">
          <h3>Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#f1a40f" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="chart-container half">
          <h3>Product Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;