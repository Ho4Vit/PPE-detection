import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search, Sort & API Processing States
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("id-asc");
    const [updatingId, setUpdatingId] = useState(null);
    const [togglingActiveId, setTogglingActiveId] = useState(null);

    // 🟢 FETCH: Get all users with Authorization Token
    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8080/api/v1/users/getall", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser?.token}`
                }
            });

            if (!response.ok) throw new Error("Failed to connect to API server");

            const resData = await response.json();
            setUsersList(resData.data || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Microservices system encountered an error loading accounts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.token) {
            fetchAllUsers();
        }
    }, [currentUser]);

    // 🟢 PUT: Update User Role
    const handleRoleChange = async (userId, newRole) => {
        setUpdatingId(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/users/${userId}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                setUsersList(prev =>
                    prev.map(user => user.id === userId ? { ...user, role: newRole } : user)
                );
                alert(`Role updated successfully to: ${newRole}`);
            } else {
                alert("Failed to update role!");
            }
        } catch (err) {
            console.error("Error updating role:", err);
            alert("API connection error while updating role.");
        } finally {
            setUpdatingId(null);
        }
    };

    // 🟢 PATCH: Toggle Active Status
    const handleToggleActive = async (userId) => {
        if (userId.toString() === currentUser?.id?.toString()) {
            alert("Security check failed: You cannot lock your own account!");
            return;
        }

        setTogglingActiveId(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/v1/users/${userId}/toggle-active`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser?.token}`
                }
            });

            if (response.ok) {
                setUsersList(prev =>
                    prev.map(user => user.id === userId ? { ...user, active: !user.active } : user)
                );
            } else {
                alert("Failed to update status!");
            }
        } catch (err) {
            console.error("Error toggling active status:", err);
            alert("API connection error while updating status.");
        } finally {
            setTogglingActiveId(null);
        }
    };

    // 📊 STATS & ANALYTICS
    const totalUsers = usersList.length;
    const adminCount = usersList.filter(u => u.role?.toUpperCase() === "ADMIN" || u.role?.toUpperCase() === "ROLE_ADMIN").length;
    const managerCount = usersList.filter(u => u.role?.toUpperCase() === "MANAGER").length;
    const operatorCount = totalUsers - adminCount - managerCount;
    const activeCount = usersList.filter(u => u.active !== false).length;
    const blockedCount = totalUsers - activeCount;

    // Percentages for CSS bars
    const adminPct = totalUsers ? Math.round((adminCount / totalUsers) * 100) : 0;
    const managerPct = totalUsers ? Math.round((managerCount / totalUsers) * 100) : 0;
    const operatorPct = totalUsers ? Math.round((operatorCount / totalUsers) * 100) : 0;

    // 🔍 SEARCH & SORT FILTERING
    const processedUsers = usersList
        .filter(u =>
            u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id?.toString() === searchTerm
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "id-asc": return a.id - b.id;
                case "id-desc": return b.id - a.id;
                case "name-asc": return (a.fullName || "").localeCompare(b.fullName || "");
                case "name-desc": return (b.fullName || "").localeCompare(b.fullName || "");
                case "status-active": return (b.active !== false ? 1 : 0) - (a.active !== false ? 1 : 0);
                case "status-blocked": return (a.active !== false ? 1 : 0) - (b.active !== false ? 1 : 0);
                default: return a.id - b.id;
            }
        });

    return (
        <div className="admin-dashboard-container">
            {/* PART 1: HEADER */}
            <header className="admin-dashboard-header">
                <div className="header-title-block">
                    <span className="cyber-tech-tag">CENTRAL CONTROL PANEL</span>
                    <h1 className="admin-main-title">User Management</h1>
                </div>
                <button onClick={fetchAllUsers} className="admin-refresh-btn">
                    <span>🔄</span> Sync Data
                </button>
            </header>

            {/* PART 2: ANALYTICS CARDS & CHART */}
            <section className="admin-analytics-section">
                <div className="analytics-summary-cards">
                    <div className="panel-stat-card total-box">
                        <h5>TOTAL USERS</h5>
                        <h3>{totalUsers}</h3>
                        <p>Accounts connected</p>
                    </div>
                    <div className="panel-stat-card active-box">
                        <h5>ACTIVE STATUS</h5>
                        <h3>{activeCount} <span className="sub-ratio">/ {totalUsers}</span></h3>
                        <div className="mini-progress">
                            <div className="fill" style={{ width: `${totalUsers ? (activeCount / totalUsers) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div className="panel-stat-card blocked-box">
                        <h5>LOCKED STATUS</h5>
                        <h3>{blockedCount}</h3>
                        <p style={{ color: blockedCount > 0 ? "#ef4444" : "#64748b" }}>Security alert</p>
                    </div>
                </div>

                <div className="analytics-chart-panel">
                    <h4 className="chart-title">📊 System Role Ratio</h4>
                    <div className="cyber-bar-chart-container">
                        <div className="chart-bar-row">
                            <span className="bar-label">ADMINS ({adminCount})</span>
                            <div className="bar-track"><div className="bar-fill admin-bg" style={{ width: `${adminPct}%` }}></div></div>
                            <span className="bar-percentage">{adminPct}%</span>
                        </div>
                        <div className="chart-bar-row">
                            <span className="bar-label">MANAGERS ({managerCount})</span>
                            <div className="bar-track"><div className="bar-fill manager-bg" style={{ width: `${managerPct}%` }}></div></div>
                            <span className="bar-percentage">{managerPct}%</span>
                        </div>
                        <div className="chart-bar-row">
                            <span className="bar-label">OPERATORS ({operatorCount})</span>
                            <div className="bar-track"><div className="bar-fill operator-bg" style={{ width: `${operatorPct}%` }}></div></div>
                            <span className="bar-percentage">{operatorPct}%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* PART 3: SEARCH & SORT TOOLBAR */}
            <div className="admin-control-toolbar-v2">
                <div className="toolbar-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search users by ID, Full Name, linked Email..."
                        className="toolbar-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button className="clear-search-btn" onClick={() => setSearchTerm("")}>✕</button>}
                </div>

                <div className="toolbar-sort-box">
                    <label className="sort-label">Sort by:</label>
                    <select
                        className="toolbar-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="id-asc">ID (Lowest first)</option>
                        <option value="id-desc">ID (Highest first)</option>
                        <option value="name-asc">Name (A - Z)</option>
                        <option value="name-desc">Name (Z - A)</option>
                        <option value="status-active">Status: Active first</option>
                        <option value="status-blocked">Status: Locked first</option>
                    </select>
                </div>
            </div>

            {/* PART 4: DATA TABLE */}
            {loading ? (
                <div className="admin-loading-screen">
                    <div className="cyber-spinner"></div>
                    <p>SYNCHRONIZING MICROSERVICES DATABASE...</p>
                </div>
            ) : error ? (
                <div className="admin-error-banner">⚠️ {error}</div>
            ) : (
                <div className="admin-table-responsive-wrapper">
                    <table className="admin-cyber-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>User Profile</th>
                            <th>Email Address</th>
                            <th>Access Level</th>
                            <th>Operation Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {processedUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="admin-no-data-cell">
                                    No records match the current filters.
                                </td>
                            </tr>
                        ) : (
                            processedUsers.map((u) => {
                                const isSelf = u.id.toString() === currentUser?.id?.toString();
                                const isActive = u.active !== false;

                                return (
                                    <tr key={u.id} className={`admin-table-row ${!isActive ? "row-disabled" : ""}`}>
                                        <td className="user-id-cell">#{u.id}</td>
                                        <td>
                                            <div className="admin-user-info-cell">
                                                <img
                                                    src={u.avatarUrl || "https://www.w3schools.com/howto/img_avatar.png"}
                                                    alt="Avatar"
                                                    className="user-row-avatar"
                                                />
                                                <div className="user-text-meta">
                                                    <span className="user-row-name">{u.fullName}</span>
                                                    {isSelf && <span className="self-badge">YOU</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="user-row-email">{u.email || "N/A"}</td>
                                        <td>
                                            <select
                                                className={`admin-role-select-box role-${u.role?.toUpperCase()}`}
                                                value={u.role || "USER"}
                                                disabled={updatingId === u.id}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                <option value="USER">USER / OPERATOR</option>
                                                <option value="MANAGER">MANAGER</option>
                                                <option value="ADMIN">ADMINISTRATOR</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="toggle-switch-wrapper">
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        disabled={togglingActiveId === u.id || isSelf}
                                                        onChange={() => handleToggleActive(u.id)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span className={`status-text-label ${isActive ? "text-active" : "text-blocked"}`}>
                                                    {isActive ? "Active" : "Locked"}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}