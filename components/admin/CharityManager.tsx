// components/admin/CharityManager.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit3, Trash2, Star, StarOff, Check, X, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import type { Charity } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props { charities: (Charity & { charity_events?: unknown[] })[]; }

const EMPTY = { name: "", description: "", long_description: "", image_url: "", website_url: "" };

export default function CharityManager({ charities: initial }: Props) {
  const supabase = createClient();
  const [charities, setCharities] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function startEdit(c: Charity) {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description ?? "", long_description: c.long_description ?? "", image_url: c.image_url ?? "", website_url: c.website_url ?? "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.name) return toast.error("Name is required");
    setSaving(true);
    if (editId) {
      const { data, error } = await supabase.from("charities").update(form).eq("id", editId).select().single();
      if (error) { toast.error(error.message); }
      else {
        setCharities(cs => cs.map(c => c.id === editId ? { ...c, ...data } : c));
        toast.success("Charity updated!");
        cancelForm();
      }
    } else {
      const { data, error } = await supabase.from("charities").insert({ ...form, is_active: true, is_featured: false }).select().single();
      if (error) { toast.error(error.message); }
      else {
        setCharities(cs => [{ ...data, charity_events: [] }, ...cs]);
        toast.success("Charity added!");
        cancelForm();
      }
    }
    setSaving(false);
  }

  async function toggleFeatured(id: string, current: boolean) {
    // Unfeature all first
    await supabase.from("charities").update({ is_featured: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("charities").update({ is_featured: !current }).eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setCharities(cs => cs.map(c => ({ ...c, is_featured: c.id === id ? !current : false })));
      toast.success(!current ? "Set as featured!" : "Removed from featured");
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from("charities").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setCharities(cs => cs.map(c => c.id === id ? { ...c, is_active: !current } : c));
      toast.success(!current ? "Charity activated" : "Charity hidden");
    }
  }

  async function deleteCharity(id: string) {
    if (!confirm("Delete this charity? This cannot be undone.")) return;
    const { error } = await supabase.from("charities").delete().eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      setCharities(cs => cs.filter(c => c.id !== id));
      toast.success("Deleted");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Charities</h1>
          <p className="text-zinc-500 text-sm">{charities.length} partners · manage charity listings and content</p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true); }} className="btn-primary text-sm">
          <Plus size={16} /> Add Charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-brand-500/30 space-y-4">
          <h3 className="font-semibold">{editId ? "Edit Charity" : "New Charity"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Name *</label>
              <input value={form.name} onChange={update("name")} className="input-field" placeholder="Charity name" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Website URL</label>
              <input value={form.website_url} onChange={update("website_url")} className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Short Description</label>
            <input value={form.description} onChange={update("description")} className="input-field" placeholder="One line summary" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Full Description</label>
            <textarea value={form.long_description} onChange={update("long_description")}
              className="input-field min-h-[100px] resize-y" placeholder="Detailed description..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Image URL</label>
            <input value={form.image_url} onChange={update("image_url")} className="input-field" placeholder="https://images.unsplash.com/..." />
            {form.image_url && (
              <img src={form.image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl opacity-80" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> {editId ? "Save Changes" : "Add Charity"}</>}
            </button>
            <button onClick={cancelForm} className="btn-outline text-sm"><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

      {/* Charity list */}
      <div className="space-y-3">
        {charities.map(charity => (
          <div key={charity.id} className={`card transition-all ${!charity.is_active ? "opacity-50" : ""} ${charity.is_featured ? "border-gold-500/30" : ""}`}>
            <div className="flex gap-4">
              {charity.image_url && (
                <img src={charity.image_url} alt={charity.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{charity.name}</h3>
                      {charity.is_featured && <span className="badge bg-gold-400/10 text-gold-400"><Star size={10} fill="currentColor" /> Featured</span>}
                      {!charity.is_active && <span className="badge bg-zinc-800 text-zinc-500">Hidden</span>}
                    </div>
                    <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{charity.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-600">
                      <span>Raised: {formatCurrency(charity.total_raised)}</span>
                      <span>Added: {formatDate(charity.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleFeatured(charity.id, charity.is_featured)}
                      title={charity.is_featured ? "Unfeature" : "Set as Featured"}
                      className={`btn-ghost p-2 ${charity.is_featured ? "text-gold-400" : "text-zinc-600 hover:text-gold-400"}`}>
                      {charity.is_featured ? <Star size={15} fill="currentColor" /> : <Star size={15} />}
                    </button>
                    <button onClick={() => toggleActive(charity.id, charity.is_active)}
                      title={charity.is_active ? "Hide" : "Show"}
                      className="btn-ghost p-2 text-zinc-500 hover:text-white">
                      {charity.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => startEdit(charity)}
                      className="btn-ghost p-2 text-zinc-500 hover:text-brand-400">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => deleteCharity(charity.id)}
                      className="btn-ghost p-2 text-zinc-500 hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
