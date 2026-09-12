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

const initialServices = [
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

function mapSupabaseService(service, profile = null) {
  return {
    id: service.id,
    name: profile?.name || service.name || "Profesional",
    profession:
      profile?.profession || service.profession || "Profesional",
    service:
      service.service_title ||
      service.service ||
      "Servicio profesional",
    category: service.category || "Otros",
    description:
      service.description ||
      "Servicio profesional ofrecido en RobLoren.",
    price: Number(service.price) || 0,
    userId: service.user_id || null,
    demo: false,
  };
}

function buildLoggedUser(user, profile = null) {
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
    bio: profile?.bio || "",
  };
}

function statusLabel(status) {
  if (status === "accepted") return "Aceptada";
  if (status === "rejected") return "Rechazada";
  return "Pendiente";
}

function formatMessageDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function App() {
  const [page, setPage] = useState("home");
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [services, setServices] = useState(initialServices);

  const [accountMode, setAccountMode] = useState("login");
  const [loggedUser, setLoggedUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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

  const [savingProfile, setSavingProfile] = useState(false);

  async function ensureUserProfile(user) {
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,profession,bio")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando perfil:", error);
      return null;
    }

    if (data) return data;

    const profile = {
      id: user.id,
      name:
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        "Usuario",
      profession:
        user.user_metadata?.profession || "Profesional",
      bio: user.user_metadata?.bio || "",
    };

    const {
      data: createdProfile,
      error: createError,
    } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (createError) {
      console.error("Error creando perfil:", createError);
      return null;
    }

    return createdProfile;
  }

  async function refreshLoggedUser(user) {
    if (!user) {
      setLoggedUser(null);
      return;
    }

    const profile = await ensureUserProfile(user);
    const nextUser = buildLoggedUser(user, profile);

    setLoggedUser(nextUser);

    setProfileForm({
      name: nextUser.name || "",
      profession: nextUser.profession || "",
      bio: nextUser.bio || "",
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
      console.error("Error cargando servicios:", error);
      setServices(initialServices);
      setServicesLoading(false);
      return;
    }

    const rows = data || [];

    const userIds = [
      ...new Set(
        rows.map((service) => service.user_id).filter(Boolean)
      ),
    ];

    let profilesById = {};

    if (userIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select("id,name,profession,bio")
        .in("id", userIds);

      if (profilesError) {
        console.error(
          "Error cargando perfiles:",
          profilesError
        );
      } else {
        profilesById = Object.fromEntries(
          (profiles || []).map((profile) => [
            profile.id,
            profile,
          ])
        );
      }
    }

    const realServices = rows.map((service) =>
      mapSupabaseService(
        service,
        profilesById[service.user_id]
      )
    );

    setServices([...realServices, ...initialServices]);
    setServicesLoading(false);
  }

  async function loadRequests() {
    if (!loggedUser?.id) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);

    const userId = loggedUser.id;

    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .or(
        `client_id.eq.${userId},provider_id.eq.${userId}`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error cargando solicitudes:",
        error
      );
      setRequests([]);
      setLoadingRequests(false);
      return;
    }

    const rows = data || [];

    const profileIds = [
      ...new Set(
        rows
          .flatMap((request) => [
            request.client_id,
            request.provider_id,
          ])
          .filter(Boolean)
      ),
    ];

    const serviceIds = [
      ...new Set(
        rows
          .map((request) => request.service_id)
          .filter(Boolean)
      ),
    ];

    let profilesById = {};
    let servicesById = {};

    if (profileIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select("id,name,profession,bio")
        .in("id", profileIds);

      if (profilesError) {
        console.error(
          "Error cargando perfiles de solicitudes:",
          profilesError
        );
      } else {
        profilesById = Object.fromEntries(
          (profiles || []).map((profile) => [
            profile.id,
            profile,
          ])
        );
      }
    }

    if (serviceIds.length > 0) {
      const {
        data: serviceRows,
        error: servicesError,
      } = await supabase
        .from("services")
        .select(
          "id,service_title,category,description,price,user_id"
        )
        .in("id", serviceIds);

      if (servicesError) {
        console.error(
          "Error cargando servicios de solicitudes:",
          servicesError
        );
      } else {
        servicesById = Object.fromEntries(
          (serviceRows || []).map((service) => [
            service.id,
            service,
          ])
        );
      }
    }

    const enrichedRequests = rows.map((request) => {
      const service = servicesById[request.service_id];
      const clientProfile =
        profilesById[request.client_id];
      const providerProfile =
        profilesById[request.provider_id];

      return {
        ...request,
        clientName:
          clientProfile?.name ||
          (request.client_id === userId
            ? loggedUser.name
            : "Cliente"),
        providerName:
          providerProfile?.name ||
          (request.provider_id === userId
            ? loggedUser.name
            : "Profesional"),
        serviceTitle:
          service?.service_title ||
          "Servicio profesional",
        serviceCategory:
          service?.category || "Otros",
        serviceDescription:
          service?.description || "",
        servicePrice:
          Number(service?.price) || 0,
      };
    });

    setRequests(enrichedRequests);
    setLoadingRequests(false);
  }

  async function loadMessages(contactId) {
    if (!loggedUser?.id || !contactId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    const userId = loggedUser.id;

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id,created_at,sender_id,receiver_id,request_id,message"
      )
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "Error cargando mensajes:",
        error
      );
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(data || []);
    setLoadingMessages(false);
  }

  async function sendMessage(event) {
    if (event) {
      event.preventDefault();
    }

    if (!loggedUser?.id) {
      alert(
        "Debes iniciar sesión para enviar mensajes."
      );
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!selectedContact?.id) {
      alert("No hay un contacto seleccionado.");
      return;
    }

    const text = messageText.trim();

    if (!text) return;

    if (selectedContact.id === loggedUser.id) {
      alert(
        "No puedes enviarte mensajes a ti mismo."
      );
      return;
    }

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: loggedUser.id,
        receiver_id: selectedContact.id,
        request_id:
          selectedContact.requestId || null,
        message: text,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error enviando mensaje:",
        error
      );
      alert(error.message);
      setSendingMessage(false);
      return;
    }

    setMessages((current) => [...current, data]);
    setMessageText("");
    setSendingMessage(false);
  }

  async function openMessaging(contact) {
    if (!loggedUser) {
      alert(
        "Debes iniciar sesión para utilizar la mensajería."
      );
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
      alert(
        "No puedes iniciar una conversación contigo mismo."
      );
      return;
    }

    const contactData = {
      id: contact.userId,
      name: contact.name || "Profesional",
      profession:
        contact.profession || "Profesional",
      requestId: contact.requestId || null,
    };

    setSelectedContact(contactData);
    setMessageText("");
    setMessages([]);
    setPage("messages");

    await loadMessages(contactData.id);
  }

  function openMessagingFromRequest(request) {
    if (!loggedUser) return;

    const isProvider =
      request.provider_id === loggedUser.id;

    const contactId = isProvider
      ? request.client_id
      : request.provider_id;

    const contactName = isProvider
      ? request.clientName
      : request.providerName;

    const contactProfession = isProvider
      ? "Cliente"
      : "Profesional";

    openMessaging({
      userId: contactId,
      name: contactName,
      profession: contactProfession,
      requestId: request.id,
    });
  }

  async function openRequests() {
    if (!loggedUser) {
      setPage("account");
      setAccountMode("login");
      return;
    }

    await loadRequests();
    setPage("requests");
  }

  async function sendServiceRequest() {
    if (!loggedUser) {
      alert(
        "Debes iniciar sesión para solicitar un servicio."
      );
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!selectedService) return;

    if (!selectedService.userId) {
      alert(
        "Este servicio de demostración todavía no puede recibir solicitudes."
      );
      return;
    }

    if (selectedService.userId === loggedUser.id) {
      alert(
        "No puedes solicitar tu propio servicio."
      );
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
      console.error(
        "Error creando solicitud:",
        error
      );
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

  async function updateRequestStatus(
    requestId,
    status
  ) {
    if (!loggedUser?.id) return;

    setUpdatingRequestId(requestId);

    const { error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", requestId)
      .eq("provider_id", loggedUser.id);

    if (error) {
      console.error(
        "Error actualizando solicitud:",
        error
      );
      alert(error.message);
      setUpdatingRequestId(null);
      return;
    }

    await loadRequests();
    setUpdatingRequestId(null);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!loggedUser?.id) return;

    const name = profileForm.name.trim();
    const profession =
      profileForm.profession.trim();
    const bio = profileForm.bio.trim();

    if (!name) {
      alert("Escribe tu nombre.");
      return;
    }

    setSavingProfile(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name,
        profession:
          profession || "Profesional",
        bio,
      })
      .eq("id", loggedUser.id)
      .select()
      .single();

    if (error) {
      console.error(
        "Error actualizando perfil:",
        error
      );
      alert(error.message);
      setSavingProfile(false);
      return;
    }

    const updatedUser = {
      ...loggedUser,
      name: data.name || name,
      profession:
        data.profession ||
        profession ||
        "Profesional",
      bio: data.bio || bio,
    };

    setLoggedUser(updatedUser);
    setProfileForm({
      name: updatedUser.name,
      profession: updatedUser.profession,
      bio: updatedUser.bio,
    });

    setSavingProfile(false);
    alert("Perfil actualizado correctamente.");

    await loadServices();
  }

  async function register(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const profession =
      form.profession.trim();
    const bio = form.bio.trim();

    if (!name || !email || !password) {
      alert(
        "Completa nombre, correo y contraseña."
      );
      return;
    }

    if (password.length < 6) {
      alert(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setAuthLoading(true);

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            profession:
              profession || "Profesional",
            bio,
          },
        },
      });

    if (error) {
      console.error(
        "Error registrando usuario:",
        error
      );
      alert(error.message);
      setAuthLoading(false);
      return;
    }

    if (data.user && !data.session) {
      alert(
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta."
      );
    } else if (data.user) {
      await refreshLoggedUser(data.user);
      alert("Cuenta creada correctamente.");
      setPage("account");
    }

    setForm({
      name: "",
      email: "",
      password: "",
      profession: "",
      bio: "",
    });

    setAuthLoading(false);
  }

  async function login(event) {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      alert(
        "Escribe tu correo y contraseña."
      );
      return;
    }

    setAuthLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error(
        "Error iniciando sesión:",
        error
      );
      alert(error.message);
      setAuthLoading(false);
      return;
    }

    await refreshLoggedUser(data.user);
    setPage("account");

    setForm({
      name: "",
      email,
      password: "",
      profession: "",
      bio: "",
    });

    setAuthLoading(false);
  }

  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
      alert(error.message);
      return;
    }

    setLoggedUser(null);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
    setAccountMode("login");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateProfileForm(field, value) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openService(service) {
    setSelectedService(service);
    setRequestMessage("");
    setPage("service");
  }

  function openAccount() {
    setPage("account");

    if (loggedUser) {
      setProfileForm({
        name: loggedUser.name || "",
        profession:
          loggedUser.profession || "",
        bio: loggedUser.bio || "",
      });
    }
  }

  useEffect(() => {
    async function loadAuth() {
      setAuthLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await refreshLoggedUser(session.user);
      } else {
        setLoggedUser(null);
      }

      setAuthLoading(false);
    }

    loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await refreshLoggedUser(session.user);
        } else {
          setLoggedUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (loggedUser?.id) {
      loadRequests();
    } else {
      setRequests([]);
    }
  }, [loggedUser?.id]);

  const filteredServices = useMemo(() => {
    const text = search
      .trim()
      .toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === "Todas" ||
        service.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!text) return true;

      return [
        service.name,
        service.profession,
        service.service,
        service.category,
        service.description,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(text)
        );
    });
  }, [
    services,
    search,
    selectedCategory,
  ]);

  const receivedRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.provider_id ===
          loggedUser?.id
      ),
    [requests, loggedUser?.id]
  );

  const sentRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.client_id ===
          loggedUser?.id
      ),
    [requests, loggedUser?.id]
  );

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const publishedServices = services.filter(
    (service) =>
      !service.demo &&
      service.userId === loggedUser?.id
  ).length;

  function Header() {
    return (
      <header style={styles.header}>
        <div
          style={styles.headerInner}
        >
          <button
            style={styles.logoButton}
            onClick={() => setPage("home")}
          >
            <span style={styles.logoMark}>
              R
            </span>
            <span style={styles.logoText}>
              Rob<span>Loren</span>
            </span>
          </button>

          <nav style={styles.nav}>
            <button
              style={styles.navButton}
              onClick={() => setPage("home")}
            >
              Inicio
            </button>

            <button
              style={styles.navButton}
              onClick={() => {
                setPage("home");
                setTimeout(() => {
                  document
                    .getElementById("services")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }, 50);
              }}
            >
              Servicios
            </button>

            {loggedUser && (
              <button
                style={styles.navButton}
                onClick={openRequests}
              >
                Solicitudes
              </button>
            )}

            <button
              style={
                loggedUser
                  ? styles.navAccountButton
                  : styles.navPrimaryButton
              }
              onClick={openAccount}
            >
              {loggedUser
                ? "Mi cuenta"
                : "Entrar"}
            </button>
          </nav>
        </div>
      </header>
    );
  }

  function HomePage() {
    return (
      <>
        <section style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.heroCopy}>
              <div style={styles.badge}>
                ✦ Marketplace profesional
              </div>

              <h1 style={styles.heroTitle}>
                Conecta talento
                <br />
                <span>con oportunidades.</span>
              </h1>

              <p style={styles.heroText}>
                Encuentra profesionales,
                publica tus servicios y conecta
                con clientes dentro de una
                plataforma creada para crecer.
              </p>

              <div style={styles.heroActions}>
                <button
                  style={styles.primaryButton}
                  onClick={() => {
                    document
                      .getElementById("services")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                >
                  Explorar servicios
                </button>

                <button
                  style={styles.outlineButton}
                  onClick={() => {
                    if (!loggedUser) {
                      setAccountMode("register");
                      setPage("account");
                    } else {
                      setPage("offer");
                    }
                  }}
                >
                  Ofrecer mis servicios
                </button>
              </div>
            </div>

            <div style={styles.heroCard}>
              <div style={styles.heroCardTop}>
                <span>
                  🔎
                </span>
                <strong>
                  Encuentra talento
                </strong>
              </div>

              <div style={styles.heroSearch}>
                <span>¿Qué servicio buscas?</span>
                <span>⌕</span>
              </div>

              <div style={styles.heroTags}>
                <span>💻 Tecnología</span>
                <span>🎨 Diseño</span>
                <span>📣 Marketing</span>
              </div>

              <div style={styles.heroMiniStats}>
                <div>
                  <strong>+100</strong>
                  <span>Servicios</span>
                </div>
                <div>
                  <strong>+50</strong>
                  <span>Profesionales</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Conexiones</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.categoriesSection}>
          <div style={styles.sectionContainer}>
            <div style={styles.sectionHeader}>
              <div>
                <span style={styles.eyebrow}>
                  EXPLORA
                </span>
                <h2 style={styles.sectionTitle}>
                  Encuentra el servicio que necesitas
                </h2>
              </div>

              <p style={styles.sectionSubtext}>
                Profesionales listos para ayudarte.
              </p>
            </div>

            <div style={styles.categoryGrid}>
              <button
                style={
                  selectedCategory === "Todas"
                    ? styles.categoryCardActive
                    : styles.categoryCard
                }
                onClick={() =>
                  setSelectedCategory("Todas")
                }
              >
                <span style={styles.categoryIcon}>
                  ✨
                </span>
                <strong>Todas</strong>
              </button>

              {categories.map(
                ([icon, name]) => (
                  <button
                    key={name}
                    style={
                      selectedCategory === name
                        ? styles.categoryCardActive
                        : styles.categoryCard
                    }
                    onClick={() =>
                      setSelectedCategory(name)
                    }
                  >
                    <span style={styles.categoryIcon}>
                      {icon}
                    </span>
                    <strong>{name}</strong>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <section
          id="services"
          style={styles.servicesSection}
        >
          <div style={styles.sectionContainer}>
            <div style={styles.servicesToolbar}>
              <div>
                <span style={styles.eyebrow}>
                  SERVICIOS
                </span>
                <h2 style={styles.sectionTitle}>
                  Profesionales disponibles
                </h2>
              </div>

              <div style={styles.searchBox}>
                <span>🔎</span>
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar servicios..."
                  style={styles.searchInput}
                />
              </div>
            </div>

            {servicesLoading ? (
              <div style={styles.loadingBox}>
                Cargando servicios...
              </div>
            ) : filteredServices.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={styles.emptyIcon}>
                  🔎
                </div>
                <h3>No encontramos servicios</h3>
                <p>
                  Prueba con otra búsqueda o
                  categoría.
                </p>
              </div>
            ) : (
              <div style={styles.serviceGrid}>
                {filteredServices.map(
                  (service) => (
                    <article
                      key={`${service.demo ? "demo" : "real"}-${service.id}`}
                      style={styles.serviceCard}
                    >
                      <div
                        style={styles.serviceCardTop}
                      >
                        <div
                          style={
                            styles.serviceAvatar
                          }
                        >
                          {service.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "R"}
                        </div>

                        <div
                          style={
                            styles.serviceProvider
                          }
                        >
                          <strong>
                            {service.name}
                          </strong>
                          <span>
                            {service.profession}
                          </span>
                        </div>

                        <span
                          style={
                            styles.categoryPill
                          }
                        >
                          {service.category}
                        </span>
                      </div>

                      <h3
                        style={
                          styles.serviceTitle
                        }
                      >
                        {service.service}
                      </h3>

                      <p
                        style={
                          styles.serviceDescription
                        }
                      >
                        {service.description}
                      </p>

                      <div
                        style={
                          styles.serviceFooter
                        }
                      >
                        <div>
                          <span
                            style={
                              styles.priceLabel
                            }
                          >
                            Desde
                          </span>
                          <strong
                            style={
                              styles.price
                            }
                          >
                            ${service.price}
                          </strong>
                        </div>

                        <button
                          style={
                            styles.viewButton
                          }
                          onClick={() =>
                            openService(
                              service
                            )
                          }
                        >
                          Ver servicio →
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        <section style={styles.ctaSection}>
          <div style={styles.ctaInner}>
            <div>
              <span style={styles.eyebrow}>
                ROBLOREN
              </span>
              <h2 style={styles.ctaTitle}>
                Tu talento merece
                <br />
                nuevas oportunidades.
              </h2>
              <p style={styles.ctaText}>
                Crea tu perfil y comienza a
                ofrecer tus servicios.
              </p>
            </div>

            <button
              style={styles.ctaButton}
              onClick={() => {
                if (!loggedUser) {
                  setAccountMode("register");
                  setPage("account");
                } else {
                  setPage("offer");
                }
              }}
            >
              Comenzar ahora →
            </button>
          </div>
        </section>
      </>
    );
  }

  function AccountPage() {
    if (loggedUser) {
      return (
        <section style={styles.pageSection}>
          <div style={styles.dashboardContainer}>
            <div style={styles.dashboardHeader}>
              <div>
                <span style={styles.eyebrow}>
                  CUENTA PROFESIONAL
                </span>
                <h1 style={styles.dashboardTitle}>
                  Hola, {loggedUser.name}
                </h1>
                <p style={styles.dashboardSubtitle}>
                  Gestiona tu perfil, servicios y
                  oportunidades desde un solo lugar.
                </p>
              </div>

              <div style={styles.accountHeaderAvatar}>
                {loggedUser.name
                  ?.charAt(0)
                  ?.toUpperCase() || "R"}
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  📋
                </span>
                <div>
                  <strong>
                    {requests.length}
                  </strong>
                  <span>
                    Solicitudes
                  </span>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  ⏳
                </span>
                <div>
                  <strong>
                    {pendingRequests}
                  </strong>
                  <span>
                    Pendientes
                  </span>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  ✓
                </span>
                <div>
                  <strong>
                    {acceptedRequests}
                  </strong>
                  <span>
                    Aceptadas
                  </span>
                </div>
              </div>

              <div style={styles.statCard}>
                <span style={styles.statIcon}>
                  🛠️
                </span>
                <div>
                  <strong>
                    {publishedServices}
                  </strong>
                  <span>
                    Servicios publicados
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.dashboardGrid}>
              <div style={styles.dashboardMain}>
                <div style={styles.panelCard}>
                  <div style={styles.panelHeader}>
                    <div>
                      <span style={styles.eyebrow}>
                        PERFIL
                      </span>
                      <h2 style={styles.panelTitle}>
                        Tu información
                      </h2>
                    </div>
                    <span style={styles.panelIcon}>
                      👤
                    </span>
                  </div>

                  <form
                    onSubmit={saveProfile}
                    style={styles.profileForm}
                  >
                    <label style={styles.label}>
                      Nombre
                      <input
                        value={
                          profileForm.name
                        }
                        onChange={(event) =>
                          updateProfileForm(
                            "name",
                            event.target.value
                          )
                        }
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Profesión
                      <input
                        value={
                          profileForm.profession
                        }
                        onChange={(event) =>
                          updateProfileForm(
                            "profession",
                            event.target.value
                          )
                        }
                        style={styles.input}
                      />
                    </label>

                    <label style={styles.label}>
                      Biografía
                      <textarea
                        value={
                          profileForm.bio
                        }
                        onChange={(event) =>
                          updateProfileForm(
                            "bio",
                            event.target.value
                          )
                        }
                        style={
                          styles.textarea
                        }
                        placeholder="Cuéntales a tus clientes sobre ti..."
                      />
                    </label>

                    <button
                      type="submit"
                      style={
                        styles.primaryButton
                      }
                      disabled={
                        savingProfile
                      }
                    >
                      {savingProfile
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </form>
                </div>

                <div style={styles.panelCard}>
                  <div style={styles.panelHeader}>
                    <div>
                      <span style={styles.eyebrow}>
                        ACTIVIDAD
                      </span>
                      <h2 style={styles.panelTitle}>
                        Resumen de actividad
                      </h2>
                    </div>
                    <span style={styles.panelIcon}>
                      📊
                    </span>
                  </div>

                  <div style={styles.activityList}>
                    <button
                      style={
                        styles.activityItem
                      }
                      onClick={openRequests}
                    >
                      <span
                        style={
                          styles.activityIcon
                        }
                      >
                        📋
                      </span>
                      <div>
                        <strong>
                          Solicitudes
                        </strong>
                        <span>
                          Revisa las solicitudes
                          enviadas y recibidas.
                        </span>
                      </div>
                      <span>→</span>
                    </button>

                    <button
                      style={
                        styles.activityItem
                      }
                      onClick={() =>
                        setPage("messages")
                      }
                    >
                      <span
                        style={
                          styles.activityIcon
                        }
                      >
                        💬
                      </span>
                      <div>
                        <strong>
                          Mensajes
                        </strong>
                        <span>
                          Comunícate con clientes y
                          profesionales.
                        </span>
                      </div>
                      <span>→</span>
                    </button>

                    <button
                      style={
                        styles.activityItem
                      }
                      onClick={() =>
                        setPage("offer")
                      }
                    >
                      <span
                        style={
                          styles.activityIcon
                        }
                      >
                        ➕
                      </span>
                      <div>
                        <strong>
                          Publicar servicio
                        </strong>
                        <span>
                          Añade una nueva oferta a
                          RobLoren.
                        </span>
                      </div>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              <aside style={styles.dashboardSide}>
                <div style={styles.profileSummary}>
                  <div
                    style={
                      styles.profileSummaryAvatar
                    }
                  >
                    {loggedUser.name
                      ?.charAt(0)
                      ?.toUpperCase() || "R"}
                  </div>

                  <h3>
                    {loggedUser.name}
                  </h3>

                  <p>
                    {loggedUser.profession}
                  </p>

                  <span
                    style={
                      styles.verifiedBadge
                    }
                  >
                    ✓ Cuenta activa
                  </span>
                </div>

                <div style={styles.quickActions}>
                  <h3 style={styles.quickTitle}>
                    Acciones rápidas
                  </h3>

                  <button
                    style={
                      styles.quickButtonPrimary
                    }
                    onClick={() =>
                      setPage("offer")
                    }
                  >
                    ➕ Publicar servicio
                  </button>

                  <button
                    style={
                      styles.quickButton
                    }
                    onClick={openRequests}
                  >
                    📋 Ver solicitudes
                  </button>

                  <button
                    style={
                      styles.quickButton
                    }
                    onClick={() =>
                      setPage("messages")
                    }
                  >
                    💬 Abrir mensajes
                  </button>

                  <button
                    style={
                      styles.logoutButton
                    }
                    onClick={logout}
                  >
                    🚪 Cerrar sesión
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section style={styles.pageSection}>
        <div style={styles.authCard}>
          <div style={styles.authHeader}>
            <div style={styles.accountLogo}>
              R
            </div>

            <span style={styles.eyebrow}>
              ROBLOREN
            </span>

            <h1 style={styles.authTitle}>
              {accountMode === "login"
                ? "Bienvenido a RobLoren"
                : "Crea tu cuenta"}
            </h1>

            <p style={styles.authSubtitle}>
              Conecta talento con oportunidades.
            </p>
          </div>

          <div style={styles.authTabs}>
            <button
              style={
                accountMode === "login"
                  ? styles.authTabActive
                  : styles.authTab
              }
              onClick={() =>
                setAccountMode("login")
              }
            >
              Iniciar sesión
            </button>

            <button
              style={
                accountMode === "register"
                  ? styles.authTabActive
                  : styles.authTab
              }
              onClick={() =>
                setAccountMode("register")
              }
            >
              Crear cuenta
            </button>
          </div>

          {accountMode === "login" ? (
            <form
              onSubmit={login}
              style={styles.authForm}
            >
              <label style={styles.label}>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </label>

              <label style={styles.label}>
                Contraseña
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                />
              </label>

              <button
                type="submit"
                style={styles.primaryButtonFull}
                disabled={authLoading}
              >
                {authLoading
                  ? "Procesando..."
                  : "Entrar a RobLoren"}
              </button>

              <p style={styles.formNote}>
                Tu cuenta se gestiona de forma
                segura mediante autenticación.
              </p>
            </form>
          ) : (
            <form
              onSubmit={register}
              style={styles.authForm}
            >
              <label style={styles.label}>
                Nombre
                <input
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </label>

              <label style={styles.label}>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </label>

              <label style={styles.label}>
                Contraseña
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateForm(
                      "password",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </label>

              <label style={styles.label}>
                Profesión
                <input
                  value={form.profession}
                  onChange={(event) =>
                    updateForm(
                      "profession",
                      event.target.value
                    )
                  }
                  style={styles.input}
                  placeholder="Ej. Diseñador gráfico"
                />
              </label>

              <label style={styles.label}>
                Biografía
                <textarea
                  value={form.bio}
                  onChange={(event) =>
                    updateForm(
                      "bio",
                      event.target.value
                    )
                  }
                  style={styles.textarea}
                  placeholder="Cuéntanos brevemente sobre ti..."
                />
              </label>

              <button
                type="submit"
                style={styles.primaryButtonFull}
                disabled={authLoading}
              >
                {authLoading
                  ? "Creando..."
                  : "Crear mi cuenta"}
              </button>

              <p style={styles.formNote}>
                Después del registro puede ser
                necesario confirmar tu correo.
              </p>
            </form>
          )}
        </div>
      </section>
    );
  }

  function ServicePage() {
    if (!selectedService) {
      return null;
    }

    return (
      <section style={styles.pageSection}>
        <div style={styles.detailContainer}>
          <button
            style={styles.backButton}
            onClick={() => setPage("home")}
          >
            ← Volver a servicios
          </button>

          <div style={styles.detailGrid}>
            <div style={styles.detailMain}>
              <div style={styles.detailCategory}>
                {selectedService.category}
              </div>

              <h1 style={styles.detailTitle}>
                {selectedService.service}
              </h1>

              <div style={styles.detailProvider}>
                <div style={styles.detailAvatar}>
                  {selectedService.name
                    ?.charAt(0)
                    ?.toUpperCase() || "R"}
                </div>

                <div>
                  <strong>
                    {selectedService.name}
                  </strong>
                  <span>
                    {selectedService.profession}
                  </span>
                </div>
              </div>

              <div style={styles.detailDivider} />

              <h2 style={styles.detailHeading}>
                Sobre este servicio
              </h2>

              <p style={styles.detailDescription}>
                {selectedService.description}
              </p>

              <div style={styles.detailInfoGrid}>
                <div>
                  <span>Precio inicial</span>
                  <strong>
                    ${selectedService.price}
                  </strong>
                </div>

                <div>
                  <span>Categoría</span>
                  <strong>
                    {selectedService.category}
                  </strong>
                </div>

                <div>
                  <span>Modalidad</span>
                  <strong>
                    Online
                  </strong>
                </div>
              </div>
            </div>

            <aside style={styles.requestCard}>
              <span style={styles.eyebrow}>
                CONTRATAR
              </span>

              <h2 style={styles.requestTitle}>
                Solicita este servicio
              </h2>

              <div style={styles.requestPrice}>
                <span>Desde</span>
                <strong>
                  ${selectedService.price}
                </strong>
              </div>

              {selectedService.demo ? (
                <div style={styles.demoNotice}>
                  <strong>
                    Servicio de demostración
                  </strong>
                  <p>
                    Este servicio muestra cómo se
                    verá el marketplace. Los
                    servicios publicados por usuarios
                    sí pueden recibir solicitudes.
                  </p>
                </div>
              ) : (
                <>
                  <label style={styles.label}>
                    Mensaje para el profesional
                    <textarea
                      value={requestMessage}
                      onChange={(event) =>
                        setRequestMessage(
                          event.target.value
                        )
                      }
                      style={styles.textarea}
                      placeholder="Cuéntale qué necesitas..."
                    />
                  </label>

                  <button
                    style={
                      styles.primaryButtonFull
                    }
                    onClick={
                      sendServiceRequest
                    }
                    disabled={sendingRequest}
                  >
                    {sendingRequest
                      ? "Enviando..."
                      : "Solicitar servicio"}
                  </button>

                  <button
                    style={
                      styles.secondaryButtonFull
                    }
                    onClick={() =>
                      openMessaging({
                        userId:
                          selectedService.userId,
                        name:
                          selectedService.name,
                        profession:
                          selectedService.profession,
                      })
                    }
                  >
                    💬 Contactar
                  </button>
                </>
              )}
            </aside>
          </div>
        </div>
      </section>
    );
  }

  function RequestsPage() {
    return (
      <section style={styles.pageSection}>
        <div style={styles.dashboardContainer}>
          <button
            style={styles.backButton}
            onClick={openAccount}
          >
            ← Volver a mi cuenta
          </button>

          <div style={styles.pageTitleBlock}>
            <span style={styles.eyebrow}>
              GESTIÓN
            </span>
            <h1 style={styles.dashboardTitle}>
              Solicitudes
            </h1>
            <p style={styles.dashboardSubtitle}>
              Gestiona tus oportunidades y
              contrataciones.
            </p>
          </div>

          {loadingRequests ? (
            <div style={styles.loadingBox}>
              Cargando solicitudes...
            </div>
          ) : (
            <div style={styles.requestsGrid}>
              <div style={styles.requestColumn}>
                <div style={styles.columnHeader}>
                  <div>
                    <span>📥</span>
                    <h2>
                      Solicitudes recibidas
                    </h2>
                  </div>
                  <strong>
                    {receivedRequests.length}
                  </strong>
                </div>

                {receivedRequests.length === 0 ? (
                  <div style={styles.emptySmall}>
                    <span>📭</span>
                    <strong>
                      No tienes solicitudes
                    </strong>
                    <p>
                      Las solicitudes de clientes
                      aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  receivedRequests.map(
                    (request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        received
                      />
                    )
                  )
                )}
              </div>

              <div style={styles.requestColumn}>
                <div style={styles.columnHeader}>
                  <div>
                    <span>📤</span>
                    <h2>
                      Mis solicitudes
                    </h2>
                  </div>
                  <strong>
                    {sentRequests.length}
                  </strong>
                </div>

                {sentRequests.length === 0 ? (
                  <div style={styles.emptySmall}>
                    <span>📭</span>
                    <strong>
                      No has enviado solicitudes
                    </strong>
                    <p>
                      Explora servicios para encontrar
                      profesionales.
                    </p>
                    <button
                      style={
                        styles.smallPrimaryButton
                      }
                      onClick={() =>
                        setPage("home")
                      }
                    >
                      Explorar servicios
                    </button>
                  </div>
                ) : (
                  sentRequests.map(
                    (request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                      />
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  function RequestCard({
    request,
    received = false,
  }) {
    return (
      <article style={styles.requestItem}>
        <div style={styles.requestItemTop}>
          <span
            style={{
              ...styles.statusPill,
              ...(request.status ===
              "accepted"
                ? styles.statusAccepted
                : request.status ===
                  "rejected"
                ? styles.statusRejected
                : styles.statusPending),
            }}
          >
            {statusLabel(request.status)}
          </span>

          <span style={styles.requestDate}>
            {formatMessageDate(
              request.created_at
            )}
          </span>
        </div>

        <h3 style={styles.requestServiceTitle}>
          {request.serviceTitle}
        </h3>

        <div style={styles.requestPeople}>
          <div>
            <span>Cliente</span>
            <strong>
              {request.clientName}
            </strong>
          </div>

          <div>
            <span>Profesional</span>
            <strong>
              {request.providerName}
            </strong>
          </div>
        </div>

        <div style={styles.requestMessage}>
          “{request.message}”
        </div>

        <div style={styles.requestActions}>
          {received &&
            request.status ===
              "pending" && (
              <>
                <button
                  style={styles.acceptButton}
                  disabled={
                    updatingRequestId ===
                    request.id
                  }
                  onClick={() =>
                    updateRequestStatus(
                      request.id,
                      "accepted"
                    )
                  }
                >
                  ✓ Aceptar
                </button>

                <button
                  style={styles.rejectButton}
                  disabled={
                    updatingRequestId ===
                    request.id
                  }
                  onClick={() =>
                    updateRequestStatus(
                      request.id,
                      "rejected"
                    )
                  }
                >
                  ✕ Rechazar
                </button>
              </>
            )}

          <button
            style={styles.messageButton}
            onClick={() =>
              openMessagingFromRequest(
                request
              )
            }
          >
            💬 Mensajear
          </button>
        </div>
      </article>
    );
  }

  function MessagesPage() {
    return (
      <section style={styles.pageSection}>
        <div style={styles.messagesContainer}>
          <button
            style={styles.backButton}
            onClick={openRequests}
          >
            ← Volver a solicitudes
          </button>

          <div style={styles.messagesLayout}>
            <aside style={styles.contactsPanel}>
              <div style={styles.contactsHeader}>
                <span style={styles.eyebrow}>
                  COMUNICACIÓN
                </span>
                <h2>Mensajes</h2>
              </div>

              {requests.length === 0 ? (
                <div style={styles.emptyContact}>
                  <span>💬</span>
                  <p>
                    Aún no tienes conversaciones.
                  </p>
                </div>
              ) : (
                requests.map((request) => {
                  const isProvider =
                    request.provider_id ===
                    loggedUser?.id;

                  const contactId =
                    isProvider
                      ? request.client_id
                      : request.provider_id;

                  const contactName =
                    isProvider
                      ? request.clientName
                      : request.providerName;

                  if (!contactId) return null;

                  return (
                    <button
                      key={request.id}
                      style={
                        selectedContact?.id ===
                        contactId
                          ? styles.contactItemActive
                          : styles.contactItem
                      }
                      onClick={() =>
                        openMessaging({
                          userId: contactId,
                          name: contactName,
                          profession:
                            isProvider
                              ? "Cliente"
                              : "Profesional",
                          requestId:
                            request.id,
                        })
                      }
                    >
                      <div
                        style={
                          styles.contactAvatar
                        }
                      >
                        {contactName
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "R"}
                      </div>

                      <div
                        style={
                          styles.contactInfo
                        }
                      >
                        <strong>
                          {contactName}
                        </strong>
                        <span>
                          {request.serviceTitle}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </aside>

            <main style={styles.chatPanel}>
              {!selectedContact ? (
                <div style={styles.chatEmpty}>
                  <div style={styles.chatEmptyIcon}>
                    💬
                  </div>
                  <h2>
                    Selecciona una conversación
                  </h2>
                  <p>
                    Elige un contacto para comenzar
                    a conversar.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.chatHeader}>
                    <div
                      style={
                        styles.contactAvatarLarge
                      }
                    >
                      {selectedContact.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "R"}
                    </div>

                    <div>
                      <strong>
                        {selectedContact.name}
                      </strong>
                      <span>
                        {
                          selectedContact.profession
                        }
                      </span>
                    </div>
                  </div>

                  <div style={styles.messageList}>
                    {loadingMessages ? (
                      <div
                        style={
                          styles.chatLoading
                        }
                      >
                        Cargando mensajes...
                      </div>
                    ) : messages.length ===
                      0 ? (
                      <div
                        style={
                          styles.chatNoMessages
                        }
                      >
                        <span>👋</span>
                        <strong>
                          Inicia la conversación
                        </strong>
                        <p>
                          Escribe un mensaje para
                          comenzar.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const mine =
                          message.sender_id ===
                          loggedUser?.id;

                        return (
                          <div
                            key={message.id}
                            style={
                              mine
                                ? styles.messageRowMine
                                : styles.messageRow
                            }
                          >
                            <div
                              style={
                                mine
                                  ? styles.messageBubbleMine
                                  : styles.messageBubble
                              }
                            >
                              <p>
                                {
                                  message.message
                                }
                              </p>
                              <span>
                                {formatMessageDate(
                                  message.created_at
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    style={styles.messageForm}
                  >
                    <textarea
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(
                          event.target.value
                        )
                      }
                      style={
                        styles.messageInput
                      }
                      placeholder="Escribe tu mensaje..."
                      rows={2}
                    />

                    <button
                      type="submit"
                      style={styles.sendButton}
                      disabled={sendingMessage}
                    >
                      {sendingMessage
                        ? "..."
                        : "Enviar 💬"}
                    </button>
                  </form>
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    );
  }

  function OfferPage() {
    const [offer, setOffer] =
      useState({
        serviceTitle: "",
        category: "Tecnología",
        description: "",
        price: "",
      });

    const [publishing, setPublishing] =
      useState(false);

    async function publishService(event) {
      event.preventDefault();

      if (!loggedUser) {
        alert(
          "Debes iniciar sesión para publicar un servicio."
        );
        setPage("account");
        setAccountMode("login");
        return;
      }

      if (
        !offer.serviceTitle.trim() ||
        !offer.description.trim() ||
        !offer.price
      ) {
        alert(
          "Completa título, descripción y precio."
        );
        return;
      }

      setPublishing(true);

      const { error } = await supabase
        .from("services")
        .insert({
          name: loggedUser.name,
          profession:
            loggedUser.profession ||
            "Profesional",
          service_title:
            offer.serviceTitle.trim(),
          category: offer.category,
          description:
            offer.description.trim(),
          price: Number(offer.price),
          user_id: loggedUser.id,
        });

      if (error) {
        console.error(
          "Error publicando servicio:",
          error
        );
        alert(error.message);
        setPublishing(false);
        return;
      }

      setPublishing(false);

      alert(
        "¡Servicio publicado correctamente!"
      );

      await loadServices();
      setPage("home");

      setTimeout(() => {
        document
          .getElementById("services")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    }

    return (
      <section style={styles.pageSection}>
        <div style={styles.formContainer}>
          <button
            style={styles.backButton}
            onClick={openAccount}
          >
            ← Volver a mi cuenta
          </button>

          <div style={styles.formHeader}>
            <span style={styles.eyebrow}>
              NUEVA OFERTA
            </span>
            <h1 style={styles.dashboardTitle}>
              Publica tu servicio
            </h1>
            <p style={styles.dashboardSubtitle}>
              Presenta tu talento de forma
              profesional y conecta con nuevos
              clientes.
            </p>
          </div>

          <form
            onSubmit={publishService}
            style={styles.offerCard}
          >
            <div style={styles.offerIntro}>
              <div
                style={styles.offerIntroIcon}
              >
                ✨
              </div>
              <div>
                <strong>
                  {loggedUser?.name}
                </strong>
                <span>
                  {loggedUser?.profession}
                </span>
              </div>
            </div>

            <label style={styles.label}>
              Título del servicio
              <input
                value={offer.serviceTitle}
                onChange={(event) =>
                  setOffer((current) => ({
                    ...current,
                    serviceTitle:
                      event.target.value,
                  }))
                }
                style={styles.input}
                placeholder="Ej. Diseño de logotipo profesional"
              />
            </label>

            <label style={styles.label}>
              Categoría
              <select
                value={offer.category}
                onChange={(event) =>
                  setOffer((current) => ({
                    ...current,
                    category:
                      event.target.value,
                  }))
                }
                style={styles.input}
              >
                {categories.map(
                  ([, name]) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label style={styles.label}>
              Descripción
              <textarea
                value={offer.description}
                onChange={(event) =>
                  setOffer((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                style={
                  styles.textareaLarge
                }
                placeholder="Describe qué ofreces, qué incluye el servicio y por qué un cliente debería contratarte..."
              />
            </label>

            <label style={styles.label}>
              Precio inicial
              <div style={styles.priceInputWrap}>
                <span>$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={offer.price}
                  onChange={(event) =>
                    setOffer((current) => ({
                      ...current,
                      price:
                        event.target.value,
                    }))
                  }
                  style={
                    styles.priceInput
                  }
                  placeholder="0"
                />
              </div>
            </label>

            <button
              type="submit"
              style={styles.primaryButtonFull}
              disabled={publishing}
            >
              {publishing
                ? "Publicando..."
                : "Publicar servicio"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  function Footer() {
    return (
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <div style={styles.footerBrand}>
              <span style={styles.logoMark}>
                R
              </span>
              <span style={styles.logoText}>
                Rob<span>Loren</span>
              </span>
            </div>
            <p style={styles.footerText}>
              Conecta talento con oportunidades.
            </p>
          </div>

          <div style={styles.footerLinks}>
            <button
              onClick={() => setPage("home")}
            >
              Inicio
            </button>
            <button
              onClick={() => setPage("home")}
            >
              Servicios
            </button>
            <button
              onClick={openAccount}
            >
              Mi cuenta
            </button>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} RobLoren.
          Todos los derechos reservados.
        </div>
      </footer>
    );
  }

  return (
    <div style={styles.app}>
      <Header />

      <main>
        {page === "home" && <HomePage />}
        {page === "account" && <AccountPage />}
        {page === "service" && <ServicePage />}
        {page === "requests" && (
          <RequestsPage />
        )}
        {page === "messages" && (
          <MessagesPage />
        )}
        {page === "offer" && <OfferPage />}
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f7f9fc",
    color: "#142033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(255,255,255,0.96)",
    borderBottom: "1px solid #e8edf3",
    backdropFilter: "blur(12px)",
  },

  headerInner: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  logoButton: {
    border: 0,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    padding: 0,
  },

  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "#132238",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 19,
  },

  logoText: {
    fontSize: 22,
    fontWeight: 800,
    color: "#142033",
    letterSpacing: "-0.8px",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  navButton: {
    border: 0,
    background: "transparent",
    color: "#56657a",
    fontWeight: 600,
    padding: "10px 12px",
    cursor: "pointer",
  },

  navPrimaryButton: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 10,
    padding: "11px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  navAccountButton: {
    border: "1px solid #d8e0ea",
    background: "#fff",
    color: "#142033",
    borderRadius: 10,
    padding: "10px 17px",
    fontWeight: 700,
    cursor: "pointer",
  },

  hero: {
    background:
      "linear-gradient(135deg, #f4f7fb 0%, #ffffff 55%, #eef4fb 100%)",
    borderBottom: "1px solid #e7edf4",
  },

  heroInner: {
    maxWidth: 1180,
    margin: "0 auto",
    minHeight: 570,
    padding: "72px 24px",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
    gap: 70,
    alignItems: "center",
  },

  heroCopy: {
    maxWidth: 650,
  },

  badge: {
    display: "inline-flex",
    background: "#e9f0f8",
    color: "#35516f",
    borderRadius: 999,
    padding: "8px 13px",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 20,
  },

  heroTitle: {
    fontSize: "clamp(42px, 6vw, 72px)",
    lineHeight: 1.02,
    letterSpacing: "-3px",
    margin: 0,
    color: "#102033",
  },

  heroText: {
    maxWidth: 570,
    color: "#607086",
    fontSize: 18,
    lineHeight: 1.7,
    margin: "25px 0",
  },

  heroActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  heroCard: {
    background: "#fff",
    border: "1px solid #e1e8f0",
    borderRadius: 24,
    padding: 28,
    boxShadow:
      "0 25px 70px rgba(20,32,51,0.10)",
  },

  heroCardTop: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    color: "#22364d",
    marginBottom: 18,
  },

  heroSearch: {
    border: "1px solid #dce4ed",
    borderRadius: 13,
    padding: "15px 16px",
    color: "#8390a0",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  heroTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  heroMiniStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 10,
    marginTop: 25,
    paddingTop: 22,
    borderTop: "1px solid #edf1f5",
  },

  primaryButton: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 11,
    padding: "13px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  outlineButton: {
    border: "1px solid #cdd7e2",
    background: "#fff",
    color: "#1d2d43",
    borderRadius: 11,
    padding: "13px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },

  categoriesSection: {
    padding: "70px 0 35px",
    background: "#fff",
  },

  sectionContainer: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "0 24px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: 30,
    marginBottom: 28,
  },

  eyebrow: {
    display: "block",
    color: "#708197",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.8px",
    marginBottom: 8,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 30,
    letterSpacing: "-1px",
    color: "#17263a",
  },

  sectionSubtext: {
    color: "#758399",
    margin: 0,
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 12,
  },

  categoryCard: {
    border: "1px solid #e0e7ef",
    background: "#fff",
    borderRadius: 15,
    padding: "18px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    color: "#34465c",
    cursor: "pointer",
  },

  categoryCardActive: {
    border: "1px solid #132238",
    background: "#132238",
    color: "#fff",
    borderRadius: 15,
    padding: "18px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },

  categoryIcon: {
    fontSize: 25,
  },

  servicesSection: {
    padding: "45px 0 85px",
    background: "#f7f9fc",
  },

  servicesToolbar: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: 25,
    marginBottom: 28,
  },

  searchBox: {
    width: 330,
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    gap: 9,
    background: "#fff",
    border: "1px solid #dce4ed",
    borderRadius: 12,
    padding: "0 14px",
  },

  searchInput: {
    width: "100%",
    border: 0,
    outline: 0,
    padding: "13px 0",
    fontSize: 14,
    background: "transparent",
  },

  loadingBox: {
    background: "#fff",
    border: "1px solid #e2e8ef",
    borderRadius: 16,
    padding: 50,
    textAlign: "center",
    color: "#718095",
  },

  emptyBox: {
    background: "#fff",
    border: "1px solid #e2e8ef",
    borderRadius: 18,
    padding: 55,
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 8,
  },

  serviceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },

  serviceCard: {
    background: "#fff",
    border: "1px solid #e2e8ef",
    borderRadius: 18,
    padding: 22,
    boxShadow:
      "0 10px 30px rgba(20,32,51,0.035)",
  },

  serviceCardTop: {
    display: "flex",
    alignItems: "center",
    gap: 11,
  },

  serviceAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#eaf0f6",
    color: "#21364d",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },

  serviceProvider: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  categoryPill: {
    background: "#f0f4f8",
    color: "#64758b",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 10,
    fontWeight: 700,
  },

  serviceTitle: {
    margin: "22px 0 9px",
    fontSize: 19,
    color: "#17263a",
  },

  serviceDescription: {
    color: "#6b7b90",
    lineHeight: 1.6,
    minHeight: 72,
    margin: 0,
    fontSize: 14,
  },

  serviceFooter: {
    borderTop: "1px solid #edf1f5",
    marginTop: 18,
    paddingTop: 17,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceLabel: {
    display: "block",
    color: "#8a96a5",
    fontSize: 10,
  },

  price: {
    fontSize: 21,
    color: "#17263a",
  },

  viewButton: {
    border: 0,
    background: "#eef3f8",
    color: "#263c55",
    borderRadius: 9,
    padding: "9px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  ctaSection: {
    padding: "75px 24px",
    background: "#132238",
    color: "#fff",
  },

  ctaInner: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 35,
  },

  ctaTitle: {
    fontSize: 40,
    lineHeight: 1.08,
    letterSpacing: "-1.5px",
    margin: "0 0 15px",
  },

  ctaText: {
    color: "#b7c3d2",
    margin: 0,
  },

  ctaButton: {
    border: 0,
    background: "#fff",
    color: "#132238",
    borderRadius: 11,
    padding: "14px 20px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  pageSection: {
    minHeight: "calc(100vh - 70px)",
    padding: "45px 24px 80px",
  },

  authCard: {
    width: "100%",
    maxWidth: 520,
    margin: "25px auto",
    background: "#fff",
    border: "1px solid #e1e7ee",
    borderRadius: 22,
    padding: 35,
    boxShadow:
      "0 20px 60px rgba(20,32,51,0.07)",
  },

  authHeader: {
    textAlign: "center",
  },

  accountLogo: {
    width: 58,
    height: 58,
    borderRadius: 17,
    background: "#132238",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 18px",
    fontSize: 25,
    fontWeight: 800,
  },

  authTitle: {
    margin: "8px 0",
    fontSize: 30,
    letterSpacing: "-1px",
  },

  authSubtitle: {
    color: "#718095",
    margin: 0,
  },

  authTabs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    background: "#f1f4f8",
    borderRadius: 11,
    padding: 4,
    margin: "28px 0",
  },

  authTab: {
    border: 0,
    background: "transparent",
    padding: "10px",
    borderRadius: 8,
    color: "#738197",
    fontWeight: 700,
    cursor: "pointer",
  },

  authTabActive: {
    border: 0,
    background: "#fff",
    padding: "10px",
    borderRadius: 8,
    color: "#17263a",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 2px 8px rgba(20,32,51,0.07)",
  },

  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    color: "#405168",
    fontSize: 13,
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7e0e9",
    background: "#fff",
    borderRadius: 10,
    padding: "12px 13px",
    outline: "none",
    fontSize: 14,
    color: "#17263a",
  },

  textarea: {
    width: "100%",
    minHeight: 105,
    boxSizing: "border-box",
    border: "1px solid #d7e0e9",
    background: "#fff",
    borderRadius: 10,
    padding: "12px 13px",
    outline: "none",
    fontSize: 14,
    color: "#17263a",
    resize: "vertical",
    fontFamily: "inherit",
  },

  textareaLarge: {
    width: "100%",
    minHeight: 180,
    boxSizing: "border-box",
    border: "1px solid #d7e0e9",
    background: "#fff",
    borderRadius: 10,
    padding: "12px 13px",
    outline: "none",
    fontSize: 14,
    color: "#17263a",
    resize: "vertical",
    fontFamily: "inherit",
  },

  primaryButtonFull: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 10,
    padding: "13px 18px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
  },

  secondaryButtonFull: {
    border: "1px solid #d7e0e9",
    background: "#fff",
    color: "#24384f",
    borderRadius: 10,
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
    width: "100%",
    marginTop: 10,
  },

  formNote: {
    color: "#8a96a5",
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: "center",
    margin: 0,
  },

  dashboardContainer: {
    maxWidth: 1180,
    margin: "0 auto",
  },

  dashboardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
    marginBottom: 30,
  },

  dashboardTitle: {
    fontSize: 39,
    letterSpacing: "-1.5px",
    margin: "0 0 8px",
    color: "#17263a",
  },

  dashboardSubtitle: {
    margin: 0,
    color: "#708096",
    lineHeight: 1.6,
  },

  accountHeaderAvatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    background: "#132238",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: 28,
    fontWeight: 800,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: 15,
    marginBottom: 20,
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 16,
    padding: 19,
    display: "flex",
    gap: 13,
    alignItems: "center",
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "#edf2f7",
    display: "grid",
    placeItems: "center",
    fontSize: 19,
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 320px",
    gap: 20,
  },

  dashboardMain: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  panelCard: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 18,
    padding: 25,
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: 20,
  },

  panelTitle: {
    margin: 0,
    fontSize: 23,
    letterSpacing: "-0.5px",
  },

  panelIcon: {
    fontSize: 23,
  },

  profileForm: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 16,
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  activityItem: {
    width: "100%",
    border: "1px solid #e4eaf0",
    background: "#fff",
    borderRadius: 12,
    padding: 13,
    display: "grid",
    gridTemplateColumns:
      "42px 1fr 20px",
    alignItems: "center",
    gap: 11,
    textAlign: "left",
    cursor: "pointer",
    color: "#17263a",
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background: "#edf2f7",
    display: "grid",
    placeItems: "center",
  },

  profileSummary: {
    background: "#132238",
    color: "#fff",
    borderRadius: 18,
    padding: 27,
    textAlign: "center",
  },

  profileSummaryAvatar: {
    width: 68,
    height: 68,
    margin: "0 auto 13px",
    borderRadius: 19,
    background: "#fff",
    color: "#132238",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
    fontWeight: 800,
  },

  verifiedBadge: {
    display: "inline-block",
    marginTop: 10,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
  },

  quickActions: {
    marginTop: 15,
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 18,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },

  quickTitle: {
    margin: "0 0 5px",
    fontSize: 15,
  },

  quickButtonPrimary: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  quickButton: {
    border: "1px solid #dce4ed",
    background: "#fff",
    color: "#273a52",
    borderRadius: 10,
    padding: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  logoutButton: {
    border: "1px solid #f0d8d8",
    background: "#fff",
    color: "#a34d4d",
    borderRadius: 10,
    padding: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  backButton: {
    border: 0,
    background: "transparent",
    color: "#5c6e83",
    fontWeight: 700,
    padding: 0,
    cursor: "pointer",
    marginBottom: 25,
  },

  detailContainer: {
    maxWidth: 1050,
    margin: "0 auto",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 330px",
    gap: 25,
  },

  detailMain: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 20,
    padding: 32,
  },

  detailCategory: {
    display: "inline-block",
    background: "#edf2f7",
    color: "#53677e",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
  },

  detailTitle: {
    fontSize: 40,
    lineHeight: 1.1,
    letterSpacing: "-1.5px",
    margin: "18px 0 24px",
  },

  detailProvider: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "#eaf0f6",
    color: "#20364d",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },

  detailDivider: {
    height: 1,
    background: "#e8edf2",
    margin: "28px 0",
  },

  detailHeading: {
    fontSize: 21,
    marginBottom: 10,
  },

  detailDescription: {
    color: "#64748a",
    lineHeight: 1.75,
    fontSize: 15,
  },

  detailInfoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 10,
    marginTop: 30,
  },

  requestCard: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 20,
    padding: 25,
    height: "fit-content",
  },

  requestTitle: {
    margin: "5px 0 22px",
    fontSize: 24,
  },

  requestPrice: {
    background: "#f3f6f9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  demoNotice: {
    background: "#f7f9fc",
    border: "1px solid #e1e8ef",
    borderRadius: 12,
    padding: 14,
    color: "#617188",
    fontSize: 13,
    lineHeight: 1.5,
  },

  pageTitleBlock: {
    marginBottom: 28,
  },

  requestsGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 20,
  },

  requestColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  columnHeader: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 15,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  requestItem: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 16,
    padding: 18,
  },

  requestItemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusPill: {
    borderRadius: 999,
    padding: "6px 9px",
    fontSize: 10,
    fontWeight: 800,
  },

  statusPending: {
    background: "#fff4d8",
    color: "#886b20",
  },

  statusAccepted: {
    background: "#e2f5ea",
    color: "#267247",
  },

  statusRejected: {
    background: "#fbe7e7",
    color: "#9b4242",
  },

  requestDate: {
    color: "#8b98a8",
    fontSize: 11,
  },

  requestServiceTitle: {
    fontSize: 18,
    margin: "15px 0",
  },

  requestPeople: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: 10,
  },

  requestMessage: {
    background: "#f7f9fb",
    borderRadius: 10,
    padding: 12,
    margin: "14px 0",
    color: "#627287",
    fontSize: 13,
    lineHeight: 1.5,
  },

  requestActions: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
  },

  acceptButton: {
    border: 0,
    background: "#e5f5eb",
    color: "#267247",
    borderRadius: 8,
    padding: "8px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  rejectButton: {
    border: 0,
    background: "#fbe9e9",
    color: "#9b4242",
    borderRadius: 8,
    padding: "8px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  messageButton: {
    border: "1px solid #dce4ed",
    background: "#fff",
    color: "#33485f",
    borderRadius: 8,
    padding: "8px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  emptySmall: {
    background: "#fff",
    border: "1px dashed #d6dfe8",
    borderRadius: 15,
    padding: 35,
    textAlign: "center",
    color: "#718096",
  },

  smallPrimaryButton: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 9,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 10,
  },

  messagesContainer: {
    maxWidth: 1050,
    margin: "0 auto",
  },

  messagesLayout: {
    display: "grid",
    gridTemplateColumns:
      "290px minmax(0, 1fr)",
    minHeight: 600,
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 18,
    overflow: "hidden",
  },

  contactsPanel: {
    borderRight: "1px solid #e4eaf0",
    background: "#fbfcfd",
  },

  contactsHeader: {
    padding: 20,
    borderBottom: "1px solid #e4eaf0",
  },

  contactItem: {
    width: "100%",
    border: 0,
    borderBottom: "1px solid #edf1f5",
    background: "transparent",
    padding: 13,
    display: "flex",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
  },

  contactItemActive: {
    width: "100%",
    border: 0,
    borderBottom: "1px solid #edf1f5",
    background: "#edf3f8",
    padding: 13,
    display: "flex",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
  },

  contactAvatar: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 12,
    background: "#dfe8f0",
    color: "#263b52",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },

  contactInfo: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  emptyContact: {
    padding: 30,
    textAlign: "center",
    color: "#738197",
  },

  chatPanel: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  chatEmpty: {
    flex: 1,
    minHeight: 500,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    color: "#718095",
    padding: 30,
  },

  chatEmptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: 16,
    borderBottom: "1px solid #e4eaf0",
  },

  contactAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: "#e5edf4",
    color: "#263b52",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
  },

  messageList: {
    flex: 1,
    minHeight: 400,
    maxHeight: 500,
    overflowY: "auto",
    padding: 20,
    background: "#f8fafc",
  },

  chatLoading: {
    textAlign: "center",
    color: "#78879a",
    padding: 30,
  },

  chatNoMessages: {
    height: "100%",
    minHeight: 330,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    color: "#748298",
  },

  messageRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 10,
  },

  messageRowMine: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 10,
  },

  messageBubble: {
    maxWidth: "72%",
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: "14px 14px 14px 4px",
    padding: "10px 13px",
  },

  messageBubbleMine: {
    maxWidth: "72%",
    background: "#132238",
    color: "#fff",
    borderRadius: "14px 14px 4px 14px",
    padding: "10px 13px",
  },

  messageForm: {
    display: "flex",
    gap: 9,
    padding: 13,
    borderTop: "1px solid #e4eaf0",
  },

  messageInput: {
    flex: 1,
    border: "1px solid #d8e1ea",
    borderRadius: 10,
    padding: "10px 12px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
  },

  sendButton: {
    border: 0,
    background: "#132238",
    color: "#fff",
    borderRadius: 10,
    padding: "0 17px",
    fontWeight: 800,
    cursor: "pointer",
  },

  formContainer: {
    maxWidth: 720,
    margin: "0 auto",
  },

  formHeader: {
    marginBottom: 25,
  },

  offerCard: {
    background: "#fff",
    border: "1px solid #e0e7ef",
    borderRadius: 20,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 17,
  },

  offerIntro: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingBottom: 18,
    borderBottom: "1px solid #edf1f5",
  },

  offerIntroIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    background: "#e9f0f6",
    display: "grid",
    placeItems: "center",
  },

  priceInputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d7e0e9",
    borderRadius: 10,
    paddingLeft: 13,
  },

  priceInput: {
    flex: 1,
    border: 0,
    outline: 0,
    padding: "12px 13px 12px 7px",
    fontSize: 14,
  },

  footer: {
    background: "#0e1a2a",
    color: "#fff",
    padding: "42px 24px 20px",
  },

  footerInner: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: 30,
  },

  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  footerText: {
    color: "#9eacbd",
    fontSize: 13,
  },

  footerLinks: {
    display: "flex",
    gap: 15,
    alignItems: "start",
  },

  footerLinksButton: {
    color: "#b9c4d2",
  },

  footerBottom: {
    maxWidth: 1120,
    margin: "30px auto 0",
    paddingTop: 18,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    color: "#8291a4",
    fontSize: 11,
  },
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
