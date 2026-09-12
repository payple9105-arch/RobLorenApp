import React, { useEffect, useState } from "react";
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
    profession: profile?.profession || service.profession || "Profesional",
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

    const { data: createdProfile, error: createError } =
      await supabase
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
      const { data: profiles, error: profilesError } =
        await supabase
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
      const { data: profiles, error: profilesError } =
        await supabase
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
      const { data: serviceRows, error: servicesError } =
        await supabase
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
      alert("Debes iniciar sesión para enviar mensajes.");
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!selectedContact?.id) {
      alert("No hay un profesional seleccionado.");
      return;
    }

    const text = messageText.trim();

    if (!text) {
      return;
    }

    if (selectedContact.id === loggedUser.id) {
      alert("No puedes enviarte mensajes a ti mismo.");
      return;
    }

    setSendingMessage(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: loggedUser.id,
        receiver_id: selectedContact.id,
        request_id: selectedContact.requestId || null,
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

  useEffect(() => {
    async function loadAuth() {
      setAuthLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await ensureUserProfile(
          session.user
        );

        setLoggedUser(
          buildLoggedUser(session.user, profile)
        );
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
          const profile = await ensureUserProfile(
            session.user
          );

          setLoggedUser(
            buildLoggedUser(session.user, profile)
          );
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

  useEffect(() => {
    if (
      page === "messages" &&
      loggedUser?.id &&
      selectedContact?.id
    ) {
      loadMessages(selectedContact.id);
    }
  }, [
    page,
    loggedUser?.id,
    selectedContact?.id,
  ]);

  const filteredServices = services.filter(
    (service) => {
      const text = search.toLowerCase().trim();

      const matchesSearch =
        !text ||
        service.service
          .toLowerCase()
          .includes(text) ||
        service.name
          .toLowerCase()
          .includes(text) ||
        service.profession
          .toLowerCase()
          .includes(text) ||
        service.category
          .toLowerCase()
          .includes(text) ||
        service.description
          .toLowerCase()
          .includes(text);

      const matchesCategory =
        selectedCategory === "Todas" ||
        service.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }
  );

  function handleFormChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleAccountSubmit(event) {
    event.preventDefault();

    if (accountMode === "register") {
      if (
        !form.name ||
        !form.email ||
        !form.password
      ) {
        alert(
          "Completa nombre, correo y contraseña."
        );
        return;
      }

      const { data, error } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              profession: form.profession,
              bio: form.bio,
            },
          },
        });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        const profile = {
          id: data.user.id,
          name: form.name,
          profession:
            form.profession || "Profesional",
          bio: form.bio || "",
        };

        const { error: profileError } =
          await supabase
            .from("profiles")
            .upsert(profile, {
              onConflict: "id",
            });

        if (profileError) {
          console.error(profileError);
        }
      }

      alert(
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta si Supabase lo solicita."
      );

      setAccountMode("login");

      setForm({
        name: "",
        email: form.email,
        password: "",
        profession: "",
        bio: "",
      });

      return;
    }

    if (!form.email || !form.password) {
      alert(
        "Introduce tu correo y contraseña."
      );
      return;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      const profile = await ensureUserProfile(
        data.user
      );

      setLoggedUser(
        buildLoggedUser(data.user, profile)
      );

      alert("Sesión iniciada.");

      setPage("home");
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedUser(null);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
  }

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

    const serviceTitle =
      event.target.serviceTitle.value.trim();
    const category = event.target.category.value;
    const description =
      event.target.description.value.trim();
    const price = Number(
      event.target.price.value
    );

    if (
      !serviceTitle ||
      !category ||
      !description ||
      !price
    ) {
      alert("Completa todos los campos.");
      return;
    }

    const { data, error } = await supabase
      .from("services")
      .insert({
        name: loggedUser.name,
        profession: loggedUser.profession,
        service_title: serviceTitle,
        category,
        description,
        price,
        user_id: loggedUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error publicando servicio:",
        error
      );
      alert(error.message);
      return;
    }

    const serviceProfile = {
      id: loggedUser.id,
      name: loggedUser.name,
      profession: loggedUser.profession,
      bio: loggedUser.bio || "",
    };

    const newService = mapSupabaseService(
      data,
      serviceProfile
    );

    setServices((current) => [
      newService,
      ...current.filter(
        (service) => !service.demo
      ),
      ...current.filter(
        (service) => service.demo
      ),
    ]);

    alert(
      "Servicio publicado correctamente."
    );

    event.target.reset();

    setPage("services");
  }

  async function requestService() {
    if (!loggedUser) {
      alert(
        "Debes iniciar sesión para contratar un servicio."
      );
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!selectedService?.userId) {
      alert(
        "Este servicio de demostración todavía no tiene un profesional conectado."
      );
      return;
    }

    if (
      selectedService.userId === loggedUser.id
    ) {
      alert(
        "No puedes contratar tu propio servicio."
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
          requestMessage.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSendingRequest(false);
      return;
    }

    setRequestMessage("");
    setSendingRequest(false);

    alert(
      "Solicitud enviada correctamente."
    );

    await loadRequests();

    setPage("requests");
  }

  async function updateRequestStatus(
    requestId,
    newStatus
  ) {
    if (!loggedUser?.id) return;

    setUpdatingRequestId(requestId);

    const { data, error } = await supabase
      .from("service_requests")
      .update({
        status: newStatus,
      })
      .eq("id", requestId)
      .eq("provider_id", loggedUser.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setUpdatingRequestId(null);
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              ...data,
            }
          : request
      )
    );

    setUpdatingRequestId(null);

    alert(
      newStatus === "accepted"
        ? "Solicitud aceptada."
        : "Solicitud rechazada."
    );
  }

  function openProfile(service) {
    setSelectedService(service);
    setRequestMessage("");
    setPage("profile");
  }

  function openRequests() {
    if (!loggedUser) {
      setPage("account");
      setAccountMode("login");
      return;
    }

    setPage("requests");
    loadRequests();
  }

  if (authLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingLogo}>
          RobLoren
        </div>
        <p>Cargando...</p>
      </div>
    );
  }

  const receivedRequests = requests.filter(
    (request) =>
      request.provider_id === loggedUser?.id
  );

  const sentRequests = requests.filter(
    (request) =>
      request.client_id === loggedUser?.id
  );

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div
          style={styles.logo}
          onClick={() => setPage("home")}
        >
          <span style={styles.logoMark}>
            R
          </span>

          <span>RobLoren</span>
        </div>

        <nav style={styles.nav}>
          <button
            style={styles.navButton}
            onClick={() => setPage("home")}
          >
            Inicio
          </button>

          <button
            style={styles.navButton}
            onClick={() => setPage("services")}
          >
            Servicios
          </button>

          {loggedUser && (
            <>
              <button
                style={styles.navButton}
                onClick={openRequests}
              >
                📋 Solicitudes
              </button>

              <button
                style={styles.navButton}
                onClick={() => {
                  if (!selectedContact) {
                    setPage("requests");
                    return;
                  }

                  setPage("messages");
                }}
              >
                💬 Mensajes
              </button>
            </>
          )}

          {!loggedUser ? (
            <button
              style={styles.loginButton}
              onClick={() => {
                setAccountMode("login");
                setPage("account");
              }}
            >
              Iniciar sesión
            </button>
          ) : (
            <button
              style={styles.accountButton}
              onClick={() =>
                setPage("account")
              }
            >
              👤 {loggedUser.name}
            </button>
          )}
        </nav>
      </header>

      <main>
        {page === "home" && (
          <section style={styles.hero}>
            <div style={styles.heroContent}>
              <div style={styles.badge}>
                🚀 Marketplace de servicios
                profesionales
              </div>

              <h1 style={styles.heroTitle}>
                Conecta talento
                <br />

                <span style={styles.greenText}>
                  con oportunidades.
                </span>
              </h1>

              <p style={styles.heroText}>
                Encuentra profesionales, publica
                tus servicios y conecta con clientes
                nacionales e internacionales.
              </p>

              <div style={styles.heroButtons}>
                <button
                  style={styles.primaryButton}
                  onClick={() =>
                    setPage("services")
                  }
                >
                  Explorar servicios
                </button>

                <button
                  style={styles.secondaryButton}
                  onClick={() => {
                    if (!loggedUser) {
                      setPage("account");
                      setAccountMode(
                        "register"
                      );
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
                <span
                  style={styles.liveDot}
                ></span>

                Profesionales conectados
              </div>

              <div style={styles.heroStats}>
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
                  <span>Conexión</span>
                </div>
              </div>
            </div>

            <div style={styles.categoriesSection}>
              <h2
                style={styles.sectionTitle}
              >
                Explora por categoría
              </h2>

              <div
                style={styles.categoryGrid}
              >
                {categories.map(
                  ([icon, name]) => (
                    <button
                      key={name}
                      style={
                        styles.categoryCard
                      }
                      onClick={() => {
                        setSelectedCategory(
                          name
                        );
                        setPage("services");
                      }}
                    >
                      <span
                        style={
                          styles.categoryIcon
                        }
                      >
                        {icon}
                      </span>

                      <span>{name}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {page === "services" && (
          <section
            style={styles.pageSection}
          >
            <div
              style={styles.pageHeader}
            >
              <h1
                style={styles.pageTitle}
              >
                Encuentra el servicio que
                necesitas
              </h1>

              <p
                style={styles.pageSubtitle}
              >
                Profesionales preparados para
                ayudarte.
              </p>
            </div>

            <div
              style={styles.searchArea}
            >
              <input
                style={styles.searchInput}
                placeholder="🔎 Buscar servicios, profesionales..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <select
                style={
                  styles.categorySelect
                }
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
              >
                <option value="Todas">
                  Todas las categorías
                </option>

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
            </div>

            {servicesLoading ? (
              <div
                style={styles.centerText}
              >
                Cargando servicios...
              </div>
            ) : filteredServices.length ===
              0 ? (
              <div
                style={styles.emptyCard}
              >
                <div
                  style={styles.emptyIcon}
                >
                  🔎
                </div>

                <h3>
                  No encontramos servicios
                </h3>

                <p>
                  Prueba con otra búsqueda o
                  categoría.
                </p>
              </div>
            ) : (
              <div
                style={styles.serviceGrid}
              >
                {filteredServices.map(
                  (service) => (
                    <article
                      key={`${
                        service.demo
                          ? "demo"
                          : "real"
                      }-${service.id}`}
                      style={
                        styles.serviceCard
                      }
                    >
                      <div
                        style={
                          styles.serviceTop
                        }
                      >
                        <span
                          style={
                            styles.serviceCategory
                          }
                        >
                          {service.category}
                        </span>

                        {service.demo && (
                          <span
                            style={
                              styles.demoBadge
                            }
                          >
                            Demo
                          </span>
                        )}
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
                          styles.providerInfo
                        }
                      >
                        <div
                          style={
                            styles.avatar
                          }
                        >
                          {service.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {service.name}
                          </strong>

                          <small>
                            {service.profession}
                          </small>
                        </div>
                      </div>

                      <div
                        style={
                          styles.serviceBottom
                        }
                      >
                        <div>
                          <small>
                            Desde
                          </small>

                          <strong>
                            ${service.price}
                          </strong>
                        </div>

                        <button
                          style={
                            styles.viewButton
                          }
                          onClick={() =>
                            openProfile(
                              service
                            )
                          }
                        >
                          Ver servicio
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {page === "profile" &&
          selectedService && (
            <section
              style={styles.pageSection}
            >
              <button
                style={styles.backButton}
                onClick={() =>
                  setPage("services")
                }
              >
                ← Volver a servicios
              </button>

              <div
                style={
                  styles.profileLayout
                }
              >
                <div
                  style={
                    styles.profileMain
                  }
                >
                  <div
                    style={
                      styles.profileCategory
                    }
                  >
                    {selectedService.category}
                  </div>

                  <h1
                    style={
                      styles.profileTitle
                    }
                  >
                    {selectedService.service}
                  </h1>

                  <div
                    style={
                      styles.profileProvider
                    }
                  >
                    <div
                      style={
                        styles.bigAvatar
                      }
                    >
                      {selectedService.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>
                        {selectedService.name}
                      </h3>

                      <p>
                        {
                          selectedService.profession
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    style={
                      styles.profileBlock
                    }
                  >
                    <h2>
                      Descripción del servicio
                    </h2>

                    <p>
                      {
                        selectedService.description
                      }
                    </p>
                  </div>

                  <button
                    style={
                      styles.contactButton
                    }
                    onClick={() =>
                      openMessaging(
                        selectedService
                      )
                    }
                  >
                    💬 Contactar
                  </button>
                </div>

                <aside
                  style={styles.hireCard}
                >
                  <span
                    style={styles.priceLabel}
                  >
                    Precio desde
                  </span>

                  <div
                    style={styles.price}
                  >
                    ${selectedService.price}
                  </div>

                  {selectedService.demo ? (
                    <div
                      style={
                        styles.demoNotice
                      }
                    >
                      Este es un servicio de
                      demostración. Los
                      servicios reales podrán
                      contratarse cuando estén
                      publicados por un
                      profesional registrado.
                    </div>
                  ) : (
                    <>
                      <label
                        style={
                          styles.textareaLabel
                        }
                      >
                        Mensaje para el
                        profesional
                      </label>

                      <textarea
                        style={
                          styles.textarea
                        }
                        placeholder="Cuéntale al profesional qué necesitas..."
                        value={requestMessage}
                        onChange={(event) =>
                          setRequestMessage(
                            event.target.value
                          )
                        }
                      />

                      <button
                        style={
                          styles.hireButton
                        }
                        onClick={
                          requestService
                        }
                        disabled={
                          sendingRequest
                        }
                      >
                        {sendingRequest
                          ? "Enviando..."
                          : "🤝 Contratar servicio"}
                      </button>
                    </>
                  )}
                </aside>
              </div>
            </section>
          )}

        {page === "messages" &&
          loggedUser && (
            <section
              style={styles.pageSection}
            >
              <button
                style={styles.backButton}
                onClick={() =>
                  setPage("requests")
                }
              >
                ← Volver a solicitudes
              </button>

              <div
                style={styles.messagesLayout}
              >
                <div
                  style={
                    styles.messagesHeader
                  }
                >
                  <div
                    style={
                      styles.messageAvatar
                    }
                  >
                    {selectedContact?.name
                      ?.charAt(0)
                      .toUpperCase() || "?"}
                  </div>

                  <div>
                    <h1
                      style={
                        styles.messageTitle
                      }
                    >
                      {selectedContact?.name ||
                        "Conversación"}
                    </h1>

                    <p
                      style={
                        styles.messageSubtitle
                      }
                    >
                      {selectedContact?.profession ||
                        "Usuario de RobLoren"}
                    </p>
                  </div>
                </div>

                <div
                  style={
                    styles.messagesBox
                  }
                >
                  {loadingMessages ? (
                    <div
                      style={
                        styles.centerText
                      }
                    >
                      Cargando mensajes...
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div
                      style={
                        styles.emptyMessages
                      }
                    >
                      <div
                        style={
                          styles.emptyIcon
                        }
                      >
                        💬
                      </div>

                      <h3>
                        Inicia la conversación
                      </h3>

                      <p>
                        Envía tu primer mensaje
                        a{" "}
                        {selectedContact?.name ||
                          "este usuario"}.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={
                        styles.messageList
                      }
                    >
                      {messages.map(
                        (item) => {
                          const mine =
                            item.sender_id ===
                            loggedUser.id;

                          return (
                            <div
                              key={item.id}
                              style={{
                                ...styles.messageRow,
                                justifyContent:
                                  mine
                                    ? "flex-end"
                                    : "flex-start",
                              }}
                            >
                              <div
                                style={{
                                  ...styles.messageBubble,
                                  ...(mine
                                    ? styles.myMessage
                                    : styles.theirMessage),
                                }}
                              >
                                <p>
                                  {
                                    item.message
                                  }
                                </p>

                                <small
                                  style={{
                                    ...styles.messageTime,
                                    color: mine
                                      ? "#d8f5e4"
                                      : "#718078",
                                  }}
                                >
                                  {formatMessageDate(
                                    item.created_at
                                  )}
                                </small>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                <form
                  style={
                    styles.messageForm
                  }
                  onSubmit={sendMessage}
                >
                  <textarea
                    style={
                      styles.messageInput
                    }
                    placeholder="Escribe tu mensaje..."
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    disabled={
                      sendingMessage
                    }
                  />

                  <button
                    type="submit"
                    style={
                      styles.sendMessageButton
                    }
                    disabled={
                      sendingMessage ||
                      !messageText.trim()
                    }
                  >
                    {sendingMessage
                      ? "Enviando..."
                      : "Enviar 💬"}
                  </button>
                </form>
              </div>
            </section>
          )}

        {page === "offer" && (
          <section
            style={styles.pageSection}
          >
            <div
              style={styles.pageHeader}
            >
              <h1
                style={styles.pageTitle}
              >
                Publica tu servicio
              </h1>

              <p
                style={styles.pageSubtitle}
              >
                Conecta tu talento con nuevos
                clientes.
              </p>
            </div>

            <form
              style={styles.offerForm}
              onSubmit={publishService}
            >
              <label
                style={styles.formLabel}
              >
                Título del servicio
              </label>

              <input
                name="serviceTitle"
                style={styles.formInput}
                placeholder="Ej. Creación de páginas web"
              />

              <label
                style={styles.formLabel}
              >
                Categoría
              </label>

              <select
                name="category"
                style={styles.formInput}
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona una categoría
                </option>

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

              <label
                style={styles.formLabel}
              >
                Descripción
              </label>

              <textarea
                name="description"
                style={styles.formTextarea}
                placeholder="Describe claramente lo que ofreces..."
              />

              <label
                style={styles.formLabel}
              >
                Precio
              </label>

              <input
                name="price"
                type="number"
                min="1"
                step="0.01"
                style={styles.formInput}
                placeholder="Ej. 50"
              />

              <button
                type="submit"
                style={styles.primaryButton}
              >
                Publicar servicio
              </button>
            </form>
          </section>
        )}

        {page === "requests" &&
          loggedUser && (
            <section
              style={styles.pageSection}
            >
              <div
                style={styles.pageHeader}
              >
                <h1
                  style={styles.pageTitle}
                >
                  Solicitudes
                </h1>

                <p
                  style={styles.pageSubtitle}
                >
                  Gestiona las solicitudes de
                  tus servicios y consulta las
                  que has enviado.
                </p>
              </div>

              {loadingRequests ? (
                <div
                  style={styles.centerText}
                >
                  Cargando solicitudes...
                </div>
              ) : (
                <>
                  <div
                    style={
                      styles.requestSection
                    }
                  >
                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      📥 Solicitudes recibidas
                    </h2>

                    {receivedRequests.length ===
                    0 ? (
                      <div
                        style={
                          styles.emptyCard
                        }
                      >
                        <div
                          style={
                            styles.emptyIcon
                          }
                        >
                          📭
                        </div>

                        <h3>
                          No tienes solicitudes
                          recibidas
                        </h3>

                        <p>
                          Cuando un cliente
                          solicite uno de tus
                          servicios, aparecerá
                          aquí.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={
                          styles.requestGrid
                        }
                      >
                        {receivedRequests.map(
                          (request) => (
                            <article
                              key={request.id}
                              style={
                                styles.requestCard
                              }
                            >
                              <div
                                style={
                                  styles.requestTop
                                }
                              >
                                <span
                                  style={
                                    styles.serviceCategory
                                  }
                                >
                                  {
                                    request.serviceCategory
                                  }
                                </span>

                                <span
                                  style={{
                                    ...styles.status,
                                    ...(request.status ===
                                    "accepted"
                                      ? styles.statusAccepted
                                      : request.status ===
                                        "rejected"
                                      ? styles.statusRejected
                                      : styles.statusPending),
                                  }}
                                >
                                  {statusLabel(
                                    request.status
                                  )}
                                </span>
                              </div>

                              <h3
                                style={
                                  styles.requestTitle
                                }
                              >
                                {
                                  request.serviceTitle
                                }
                              </h3>

                              <p>
                                <strong>
                                  Cliente:
                                </strong>{" "}
                                {
                                  request.clientName
                                }
                              </p>

                              <div
                                style={
                                  styles.messageBox
                                }
                              >
                                <strong>
                                  Mensaje:
                                </strong>

                                <p>
                                  {request.message ||
                                    "El cliente no dejó un mensaje."}
                                </p>
                              </div>

                              {request.status ===
                                "pending" && (
                                <div
                                  style={
                                    styles.requestActions
                                  }
                                >
                                  <button
                                    style={
                                      styles.acceptButton
                                    }
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
                                    style={
                                      styles.rejectButton
                                    }
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
                                </div>
                              )}

                              <button
                                style={
                                  styles.requestMessageButton
                                }
                                onClick={() =>
                                  openMessagingFromRequest(
                                    request
                                  )
                                }
                              >
                                💬 Mensajear
                              </button>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    style={
                      styles.requestSection
                    }
                  >
                    <h2
                      style={
                        styles.sectionTitle
                      }
                    >
                      📤 Mis solicitudes
                    </h2>

                    {sentRequests.length ===
                    0 ? (
                      <div
                        style={
                          styles.emptyCard
                        }
                      >
                        <div
                          style={
                            styles.emptyIcon
                          }
                        >
                          📨
                        </div>

                        <h3>
                          No has enviado
                          solicitudes
                        </h3>

                        <p>
                          Cuando contrates un
                          servicio, podrás ver
                          aquí el estado de tu
                          solicitud.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={
                          styles.requestGrid
                        }
                      >
                        {sentRequests.map(
                          (request) => (
                            <article
                              key={request.id}
                              style={
                                styles.requestCard
                              }
                            >
                              <div
                                style={
                                  styles.requestTop
                                }
                              >
                                <span
                                  style={
                                    styles.serviceCategory
                                  }
                                >
                                  {
                                    request.serviceCategory
                                  }
                                </span>

                                <span
                                  style={{
                                    ...styles.status,
                                    ...(request.status ===
                                    "accepted"
                                      ? styles.statusAccepted
                                      : request.status ===
                                        "rejected"
                                      ? styles.statusRejected
                                      : styles.statusPending),
                                  }}
                                >
                                  {statusLabel(
                                    request.status
                                  )}
                                </span>
                              </div>

                              <h3
                                style={
                                  styles.requestTitle
                                }
                              >
                                {
                                  request.serviceTitle
                                }
                              </h3>

                              <p>
                                <strong>
                                  Profesional:
                                </strong>{" "}
                                {
                                  request.providerName
                                }
                              </p>

                              <div
                                style={
                                  styles.messageBox
                                }
                              >
                                <strong>
                                  Tu mensaje:
                                </strong>

                                <p>
                                  {request.message ||
                                    "No enviaste un mensaje."}
                                </p>
                              </div>

                              <button
                                style={
                                  styles.requestMessageButton
                                }
                                onClick={() =>
                                  openMessagingFromRequest(
                                    request
                                  )
                                }
                              >
                                💬 Mensajear
                              </button>
                            </article>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

        {page === "account" && (
          <section
            style={styles.pageSection}
          >
            <div
              style={styles.accountCard}
            >
              <div
                style={styles.accountHeader}
              >
                <div
                  style={styles.accountLogo}
                >
                  R
                </div>

                <h1>
                  {loggedUser
                    ? "Mi cuenta"
                    : accountMode === "login"
                    ? "Bienvenido a RobLoren"
                    : "Crea tu cuenta"}
                </h1>

                <p>
                  {loggedUser
                    ? "Gestiona tu cuenta y tus servicios."
                    : "Conecta talento con oportunidades."}
                </p>
              </div>

              {loggedUser ? (
                <div>
                  <div
                    style={
                      styles.accountInfo
                    }
                  >
                    <div>
                      <span>Nombre</span>
                      <strong>
                        {loggedUser.name}
                      </strong>
                    </div>

                    <div>
                      <span>Correo</span>
                      <strong>
                        {loggedUser.email}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Profesión
                      </span>
                      <strong>
                        {
                          loggedUser.profession
                        }
                      </strong>
                    </div>
                  </div>

                  <div
                    style={
                      styles.accountButtons
                    }
                  >
                    <button
                      style={
                        styles.primaryButton
                      }
                      onClick={() =>
                        setPage("offer")
                      }
                    >
                      ➕ Publicar servicio
                    </button>

                    <button
                      style={
                        styles.secondaryButton
                      }
                      onClick={openRequests}
                    >
                      📋 Mis solicitudes
                    </button>

                    <button
                      style={
                        styles.secondaryButton
                      }
                      onClick={() =>
                        setPage("messages")
                      }
                    >
                      💬 Mensajes
                    </button>

                    <button
                      style={
                        styles.logoutButton
                      }
                      onClick={logout}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form
                    onSubmit={
                      handleAccountSubmit
                    }
                  >
                    {accountMode ===
                      "register" && (
                      <>
                        <label
                          style={
                            styles.formLabel
                          }
                        >
                          Nombre
                        </label>

                        <input
                          name="name"
                          value={form.name}
                          onChange={
                            handleFormChange
                          }
                          style={
                            styles.formInput
                          }
                          placeholder="Tu nombre"
                        />

                        <label
                          style={
                            styles.formLabel
                          }
                        >
                          Profesión
                        </label>

                        <input
                          name="profession"
                          value={
                            form.profession
                          }
                          onChange={
                            handleFormChange
                          }
                          style={
                            styles.formInput
                          }
                          placeholder="Ej. Diseñador gráfico"
                        />

                        <label
                          style={
                            styles.formLabel
                          }
                        >
                          Biografía
                        </label>

                        <textarea
                          name="bio"
                          value={form.bio}
                          onChange={
                            handleFormChange
                          }
                          style={
                            styles.formTextarea
                          }
                          placeholder="Cuéntanos sobre ti..."
                        />
                      </>
                    )}

                    <label
                      style={
                        styles.formLabel
                      }
                    >
                      Correo electrónico
                    </label>

                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={
                        handleFormChange
                      }
                      style={
                        styles.formInput
                      }
                      placeholder="correo@ejemplo.com"
                    />

                    <label
                      style={
                        styles.formLabel
                      }
                    >
                      Contraseña
                    </label>

                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={
                        handleFormChange
                      }
                      style={
                        styles.formInput
                      }
                      placeholder="Tu contraseña"
                    />

                    <button
                      type="submit"
                      style={
                        styles.primaryButton
                      }
                    >
                      {accountMode ===
                      "login"
                        ? "Iniciar sesión"
                        : "Crear cuenta"}
                    </button>
                  </form>

                  <div
                    style={
                      styles.switchAccount
                    }
                  >
                    {accountMode ===
                    "login" ? (
                      <>
                        ¿No tienes cuenta?{" "}
                        <button
                          onClick={() =>
                            setAccountMode(
                              "register"
                            )
                          }
                          style={
                            styles.linkButton
                          }
                        >
                          Crear cuenta
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes cuenta?{" "}
                        <button
                          onClick={() =>
                            setAccountMode(
                              "login"
                            )
                          }
                          style={
                            styles.linkButton
                          }
                        >
                          Iniciar sesión
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <strong>RobLoren</strong>

        <span>
          Conecta talento con oportunidades.
        </span>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f7faf8",
    color: "#102018",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7faf8",
  },

  loadingLogo: {
    fontSize: 34,
    fontWeight: 800,
    color: "#18a957",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 6%",
    background: "rgba(255,255,255,.96)",
    borderBottom:
      "1px solid #e7eee9",
    backdropFilter: "blur(10px)",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 23,
    fontWeight: 800,
    cursor: "pointer",
    color: "#102018",
  },

  logoMark: {
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    background: "#18a957",
    color: "#fff",
    fontWeight: 900,
  },

  nav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  navButton: {
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    cursor: "pointer",
    color: "#304239",
    fontWeight: 600,
  },

  loginButton: {
    border: "none",
    background: "#18a957",
    color: "#fff",
    borderRadius: 10,
    padding: "11px 17px",
    cursor: "pointer",
    fontWeight: 700,
  },

  accountButton: {
    border:
      "1px solid #d7e4db",
    background: "#fff",
    color: "#183022",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  hero: {
    padding: "80px 6% 70px",
    maxWidth: 1200,
    margin: "0 auto",
  },

  heroContent: {
    maxWidth: 800,
  },

  badge: {
    display: "inline-block",
    background: "#e6f7ed",
    color: "#118446",
    borderRadius: 30,
    padding: "9px 15px",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 20,
  },

  heroTitle: {
    fontSize:
      "clamp(45px, 7vw, 82px)",
    lineHeight: 1.02,
    margin: "0 0 24px",
    letterSpacing: -3,
  },

  greenText: {
    color: "#18a957",
  },

  heroText: {
    maxWidth: 680,
    fontSize: 20,
    lineHeight: 1.6,
    color: "#52645a",
  },

  heroButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 30,
  },

  primaryButton: {
    border: "none",
    background: "#18a957",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 20px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
  },

  secondaryButton: {
    border:
      "1px solid #cfe0d5",
    background: "#fff",
    color: "#163022",
    borderRadius: 12,
    padding: "14px 20px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
  },

  heroCard: {
    marginTop: 60,
    background: "#102018",
    color: "#fff",
    borderRadius: 24,
    padding: 28,
    maxWidth: 850,
    boxShadow:
      "0 20px 50px rgba(16,32,24,.15)",
  },

  heroCardTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#d8e8de",
    marginBottom: 28,
  },

  liveDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#35d978",
  },

  heroStats: {
    display: "flex",
    gap: 60,
    flexWrap: "wrap",
  },

  categoriesSection: {
    marginTop: 70,
  },

  sectionTitle: {
    fontSize: 28,
    marginBottom: 24,
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(130px,1fr))",
    gap: 12,
  },

  categoryCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    border:
      "1px solid #dfe9e2",
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    cursor: "pointer",
    fontWeight: 700,
    color: "#20382a",
  },

  categoryIcon: {
    fontSize: 30,
  },

  pageSection: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "55px 6% 80px",
  },

  pageHeader: {
    marginBottom: 35,
  },

  pageTitle: {
    fontSize:
      "clamp(32px,5vw,52px)",
    margin: "0 0 10px",
    letterSpacing: -1.5,
  },

  pageSubtitle: {
    color: "#617168",
    fontSize: 18,
  },

  searchArea: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 35,
  },

  searchInput: {
    flex: 1,
    minWidth: 250,
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    background: "#fff",
  },

  categorySelect: {
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: "14px 16px",
    background: "#fff",
    fontSize: 15,
  },

  serviceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: 20,
  },

  serviceCard: {
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 20,
    padding: 22,
    boxShadow:
      "0 8px 25px rgba(16,32,24,.05)",
  },

  serviceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  serviceCategory: {
    display: "inline-block",
    background: "#eaf7ef",
    color: "#168548",
    borderRadius: 30,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },

  demoBadge: {
    fontSize: 11,
    background: "#f0f2f1",
    padding: "5px 8px",
    borderRadius: 20,
    color: "#65726b",
  },

  serviceTitle: {
    fontSize: 21,
    margin: "18px 0 10px",
  },

  serviceDescription: {
    color: "#627068",
    lineHeight: 1.55,
    minHeight: 70,
  },

  providerInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    paddingTop: 18,
    borderTop:
      "1px solid #edf1ee",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#dff4e7",
    color: "#148447",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },

  serviceBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  viewButton: {
    border: "none",
    background: "#102018",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    color: "#168548",
    fontWeight: 700,
    marginBottom: 25,
  },

  profileLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0,1fr) 360px",
    gap: 35,
  },

  profileMain: {
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 22,
    padding: 30,
  },

  profileCategory: {
    color: "#168548",
    fontWeight: 800,
    marginBottom: 15,
  },

  profileTitle: {
    fontSize:
      "clamp(30px,5vw,48px)",
    margin: "0 0 25px",
  },

  profileProvider: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    padding: "20px 0",
    borderTop:
      "1px solid #edf1ee",
    borderBottom:
      "1px solid #edf1ee",
  },

  bigAvatar: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#dff4e7",
    color: "#148447",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 900,
  },

  profileBlock: {
    marginTop: 30,
    lineHeight: 1.7,
    color: "#52645a",
  },

  contactButton: {
    marginTop: 25,
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border:
      "1px solid #d2e1d7",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },

  hireCard: {
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 22,
    padding: 25,
    height: "fit-content",
    position: "sticky",
    top: 100,
  },

  priceLabel: {
    color: "#718078",
    fontSize: 14,
  },

  price: {
    fontSize: 38,
    fontWeight: 900,
    margin: "5px 0 20px",
  },

  textareaLabel: {
    display: "block",
    fontWeight: 700,
    marginBottom: 8,
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    boxSizing: "border-box",
    resize: "vertical",
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: 12,
    fontFamily: "inherit",
    fontSize: 15,
  },

  hireButton: {
    width: "100%",
    border: "none",
    background: "#18a957",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: 12,
  },

  demoNotice: {
    background: "#f3f6f4",
    borderRadius: 12,
    padding: 15,
    color: "#5d6c64",
    lineHeight: 1.5,
    fontSize: 14,
  },

  messagesLayout: {
    maxWidth: 850,
    margin: "0 auto",
  },

  messagesHeader: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: "20px 20px 0 0",
    padding: 22,
  },

  messageAvatar: {
    width: 55,
    height: 55,
    borderRadius: "50%",
    background: "#dff4e7",
    color: "#148447",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 900,
  },

  messageTitle: {
    margin: 0,
    fontSize: 24,
  },

  messageSubtitle: {
    margin: "5px 0 0",
    color: "#68766e",
  },

  messagesBox: {
    minHeight: 430,
    maxHeight: 520,
    overflowY: "auto",
    background: "#f0f5f2",
    borderLeft:
      "1px solid #e1eae4",
    borderRight:
      "1px solid #e1eae4",
    padding: 20,
  },

  emptyMessages: {
    minHeight: 380,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#65736b",
  },

  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  messageRow: {
    display: "flex",
    width: "100%",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: "12px 15px",
    borderRadius: 16,
    boxShadow:
      "0 3px 10px rgba(16,32,24,.06)",
  },

  myMessage: {
    background: "#18a957",
    color: "#fff",
    borderBottomRightRadius: 4,
  },

  theirMessage: {
    background: "#fff",
    color: "#24372c",
    borderBottomLeftRadius: 4,
  },

  messageBubbleText: {
    margin: 0,
  },

  messageTime: {
    display: "block",
    marginTop: 6,
    fontSize: 11,
  },

  messageForm: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: "0 0 20px 20px",
    padding: 15,
  },

  messageInput: {
    flex: 1,
    minHeight: 55,
    maxHeight: 140,
    resize: "vertical",
    boxSizing: "border-box",
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: 13,
    fontFamily: "inherit",
    fontSize: 15,
  },

  sendMessageButton: {
    border: "none",
    background: "#18a957",
    color: "#fff",
    borderRadius: 12,
    padding: "14px 18px",
    cursor: "pointer",
    fontWeight: 800,
  },

  requestMessageButton: {
    width: "100%",
    border:
      "1px solid #cfe0d5",
    background: "#fff",
    color: "#168548",
    borderRadius: 10,
    padding: 11,
    cursor: "pointer",
    fontWeight: 800,
    marginTop: 15,
  },

  offerForm: {
    maxWidth: 650,
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 22,
    padding: 28,
  },

  formLabel: {
    display: "block",
    fontWeight: 700,
    marginBottom: 7,
    marginTop: 18,
  },

  formInput: {
    width: "100%",
    boxSizing: "border-box",
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: "13px 14px",
    fontSize: 15,
    background: "#fff",
  },

  formTextarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 140,
    border:
      "1px solid #d5e2d9",
    borderRadius: 12,
    padding: "13px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    resize: "vertical",
  },

  requestSection: {
    marginTop: 35,
  },

  requestGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(300px,1fr))",
    gap: 18,
  },

  requestCard: {
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 18,
    padding: 22,
    boxShadow:
      "0 7px 22px rgba(16,32,24,.05)",
  },

  requestTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  requestTitle: {
    fontSize: 20,
    margin: "0 0 14px",
  },

  messageBox: {
    background: "#f5f8f6",
    borderRadius: 12,
    padding: 14,
    marginTop: 15,
    lineHeight: 1.5,
    color: "#42534a",
  },

  status: {
    borderRadius: 20,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },

  statusPending: {
    background: "#fff5d9",
    color: "#946d00",
  },

  statusAccepted: {
    background: "#e5f7ec",
    color: "#148447",
  },

  statusRejected: {
    background: "#fde9e9",
    color: "#b33b3b",
  },

  requestActions: {
    display: "flex",
    gap: 10,
    marginTop: 18,
  },

  acceptButton: {
    flex: 1,
    border: "none",
    background: "#18a957",
    color: "#fff",
    borderRadius: 10,
    padding: 11,
    cursor: "pointer",
    fontWeight: 800,
  },

  rejectButton: {
    flex: 1,
    border:
      "1px solid #e1caca",
    background: "#fff",
    color: "#a43d3d",
    borderRadius: 10,
    padding: 11,
    cursor: "pointer",
    fontWeight: 800,
  },

  emptyCard: {
    background: "#fff",
    border:
      "1px dashed #d4e1d8",
    borderRadius: 18,
    padding: 35,
    textAlign: "center",
    color: "#65736b",
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  centerText: {
    textAlign: "center",
    padding: 45,
    color: "#66756d",
  },

  accountCard: {
    maxWidth: 600,
    margin: "0 auto",
    background: "#fff",
    border:
      "1px solid #e1eae4",
    borderRadius: 22,
    padding: 30,
  },

  accountHeader: {
    textAlign: "center",
    marginBottom: 25,
  },

  accountLogo: {
    width: 55,
    height: 55,
    borderRadius: 16,
    background: "#18a957",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontWeight: 900,
    fontSize: 25,
  },

  accountInfo: {
    display: "grid",
    gap: 15,
    background: "#f5f8f6",
    padding: 20,
    borderRadius: 15,
  },

  accountButtons: {
    display: "grid",
    gap: 10,
    marginTop: 20,
  },

  logoutButton: {
    border:
      "1px solid #efcccc",
    background: "#fff",
    color: "#a33c3c",
    borderRadius: 12,
    padding: 13,
    cursor: "pointer",
    fontWeight: 800,
  },

  switchAccount: {
    textAlign: "center",
    marginTop: 20,
    color: "#637169",
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: "#168548",
    cursor: "pointer",
    fontWeight: 800,
  },

  footer: {
    borderTop:
      "1px solid #e1eae4",
    padding: "30px 6%",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    color: "#65736b",
    background: "#fff",
  },
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
