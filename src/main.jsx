import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";

const categories = [
  ["💻", "Tecnología"],
  ["🎨", "Diseño"],
  ["📣", "Marketing"],
  ["✍️", "Redacción"],
  ["📚", "Educación"],
  ["📷", "Fotografía"],
  ["🎬", "Video"],
  ["🎵", "Música"],
  ["🌐", "Traducción"],
  ["🔧", "Otros"],
];

const demoServices = [
  {
    id: 1,
    name: "Carlos Rodríguez",
    profession: "Desarrollador Web",
    service: "Creación de sitios web profesionales",
    category: "Tecnología",
    description:
      "Creo sitios web modernos, rápidos y adaptados a móviles para negocios y profesionales.",
    price: 80,
    userId: null,
    demo: true,
  },
  {
    id: 2,
    name: "Ana Martínez",
    profession: "Diseñadora Gráfica",
    service: "Diseño de logotipos",
    category: "Diseño",
    description:
      "Diseño logotipos modernos y profesionales para marcas y emprendimientos.",
    price: 35,
    userId: null,
    demo: true,
  },
  {
    id: 3,
    name: "Luis Gómez",
    profession: "Especialista en Marketing",
    service: "Marketing para redes sociales",
    category: "Marketing",
    description:
      "Ayudo a negocios a mejorar su presencia y alcance en redes sociales.",
    price: 50,
    userId: null,
    demo: true,
  },
];

function mapService(row, profile) {
  return {
    id: row.id,
    name: profile?.name || row.name || "Profesional",
    profession: profile?.profession || row.profession || "Profesional",
    service: row.service_title || "Servicio profesional",
    category: row.category || "Otros",
    description: row.description || "",
    price: Number(row.price) || 0,
    userId: row.user_id || null,
    demo: false,
  };
}

function makeUser(user, profile) {
  return {
    id: user.id,
    email: user.email || "",
    name:
      profile?.name ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      "Usuario",
    profession:
      profile?.profession ||
      user.user_metadata?.profession ||
      "Profesional",
    bio: profile?.bio || user.user_metadata?.bio || "",
  };
}

function statusText(status) {
  if (status === "accepted") return "Aceptada";
  if (status === "rejected") return "Rechazada";
  return "Pendiente";
}

function statusClass(status) {
  if (status === "accepted") return "status accepted";
  if (status === "rejected") return "status rejected";
  return "status pending";
}

