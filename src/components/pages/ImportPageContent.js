"use client";

import { useState } from "react";
import { Icons } from "@/components/layout";

export default function ImportPageContent({ role }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1E2761]">Excel Import</h1>
                <p className="text-gray-500 text-sm mt-1">Bulk import students, faculty, or event data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className={`bg-white border-2 border-dashed rounded-3xl p-12 text-center transition-all ${dragActive ? 'border-[#1E2761] bg-blue-50/30' : 'border-gray-200'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Icons.Import />
                        </div>
                        {file ? (
                            <div>
                                <p className="text-[#1E2761] font-bold text-lg mb-2">{file.name}</p>
                                <p className="text-gray-400 text-sm mb-6">{(file.size / 1024).toFixed(2)} KB</p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="px-6 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Drag and drop your Excel file here</h3>
                                <p className="text-gray-400 text-sm mb-8">Supports .xlsx and .csv formats</p>
                                <button className="px-8 py-3 bg-[#1E2761] text-white rounded-xl shadow-lg shadow-[#1E2761]/20 font-bold text-sm hover:scale-105 transition-transform">
                                    Browse Files
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                        <h4 className="font-bold text-[#1E2761] mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-xs">1</span>
                            Select Target Collection
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['Students', 'Faculty', 'Events'].map(type => (
                                <button
                                    key={type}
                                    className="p-4 border border-gray-100 rounded-xl text-center hover:border-[#1E2761] hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="text-sm font-bold text-gray-600 group-hover:text-[#1E2761]">{type}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1E2761] rounded-2xl p-8 text-white">
                        <h4 className="font-bold mb-4">Instructions</h4>
                        <ul className="space-y-4 text-sm text-white/70 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-white/40">•</span>
                                Use the provided templates to ensure column matching.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-white/40">•</span>
                                Max 1000 records per upload.
                            </li>
                            <li className="flex gap-3">
                                <span className="text-white/40">•</span>
                                Duplicate register numbers will be skipped.
                            </li>
                        </ul>
                        <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-colors">
                            Download Template
                        </button>
                    </div>

                    <button
                        disabled={!file}
                        className="w-full bg-emerald-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-transform"
                    >
                        Start Processing
                    </button>
                </div>
            </div>
        </div>
    );
}
