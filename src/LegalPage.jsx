import React from "react";

const termsContent = [
  {
    title: "1. Aceptación de los términos",
    body: "Al registrarte, acceder o usar RobLoren (\"la Plataforma\"), aceptas estos Términos de uso. Si no estás de acuerdo, no utilices el servicio. RobLoren conecta clientes con profesionales y permite la compraventa de productos y servicios digitales o físicos.",
  },
  {
    title: "2. Descripción del servicio",
    body: "RobLoren es un marketplace donde los usuarios pueden publicar servicios, vender productos, contratar talento y realizar pagos. RobLoren actúa como intermediario tecnológico y de pagos; no es empleador de los profesionales ni garantiza resultados específicos de los servicios contratados.",
  },
  {
    title: "3. Cuentas de usuario",
    body: "Debes proporcionar información veraz y mantener la confidencialidad de tu cuenta. Eres responsable de toda actividad realizada desde tu usuario. Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estos términos, cometan fraude o perjudiquen a otros usuarios.",
  },
  {
    title: "4. Publicaciones y contenido",
    body: "Al publicar servicios, productos o mensajes, garantizas que tienes los derechos necesarios y que el contenido no es ilegal, engañoso, ofensivo ni infringe derechos de terceros. Podemos retirar contenido que viole estas normas.",
  },
  {
    title: "5. Pagos, comisiones y reembolsos",
    body: "Los pagos se procesan a través de proveedores externos (por ejemplo, PayPal). RobLoren puede cobrar comisiones según el plan del vendedor. Los precios se muestran antes de confirmar la compra. Las políticas de reembolso dependen del tipo de producto o servicio y del estado del pedido; en caso de disputa, ambas partes deben colaborar de buena fe.",
  },
  {
    title: "6. Pedidos, entrega y disputas",
    body: "El vendedor es responsable de entregar el producto o prestar el servicio según lo descrito. El comprador debe confirmar la recepción cuando corresponda. Si surge un conflicto, puede abrirse una disputa en la Plataforma. RobLoren puede mediar, pero no garantiza un resultado concreto.",
  },
  {
    title: "7. Conducta prohibida",
    body: "Está prohibido usar la Plataforma para actividades ilegales, spam, acoso, suplantación de identidad, manipulación de reseñas, elusión de pagos o cualquier uso que dañe la seguridad o reputación de RobLoren o de sus usuarios.",
  },
  {
    title: "8. Propiedad intelectual",
    body: "La marca RobLoren, el diseño del sitio y el software asociado son propiedad de sus titulares. El contenido que publicas sigue siendo tuyo, pero nos concedes una licencia para mostrarlo en la Plataforma con el fin de operar el servicio.",
  },
  {
    title: "9. Limitación de responsabilidad",
    body: "La Plataforma se ofrece \"tal cual\". En la medida permitida por la ley, RobLoren no responde por daños indirectos, pérdida de beneficios, interrupciones del servicio o actuaciones de terceros (incluido PayPal u otros proveedores de pago).",
  },
  {
    title: "10. Modificaciones",
    body: "Podemos actualizar estos términos. Los cambios relevantes se comunicarán en el sitio o por otros medios razonables. El uso continuado después de la actualización implica la aceptación de la nueva versión.",
  },
  {
    title: "11. Contacto",
    body: "Para consultas sobre estos términos, puedes contactarnos a través de la sección de cuenta o los canales de soporte indicados en la Plataforma.",
  },
];

const privacyContent = [
  {
    title: "1. Responsable del tratamiento",
    body: "RobLoren es el responsable del tratamiento de los datos personales recopilados a través de la Plataforma. Esta política describe qué datos tratamos, con qué finalidad y cuáles son tus derechos.",
  },
  {
    title: "2. Datos que recopilamos",
    body: "Podemos recopilar: datos de registro (nombre, correo, usuario), datos de perfil (biografía, ubicación, habilidades, fotos), datos de transacciones (pedidos, montos, estado de pago), datos de comunicación (mensajes en la plataforma) e información técnica básica (tipo de dispositivo, registros de acceso) necesaria para operar y asegurar el servicio.",
  },
  {
    title: "3. Finalidades",
    body: "Usamos tus datos para: crear y gestionar tu cuenta, facilitar compras y ventas, procesar pagos mediante proveedores externos, enviar notificaciones relacionadas con pedidos, mejorar la seguridad y prevenir fraude, y cumplir obligaciones legales.",
  },
  {
    title: "4. Base legal",
    body: "El tratamiento se basa en la ejecución del contrato (prestación del servicio), tu consentimiento cuando sea necesario, y el interés legítimo en mantener la seguridad y mejorar la Plataforma, siempre respetando tus derechos.",
  },
  {
    title: "5. Proveedores y terceros",
    body: "Compartimos datos solo cuando es necesario para operar el servicio, por ejemplo con proveedores de autenticación y base de datos (como Supabase) y de pagos (como PayPal). Estos proveedores tratan los datos según sus propias políticas y contratos de encargo.",
  },
  {
    title: "6. Conservación",
    body: "Conservamos los datos mientras mantengas una cuenta activa y el tiempo adicional necesario para cumplir obligaciones legales, resolver disputas o hacer valer derechos. Puedes solicitar la eliminación de tu cuenta sujeto a límites legales.",
  },
  {
    title: "7. Seguridad",
    body: "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. Ningún sistema es 100 % seguro; te recomendamos usar contraseñas fuertes y no compartir tus credenciales.",
  },
  {
    title: "8. Tus derechos",
    body: "Según la normativa aplicable, puedes solicitar acceso, rectificación, eliminación, limitación del tratamiento, portabilidad u oposición. Para ejercerlos, contacta a través de los canales de soporte de la Plataforma. También puedes presentar una reclamación ante la autoridad de protección de datos competente.",
  },
  {
    title: "9. Menores",
    body: "El servicio no está dirigido a menores de 18 años. Si detectamos una cuenta de un menor sin autorización válida, podremos suspenderla o eliminarla.",
  },
  {
    title: "10. Cambios en esta política",
    body: "Podemos actualizar esta Política de privacidad. Publicaremos la versión vigente en esta página e indicaremos la fecha de la última actualización.",
  },
  {
    title: "11. Contacto",
    body: "Para preguntas sobre privacidad o el ejercicio de derechos, utiliza la sección de cuenta o el soporte indicado en RobLoren.",
  },
];

export default function LegalPage({ type = "terms", onBack }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Política de privacidad" : "Términos de uso";
  const sections = isPrivacy ? privacyContent : termsContent;
  const updated = "22 de octubre de 2026";

  return (
    <main className="page-container" style={{ maxWidth: 800 }}>
      <button className="button outline" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Volver
      </button>

      <header className="page-header">
        <span className="eyebrow">LEGAL</span>
        <h1>{title}</h1>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          Última actualización: {updated}
        </p>
      </header>

      <div style={{ display: "grid", gap: 20 }}>
        {sections.map((section) => (
          <section
            key={section.title}
            className="service-card"
            style={{ padding: "18px 20px" }}
          >
            <h2 style={{ fontSize: 17, marginBottom: 8 }}>{section.title}</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, fontSize: 15 }}>
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: 13,
          color: "var(--muted)",
          textAlign: "center",
        }}
      >
        Este documento es informativo y puede adaptarse a requisitos legales de tu
        jurisdicción. Consulta a un profesional si necesitas asesoramiento legal.
      </p>
    </main>
  );
}
