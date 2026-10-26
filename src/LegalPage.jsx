import React from "react";

const LEGAL_NAME = "Roberto Lorenzo Hechavarria";
const CONTACT_EMAIL = "roblorentodonegocio@gmail.com";
const CONTACT_WHATSAPP = "+53 5473 2279";

const CONTACT_NOTE =
  "Operador: " +
  LEGAL_NAME +
  ". Email: " +
  CONTACT_EMAIL +
  ". WhatsApp: " +
  CONTACT_WHATSAPP +
  ". También puedes escribir desde la sección de cuenta / soporte de la Plataforma.";

const termsContent = [
  {
    title: "1. Aceptación de los términos",
    body: "Al registrarte, acceder o usar RobLoren (\"la Plataforma\"), aceptas estos Términos de uso. Si no estás de acuerdo, no utilices el servicio. El uso continuado después de cambios en estos términos implica su aceptación.",
  },
  {
    title: "2. Quién opera el servicio",
    body:
      "RobLoren es un marketplace digital operado por " +
      LEGAL_NAME +
      ". Contacto: " +
      CONTACT_NOTE,
  },
  {
    title: "3. Descripción del servicio",
    body: "RobLoren conecta clientes con profesionales y permite publicar, comprar y vender servicios y productos (digitales o físicos). RobLoren actúa como intermediario tecnológico y de pagos. No es empleador de los profesionales ni garantiza resultados concretos de los servicios contratados entre usuarios.",
  },
  {
    title: "4. Cuentas de usuario",
    body: "Debes proporcionar información veraz y mantener la confidencialidad de tu cuenta. Eres responsable de toda actividad realizada desde tu usuario. Podemos suspender o eliminar cuentas por fraude, abuso, impago reiterado o incumplimiento de estos términos.",
  },
  {
    title: "5. Publicaciones y contenido",
    body: "Al publicar servicios, productos o mensajes garantizas que tienes los derechos necesarios y que el contenido no es ilegal, engañoso, ofensivo ni infringe derechos de terceros. Podemos retirar contenido que viole estas normas o la ley aplicable.",
  },
  {
    title: "6. Pagos y comisiones",
    body: "Los pagos se procesan mediante proveedores externos (por ejemplo, PayPal). Los precios se muestran antes de confirmar la compra. RobLoren puede cobrar una comisión al vendedor según el plan o las reglas publicadas en la Plataforma. El importe neto del vendedor se calcula descontando esa comisión. Los pagos pueden retenerse hasta que el comprador confirme la recepción o según las reglas de liberación de fondos de la Plataforma.",
  },
  {
    title: "7. Pedidos, entrega y confirmación",
    body: "El vendedor es responsable de entregar el producto o prestar el servicio según lo descrito en el anuncio. El comprador debe revisar la entrega y, cuando corresponda, marcar el pedido como recibido. En productos digitales, la entrega puede ser mediante enlace o archivo asociado al pedido.",
  },
  {
    title: "8. Cancelaciones, reembolsos y disputas",
    body: "Las cancelaciones y reembolsos dependen del tipo de producto o servicio y del estado del pedido. En general: (a) si el pedido no se ha entregado, las partes deben intentar resolverlo de buena fe; (b) el comprador puede abrir una disputa desde la Plataforma describiendo el problema; (c) RobLoren puede mediar y solicitar evidencia a ambas partes; (d) productos digitales ya descargados o entregados pueden no ser reembolsables salvo error de la Plataforma o incumplimiento grave del vendedor. RobLoren no garantiza un resultado concreto en cada disputa.",
  },
  {
    title: "9. Retiros de vendedores",
    body: "Los vendedores pueden solicitar el retiro de fondos disponibles hacia una cuenta PayPal indicada por ellos. Los plazos y la disponibilidad del pago automático dependen del proveedor de pagos, del saldo de la cuenta de la Plataforma y de controles antifraude. RobLoren puede rechazar o retrasar retiros ante sospecha de fraude o incumplimiento.",
  },
  {
    title: "10. Conducta prohibida",
    body: "Está prohibido usar la Plataforma para actividades ilegales, spam, acoso, suplantación de identidad, manipulación de reseñas, elusión de pagos o comisiones, o cualquier uso que dañe la seguridad o reputación de RobLoren o de sus usuarios.",
  },
  {
    title: "11. Propiedad intelectual",
    body: "La marca RobLoren, el diseño del sitio y el software asociado pertenecen a sus titulares. El contenido que publicas sigue siendo tuyo; nos concedes una licencia no exclusiva para mostrarlo y operarlo dentro de la Plataforma.",
  },
  {
    title: "12. Limitación de responsabilidad",
    body: "La Plataforma se ofrece \"tal cual\". En la medida permitida por la ley aplicable, RobLoren no responde por daños indirectos, lucro cesante, interrupciones del servicio, actuaciones de otros usuarios o de terceros (incluido PayPal u otros proveedores).",
  },
  {
    title: "13. Modificaciones",
    body: "Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con la fecha de actualización. El uso continuado del servicio después del cambio constituye aceptación de la nueva versión.",
  },
  {
    title: "14. Contacto",
    body: CONTACT_NOTE,
  },
];

