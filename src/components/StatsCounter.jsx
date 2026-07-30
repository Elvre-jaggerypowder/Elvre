import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import "./StatsCounter.css";

const StatsCounter = () => {
  const [stats, setStats] = useState({
    natural: 100,
    customers: 5000,
    farmerMade: 100,
    support: 24
  });

  useEffect(() => {
    // You can fetch real stats from Supabase here
  }, []);

  return (
    <section className="stats-section">
      <div className="stats-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🌿</div>
            <div className="stat-number">
              <CountUp end={stats.natural} duration={2.5} />%
            </div>
            <div className="stat-label">Natural & Chemical Free</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">😊</div>
            <div className="stat-number">
              <CountUp end={stats.customers} duration={2.5} />+
            </div>
            <div className="stat-label">Happy Customers</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🌾</div>
            <div className="stat-number">
              <CountUp end={stats.farmerMade} duration={2.5} />%
            </div>
            <div className="stat-label">Farmer Made</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-number">
              <CountUp end={stats.support} duration={2.5} />/7
            </div>
            <div className="stat-label">Customer Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;