function dateText(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name = "Usuario", large = false }) {
  const letter = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className={large ? "avatar avatar-large" : "avatar"}>
      {letter}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");

  const [services, setServices] = useState(demoServices);
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const [loggedUser, setLoggedUser] = useState(null);
  const [accountMode, setAccountMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(true);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [servicesLoading, setServicesLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profession: "",
    bio: "",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    profession: "",
    bio: "",
  });

  const [offer, setOffer] = useState({
    serviceTitle: "",
    category: "Tecnología",
    description: "",
    price: "",
  });

  const [publishing, setPublishing] = useState(false);

  async function ensureProfile(user) {
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,profession,bio")
      .eq("id", user.id)
      .limit(1);

    if (error) {
      console.error(error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    const profile = {
      id: user.id,
      name:
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        "Usuario",
      profession: user.user_metadata?.profession || "Profesional",
      bio: user.user_metadata?.bio || "",
    };

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert(profile)
      .select("id,name,profession,bio");

    if (createError) {
      console.error(createError);
      return null;
    }

    return created?.[0] || profile;
  }

  async function refreshUser(user) {
    if (!user) {
      setLoggedUser(null);
      setProfileForm({
        name: "",
        profession: "",
        bio: "",
      });
      return;
    }

    const profile = await ensureProfile(user);
    const next = makeUser(user, profile);

    setLoggedUser(next);

    setProfileForm({
      name: next.name,
      profession: next.profession,
      bio: next.bio,
    });
  }

  async function loadServices() {
    setServicesLoading(true);

    const { data, error } = await supabase
      .from("services")
      .select(
        "id,created_at,name,profession,service_title,category,description,price,user_id"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setServices(demoServices);
      setServicesLoading(false);
      return;
    }

    const rows = data || [];

    const ids = [
      ...new Set(rows.map((x) => x.user_id).filter(Boolean)),
    ];

    let profiles = {};

    if (ids.length) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id,name,profession,bio")
        .in("id", ids);

      profiles = Object.fromEntries(
        (profileRows || []).map((p) => [p.id, p])
      );
    }

    const real = rows.map((row) =>
      mapService(row, profiles[row.user_id])
    );

    setServices([...real, ...demoServices]);
    setServicesLoading(false);
  }

  async function loadRequests() {
    if (!loggedUser?.id) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .or(
        `client_id.eq.${loggedUser.id},provider_id.eq.${loggedUser.id}`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setRequests([]);
      setLoadingRequests(false);
      return;
    }

    const rows = data || [];

    const profileIds = [
      ...new Set(
        rows
          .flatMap((r) => [r.client_id, r.provider_id])
          .filter(Boolean)
      ),
    ];

    const serviceIds = [
      ...new Set(rows.map((r) => r.service_id).filter(Boolean)),
    ];

    let profiles = {};
    let serviceRows = {};

    if (profileIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id,name,profession,bio")
        .in("id", profileIds);

      profiles = Object.fromEntries(
        (ps || []).map((p) => [p.id, p])
      );
    }

    if (serviceIds.length) {
      const { data: ss } = await supabase
        .from("services")
        .select(
          "id,service_title,category,description,price,user_id"
        )
        .in("id", serviceIds);

      serviceRows = Object.fromEntries(
        (ss || []).map((s) => [s.id, s])
      );
    }

    setRequests(
      rows.map((r) => {
        const service = serviceRows[r.service_id];
        const client = profiles[r.client_id];
        const provider = profiles[r.provider_id];

        return {
          ...r,
          clientName:
            client?.name ||
            (r.client_id === loggedUser.id
              ? loggedUser.name
              : "Cliente"),
          providerName:
            provider?.name ||
            (r.provider_id === loggedUser.id
              ? loggedUser.name
              : "Profesional"),
          serviceTitle:
            service?.service_title || "Servicio profesional",
          serviceCategory: service?.category || "Otros",
          servicePrice: Number(service?.price) || 0,
          providerId: r.provider_id,
          clientId: r.client_id,
        };
      })
    );

    setLoadingRequests(false);
  }

  async function loadMessages(contactId) {
    if (!loggedUser?.id || !contactId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id,created_at,sender_id,receiver_id,request_id,message"
      )
      .or(
        `and(sender_id.eq.${loggedUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${loggedUser.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMessages([]);
    } else {
      setMessages(data || []);
    }

    setLoadingMessages(false);
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (!loggedUser || !selectedContact) return;

    const text = messageText.trim();

    if (!text) return;

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: loggedUser.id,
        receiver_id: selectedContact.id,
        request_id: selectedContact.requestId || null,
        message: text,
      })
      .select(
        "id,created_at,sender_id,receiver_id,request_id,message"
      );

    if (error) {
      alert(error.message);
      setSendingMessage(false);
      return;
    }

    if (data?.[0]) {
      setMessages((current) => [...current, data[0]]);
    }

    setMessageText("");
    setSendingMessage(false);
  }

  async function openMessaging(contact) {
    if (!loggedUser) {
      setAccountMode("login");
      setPage("account");
      return;
    }

    if (!contact?.userId) {
      alert(
        "Este profesional todavía no tiene mensajería disponible."
      );
      return;
    }

    if (contact.userId === loggedUser.id) {
      alert("No puedes iniciar una conversación contigo mismo.");
      return;
    }

    const contactData = {
      id: contact.userId,
      name: contact.name || "Profesional",
      profession: contact.profession || "Profesional",
      requestId: contact.requestId || null,
    };

    setSelectedContact(contactData);
    setMessages([]);
    setMessageText("");
    setPage("messages");

    await loadMessages(contactData.id);
  }

  async function sendRequest() {
    if (!loggedUser) {
      setAccountMode("login");
      setPage("account");
      return;
    }

    if (!selectedService?.userId) {
      alert(
        "Este servicio de demostración todavía no puede recibir solicitudes."
      );
      return;
    }

    if (selectedService.userId === loggedUser.id) {
      alert("No puedes solicitar tu propio servicio.");
      return;
    }

    setSendingRequest(true);

    const { error } = await supabase
      .from("service_requests")
      .insert({
        service_id: selectedService.id,
        client_id: loggedUser.id,
        provider_id: selectedService.userId,
        status: "pending",
        message:
          requestMessage.trim() ||
          "Estoy interesado en contratar este servicio.",
      });

    if (error) {
      alert(error.message);
      setSendingRequest(false);
      return;
    }

    setRequestMessage("");
    setSendingRequest(false);

    alert("Solicitud enviada correctamente.");

    await loadRequests();
    setPage("requests");
  }

  async function changeRequestStatus(id, status) {
    if (!loggedUser) return;

    setUpdatingRequest(id);

    const { error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", id)
      .eq("provider_id", loggedUser.id);

    if (error) {
      alert(error.message);
    } else {
      await loadRequests();
    }

    setUpdatingRequest(null);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!loggedUser) return;

    if (!profileForm.name.trim()) {
      alert("Escribe tu nombre.");
      return;
    }

    setSavingProfile(true);

    const newProfile = {
      name: profileForm.name.trim(),
      profession:
        profileForm.profession.trim() || "Profesional",
      bio: profileForm.bio.trim(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(newProfile)
      .eq("id", loggedUser.id)
      .select("id,name,profession,bio");

    if (error) {
      console.error(error);
      alert(error.message);
      setSavingProfile(false);
      return;
    }

    const saved = data?.[0] || {
      id: loggedUser.id,
      ...newProfile,
    };

    const updated = {
      ...loggedUser,
      name: saved.name,
      profession: saved.profession,
      bio: saved.bio,
    };

    setLoggedUser(updated);

    setProfileForm({
      name: updated.name,
      profession: updated.profession,
      bio: updated.bio,
    });

    setSavingProfile(false);

    alert("Perfil actualizado correctamente.");

    await loadServices();
  }

  async function publishService(event) {
    event.preventDefault();

    if (!loggedUser) {
      setAccountMode("login");
      setPage("account");
      return;
    }

    if (!offer.serviceTitle.trim()) {
      alert("Escribe el nombre del servicio.");
      return;
    }

    if (!offer.description.trim()) {
      alert("Escribe una descripción.");
      return;
    }

    if (!offer.price || Number(offer.price) <= 0) {
      alert("Escribe un precio válido.");
      return;
    }

    setPublishing(true);

    const { error } = await supabase.from("services").insert({
      name: loggedUser.name,
      profession: loggedUser.profession,
      service_title: offer.serviceTitle.trim(),
      category: offer.category,
      description: offer.description.trim(),
      price: Number(offer.price),
      user_id: loggedUser.id,
    });

    if (error) {
      alert(error.message);
      setPublishing(false);
      return;
    }

    setOffer({
      serviceTitle: "",
      category: "Tecnología",
      description: "",
      price: "",
    });

    await loadServices();

    setPublishing(false);

    alert("Servicio publicado correctamente.");
    setPage("services");
  }

  async function register(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Escribe tu nombre.");
      return;
    }

    if (!form.email.trim()) {
      alert("Escribe tu correo.");
      return;
    }

    if (form.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setAuthLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          name: form.name.trim(),
          profession:
            form.profession.trim() || "Profesional",
          bio: form.bio.trim(),
        },
      },
    });

    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return;
    }

    if (data?.user) {
      const user = data.user;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: form.name.trim(),
            profession:
              form.profession.trim() || "Profesional",
            bio: form.bio.trim(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(profileError);
      }
    }

    setForm({
      name: "",
      email: "",
      password: "",
      profession: "",
      bio: "",
    });

    alert(
      "Cuenta creada correctamente. Si Supabase solicita confirmación por correo, confirma tu cuenta antes de iniciar sesión."
    );

    setAccountMode("login");
    setAuthLoading(false);
  }

  async function login(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      alert("Escribe tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return;
    }

    await refreshUser(data.user);

    setForm({
      name: "",
      email: "",
      password: "",
      profession: "",
      bio: "",
    });

    setAuthLoading(false);
    setPage("account");
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedUser(null);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
    setAccountMode("login");
  }

  useEffect(() => {
    let mounted = true;

    async function start() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data?.session?.user) {
        await refreshUser(data.session.user);
      }

      if (mounted) {
        setAuthLoading(false);
      }
    }

    start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        await refreshUser(session.user);
      } else {
        setLoggedUser(null);
      }

      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (loggedUser) {
      loadRequests();
    }
  }, [loggedUser]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        category === "Todas" ||
        service.category === category;

      if (!matchesCategory) return false;

      if (!term) return true;

      return [
        service.name,
        service.profession,
        service.service,
        service.category,
        service.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [services, search, category]);

  const myServices = useMemo(() => {
    if (!loggedUser) return [];

    return services.filter(
      (service) =>
        !service.demo &&
        service.userId === loggedUser.id
    );
  }, [services, loggedUser]);

  const myRequests = useMemo(() => {
    if (!loggedUser) return [];

    return requests.filter(
      (r) =>
        r.clientId === loggedUser.id ||
        r.providerId === loggedUser.id
    );
  }, [requests, loggedUser]);

  const pendingRequests = myRequests.filter(
    (r) =>
      r.status === "pending" &&
      r.providerId === loggedUser?.id
  );

  const acceptedRequests = myRequests.filter(
    (r) => r.status === "accepted"
  );

  const recentActivity = myRequests.slice(0, 4);

  function go(pageName) {
    setPage(pageName);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openService(service) {
    setSelectedService(service);
    setRequestMessage("");
    go("service");
  }

  function HomePage() {
    return (
      <>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              MARKETPLACE PROFESIONAL
            </span>

            <h1>
              Conecta talento
              <br />
              con oportunidades.
            </h1>

            <p>
              Encuentra profesionales, descubre servicios y
              conecta directamente con personas que pueden
              ayudarte a llevar tus proyectos más lejos.
            </p>

            <div className="hero-actions">
              <button
                className="primary"
                onClick={() => go("services")}
              >
                Explorar servicios
              </button>

              <button
                className="secondary"
                onClick={() =>
                  loggedUser
                    ? go("publish")
                    : setPage("account")
                }
              >
                Ofrecer mis servicios
              </button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CATEGORÍAS</span>
              <h2>Encuentra el talento que necesitas</h2>
            </div>

            <button
              className="text-button"
              onClick={() => go("categories")}
            >
              Ver todas →
            </button>
          </div>

          <div className="category-grid">
            {categories.slice(0, 6).map(([icon, name]) => (
              <button
                className="category-card"
                key={name}
                onClick={() => {
                  setCategory(name);
                  go("services");
                }}
              >
                <span>{icon}</span>
                <strong>{name}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="section soft-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DESTACADOS</span>
              <h2>Servicios profesionales</h2>
            </div>

            <button
              className="text-button"
              onClick={() => go("services")}
            >
              Ver todos →
            </button>
          </div>

          <div className="service-grid">
            {services.slice(0, 3).map((service) => (
              <ServiceCard
                key={`${service.demo ? "demo" : "real"}-${service.id}`}
                service={service}
                onOpen={openService}
              />
            ))}
          </div>
        </section>
      </>
    );
  }

  function ServicesPage() {
    return (
      <section className="section page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MARKETPLACE</span>
            <h2>Servicios</h2>
          </div>
        </div>

        <div className="search-panel">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicios..."
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map(([, name]) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {servicesLoading ? (
          <div className="empty-state">
            Cargando servicios...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">
            No encontramos servicios con esos criterios.
          </div>
        ) : (
          <div className="service-grid">
            {filteredServices.map((service) => (
              <ServiceCard
                key={`${service.demo ? "demo" : "real"}-${service.id}`}
                service={service}
                onOpen={openService}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  function CategoriesPage() {
    return (
      <section className="section page-section">
        <span className="eyebrow">EXPLORAR</span>
        <h2>Categorías</h2>

        <div className="category-grid category-grid-large">
          {categories.map(([icon, name]) => (
            <button
              className="category-card"
              key={name}
              onClick={() => {
                setCategory(name);
                go("services");
              }}
            >
              <span>{icon}</span>
              <strong>{name}</strong>
              <small>
                Explorar servicios de {name.toLowerCase()}
              </small>
            </button>
          ))}
        </div>
      </section>
    );
  }

  function ServicePage() {
    if (!selectedService) {
      return (
        <section className="section page-section">
          <button
            className="back-button"
            onClick={() => go("services")}
          >
            ← Volver
          </button>
        </section>
      );
    }

    return (
      <section className="section page-section">
        <button
          className="back-button"
          onClick={() => go("services")}
        >
          ← Volver a servicios
        </button>

        <div className="service-detail">
          <div className="service-detail-main">
            <span className="service-category">
              {selectedService.category}
            </span>

            <h2>{selectedService.service}</h2>

            <div className="professional-row">
              <Avatar name={selectedService.name} />

              <div>
                <strong>{selectedService.name}</strong>
                <span>{selectedService.profession}</span>
              </div>
            </div>

            <p className="detail-description">
              {selectedService.description}
            </p>

            <div className="detail-price">
              <small>Desde</small>
              <strong>${selectedService.price}</strong>
            </div>
          </div>

          <div className="request-box">
            <h3>¿Te interesa este servicio?</h3>

            {selectedService.demo ? (
              <>
                <p>
                  Este es un servicio de demostración. Los
                  servicios reales pueden recibir solicitudes.
                </p>

                <button
                  className="secondary full"
                  onClick={() => go("services")}
                >
                  Seguir explorando
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={requestMessage}
                  onChange={(e) =>
                    setRequestMessage(e.target.value)
                  }
                  placeholder="Escribe un mensaje para el profesional..."
                  rows="5"
                />

                <button
                  className="primary full"
                  disabled={sendingRequest}
                  onClick={sendRequest}
                >
                  {sendingRequest
                    ? "Enviando..."
                    : "Solicitar servicio"}
                </button>

                {loggedUser &&
                  selectedService.userId !== loggedUser.id && (
                    <button
                      className="secondary full"
                      onClick={() =>
                        openMessaging({
                          userId: selectedService.userId,
                          name: selectedService.name,
                          profession:
                            selectedService.profession,
                        })
                      }
                    >
                      💬 Contactar profesional
                    </button>
                  )}
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  function DashboardPage() {
    if (!loggedUser) {
      return <AccountPage />;
    }

    return (
      <section className="section page-section dashboard">
        <div className="dashboard-header">
          <div>
            <span className="eyebrow">MI CUENTA</span>
            <h2>Hola, {loggedUser.name}</h2>
            <p>
              Gestiona tu perfil, servicios y oportunidades
              desde un solo lugar.
            </p>
          </div>

          <div className="account-mini">
            <Avatar name={loggedUser.name} />
            <div>
              <strong>{loggedUser.name}</strong>
              <span>{loggedUser.profession}</span>
              <small>✓ Cuenta activa</small>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            icon="📋"
            value={myRequests.length}
            label="Solicitudes"
          />
          <StatCard
            icon="⏳"
            value={pendingRequests.length}
            label="Pendientes"
          />
          <StatCard
            icon="✓"
            value={acceptedRequests.length}
            label="Aceptadas"
          />
          <StatCard
            icon="💼"
            value={myServices.length}
            label="Servicios publicados"
          />
        </div>

        <div className="dashboard-grid">
          <form
            className="panel profile-panel"
            onSubmit={saveProfile}
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PERFIL</span>
                <h3>Tu información</h3>
              </div>
              <Avatar name={loggedUser.name} large />
            </div>

            <label>
              Nombre
              <input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    name: e.target.value,
                  })
                }
                placeholder="Tu nombre"
              />
            </label>

            <label>
              Profesión
              <input
                value={profileForm.profession}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    profession: e.target.value,
                  })
                }
                placeholder="Tu profesión"
              />
            </label>

            <label>
              Biografía
              <textarea
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    bio: e.target.value,
                  })
                }
                rows="5"
                placeholder="Cuéntale a los clientes quién eres..."
              />
            </label>

            <button
              className="primary full"
              disabled={savingProfile}
            >
              {savingProfile
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </form>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ACCIONES</span>
                <h3>Accesos rápidos</h3>
              </div>
            </div>

            <div className="quick-actions">
              <button onClick={() => go("publish")}>
                <span>➕</span>
                <div>
                  <strong>Publicar servicio</strong>
                  <small>Ofrece tus habilidades</small>
                </div>
              </button>

              <button onClick={() => go("requests")}>
                <span>📋</span>
                <div>
                  <strong>Ver solicitudes</strong>
                  <small>Gestiona tus oportunidades</small>
                </div>
              </button>

              <button onClick={() => go("messages")}>
                <span>💬</span>
                <div>
                  <strong>Abrir mensajes</strong>
                  <small>Comunícate directamente</small>
                </div>
              </button>

              <button onClick={logout}>
                <span>🚪</span>
                <div>
                  <strong>Cerrar sesión</strong>
                  <small>Salir de tu cuenta</small>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ACTIVIDAD</span>
              <h3>Actividad reciente</h3>
            </div>

            <button
              className="text-button"
              onClick={() => go("requests")}
            >
              Ver solicitudes →
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-small">
              Todavía no tienes actividad reciente.
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((request) => (
                <div
                  className="activity-item"
                  key={request.id}
                >
                  <span className={statusClass(request.status)}>
                    {statusText(request.status)}
                  </span>

                  <div>
                    <strong>{request.serviceTitle}</strong>
                    <small>
                      {request.providerId === loggedUser.id
                        ? `Solicitud de ${request.clientName}`
                        : `Solicitud enviada a ${request.providerName}`}
                    </small>
                  </div>

                  <time>
                    {dateText(request.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  function RequestsPage() {
    if (!loggedUser) return <AccountPage />;

    return (
      <section className="section page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GESTIÓN</span>
            <h2>Solicitudes</h2>
            <p>
              Gestiona los servicios que has solicitado o
              las solicitudes recibidas.
            </p>
          </div>
        </div>

        {loadingRequests ? (
          <div className="empty-state">
            Cargando solicitudes...
          </div>
        ) : myRequests.length === 0 ? (
          <div className="empty-state">
            <span>📋</span>
            <h3>Aún no tienes solicitudes</h3>
            <p>
              Explora servicios y envía tu primera solicitud.
            </p>
            <button
              className="primary"
              onClick={() => go("services")}
            >
              Explorar servicios
            </button>
          </div>
        ) : (
          <div className="request-list">
            {myRequests.map((request) => {
              const isProvider =
                request.providerId === loggedUser.id;

              return (
                <div className="request-card" key={request.id}>
                  <div className="request-top">
                    <div>
                      <span className="service-category">
                        {request.serviceCategory}
                      </span>

                      <h3>{request.serviceTitle}</h3>
                    </div>

                    <span className={statusClass(request.status)}>
                      {statusText(request.status)}
                    </span>
                  </div>

                  <div className="request-info">
                    <div>
                      <small>
                        {isProvider ? "Cliente" : "Profesional"}
                      </small>

                      <strong>
                        {isProvider
                          ? request.clientName
                          : request.providerName}
                      </strong>
                    </div>

                    <div>
                      <small>Precio</small>
                      <strong>
                        ${request.servicePrice}
                      </strong>
                    </div>

                    <div>
                      <small>Fecha</small>
                      <strong>
                        {dateText(request.created_at)}
                      </strong>
                    </div>
                  </div>

                  {request.message && (
                    <p className="request-message">
                      “{request.message}”
                    </p>
                  )}

                  <div className="request-actions">
                    {isProvider &&
                      request.status === "pending" && (
                        <>
                          <button
                            className="primary"
                            disabled={
                              updatingRequest === request.id
                            }
                            onClick={() =>
                              changeRequestStatus(
                                request.id,
                                "accepted"
                              )
                            }
                          >
                            ✓ Aceptar
                          </button>

                          <button
                            className="danger-button"
                            disabled={
                              updatingRequest === request.id
                            }
                            onClick={() =>
                              changeRequestStatus(
                                request.id,
                                "rejected"
                              )
                            }
                          >
                            Rechazar
                          </button>
                        </>
                      )}

                    {request.providerId !== loggedUser.id && (
                      <button
                        className="secondary"
                        onClick={() =>
                          openMessaging({
                            userId: request.providerId,
                            name: request.providerName,
                            profession: "Profesional",
                            requestId: request.id,
                          })
                        }
                      >
                        💬 Mensaje
                      </button>
                    )}

                    {request.providerId === loggedUser.id && (
                      <button
                        className="secondary"
                        onClick={() =>
                          openMessaging({
                            userId: request.clientId,
                            name: request.clientName,
                            profession: "Cliente",
                            requestId: request.id,
                          })
                        }
                      >
                        💬 Mensaje al cliente
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function MessagesPage() {
    if (!loggedUser) return <AccountPage />;

    if (!selectedContact) {
      return (
        <section className="section page-section">
          <span className="eyebrow">COMUNICACIÓN</span>
          <h2>Mensajes</h2>

          <div className="empty-state">
            <span>💬</span>
            <h3>Selecciona una conversación</h3>
            <p>
              Puedes abrir una conversación desde una
              solicitud o desde un servicio.
            </p>

            <button
              className="primary"
              onClick={() => go("requests")}
            >
              Ver solicitudes
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="section page-section messages-page">
        <button
          className="back-button"
          onClick={() => {
            setSelectedContact(null);
            go("requests");
          }}
        >
          ← Volver a solicitudes
        </button>

        <div className="chat">
          <div className="chat-header">
            <Avatar name={selectedContact.name} />

            <div>
              <span className="eyebrow">CONVERSACIÓN</span>
              <h3>{selectedContact.name}</h3>
              <small>{selectedContact.profession}</small>
            </div>
          </div>

          <div className="chat-body">
            {loadingMessages ? (
              <div className="chat-empty">
                Cargando mensajes...
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <span>💬</span>
                <p>
                  Todavía no hay mensajes. Escribe el primero.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const mine =
                  message.sender_id === loggedUser.id;

                return (
                  <div
                    key={message.id}
                    className={
                      mine
                        ? "message-row mine"
                        : "message-row"
                    }
                  >
                    <div className="message-bubble">
                      <p>{message.message}</p>
                      <small>
                        {dateText(message.created_at)}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="chat-form"
            onSubmit={sendMessage}
          >
            <input
              value={messageText}
              onChange={(e) =>
                setMessageText(e.target.value)
              }
              placeholder="Escribe un mensaje..."
              autoComplete="off"
            />

            <button
              className="primary"
              disabled={sendingMessage}
            >
              {sendingMessage ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  function PublishPage() {
    if (!loggedUser) return <AccountPage />;

    return (
      <section className="section page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OPORTUNIDAD</span>
            <h2>Publicar servicio</h2>
            <p>
              Presenta tus habilidades y permite que nuevos
              clientes te encuentren.
            </p>
          </div>
        </div>

        <form
          className="publish-form panel"
          onSubmit={publishService}
        >
          <label>
            Nombre del servicio
            <input
              value={offer.serviceTitle}
              onChange={(e) =>
                setOffer({
                  ...offer,
                  serviceTitle: e.target.value,
                })
              }
              placeholder="Ej. Diseño de logotipos"
            />
          </label>

          <label>
            Categoría
            <select
              value={offer.category}
              onChange={(e) =>
                setOffer({
                  ...offer,
                  category: e.target.value,
                })
              }
            >
              {categories.map(([, name]) => (
                <option value={name} key={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Descripción
            <textarea
              value={offer.description}
              onChange={(e) =>
                setOffer({
                  ...offer,
                  description: e.target.value,
                })
              }
              rows="7"
              placeholder="Describe claramente qué ofreces..."
            />
          </label>

          <label>
            Precio inicial
            <input
              type="number"
              min="1"
              step="0.01"
              value={offer.price}
              onChange={(e) =>
                setOffer({
                  ...offer,
                  price: e.target.value,
                })
              }
              placeholder="Ej. 50"
            />
          </label>

          <div className="publish-note">
            <strong>💡 Importante</strong>
            <p>
              RobLoren todavía no procesa pagos reales. El
              precio solamente informa al cliente del valor
              del servicio.
            </p>
          </div>

          <button
            className="primary full"
            disabled={publishing}
          >
            {publishing
              ? "Publicando..."
              : "Publicar servicio"}
          </button>
        </form>
      </section>
    );
  }

  function AccountPage() {
    return (
      <section className="section page-section auth-page">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="brand-mark">RL</span>

            <span className="eyebrow">
              ROBLOREN
            </span>

            <h2>
              {accountMode === "login"
                ? "Bienvenido de nuevo"
                : "Crea tu cuenta"}
            </h2>

            <p>
              {accountMode === "login"
                ? "Accede a tu cuenta para gestionar tus servicios y oportunidades."
                : "Únete a RobLoren y conecta tu talento con nuevas oportunidades."}
            </p>
          </div>

          {accountMode === "login" ? (
            <form onSubmit={login}>
              <label>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                />
              </label>

              <button
                className="primary full"
                disabled={authLoading}
              >
                {authLoading
                  ? "Entrando..."
                  : "Iniciar sesión"}
              </button>

              <button
                type="button"
                className="link-button"
                onClick={() => setAccountMode("register")}
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </form>
          ) : (
            <form onSubmit={register}>
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  autoComplete="name"
                  placeholder="Tu nombre"
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

              <label>
                Profesión
                <input
                  value={form.profession}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      profession: e.target.value,
                    })
                  }
                  placeholder="Ej. Diseñador gráfico"
                />
              </label>

              <label>
                Biografía
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bio: e.target.value,
                    })
                  }
                  rows="4"
                  placeholder="Cuéntanos brevemente sobre ti..."
                />
              </label>

              <button
                className="primary full"
                disabled={authLoading}
              >
                {authLoading
                  ? "Creando..."
                  : "Crear cuenta"}
              </button>

              <button
                type="button"
                className="link-button"
                onClick={() => setAccountMode("login")}
              >
                ← Ya tengo una cuenta
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  if (authLoading && page === "home" && !loggedUser) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">RL</div>
        <p>Cargando RobLoren...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root {
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #172033;
          background: #f7f9fc;
          font-synthesis: none;
          text-rendering: optimizeLegibility;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          min-width: 320px;
          background: #f7f9fc;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid #dce3ed;
          border-radius: 14px;
          padding: 13px 15px;
          background: #fff;
          color: #172033;
          outline: none;
          transition: border .15s ease, box-shadow .15s ease;
          font-size: 16px;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #315efb;
          box-shadow: 0 0 0 3px rgba(49,94,251,.10);
        }

        textarea {
          resize: vertical;
        }

        label {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          font-weight: 700;
          color: #273247;
          font-size: 14px;
        }

        label input,
        label textarea,
        label select {
          font-weight: 400;
        }

        .app {
          min-height: 100vh;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e9edf3;
        }

        .nav {
          max-width: 1180px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #172033;
          padding: 0;
        }

        .brand-name {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -.5px;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #315efb;
          color: #fff;
          font-weight: 900;
          box-shadow: 0 8px 20px rgba(49,94,251,.22);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-links button {
          border: 0;
          background: transparent;
          padding: 9px 12px;
          border-radius: 10px;
          color: #536075;
          font-weight: 700;
        }

        .nav-links button:hover {
          background: #f1f4f9;
          color: #172033;
        }

        .nav-account {
          border: 1px solid #dbe3ef !important;
          color: #172033 !important;
        }

        .hero {
          background:
            radial-gradient(circle at 80% 20%, rgba(49,94,251,.18), transparent 32%),
            linear-gradient(135deg, #101a31 0%, #1b2d55 100%);
          color: white;
        }

        .hero-content {
          max-width: 1180px;
          margin: 0 auto;
          padding: 100px 20px 110px;
        }

        .eyebrow {
          color: #315efb;
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 900;
        }

        .hero .eyebrow {
          color: #aebfff;
        }

        .hero h1 {
          max-width: 800px;
          margin: 15px 0;
          font-size: clamp(42px, 7vw, 76px);
          line-height: .98;
          letter-spacing: -3px;
        }

        .hero p {
          max-width: 650px;
          margin: 24px 0;
          font-size: 18px;
          line-height: 1.7;
          color: #d8e0ef;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary,
        .secondary,
        .danger-button {
          border: 0;
          border-radius: 12px;
          padding: 12px 17px;
          font-weight: 800;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .primary {
          background: #315efb;
          color: #fff;
          box-shadow: 0 8px 18px rgba(49,94,251,.20);
        }

        .primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 11px 23px rgba(49,94,251,.26);
        }

        .secondary {
          background: #fff;
          color: #24304a;
          border: 1px solid #dbe2ec;
        }

        .secondary:hover {
          transform: translateY(-1px);
        }

        .hero .secondary {
          background: rgba(255,255,255,.10);
          color: #fff;
          border-color: rgba(255,255,255,.22);
        }

        .danger-button {
          background: #fff0f0;
          color: #c43333;
          border: 1px solid #ffd2d2;
        }

        .full {
          width: 100%;
        }

        .section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 70px 20px;
        }

        .page-section {
          min-height: calc(100vh - 70px);
        }

        .soft-section {
          max-width: none;
          padding-left: max(20px, calc((100vw - 1140px) / 2));
          padding-right: max(20px, calc((100vw - 1140px) / 2));
          background: #eef3fa;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        h2 {
          margin: 5px 0 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.08;
          letter-spacing: -1.5px;
        }

        h3 {
          margin: 4px 0 0;
        }

        .section-heading p,
        .dashboard-header p {
          margin: 8px 0 0;
          color: #68758b;
          line-height: 1.6;
        }

        .text-button,
        .link-button {
          border: 0;
          background: transparent;
          color: #315efb;
          font-weight: 800;
          padding: 8px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .category-grid-large {
          grid-template-columns: repeat(4, 1fr);
          margin-top: 30px;
        }

        .category-card {
          min-height: 130px;
          border: 1px solid #e0e6ef;
          background: #fff;
          border-radius: 18px;
          padding: 22px;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          box-shadow: 0 8px 25px rgba(24,40,72,.04);
        }

        .category-card:hover {
          border-color: #b8c8f9;
          transform: translateY(-2px);
        }

        .category-card span {
          font-size: 30px;
        }

        .category-card strong {
          font-size: 16px;
        }

        .category-card small {
          color: #77849a;
        }

        .service-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .service-card {
          background: #fff;
          border: 1px solid #e1e7ef;
          border-radius: 20px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          min-height: 300px;
          box-shadow: 0 10px 30px rgba(25,42,74,.05);
        }

        .service-card:hover {
          border-color: #c2cff1;
          box-shadow: 0 15px 35px rgba(25,42,74,.08);
        }

        .service-category {
          display: inline-flex;
          width: fit-content;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eef2ff;
          color: #315efb;
          font-size: 11px;
          font-weight: 900;
        }

        .service-card h3 {
          font-size: 21px;
          line-height: 1.25;
          margin: 15px 0 8px;
        }

        .service-professional {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 15px;
        }

        .service-professional div:last-child {
          display: grid;
          gap: 2px;
        }

        .service-professional span,
        .professional-row span,
        .account-mini span,
        .account-mini small {
          color: #738096;
          font-size: 13px;
        }

        .service-description {
          color: #657288;
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }

        .service-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
        }

        .price {
          font-size: 22px;
          font-weight: 900;
        }

        .price small {
          display: block;
          color: #8390a3;
          font-size: 11px;
          font-weight: 600;
        }

        .avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #e8edff;
          color: #315efb;
          font-weight: 900;
        }

        .avatar-large {
          width: 58px;
          height: 58px;
          min-width: 58px;
          font-size: 21px;
        }

        .search-panel {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
        }

        .back-button {
          border: 0;
          background: transparent;
          color: #315efb;
          font-weight: 800;
          padding: 0;
          margin-bottom: 25px;
        }

        .service-detail {
          display: grid;
          grid-template-columns: 1.6fr .8fr;
          gap: 24px;
        }

        .service-detail-main,
        .request-box,
        .panel,
        .auth-card,
        .chat,
        .request-card {
          background: #fff;
          border: 1px solid #e0e6ef;
          border-radius: 22px;
          box-shadow: 0 10px 35px rgba(25,42,74,.05);
        }

        .service-detail-main {
          padding: 35px;
        }

        .service-detail-main h2 {
          margin: 20px 0;
        }

        .professional-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 25px 0;
        }

        .professional-row div:last-child {
          display: grid;
          gap: 4px;
        }

        .detail-description {
          color: #59677e;
          line-height: 1.8;
          font-size: 16px;
        }

        .detail-price {
          margin-top: 35px;
          display: grid;
        }

        .detail-price small {
          color: #7c899c;
        }

        .detail-price strong {
          font-size: 35px;
        }

        .request-box {
          padding: 25px;
          height: fit-content;
        }

        .request-box h3 {
          margin-bottom: 10px;
        }

        .request-box p {
          color: #68758b;
          line-height: 1.6;
        }

        .request-box .secondary {
          margin-top: 10px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
          margin-bottom: 30px;
        }

        .account-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: #fff;
          border: 1px solid #e1e7ef;
          border-radius: 16px;
        }

        .account-mini div:last-child {
          display: grid;
          gap: 3px;
        }

        .account-mini small {
          color: #23925a;
          font-weight: 800;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e0e6ef;
          border-radius: 18px;
          padding: 20px;
        }

        .stat-card span {
          font-size: 25px;
        }

        .stat-card strong {
          display: block;
          font-size: 30px;
          margin-top: 8px;
        }

        .stat-card small {
          color: #78859a;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.3fr .7fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .panel {
          padding: 25px;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .quick-actions {
          display: grid;
          gap: 9px;
        }

        .quick-actions button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          border: 1px solid #e6ebf2;
          background: #f9fbfd;
          border-radius: 14px;
          padding: 15px;
        }

        .quick-actions button:hover {
          border-color: #c8d3ee;
          background: #fff;
        }

        .quick-actions button > span {
          font-size: 22px;
        }

        .quick-actions button div {
          display: grid;
          gap: 3px;
        }

        .quick-actions small {
          color: #7b879a;
        }

        .activity-list {
          display: grid;
        }

        .activity-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .activity-item:last-child {
          border-bottom: 0;
        }

        .activity-item div {
          display: grid;
          gap: 3px;
        }

        .activity-item small,
        .activity-item time {
          color: #7a879a;
          font-size: 12px;
        }

        .status {
          display: inline-flex;
          width: fit-content;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .status.pending {
          background: #fff6dd;
          color: #9a6b00;
        }

        .status.accepted {
          background: #e7f8ef;
          color: #16814b;
        }

        .status.rejected {
          background: #ffeded;
          color: #ba3636;
        }

        .empty-small,
        .empty-state {
          color: #718097;
          text-align: center;
          padding: 30px;
        }

        .empty-state {
          min-height: 250px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          border: 1px dashed #d6deea;
          border-radius: 20px;
          background: #fff;
        }

        .empty-state span {
          font-size: 35px;
        }

        .empty-state h3,
        .empty-state p {
          margin: 0;
        }

        .request-list {
          display: grid;
          gap: 15px;
        }

        .request-card {
          padding: 23px;
        }

        .request-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .request-top h3 {
          margin-top: 10px;
        }

        .request-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          padding: 18px 0;
          margin-top: 18px;
          border-top: 1px solid #edf0f4;
          border-bottom: 1px solid #edf0f4;
        }

        .request-info div {
          display: grid;
          gap: 4px;
        }

        .request-info small {
          color: #7b879a;
        }

        .request-message {
          color: #68758b;
          line-height: 1.6;
        }

        .request-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .publish-form {
          max-width: 760px;
          margin: 0 auto;
        }

        .publish-note {
          background: #f1f5ff;
          border: 1px solid #d8e1ff;
          border-radius: 14px;
          padding: 15px;
          margin-bottom: 18px;
        }

        .publish-note strong {
          color: #315efb;
        }

        .publish-note p {
          margin: 5px 0 0;
          color: #62708a;
          line-height: 1.5;
        }

        .auth-page {
          display: grid;
          place-items: center;
        }

        .auth-card {
          width: min(100%, 500px);
          padding: 32px;
        }

        .auth-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .auth-heading .brand-mark {
          margin: 0 auto 15px;
        }

        .auth-heading h2 {
          margin-top: 9px;
        }

        .auth-heading p {
          color: #738096;
          line-height: 1.6;
        }

        .link-button {
          width: 100%;
          margin-top: 12px;
        }

        .chat {
          max-width: 850px;
          margin: 0 auto;
          overflow: hidden;
        }

        .chat-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 13px;
          border-bottom: 1px solid #e8edf3;
        }

        .chat-header h3 {
          font-size: 20px;
        }

        .chat-header div:last-child {
          display: grid;
          gap: 2px;
        }

        .chat-header small {
          color: #7b879a;
        }

        .chat-body {
          min-height: 430px;
          max-height: 60vh;
          overflow-y: auto;
          padding: 20px;
          background: #f8fafc;
        }

        .chat-empty {
          min-height: 350px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          color: #748198;
          text-align: center;
        }

        .chat-empty span {
          font-size: 35px;
        }

        .message-row {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;
        }

        .message-row.mine {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: min(75%, 520px);
          padding: 11px 14px;
          border-radius: 16px 16px 16px 5px;
          background: #fff;
          border: 1px solid #e1e7ef;
        }

        .message-row.mine .message-bubble {
          border-radius: 16px 16px 5px 16px;
          background: #315efb;
          border-color: #315efb;
          color: #fff;
        }

        .message-bubble p {
          margin: 0 0 5px;
          line-height: 1.5;
        }

        .message-bubble small {
          font-size: 10px;
          opacity: .7;
        }

        .chat-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid #e8edf3;
          background: #fff;
        }

        .loading-screen {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 15px;
          color: #718097;
        }

        @media (max-width: 850px) {
          .nav {
            padding: 11px 14px;
          }

          .nav-links {
            display: none;
          }

          .hero-content {
            padding: 70px 20px 80px;
          }

          .hero h1 {
            letter-spacing: -2px;
          }

          .category-grid,
          .category-grid-large,
          .service-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .service-detail,
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .section {
            padding: 45px 15px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .category-grid,
          .category-grid-large,
          .service-grid,
          .stats-grid,
          .search-panel,
          .request-info {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 43px;
          }

          .hero p {
            font-size: 16px;
          }

          .hero-actions {
            display: grid;
          }

          .hero-actions button {
            width: 100%;
          }

          .service-detail-main,
          .request-box,
          .panel,
          .auth-card {
            padding: 20px;
          }

          .request-top {
            flex-direction: column;
          }

          .request-info {
            gap: 10px;
          }

          .activity-item {
            grid-template-columns: auto 1fr;
          }

          .activity-item time {
            grid-column: 2;
          }

          .chat-form {
            grid-template-columns: 1fr;
          }

          .chat-body {
            min-height: 400px;
          }

          .message-bubble {
            max-width: 88%;
          }
        }
      `}</style>

      <div className="app">
        <header className="topbar">
          <nav className="nav">
            <button
              className="brand"
              onClick={() => go("home")}
            >
              <span className="brand-mark">RL</span>
              <span className="brand-name">RobLoren</span>
            </button>

            <div className="nav-links">
              <button onClick={() => go("home")}>
                Inicio
              </button>

              <button onClick={() => go("services")}>
                Servicios
              </button>

              <button onClick={() => go("categories")}>
                Categorías
              </button>

              {loggedUser && (
                <>
                  <button onClick={() => go("requests")}>
                    Solicitudes
                  </button>

                  <button onClick={() => go("messages")}>
                    Mensajes
                  </button>
                </>
              )}

              <button
                className="nav-account"
                onClick={() =>
                  loggedUser
                    ? go("account")
                    : go("account")
                }
              >
                {loggedUser ? "Mi cuenta" : "Entrar"}
              </button>
            </div>
          </nav>
        </header>

        <main>
          {page === "home" && <HomePage />}
          {page === "services" && <ServicesPage />}
          {page === "categories" && <CategoriesPage />}
          {page === "service" && <ServicePage />}
          {page === "account" && <DashboardPage />}
          {page === "requests" && <RequestsPage />}
          {page === "messages" && <MessagesPage />}
          {page === "publish" && <PublishPage />}
        </main>

        <footer
          style={{
            borderTop: "1px solid #e5eaf1",
            background: "#fff",
            padding: "28px 20px",
            textAlign: "center",
            color: "#77849a",
            fontSize: "13px",
          }}
        >
          <strong style={{ color: "#172033" }}>
            RobLoren
          </strong>{" "}
          · Conecta talento con oportunidades.
        </footer>
      </div>
    </>
  );
}

function ServiceCard({ service, onOpen }) {
  return (
    <article className="service-card">
      <span className="service-category">
        {service.category}
      </span>

      <h3>{service.service}</h3>

      <div className="service-professional">
        <Avatar name={service.name} />

        <div>
          <strong>{service.name}</strong>
          <span>{service.profession}</span>
        </div>
      </div>

      <p className="service-description">
        {service.description}
      </p>

      <div className="service-bottom">
        <div className="price">
          <small>Desde</small>${service.price}
        </div>

        <button
          className="primary"
          onClick={() => onOpen(service)}
        >
          Ver servicio
        </button>
      </div>
    </article>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
