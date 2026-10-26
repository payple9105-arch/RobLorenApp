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

async function uploadFile(userId, file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${folder}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from("products").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

export default function ProductForm({ user, onPublished }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Diseño",
    product_type: "digital",
    stock: "1",
    is_featured: false,
    delivery_days: "3",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [digitalFile, setDigitalFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("La imagen debe ser un archivo de imagen (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("La imagen no puede superar 5 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  };

  const onDigitalPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setMessage("El archivo digital no puede superar 25 MB.");
      return;
    }
    setDigitalFile(file);
    setMessage("");
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

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("id", user.id)
        .maybeSingle();

      const planId = profile?.plan_id || "free";

      const { data: plan } = await supabase
        .from("plans")
        .select("max_products, name")
        .eq("id", planId)
        .maybeSingle();

      const maxProducts = plan?.max_products ?? 5;
      const canFeature = planId !== "free";

      if (form.is_featured && !canFeature) {
        setMessage("Solo los planes Pro y Premium pueden destacar productos.");
        setSaving(false);
        return;
      }

      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id);

      if ((count || 0) >= maxProducts) {
        setMessage(
          `Has alcanzado el límite de ${maxProducts} productos de tu plan ${plan?.name || "Gratis"}.`
        );
        setSaving(false);
        return;
      }

      let imageUrl = null;
      let digitalUrl = null;

      if (imageFile) {
        imageUrl = await uploadFile(user.id, imageFile, "images");
      }

      if (
        digitalFile &&
        (form.product_type === "digital" || form.product_type === "both")
      ) {
        digitalUrl = await uploadFile(user.id, digitalFile, "files");
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
        image_url: imageUrl,
        delivery_days:
          form.product_type === "digital"
            ? 0
            : Number(form.delivery_days) || 3,
        digital_file_url:
          form.product_type !== "physical" ? digitalUrl : null,
      });

      if (error) throw error;

      setMessage("Producto publicado correctamente.");
      setForm({
        title: "",
        description: "",
        price: "",
        category: "Diseño",
        product_type: "digital",
        stock: "1",
        is_featured: false,
        delivery_days: "3",
      });
      setImageFile(null);
      setImagePreview("");
      setDigitalFile(null);
      onPublished?.();
    } catch (err) {
      console.error(err);
      const msg = String(err?.message || "");
      if (msg.includes("Bucket not found") || msg.includes("not found")) {
        setMessage(
          "Falta crear el almacenamiento 'products' en Supabase (Storage). Ver instrucciones."
        );
      } else {
        setMessage(
          "No se pudo publicar. Revisa los archivos o inténtalo de nuevo."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    display: "grid",
    gap: 6,
    marginBottom: 14,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
  };

  const inputStyle = {
    width: "100%",
    minHeight: 44,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--line)",
    background: "#fff",
    font: "inherit",
  };

  const fileBoxStyle = {
    border: "1px dashed #c5d0e0",
    borderRadius: 14,
    padding: "16px 14px",
    background: "#f8fafc",
    textAlign: "center",
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 4px" }}>
      <header className="page-header" style={{ marginBottom: 20 }}>
        <span className="eyebrow">TIENDA</span>
        <h1 style={{ fontSize: 26 }}>Publicar producto</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          Completa los datos. Puedes subir la foto y el archivo desde tu teléfono.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Título</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej. Plantilla de logo minimalista"
            required
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Qué incluye, cómo se entrega..."
            rows={4}
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <label style={labelStyle}>Precio (USD)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="19.00"
              required
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={labelStyle}>Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <label style={labelStyle}>Categoría</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={inputStyle}
            >
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={labelStyle}>Tipo</label>
            <select
              name="product_type"
              value={form.product_type}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="digital">Digital</option>
              <option value="physical">Físico</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        {(form.product_type === "physical" || form.product_type === "both") && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Días de entrega</label>
            <input
              name="delivery_days"
              type="number"
              min="1"
              max="30"
              value={form.delivery_days}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ ...fieldStyle, marginBottom: 16 }}>
          <label style={labelStyle}>Foto del producto</label>
          <div style={fileBoxStyle}>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              />
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
                Elige una imagen desde tu galería
              </p>
            )}
            <label className="button outline" style={{ cursor: "pointer" }}>
              {imageFile ? "Cambiar foto" : "Subir foto"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onImagePick}
                style={{ display: "none" }}
              />
            </label>
            {imageFile && (
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                {imageFile.name}
              </p>
            )}
          </div>
        </div>

        {(form.product_type === "digital" || form.product_type === "both") && (
          <div style={{ ...fieldStyle, marginBottom: 16 }}>
            <label style={labelStyle}>Archivo digital (para el comprador)</label>
            <div style={fileBoxStyle}>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
                PDF, ZIP, imagen u otro archivo (máx. 25 MB)
              </p>
              <label className="button outline" style={{ cursor: "pointer" }}>
                {digitalFile ? "Cambiar archivo" : "Subir archivo"}
                <input
                  type="file"
                  onChange={onDigitalPick}
                  style={{ display: "none" }}
                />
              </label>
              {digitalFile && (
                <p style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  {digitalFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 18,
            fontSize: 14,
            color: "var(--muted)",
          }}
        >
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
            }
            style={{ marginTop: 3 }}
          />
          <span>Destacar este producto (planes Pro y Premium)</span>
        </label>

        <button
          type="submit"
          className="button primary large"
          style={{ width: "100%" }}
          disabled={saving}
        >
          {saving ? "Publicando..." : "Publicar producto"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            lineHeight: 1.45,
            color: message.includes("correctamente") ? "#16a34a" : "var(--danger)",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
