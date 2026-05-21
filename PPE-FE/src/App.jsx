import React, { useState } from "react";

export default function App() {
    // State giả lập đổi trạng thái Hệ thống để test màu sắc của Tailwind
    const [systemStatus, setSystemStatus] = useState("Danger");

    return (
        <>
            {/* Nhúng CSS bổ trợ trực tiếp vào trang để tránh phải tạo nhiều file */}
            <style>{`
        body {
          margin: 0;
          background-color: #020617;
        }
        .tech-grid {
          background-image: 
            linear-gradient(to right, rgba(51, 65, 85, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51, 65, 85, 0.08) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

            {/* Container chính bao phủ toàn màn hình */}
            <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans tech-grid">
                <div className="w-full max-w-md rounded-3xl bg-slate-900/80 p-8 shadow-2xl border border-slate-800 backdrop-blur-sm transition-all duration-300 hover:border-slate-700">

                    {/* Vùng Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6">
                        <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
                PPE MONITORING SYSTEM
              </span>
                            <h1 className="text-xl font-black tracking-tight text-white mt-1">
                                AI Camera Gate #01
                            </h1>
                        </div>
                        {/* Đèn Led quét nhấp nháy */}
                        <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
                    </div>

                    {/* Hộp hiển thị Trạng thái biến đổi theo State */}
                    <div
                        className={`rounded-2xl p-6 text-center border transition-all duration-500 ${
                            systemStatus === "Danger"
                                ? "bg-red-950/30 border-red-500/40 text-red-400 shadow-lg shadow-red-950/20"
                                : "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/20"
                        }`}
                    >
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-70">
                            Mô phỏng Trạng Thái Hệ Thống
                        </p>
                        <h3 className="text-4xl font-black tracking-widest uppercase my-2.5 italic">
                            {systemStatus}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold">
                            {systemStatus === "Danger"
                                ? "⚠️ Phát hiện vi phạm liên tục quá 5s!"
                                : "● Thiết bị bảo hộ đầy đủ (Safe)"}
                        </p>
                    </div>

                    {/* Grid thông số kỹ thuật đầu ra */}
                    <div className="grid grid-cols-2 gap-4 my-6">
                        <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Đầu vào ảnh
              </span>
                            <span className="text-xs font-black text-slate-300">
                JPEG 1.0 Lossless
              </span>
                        </div>
                        <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Bộ lọc BBox
              </span>
                            <span className="text-xs font-black text-slate-300">
                RAM Smoothing
              </span>
                        </div>
                    </div>

                    {/* Khu vực nút bấm Test tính năng tương tác */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setSystemStatus(systemStatus === "Danger" ? "Safe" : "Danger")}
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all active:scale-[0.98]"
                        >
                            🔄 Đổi trạng thái hiển thị
                        </button>

                        <button
                            onClick={() => alert("Tailwind CSS hoạt động 100% ngon lành!")}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-blue-950/60 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            🚀 Kiểm tra kết nối Web
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}