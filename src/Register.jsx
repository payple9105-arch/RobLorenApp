import React, { useState } from "react";

export default function Register() {
  const [role, setRole] = useState("cliente");

  const handleSubmit = (event) => {
    event.preventDefault();

    alert(
      `Registro iniciado como ${
        role === "cliente" ? "Cliente" : "Profesional"
      }.`
    );
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Únete a RobLoren</h1>

        <p>Encuentra servicios o ofrece tu talento.</p>

        <div className="role-buttons">
          <button
            type="button"
            onClick={() => setRole("cliente")}
          >
            👤 Soy cliente
          </button>

          <button
            type="button"
            onClick={() => setRole("profesional")}
          >
            💼 Soy profesional
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Nombre completo</label>
          <input
            type="text"
            placeholder="Tu nombre"
            required
          />

          <label>Correo electrónico</label>
          <input
            type="email"
            placeholder="tu@email.com"
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Crea una contraseña"
            required
          />

          <button type="submit">
            Crear cuenta
          </button>
        </form>

        <p>
          Tipo de cuenta:{" "}
          <strong>
            {role === "cliente" ? "Cliente" : "Profesional"}
          </strong>
        </p>
      </div>
    </div>
  );
}
