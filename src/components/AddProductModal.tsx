"use client";

import { useState, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { addGlobalProduct, CATEGORIES } from "@/lib/products";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

const YONGYANG_OPTIONS: Record<string, string[]> = {
  기름: ["300ml", "350ml", "1.75L", "1.8L", "16.5kg"],
  가루: ["200g", "400g", "1kg", "4kg", "20kg"],
};

const HAS_OPTIONS = ["기름", "가루"];

export default function AddProductModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [yongyang, setYongyang] = useState<string[]>([]);
  const [label, setLabel] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
    setYongyang([]);
  }

  function toggleYongyang(opt: string) {
    setYongyang((prev) =>
      prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
    );
  }

  function addLabel() {
    const val = labelInput.trim();
    if (!val || label.includes(val)) return;
    setLabel((prev) => [...prev, val]);
    setLabelInput("");
  }

  function removeLabel(idx: number) {
    setLabel((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const hasOpts = HAS_OPTIONS.includes(category);

      let finalImageUrl = imageUrl.trim();
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await addGlobalProduct({
        name: name.trim(),
        category,
        imageUrl: finalImageUrl,
        yongyang: hasOpts ? yongyang : [],
        magae: [],
        label: hasOpts ? label : [],
      });

      onAdded();
      onClose();
    } catch (err) {
      console.error("제품 저장 실패:", err);
      alert("저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
      setSaving(false);
    }
  }

  const showOptions = HAS_OPTIONS.includes(category);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-800">제품 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이미지</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 h-40">
                <img src={imagePreview} alt="미리보기" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">클릭해서 이미지 업로드</span>
                <span className="text-xs text-gray-300">JPG, PNG, WEBP</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 카테고리 + 제품명 */}
          <div className="flex gap-3">
            <div className="w-28">
              <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제품명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 참기름"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* 용량 — 기름/가루만 */}
          {showOptions && YONGYANG_OPTIONS[category] && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">용량</label>
              <div className="flex flex-wrap gap-2">
                {YONGYANG_OPTIONS[category].map((opt) => {
                  const checked = yongyang.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleYongyang(opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        checked
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-300 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 라벨 — 기름/가루만 */}
          {showOptions && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">라벨</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                  placeholder="예: 국문, 영문"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={addLabel}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  추가
                </button>
              </div>
              {label.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {label.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeLabel(idx)}
                        className="text-orange-400 hover:text-orange-600 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 저장/취소 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