const privacyContent = [
  {
    title: "1. Responsable del tratamiento",
    body:
      "El responsable del tratamiento de los datos personales recopilados a través de RobLoren es " +
      LEGAL_NAME +
      ". Contacto: " +
      CONTACT_NOTE,
  },
  {
    title: "2. Datos que recopilamos",
    body: "Podemos recopilar: datos de registro (nombre, correo electrónico, usuario), datos de perfil (biografía, ubicación, habilidades, fotos), datos de transacciones (pedidos, importes, estado de pago, identificadores de pago), datos de comunicación (mensajes en la Plataforma), datos de soporte (email, WhatsApp u otros canales) e información técnica básica (tipo de dispositivo, registros de acceso) necesaria para operar y asegurar el servicio.",
  },
  {
    title: "3. Finalidades",
    body: "Usamos tus datos para: crear y gestionar tu cuenta; facilitar compras, ventas y mensajería; procesar pagos y retiros mediante proveedores externos; enviar notificaciones relacionadas con pedidos; prevenir fraude y abusos; mejorar la seguridad y el funcionamiento de la Plataforma; y cumplir obligaciones legales.",
  },
  {
    title: "4. Base del tratamiento",
    body: "El tratamiento se basa en la ejecución del contrato de uso del servicio, en tu consentimiento cuando sea necesario, y en el interés legítimo de mantener la seguridad, prevenir fraude y mejorar la Plataforma, siempre respetando tus derechos.",
  },
  {
    title: "5. Proveedores y encargados",
    body: "Compartimos datos solo cuando es necesario para operar el servicio, por ejemplo con proveedores de autenticación y base de datos (como Supabase) y de pagos (como PayPal). Estos proveedores tratan los datos según sus propias políticas y acuerdos aplicables.",
  },
  {
    title: "6. Conservación",
    body: "Conservamos los datos mientras mantengas una cuenta activa y el tiempo adicional necesario para cumplir obligaciones legales, resolver disputas, prevenir fraude o hacer valer derechos. Puedes solicitar la eliminación de tu cuenta, sujeto a límites legales y operativos.",
  },
  {
    title: "7. Seguridad",
    body: "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos. Ningún sistema es totalmente seguro; te recomendamos usar contraseñas fuertes y no compartir tus credenciales.",
  },
  {
    title: "8. Tus derechos",
    body: "Según la normativa aplicable, puedes solicitar acceso, rectificación, eliminación, limitación del tratamiento, portabilidad u oposición. Para ejercerlos, escribe a " +
      CONTACT_EMAIL +
      " o usa los canales de soporte de RobLoren. También puedes presentar una reclamación ante la autoridad de protección de datos competente en tu jurisdicción.",
  },
  {
    title: "9. Menores de edad",
    body: "El servicio no está dirigido a menores de 18 años. Si detectamos una cuenta de un menor sin autorización válida, podremos suspenderla o eliminarla.",
  },
  {
    title: "10. Transferencias y ubicación",
    body: "La infraestructura puede estar alojada en proveedores con servidores en distintos países. Al usar la Plataforma aceptas que tus datos se traten según esta política y las garantías disponibles de esos proveedores.",
  },
  {
    title: "11. Cambios en esta política",
    body: "Podemos actualizar esta Política de privacidad. Publicaremos la versión vigente en esta página e indicaremos la fecha de la última actualización.",
  },
  {
    title: "12. Contacto",
    body: CONTACT_NOTE,
  },
];

export default function LegalPage({ type = "terms", onBack }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Política de privacidad" : "Términos de uso";
  const sections = isPrivacy ? privacyContent : termsContent;
  const updated = "25 de octubre de 2026";

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
        <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
          Operador: {LEGAL_NAME}
        </p>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
          Email: {CONTACT_EMAIL} · WhatsApp {CONTACT_WHATSAPP}
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
          lineHeight: 1.5,
        }}
      >
        Este documento es orientativo para el funcionamiento de RobLoren y puede
        adaptarse a requisitos legales de tu jurisdicción. Si necesitas asesoramiento
        legal formal, consulta a un profesional.
      </p>
    </main>
  );
}
