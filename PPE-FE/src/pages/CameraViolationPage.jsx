import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ExcelJS from "exceljs"; // 🔥 Thư viện cao cấp hỗ trợ chèn ảnh
import { saveAs } from "file-saver"; // 🔥 Thư viện hỗ trợ tải tệp tin
import "./CameraViolationPage.css";

const VIOLATION_MAP = {
    "NO_HARDHAT": { text: "No Hard Hat", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)" },
    "NO_SAFETY_VEST": { text: "No Safety Vest", color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" },
    "NO_MASK": { text: "No Mask", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" }
};

const CameraViolationPage = () => {
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false); // Trạng thái đợi tải và nhúng ảnh

    const getTodayString = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const [filterDate, setFilterDate] = useState(getTodayString());
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClass, setFilterClass] = useState("ALL");

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated && !currentUser) {
            navigate("/login");
        }
    }, [currentUser, isAuthenticated, authLoading, navigate]);

    useEffect(() => {
        if (authLoading || !currentUser?.id) return;

        const fetchCameras = async () => {
            const token = currentUser?.token || "";
            try {
                const response = await fetch(`http://localhost:8080/api/v1/cameras/user/${currentUser.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` })
                    }
                });

                if (response.status === 401) {
                    setError("Session expired. Please log in again.");
                    setTimeout(() => navigate("/login"), 2000);
                    return;
                }

                if (response.ok) {
                    const result = await response.json();
                    const cameraList = result.data || [];
                    setCameras(cameraList);
                    if (cameraList.length > 0 && !selectedCameraId) {
                        setSelectedCameraId(cameraList[0].id);
                    }
                }
            } catch (err) {
                console.error("Camera Fetch Error:", err);
                setError("Failed to establish server connection for node streams.");
            }
        };

        fetchCameras();
    }, [currentUser, authLoading, navigate, selectedCameraId]);

    useEffect(() => {
        if (!selectedCameraId || !currentUser) return;

        const fetchViolations = async () => {
            setLoading(true);
            setError(null);
            const token = currentUser?.token || "";

            try {
                const response = await fetch(`http://localhost:8080/api/v1/violations/camera/${selectedCameraId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { "Authorization": `Bearer ${token}` })
                    }
                });

                if (response.status === 401) {
                    setError("Unauthorized portal access. Reloading logs failed.");
                    return;
                }

                if (response.ok) {
                    const result = await response.json();
                    setViolations(result.data || []);
                } else {
                    setError("Failed to retrieve telemetry logs from server node.");
                }
            } catch (err) {
                setError("Backend core service connectivity failure.");
                console.error("Violations Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchViolations();
    }, [selectedCameraId, currentUser]);

    const formatDateTime = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour12: false
        });
    };

    const filteredViolations = violations.filter(item => {
        const itemDate = item.startTime ? item.startTime.split('T')[0] : "";
        const matchesDate = filterDate ? (itemDate === filterDate) : true;

        const matchesClass = filterClass === "ALL" ? true : item.violationTypes?.includes(filterClass);

        const matchesSearch = searchTerm.trim() === "" ? true : (
            item.cameraName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.violationTypes?.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return matchesDate && matchesClass && matchesSearch;
    });

    // 🔥 HÀM CHUYỂN LINK URL ẢNH THÀNH BASE64 NGẦM ĐỂ NHÚNG VÀO EXCEL
    const fetchImageAsBase64 = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(",")[1]); // Lấy chuỗi base64 thuần
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Không thể lấy dữ liệu ảnh từ URL công khai:", error);
            return null;
        }
    };

    // 🟢 TÍNH NĂNG NÂNG CẤP: XUẤT EXCEL CHÈN HÌNH ẢNH TRỰC TIẾP TỰ ĐỘNG
    const handleExportToExcelWithImages = async () => {
        if (filteredViolations.length === 0) {
            alert("No data available to export!");
            return;
        }

        setIsExporting(true); // Bật trạng thái loading xuất file

        try {
            // 1. Khởi tạo một Workbook Excel mới từ ExcelJS
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Violations Audit");

            // 2. Định nghĩa cấu trúc các tiêu đề cột
            worksheet.columns = [
                { header: "No.", key: "no", width: 8 },
                { header: "Camera ID", key: "cameraId", width: 15 },
                { header: "Camera Name", key: "cameraName", width: 25 },
                { header: "Violation Target Classes", key: "violations", width: 35 },
                { header: "Timestamp", key: "timestamp", width: 25 },
                { header: "Evidence Snapshot", key: "image", width: 20 } // Cột chứa ảnh trực tiếp
            ];

            // Định dạng font chữ in đậm cho hàng đầu tiên (Header)
            worksheet.getRow(1).font = { bold: true, size: 12 };
            worksheet.getRow(1).height = 25;

            // 3. Vòng lặp duyệt qua mảng đã sort để nạp dữ liệu và xử lý ảnh
            for (let i = 0; i < filteredViolations.length; i++) {
                const item = filteredViolations[i];
                const readableViolations = item.violationTypes
                    ?.map(type => VIOLATION_MAP[type]?.text || type)
                    .join(", ") || "N/A";

                const rowIndex = i + 2; // Hàng bắt đầu ghi dữ liệu (sau hàng header số 1)

                // Ghi dữ liệu dạng Text vào ô trước
                worksheet.addRow({
                    no: String(i + 1).padStart(2, '0'),
                    cameraId: `NODE_0${item.cameraId || ""}`,
                    cameraName: item.cameraName || "Warehouse Cam",
                    violations: readableViolations,
                    timestamp: formatDateTime(item.startTime),
                    image: "" // Tạm thời để trống để tí chèn ảnh đè lên
                });

                // Thiết lập độ cao hàng lớn một chút (ví dụ 60pt) để ô Excel đủ rộng chứa được ảnh thumbnail
                worksheet.getRow(rowIndex).height = 65;
                worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'left' };

                // Nếu bản ghi có URL ảnh, tiến hành tải về và nhúng trực tiếp vào ô Excel
                if (item.violationUrl) {
                    const base64Image = await fetchImageAsBase64(item.violationUrl);
                    if (base64Image) {
                        // Thêm ảnh vào cấu trúc tài nguyên của Workbook
                        const imageId = workbook.addImage({
                            base64: base64Image,
                            extension: 'jpeg',
                        });

                        // Xác định vị trí ô để thả ảnh vào (Cột F là cột số 5 tính từ index 0)
                        worksheet.addImage(imageId, {
                            tl: { col: 5, row: rowIndex - 1 }, // Góc trên bên trái ô
                            ext: { width: 110, height: 80 },  // Kích thước chiều rộng/cao của ảnh hiển thị trong ô
                            editAs: 'oneCell'
                        });
                    }
                }
            }

            // 4. Xuất file nén luồng ghi ra dạng mảng nhị phân và kích hoạt tải xuống
            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `PPE_Violations_Images_Report_${filterDate || "All_Time"}.xlsx`;
            saveAs(new Blob([buffer]), fileName);

        } catch (err) {
            console.error("Lỗi xuất tệp Excel nhúng ảnh:", err);
            alert("Failed to compile image binary spreadsheet matrix.");
        } finally {
            setIsExporting(false); // Tắt trạng thái loading
        }
    };

    return (
        <div className="violation-page-wrapper">
            <div className="cyber-grid"></div>
            <div className="ambient-glow cyan"></div>

            <div className="violation-content-container">
                <header className="violation-panel-header">
                    <div className="header-left">
                        <span className="tech-tag">REAL-TIME RISK METRICS</span>
                        <h1 className="page-main-title">Safety Violations Audit</h1>
                        <p className="page-sub-desc">
                            Enterprise analytical monitoring log. Continuous inspection matrix for workplace compliance tracking.
                        </p>
                    </div>

                    <div className="control-filter-panel">
                        <div className="input-group">
                            <label>NODE STREAM SOURCE</label>
                            <select
                                value={selectedCameraId}
                                onChange={(e) => setSelectedCameraId(e.target.value)}
                            >
                                {cameras.length === 0 ? (
                                    <option value="">No active nodes found</option>
                                ) : (
                                    cameras.map((cam) => (
                                        <option key={cam.id} value={cam.id}>
                                            CAM // {cam.cameraName}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>AUDIT DATE</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                max={getTodayString()}
                            />
                        </div>

                        <div className="input-group">
                            <label>VIOLATION CLASS</label>
                            <select
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                            >
                                <option value="ALL">All Threat Classes</option>
                                <option value="NO_HARDHAT">No Hard Hat</option>
                                <option value="NO_SAFETY_VEST">No Safety Vest</option>
                                <option value="NO_MASK">No Mask</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>SEARCH FILTER</label>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="input-group action-btn-group">
                            <label>DATA UTILITY</label>
                            <button
                                type="button"
                                className="excel-export-btn"
                                onClick={handleExportToExcelWithImages}
                                disabled={loading || isExporting || filteredViolations.length === 0}
                            >
                                {isExporting ? "⏳ Downloading Images..." : "📊 Export Excel with Images"}
                            </button>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="telemetry-loading">
                        <div className="loading-pulse"></div>
                        <p>Syncing encrypted data logs with matrix streams...</p>
                    </div>
                ) : error ? (
                    <div className="telemetry-error">
                        <span className="err-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                ) : filteredViolations.length === 0 ? (
                    <div className="telemetry-empty">
                        <div className="shield-radar"></div>
                        <h3>No Anomalies Detected</h3>
                        <p>All active entities comply with selected protective filters.</p>
                    </div>
                ) : (
                    <div className="matrix-table-wrapper">
                        <table className="matrix-violation-table">
                            <thead>
                            <tr>
                                <th style={{ width: "60px", textAlign: "center" }}>NO.</th>
                                <th>CAMERA IDENTITY</th>
                                <th>EVIDENCE SNAPSHOT</th>
                                <th>VIOLATION TARGET CLASSES</th>
                                <th>TIMESTAMP</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredViolations.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td className="txt-center txt-index">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </td>
                                    <td>
                                        <div className="camera-identity-block">
                                            <span className="cam-core-id">NODE_0{item.cameraId || index}</span>
                                            <span className="cam-geo-tag">{item.cameraName || "Warehouse Cam"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="snapshot-media-frame">
                                            {item.violationUrl ? (
                                                <img
                                                    src={item.violationUrl}
                                                    alt="PPE Threat Snapshot"
                                                    className="snapshot-thumbnail"
                                                    onClick={() => window.open(item.violationUrl, "_blank")}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.parentNode.innerHTML = '<span class="fallback-err">MEDIA_EXPIRED</span>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="snapshot-disabled-holder">
                                                    <span>LOGGED // NO_IMAGE</span>
                                                </div>
                                            )}
                                            <div className="frame-corner top-left"></div>
                                            <div className="frame-corner bottom-right"></div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="matrix-tags-flex">
                                            {item.violationTypes?.map((type, idx) => {
                                                const config = VIOLATION_MAP[type] || { text: type, color: "#94a3b8", bg: "rgba(255,255,255,0.05)" };
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="matrix-safety-tag"
                                                        style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color }}
                                                    >
                                                        <span className="tag-pulse" style={{ backgroundColor: config.color }}></span>
                                                        {config.text}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="txt-timestamp">
                                        {formatDateTime(item.startTime)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraViolationPage;