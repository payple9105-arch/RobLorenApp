import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const productCategories = [
  "Diseño",
  "Educación",
  "Ropa",
  "Música",
  "Fotografía",
  "Artesanía",
  "Tecnología",
  "Otros",
];

export default function ProductForm({ user, onPublished }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Diseño",
    product_type: "digital",
    stock: "1",
    image_url: "",
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      setMessage("Debes iniciar sesión para publicar un producto.");
      return;
    }
    if (!form.title.trim() || !form.price) {
      setMessage("El título y el precio son obligatorios.");
      return;
    }

    setSaving(true);
    setMessage("");

    // Verificar límite según el plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("id", user.id)
      .maybeSingle();

    const planId = profile?.plan_id || "free";

    const { data: plan } = await supabase
      .from("plans")
      .select("max_products, name, features")
      .eq("id", planId)
      .maybeSingle();

    const maxProducts = plan?.max_products ?? 5;
    const canFeature = planId !== "free";

    if (form.is_featured && !canFeature) {
      setSaving(false);
      setMessage("Solo los planes Pro y Premium pueden destacar productos.");
      return;
    }

    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id);

    if ((count || 0) >= maxProducts) {
      setSaving(false);
      setMessage(`Has alcanzado el límite de ${maxProducts} productos de tu plan ${plan?.name || "Gratis"}. Actualiza tu plan para publicar más.`);
      return;
    }

    const { error } = await supabase.from("products").insert({
      seller_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      category: form.category,
      product_type: form.product_type,
      stock: Number(form.stock) || 0,
      is_available: true,
      is_featured: form.is_featured && canFeature,
      image_url: form.image_url.trim() || null,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage("No se pudo publicar el producto. Inténtalo de nuevo.");
      return;
    }

    setMessage("Producto publicado correctamente.");
    setForm({
      title: "",
      description: "",
      price: "",
      category: "Diseño",
      product_type: "digital",
      stock: "1",
      image_url: "",
      is_featured: false,
    });
    onPublished?.();
  };

  return (
    <div className="offer-form" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16 }}>Publicar producto</h2>

      <form onSubmit={handleSubmit} className="form-grid">
        <label className="full">
          Título del producto
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej. Plantilla de logo minimalista"
            required
          />
        </label>

        <label className="full">
          Descripción
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe qué incluye el producto, cómo se entrega, etc."
          />
        </label>

        <label>
          Precio (USD)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="19.00"
            required
          />
        </label>

        <label>
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleChange}
          />
        </label>

        <label>
          Categoría
          <select name="category" value={form.category} onChange={handleChange}>
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tipo de producto
          <select name="product_type" value={form.product_type} onChange={handleChange}>
            <option value="digital">Digital</option>
            <option value="physical">Físico</option>
            <option value="both">Ambos</option>
          </select>
        </label>

        <label className="full">
          URL de la imagen (opcional)
          <input
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="/media/design.jpg o una URL externa"
          />
        </label>

        <label className="full" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            name="is_featured"
            checked={form.is_featured}
            onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
          />
          Destacar este producto (solo planes Pro y Premium)
        </label>

        <div className="full" style={{ marginTop: 8 }}>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? "Publicando..." : "Publicar producto"}
          </button>
        </div>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.includes("correctamente") ? "green" : "var(--danger)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
