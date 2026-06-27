"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

type CategoryNode = {
  _id: string;
  label: string;
  slug: string;
  level: number;
  parentId: string | null;
  image?: string;
  isActive: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(null);

  const [formData, setFormData] = useState({
    label: "",
    parentId: "",
    image: "",
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories?all=true");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    const newExp = new Set(expanded);
    if (newExp.has(id)) newExp.delete(id);
    else newExp.add(id);
    setExpanded(newExp);
  };

  const handleOpenModal = (mode: "create" | "edit", category?: CategoryNode, defaultParentId?: string) => {
    setModalMode(mode);
    if (mode === "edit" && category) {
      setActiveCategory(category);
      setFormData({
        label: category.label,
        parentId: category.parentId || "",
        image: category.image || "",
        isActive: category.isActive,
      });
    } else {
      setActiveCategory(null);
      setFormData({
        label: "",
        parentId: defaultParentId || "",
        image: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = modalMode === "edit" ? `/api/admin/categories/${activeCategory?._id}` : "/api/admin/categories";
      const method = modalMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(modalMode === "create" ? "Category created!" : "Category updated!");
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const mainCats = categories.filter((c) => c.level === 0);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const renderTree = (nodes: CategoryNode[], parentId: string | null = null) => {
    return (
      <div className="space-y-3">
        {nodes.map((node) => {
          const children = getChildren(node._id);
          const hasChildren = children.length > 0;
          const isExpanded = expanded.has(node._id);

          return (
            <div key={node._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {hasChildren ? (
                    <button onClick={() => toggleExpand(node._id)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  ) : (
                    <div className="w-7"></div>
                  )}

                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {node.label}
                      {!node.isActive && (
                        <span className="text-[10px] uppercase font-black tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">/{node.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {node.level < 2 && (
                    <button
                      onClick={() => handleOpenModal("create", undefined, node._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors uppercase tracking-wider"
                    >
                      <Plus size={14} /> Add Child
                    </button>
                  )}
                  {node.level > 0 && (
                    <button
                      onClick={() => handleOpenModal("edit", node)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {node.level > 0 && (
                    <button
                      onClick={() => handleDelete(node._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && hasChildren && (
                <div className="pl-14 pr-4 pb-4 bg-gray-50/50 border-t border-gray-100">
                  <div className="mt-4">
                    {renderTree(children, node._id)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product hierarchy and menus.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        renderTree(mainCats)
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black">{modalMode === "create" ? "Add Category" : "Edit Category"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none font-bold"
                  placeholder="e.g. Denim Jackets"
                />
              </div>

              {(modalMode === "create" || (activeCategory && activeCategory.level > 0)) && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Parent Category *</label>
                  <select
                    required
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    disabled={modalMode === "edit"} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none font-medium"
                  >
                    <option value="" disabled>Select Parent</option>
                    {categories.filter(c => c.level < 2).map(c => (
                      <option key={c._id} value={c._id}>
                        {c.level === 0 ? c.label : `↳ ${c.label}`}
                      </option>
                    ))}
                  </select>
                  {modalMode === "create" && (
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">Main categories are restricted. You must select a parent.</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black accent-black cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Active (Visible to customers)
                </label>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {modalMode === "create" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
