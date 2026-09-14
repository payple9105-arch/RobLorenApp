import React, {
  useEffect,
  useMemo,
  useState,
  useDeferredValue,
} from "react";
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
    rating: 4.9,
    reviews: 24,
    jobs: 38,
    experience: "5 años",
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
    rating: 4.8,
    reviews: 19,
    jobs: 31,
    experience: "4 años",
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
    rating: 4.7,
    reviews: 16,
    jobs: 27,
    experience: "3 años",
    userId: null,
    demo: true,
  },
];

function mapService(row, profile) {
  return {
    id: row.id,
    name: profile?.name || row.name || "Profesional",
    profession:
      profile?.profession || row.profession || "Profesional",
    service: row.service_title || "Servicio profesional",
    category: row.category || "Otros",
    description: row.description || "",
    price: Number(row.price) || 0,
    rating: Number(row.rating) || 5,
    reviews: Number(row.reviews) || 0,
    jobs: Number(row.jobs) || 0,
    experience: row.experience || "Profesional",
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

function dateText(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stars(rating) {
  const value = Number(rating) || 0;
  const rounded = Math.round(value);

  return "★★★★★"
    .split("")
    .map((star, index) =>
      index < rounded ? star : "☆"
    )
    .join("");
}

function App() {
  const [page, setPage] = useState("home");
  const [services, setServices] = useState(demoServices);
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [category, setCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("recommended");

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
  const [publishing, setPublishing] = useState(false);

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

  function updateOffer(field, value) {
    setOffer((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ensureProfile(user) {
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,profession,bio")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
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

    const { data: created, error: createError } =
      await supabase
        .from("profiles")
        .insert(profile)
        .select()
        .single();

    if (createError) {
      console.error(createError);
      return null;
    }

    return created;
  }

  async function refreshUser(user) {
    if (!user) {
      setLoggedUser(null);
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
      ...new Set(
        rows.map((r) => r.service_id).filter(Boolean)
      ),
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
          serviceCategory:
            service?.category || "Otros",
          servicePrice: Number(service?.price) || 0,
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
      .select()
      .single();

    if (error) {
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

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: profileForm.name.trim(),
        profession:
          profileForm.profession.trim() || "Profesional",
        bio: profileForm.bio.trim(),
      })
      .eq("id", loggedUser.id)
      .select()
      .single();

    if (error) {
      alert(error.message);
      setSavingProfile(false);
      return;
    }

    const updated = {
      ...loggedUser,
      name: data.name,
      profession: data.profession,
      bio: data.bio,
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

  async function register(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      alert("Completa nombre, correo y contraseña.");
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

    if (data.user && !data.session) {
      alert(
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta."
      );
    } else if (data.user) {
      await refreshUser(data.user);
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

    if (!form.email.trim() || !form.password) {
      alert("Escribe tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

    if (error) {
      alert(error.message);
      setAuthLoading(false);
      return;
    }

    await refreshUser(data.user);
    setPage("account");

    setForm({
      name: "",
      email: form.email,
      password: "",
      profession: "",
      bio: "",
    });

    setAuthLoading(false);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setLoggedUser(null);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
  }

  async function publishService(event) {
    event.preventDefault();

    if (!loggedUser) {
      setAccountMode("login");
      setPage("account");
      return;
    }

    if (
      !offer.serviceTitle.trim() ||
      !offer.description.trim() ||
      !offer.price
    ) {
      alert("Completa título, descripción y precio.");
      return;
    }

    setPublishing(true);

    const { error } = await supabase
      .from("services")
      .insert({
        name: loggedUser.name,
        profession: loggedUser.profession || "Profesional",
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

    setPublishing(false);

    setOffer({
      serviceTitle: "",
      category: "Tecnología",
      description: "",
      price: "",
    });

    await loadServices();

    alert("¡Servicio publicado correctamente!");

    setPage("home");
  }

  function openAccount() {
    setPage("account");

    if (loggedUser) {
      setProfileForm({
        name: loggedUser.name || "",
        profession: loggedUser.profession || "",
        bio: loggedUser.bio || "",
      });
    }
  }

  function openRequests() {
    if (!loggedUser) {
      setAccountMode("login");
      setPage("account");
      return;
    }

    loadRequests();
    setPage("requests");
  }

  function openService(service) {
    setSelectedService(service);
    setRequestMessage("");
    setPage("service");
  }

  useEffect(() => {
    async function startAuth() {
      setAuthLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await refreshUser(session.user);
      }

      setAuthLoading(false);
    }

    startAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await refreshUser(session.user);
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
    }
  }, [loggedUser?.id]);

  const filteredServices = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    const result = services.filter((service) => {
      const categoryMatch =
        category === "Todas" ||
        service.category === category;

      if (!categoryMatch) return false;

      if (!q) return true;

      return [
        service.name,
        service.profession,
        service.service,
        service.category,
        service.description,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        );
    });

    if (sortBy === "priceLow") {
      return [...result].sort(
        (a, b) => a.price - b.price
      );
    }

    if (sortBy === "priceHigh") {
      return [...result].sort(
        (a, b) => b.price - a.price
      );
    }

    if (sortBy === "rating") {
      return [...result].sort(
        (a, b) => b.rating - a.rating
      );
    }

    return result;
  }, [
    services,
    deferredSearch,
    category,
    sortBy,
  ]);

  const received = requests.filter(
    (r) => r.provider_id === loggedUser?.id
  );

  const sent = requests.filter(
    (r) => r.client_id === loggedUser?.id
  );

  const pending = requests.filter(
    (r) => r.status === "pending"
  ).length;

  const accepted = requests.filter(
    (r) => r.status === "accepted"
  ).length;

  const published = services.filter(
    (s) =>
      !s.demo &&
      s.userId === loggedUser?.id
  ).length;

  function Header() {
    return (
      <header className="header">
        <div className="headerInner">
          <button
            className="logoButton"
            onClick={() => setPage("home")}
          >
            <span className="logoMark">R</span>

            <span className="logoText">
              Rob<span>Loren</span>
            </span>
          </button>

          <nav className="nav">
            <button
              className="navButton"
              onClick={() => setPage("home")}
            >
              Inicio
            </button>

            <button
              className="navButton"
              onClick={() => {
                setPage("home");

                setTimeout(() => {
                  document
                    .getElementById("services")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }, 100);
              }}
            >
              Servicios
            </button>

            {loggedUser && (
              <button
                className="navButton"
                onClick={openRequests}
              >
                Solicitudes
              </button>
            )}

            <button
              className="navAccount"
              onClick={openAccount}
            >
              {loggedUser ? "Mi cuenta" : "Entrar"}
            </button>
          </nav>
        </div>
      </header>
    );
  }

  function HomePage() {
    const featuredServices =
      filteredServices.slice(0, 3);

    const professionals = [];

    filteredServices.forEach((service) => {
      const exists = professionals.some(
        (person) => person.name === service.name
      );

      if (!exists) {
        professionals.push({
          name: service.name,
          profession: service.profession,
          category: service.category,
          userId: service.userId,
          service: service,
          rating: service.rating,
          reviews: service.reviews,
          jobs: service.jobs,
          experience: service.experience,
        });
      }
    });

    return (
      <>
        <section className="hero">
          <div className="heroInner">
            <div className="heroCopy">
              <span className="badge">
                ✦ Marketplace profesional
              </span>

              <h1>
                Conecta talento
                <br />
                <span>con oportunidades.</span>
              </h1>

              <p>
                Encuentra profesionales, publica tus
                servicios y conecta con clientes dentro de
                una plataforma creada para crecer.
              </p>

              <div className="heroActions">
                <button
                  className="primary"
                  onClick={() =>
                    document
                      .getElementById("services")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  Explorar servicios
                </button>

                <button
                  className="secondary"
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

            <div className="heroCard">
              <div className="heroCardTitle">
                🔎 Encuentra talento
              </div>

              <div
                className="heroSearch"
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                ¿Qué servicio buscas?
              </div>

              <div className="tags">
                <span>💻 Tecnología</span>
                <span>🎨 Diseño</span>
                <span>📣 Marketing</span>
              </div>

              <div className="miniStats">
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

        <section className="categories">
          <div className="container">
            <span className="eyebrow">
              EXPLORA
            </span>

            <h2>
              Encuentra el servicio que necesitas
            </h2>

            <p className="muted">
              Profesionales listos para ayudarte.
            </p>

            <div className="categoryGrid">
              <button
                className={
                  category === "Todas"
                    ? "category active"
                    : "category"
                }
                onClick={() => setCategory("Todas")}
              >
                <span>✨</span>
                Todas
              </button>

              {categories.map(([icon, name]) => (
                <button
                  key={name}
                  className={
                    category === name
                      ? "category active"
                      : "category"
                  }
                  onClick={() => setCategory(name)}
                >
                  <span>{icon}</span>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="featured">
          <div className="container">
            <div className="sectionHeading">
              <div>
                <span className="eyebrow">
                  DESTACADOS
                </span>

                <h2>
                  Servicios que pueden ayudarte
                </h2>

                <p className="muted">
                  Descubre talento disponible en RobLoren.
                </p>
              </div>

              <button
                className="linkButton"
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                Ver todos →
              </button>
            </div>

            <div className="featuredGrid">
              {featuredServices.map((service) => (
                <article
                  key={`featured-${service.demo}-${service.id}`}
                  className="featuredCard"
                  onClick={() => openService(service)}
                >
                  <div className="featuredTop">
                    <div className="featuredIcon">
                      {service.category === "Tecnología"
                        ? "💻"
                        : service.category === "Diseño"
                        ? "🎨"
                        : service.category === "Marketing"
                        ? "📣"
                        : "✦"}
                    </div>

                    <span className="featuredBadge">
                      ⭐ Destacado
                    </span>
                  </div>

                  <span className="featuredCategory">
                    {service.category}
                  </span>

                  <h3>{service.service}</h3>

                  <p>{service.description}</p>

                  <div className="ratingLine">
                    <strong>
                      {stars(service.rating)}
                    </strong>

                    <span>
                      {service.rating.toFixed(1)}
                    </span>

                    <small>
                      ({service.reviews} reseñas)
                    </small>
                  </div>

                  <div className="featuredBottom">
                    <span>
                      {service.name}
                    </span>

                    <strong>
                      Desde ${service.price}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="professionals">
          <div className="container">
            <span className="eyebrow">
              TALENTO
            </span>

            <h2>
              Profesionales destacados
            </h2>

            <p className="muted">
              Personas con habilidades listas para crear
              nuevas oportunidades.
            </p>

            <div className="professionalGrid">
              {professionals.slice(0, 3).map((person) => (
                <article
                  className="professionalCard"
                  key={person.name}
                  onClick={() =>
                    openService(person.service)
                  }
                >
                  <div className="professionalAvatar">
                    {person.name
                      ?.charAt(0)
                      ?.toUpperCase() || "R"}
                  </div>

                  <div className="professionalInfo">
                    <h3>{person.name}</h3>

                    <p>{person.profession}</p>

                    <div className="professionalRating">
                      <strong>
                        {stars(person.rating)}
                      </strong>

                      <span>
                        {person.rating.toFixed(1)}
                      </span>
                    </div>

                    <div className="professionalMeta">
                      <span>
                        {person.jobs}+ trabajos
                      </span>

                      <span>
                        {person.experience}
                      </span>
                    </div>

                    <span className="professionalCategory">
                      {person.category}
                    </span>
                  </div>

                  <button
                    className="smallView"
                    onClick={(event) => {
                      event.stopPropagation();
                      openService(person.service);
                    }}
                  >
                    Ver perfil →
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="how">
          <div className="container">
            <div className="centerHeading">
              <span className="eyebrow">
                CÓMO FUNCIONA
              </span>

              <h2>
                Conectar talento nunca fue tan sencillo
              </h2>

              <p className="muted">
                Una plataforma para convertir talento en
                oportunidades.
              </p>
            </div>

            <div className="steps">
              <div className="step">
                <div className="stepNumber">
                  01
                </div>

                <div className="stepIcon">
                  👤
                </div>

                <h3>
                  Crea tu cuenta
                </h3>

                <p>
                  Regístrate como cliente o profesional y
                  crea tu perfil.
                </p>
              </div>

              <div className="step">
                <div className="stepNumber">
                  02
                </div>

                <div className="stepIcon">
                  🔎
                </div>

                <h3>
                  Encuentra o publica
                </h3>

                <p>
                  Busca el servicio que necesitas o
                  muestra tus propias habilidades.
                </p>
              </div>

              <div className="step">
                <div className="stepNumber">
                  03
                </div>

                <div className="stepIcon">
                  💬
                </div>

                <h3>
                  Conecta directamente
                </h3>

                <p>
                  Habla con profesionales y clientes para
                  definir cada proyecto.
                </p>
              </div>

              <div className="step">
                <div className="stepNumber">
                  04
                </div>

                <div className="stepIcon">
                  🚀
                </div>

                <h3>
                  Trabaja y crece
                </h3>

                <p>
                  Gestiona solicitudes, construye tu
                  reputación y encuentra nuevas oportunidades.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits">
          <div className="container">
            <div className="benefitIntro">
              <span className="eyebrow">
                POR QUÉ ROBLOREN
              </span>

              <h2>
                Una plataforma creada para crecer contigo
              </h2>

              <p>
                RobLoren busca hacer más sencilla la conexión
                entre quienes necesitan talento y quienes
                tienen talento para ofrecer.
              </p>
            </div>

            <div className="benefitGrid">
              <div className="benefit">
                <span>✓</span>
                <div>
                  <h3>
                    Talento profesional
                  </h3>

                  <p>
                    Descubre personas con diferentes
                    habilidades y especialidades.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span>⚡</span>
                <div>
                  <h3>
                    Conexiones directas
                  </h3>

                  <p>
                    Comunícate directamente para entender
                    cada necesidad.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span>🌎</span>
                <div>
                  <h3>
                    Nuevas oportunidades
                  </h3>

                  <p>
                    Conecta con clientes y profesionales
                    dentro y fuera de tu entorno.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span>⭐</span>
                <div>
                  <h3>
                    Reputación profesional
                  </h3>

                  <p>
                    Construye confianza a través de tu
                    perfil, servicios y futuras valoraciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="services"
        >
          <div className="container">
            <div className="sectionTop">
              <div>
                <span className="eyebrow">
                  SERVICIOS
                </span>

                <h2>
                  Profesionales disponibles
                </h2>

                <p className="muted">
                  Explora, compara y encuentra el servicio
                  adecuado para ti.
                </p>
              </div>

              <div className="serviceTools">
                <div className="searchBox">
                  🔎

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Buscar servicios..."
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>

                <select
                  className="sortSelect"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                >
                  <option value="recommended">
                    Recomendados
                  </option>

                  <option value="rating">
                    Mejor valorados
                  </option>

                  <option value="priceLow">
                    Precio menor
                  </option>

                  <option value="priceHigh">
                    Precio mayor
                  </option>
                </select>
              </div>
            </div>

            {servicesLoading ? (
              <div className="empty">
                Cargando servicios...
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="empty">
                <strong>
                  No encontramos servicios
                </strong>

                <p>
                  Prueba con otra búsqueda o categoría.
                </p>
              </div>
            ) : (
              <div className="serviceGrid">
                {filteredServices.map((service) => (
                  <article
                    key={`${service.demo ? "demo" : "real"}-${service.id}`}
                    className="serviceCard"
                  >
                    <div className="provider">
                      <div className="avatar">
                        {service.name
                          ?.charAt(0)
                          ?.toUpperCase() || "R"}
                      </div>

                      <div>
                        <strong>
                          {service.name}
                        </strong>

                        <span>
                          {service.profession}
                        </span>
                      </div>

                      <small>
                        {service.category}
                      </small>
                    </div>

                    <h3>{service.service}</h3>

                    <p>
                      {service.description}
                    </p>

                    <div className="serviceRating">
                      <strong>
                        {stars(service.rating)}
                      </strong>

                      <b>
                        {service.rating.toFixed(1)}
                      </b>

                      <span>
                        ({service.reviews} reseñas)
                      </span>
                    </div>

                    <div className="serviceMeta">
                      <span>
                        ✓ {service.jobs} trabajos
                      </span>

                      <span>
                        🕐 {service.experience}
                      </span>
                    </div>

                    <div className="serviceBottom">
                      <div>
                        <small>Desde</small>

                        <strong>
                          ${service.price}
                        </strong>
                      </div>

                      <button
                        className="view"
                        onClick={() =>
                          openService(service)
                        }
                      >
                        Ver servicio →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="cta">
          <div>
            <span className="eyebrow">
              ROBLOREN
            </span>

            <h2>
              Tu talento merece nuevas oportunidades.
            </h2>

            <p>
              Crea tu perfil y comienza a ofrecer tus
              servicios.
            </p>
          </div>

          <button
            className="ctaButton"
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
        </section>
      </>
    );
  }

  function AccountPage() {
    if (!loggedUser) {
      return (
        <section className="page">
          <div className="authCard">
            <div className="accountLogo">
              R
            </div>

            <span className="eyebrow">
              ROBLOREN
            </span>

            <h1>
              {accountMode === "login"
                ? "Bienvenido a RobLoren"
                : "Crea tu cuenta"}
            </h1>

            <p className="muted">
              Conecta talento con oportunidades.
            </p>

            <div className="tabs">
              <button
                className={
                  accountMode === "login"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setAccountMode("login")
                }
              >
                Iniciar sesión
              </button>

              <button
                className={
                  accountMode === "register"
                    ? "tab active"
                    : "tab"
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
                className="form"
              >
                <label>
                  Correo electrónico

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateForm(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  Contraseña

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      updateForm(
                        "password",
                        e.target.value
                      )
                    }
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                  />
                </label>

                <button
                  className="primary full"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Procesando..."
                    : "Entrar a RobLoren"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={register}
                className="form"
              >
                <label>
                  Nombre

                  <input
                    value={form.name}
                    onChange={(e) =>
                      updateForm(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </label>

                <label>
                  Correo electrónico

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      updateForm(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  Contraseña

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      updateForm(
                        "password",
                        e.target.value
                      )
                    }
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                </label>

                <label>
                  Profesión

                  <input
                    value={form.profession}
                    onChange={(e) =>
                      updateForm(
                        "profession",
                        e.target.value
                      )
                    }
                    placeholder="Ej. Diseñador gráfico"
                  />
                </label>

                <label>
                  Biografía

                  <textarea
                    value={form.bio}
                    onChange={(e) =>
                      updateForm(
                        "bio",
                        e.target.value
                      )
                    }
                    placeholder="Cuéntanos sobre ti..."
                  />
                </label>

                <button
                  className="primary full"
                  disabled={authLoading}
                >
                  {authLoading
                    ? "Creando..."
                    : "Crear mi cuenta"}
                </button>
              </form>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="page">
        <div className="dashboard">
          <div className="dashboardHeader">
            <div>
              <span className="eyebrow">
                CUENTA PROFESIONAL
              </span>

              <h1>
                Hola, {loggedUser.name}
              </h1>

              <p>
                Gestiona tu perfil, servicios y
                oportunidades desde un solo lugar.
              </p>
            </div>

            <div className="bigAvatar">
              {loggedUser.name
                ?.charAt(0)
                ?.toUpperCase() || "R"}
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span>📋</span>
              <strong>{requests.length}</strong>
              <small>Solicitudes</small>
            </div>

            <div className="stat">
              <span>⏳</span>
              <strong>{pending}</strong>
              <small>Pendientes</small>
            </div>

            <div className="stat">
              <span>✓</span>
              <strong>{accepted}</strong>
              <small>Aceptadas</small>
            </div>

            <div className="stat">
              <span>🛠️</span>
              <strong>{published}</strong>
              <small>Servicios publicados</small>
            </div>
          </div>

          <div className="dashboardGrid">
            <div className="panel">
              <span className="eyebrow">
                PERFIL
              </span>

              <h2>Tu información</h2>

              <form
                onSubmit={saveProfile}
                className="form"
              >
                <label>
                  Nombre

                  <input
                    value={profileForm.name}
                    onChange={(e) =>
                      updateProfileForm(
                        "name",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Profesión

                  <input
                    value={profileForm.profession}
                    onChange={(e) =>
                      updateProfileForm(
                        "profession",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Biografía

                  <textarea
                    value={profileForm.bio}
                    onChange={(e) =>
                      updateProfileForm(
                        "bio",
                        e.target.value
                      )
                    }
                  />
                </label>

                <button
                  className="primary"
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
              </form>
            </div>

            <aside>
              <div className="profileBox">
                <div className="profileAvatar">
                  {loggedUser.name
                    ?.charAt(0)
                    ?.toUpperCase() || "R"}
                </div>

                <h3>{loggedUser.name}</h3>

                <p>
                  {loggedUser.profession}
                </p>

                <div className="profileRating">
                  <strong>
                    ★★★★★
                  </strong>

                  <span>
                    Nuevo profesional
                  </span>
                </div>

                <span>
                  ✓ Cuenta activa
                </span>
              </div>

              <div className="quick">
                <h3>Acciones rápidas</h3>

                <button
                  onClick={() =>
                    setPage("offer")
                  }
                >
                  ➕ Publicar servicio
                </button>

                <button onClick={openRequests}>
                  📋 Ver solicitudes
                </button>

                <button
                  onClick={() =>
                    setPage("messages")
                  }
                >
                  💬 Abrir mensajes
                </button>

                <button
                  className="logout"
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

  function ServicePage() {
    if (!selectedService) return null;

    return (
      <section className="page">
        <div className="detail">
          <button
            className="back"
            onClick={() => setPage("home")}
          >
            ← Volver a servicios
          </button>

          <div className="detailGrid">
            <div className="panel">
              <div className="detailTop">
                <span className="eyebrow">
                  {selectedService.category}
                </span>

                {selectedService.rating >= 4.8 && (
                  <span className="topRated">
                    🏆 Mejor valorado
                  </span>
                )}
              </div>

              <h1>
                {selectedService.service}
              </h1>

              <div className="provider">
                <div className="avatar">
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

              <div className="detailRating">
                <strong>
                  {stars(selectedService.rating)}
                </strong>

                <b>
                  {selectedService.rating.toFixed(1)}
                </b>

                <span>
                  {selectedService.reviews} reseñas
                </span>
              </div>

              <hr />

              <h2>Sobre este servicio</h2>

              <p>
                {selectedService.description}
              </p>

              <div className="infoGrid">
                <div>
                  <small>Precio inicial</small>

                  <strong>
                    ${selectedService.price}
                  </strong>
                </div>

                <div>
                  <small>Trabajos realizados</small>

                  <strong>
                    {selectedService.jobs}
                  </strong>
                </div>

                <div>
                  <small>Experiencia</small>

                  <strong>
                    {selectedService.experience}
                  </strong>
                </div>
              </div>

              <div className="profileSummary">
                <div className="summaryIcon">
                  👤
                </div>

                <div>
                  <strong>
                    {selectedService.name}
                  </strong>

                  <p>
                    Profesional especializado en{" "}
                    {selectedService.category.toLowerCase()}.
                    Disponible para nuevos proyectos.
                  </p>
                </div>
              </div>
            </div>

            <div className="panel requestPanel">
              <span className="eyebrow">
                CONTRATAR
              </span>

              <h2>
                Solicita este servicio
              </h2>

              <div className="requestPrice">
                Desde ${selectedService.price}
              </div>

              <div className="trustBox">
                <span>⭐</span>

                <div>
                  <strong>
                    Profesional valorado
                  </strong>

                  <small>
                    {selectedService.rating.toFixed(1)}
                    /5 ·{" "}
                    {selectedService.reviews} reseñas
                  </small>
                </div>
              </div>

              {selectedService.demo ? (
                <div className="notice">
                  <strong>
                    Servicio de demostración
                  </strong>

                  <p>
                    Los servicios publicados por
                    usuarios sí pueden recibir
                    solicitudes.
                  </p>
                </div>
              ) : (
                <>
                  <label>
                    Mensaje para el profesional

                    <textarea
                      value={requestMessage}
                      onChange={(e) =>
                        setRequestMessage(
                          e.target.value
                        )
                      }
                      placeholder="Cuéntale qué necesitas..."
                    />
                  </label>

                  <button
                    className="primary full"
                    onClick={sendRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest
                      ? "Enviando..."
                      : "Solicitar servicio"}
                  </button>

                  <button
                    className="secondary full"
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
            </div>
          </div>
        </div>
      </section>
    );
  }

  function RequestColumn({
    title,
    items,
    received = false,
  }) {
    return (
      <div className="panel">
        <h2>{title}</h2>

        {items.length === 0 ? (
          <div className="empty small">
            <strong>
              No hay solicitudes
            </strong>

            <p>
              {received
                ? "Las solicitudes de clientes aparecerán aquí."
                : "Explora servicios para encontrar profesionales."}
            </p>
          </div>
        ) : (
          items.map((request) => (
            <div
              className="requestCard"
              key={request.id}
            >
              <div className="requestTop">
                <span
                  className={
                    request.status === "accepted"
                      ? "status accepted"
                      : request.status === "rejected"
                      ? "status rejected"
                      : "status"
                  }
                >
                  {statusText(request.status)}
                </span>

                <small>
                  {dateText(request.created_at)}
                </small>
              </div>

              <h3>
                {request.serviceTitle}
              </h3>

              <p>
                <strong>Cliente:</strong>{" "}
                {request.clientName}
              </p>

              <p>
                <strong>Profesional:</strong>{" "}
                {request.providerName}
              </p>

              <div className="messageQuote">
                “{request.message}”
              </div>

              <div className="requestActions">
                {received &&
                  request.status === "pending" && (
                    <>
                      <button
                        className="accept"
                        disabled={
                          updatingRequest ===
                          request.id
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
                        className="reject"
                        disabled={
                          updatingRequest ===
                          request.id
                        }
                        onClick={() =>
                          changeRequestStatus(
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
                  className="messageBtn"
                  onClick={() =>
                    openMessaging({
                      userId:
                        received
                          ? request.client_id
                          : request.provider_id,
                      name:
                        received
                          ? request.clientName
                          : request.providerName,
                      profession:
                        received
                          ? "Cliente"
                          : "Profesional",
                      requestId: request.id,
                    })
                  }
                >
                  💬 Mensajear
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function RequestsPage() {
    return (
      <section className="page">
        <div className="dashboard">
          <button
            className="back"
            onClick={openAccount}
          >
            ← Volver a mi cuenta
          </button>

          <span className="eyebrow">
            GESTIÓN
          </span>

          <h1>Solicitudes</h1>

          <p className="muted">
            Gestiona tus oportunidades y
            contrataciones.
          </p>

          {loadingRequests ? (
            <div className="empty">
              Cargando solicitudes...
            </div>
          ) : (
            <div className="requestColumns">
              <RequestColumn
                title="📥 Solicitudes recibidas"
                items={received}
                received
              />

              <RequestColumn
                title="📤 Mis solicitudes"
                items={sent}
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  function MessagesPage() {
    const contacts = requests.map((request) => {
      const provider =
        request.provider_id === loggedUser?.id;

      return {
        id: request.id,
        contactId: provider
          ? request.client_id
          : request.provider_id,
        name: provider
          ? request.clientName
          : request.providerName,
        profession: provider
          ? "Cliente"
          : "Profesional",
        requestId: request.id,
        serviceTitle: request.serviceTitle,
      };
    });

    return (
      <section className="page">
        <div className="dashboard">
          <button
            className="back"
            onClick={openRequests}
          >
            ← Volver a solicitudes
          </button>

          <div className="messagesLayout">
            <aside className="contacts">
              <span className="eyebrow">
                COMUNICACIÓN
              </span>

              <h2>Mensajes</h2>

              {contacts.length === 0 ? (
                <div className="empty small">
                  Aún no tienes conversaciones.
                </div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={
                      selectedContact?.id ===
                      contact.contactId
                        ? "contact active"
                        : "contact"
                    }
                    onClick={() =>
                      openMessaging({
                        userId:
                          contact.contactId,
                        name: contact.name,
                        profession:
                          contact.profession,
                        requestId:
                          contact.requestId,
                      })
                    }
                  >
                    <div className="avatar">
                      {contact.name
                        ?.charAt(0)
                        ?.toUpperCase() || "R"}
                    </div>

                    <div>
                      <strong>
                        {contact.name}
                      </strong>

                      <span>
                        {contact.serviceTitle}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </aside>

            <main className="chat">
              {!selectedContact ? (
                <div className="chatEmpty">
                  <span>💬</span>

                  <h2>
                    Selecciona una conversación
                  </h2>

                  <p>
                    Elige un contacto para comenzar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="chatHeader">
                    <div className="avatar">
                      {selectedContact.name
                        ?.charAt(0)
                        ?.toUpperCase() || "R"}
                    </div>

                    <div>
                      <strong>
                        {selectedContact.name}
                      </strong>

                      <span>
                        {selectedContact.profession}
                      </span>
                    </div>
                  </div>

                  <div className="chatMessages">
                    {loadingMessages ? (
                      <div className="empty small">
                        Cargando mensajes...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="chatEmpty">
                        <span>👋</span>

                        <strong>
                          Inicia la conversación
                        </strong>

                        <p>
                          Escribe un mensaje para comenzar.
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
                            className={
                              mine
                                ? "bubbleRow mine"
                                : "bubbleRow"
                            }
                          >
                            <div
                              className={
                                mine
                                  ? "bubble mine"
                                  : "bubble"
                              }
                            >
                              <p>
                                {message.message}
                              </p>

                              <small>
                                {dateText(
                                  message.created_at
                                )}
                              </small>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="messageForm"
                  >
                    <textarea
                      value={messageText}
                      onChange={(e) =>
                        setMessageText(
                          e.target.value
                        )
                      }
                      placeholder="Escribe tu mensaje..."
                      rows={2}
                      autoComplete="off"
                    />

                    <button
                      className="primary"
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
    return (
      <section className="page">
        <div className="formContainer">
          <button
            className="back"
            onClick={openAccount}
          >
            ← Volver a mi cuenta
          </button>

          <span className="eyebrow">
            NUEVA OFERTA
          </span>

          <h1>Publica tu servicio</h1>

          <p className="muted">
            Presenta tu talento de forma profesional
            y conecta con nuevos clientes.
          </p>

          <form
            className="panel form"
            onSubmit={publishService}
          >
            <div className="offerUser">
              <div className="avatar">
                {loggedUser?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "R"}
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

            <label>
              Título del servicio

              <input
                value={offer.serviceTitle}
                onChange={(e) =>
                  updateOffer(
                    "serviceTitle",
                    e.target.value
                  )
                }
                placeholder="Ej. Diseño de logotipo profesional"
              />
            </label>

            <label>
              Categoría

              <select
                value={offer.category}
                onChange={(e) =>
                  updateOffer(
                    "category",
                    e.target.value
                  )
                }
              >
                {categories.map(([, name]) => (
                  <option
                    key={name}
                    value={name}
                  >
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
                  updateOffer(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe qué ofreces..."
              />
            </label>

            <label>
              Precio inicial

              <input
                type="number"
                min="0"
                step="1"
                value={offer.price}
                onChange={(e) =>
                  updateOffer(
                    "price",
                    e.target.value
                  )
                }
                placeholder="0"
                inputMode="numeric"
              />
            </label>

            <button
              className="primary full"
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

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          -webkit-text-size-adjust: 100%;
        }

        body {
          margin: 0;
          background: #F8FAFC;
          color: #0F172A;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        input,
        textarea,
        select {
          -webkit-appearance: none;
          appearance: none;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.97);
          border-bottom: 1px solid #E2E8F0;
          backdrop-filter: blur(12px);
        }

        .headerInner {
          max-width: 1180px;
          margin: auto;
          padding: 13px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .logoButton {
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0;
        }

        .logoMark,
        .accountLogo {
          display: grid;
          place-items: center;
          background: #0F172A;
          color: white;
          font-weight: 800;
        }

        .logoMark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
        }

        .logoText {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
        }

        .logoText span {
          color: #2563EB;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .navButton,
        .navAccount {
          border: 0;
          background: transparent;
          padding: 10px 12px;
          color: #475569;
          font-weight: 700;
        }

        .navButton:hover {
          color: #2563EB;
        }

        .navAccount {
          background: #0F172A;
          color: white;
          border-radius: 10px;
        }

        .navAccount:hover,
        .primary:hover {
          background: #1E3A8A;
        }

        .hero {
          background:
            linear-gradient(
              135deg,
              #EFF6FF,
              #FFFFFF 55%,
              #F1F5F9
            );
        }

        .heroInner {
          max-width: 1180px;
          min-height: 570px;
          margin: auto;
          padding: 70px 24px;
          display: grid;
          grid-template-columns:
            minmax(0,1.15fr)
            minmax(300px,.85fr);
          gap: 60px;
          align-items: center;
        }

        .heroCopy {
          max-width: 650px;
        }

        .badge {
          display: inline-block;
          padding: 8px 13px;
          border-radius: 999px;
          background: #DBEAFE;
          color: #1E3A8A;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(42px,6vw,72px);
          line-height: 1.02;
          letter-spacing: -3px;
          color: #0F172A;
        }

        .hero h1 span {
          color: #2563EB;
        }

        .hero p {
          max-width: 570px;
          color: #64748B;
          font-size: 18px;
          line-height: 1.65;
          margin: 25px 0;
        }

        .heroActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary,
        .secondary {
          border-radius: 10px;
          padding: 13px 18px;
          font-weight: 800;
          transition: .2s ease;
        }

        .primary {
          border: 0;
          background: #0F172A;
          color: white;
        }

        .secondary {
          border: 1px solid #CBD5E1;
          background: white;
          color: #1E3A8A;
        }

        .secondary:hover {
          border-color: #2563EB;
          background: #EFF6FF;
        }

        .full {
          width: 100%;
        }

        .heroCard {
          background: white;
          border: 1px solid #DBEAFE;
          border-radius: 24px;
          padding: 28px;
          box-shadow:
            0 25px 70px rgba(15,23,42,.10);
        }

        .heroCardTitle {
          font-size: 15px;
          line-height: 1.35;
          font-weight: 800;
          margin-bottom: 18px;
        }

        .heroSearch {
          border: 1px solid #DCE4ED;
          border-radius: 12px;
          padding: 15px;
          color: #8591A0;
          font-size: 13px;
          cursor: pointer;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .tags span {
          background: #EFF6FF;
          color: #1E3A8A;
          padding: 7px 9px;
          border-radius: 999px;
          font-size: 11px;
        }

        .miniStats {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
          border-top: 1px solid #EDF1F5;
          margin-top: 24px;
          padding-top: 20px;
        }

        .miniStats div,
        .stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .miniStats strong {
          font-size: 18px;
        }

        .miniStats span {
          color: #8793A2;
          font-size: 10px;
        }

        .categories,
        .services,
        .featured,
        .professionals,
        .how,
        .benefits {
          padding: 65px 0;
        }

        .categories {
          background: white;
        }

        .services {
          background: #F8FAFC;
        }

        .featured {
          background: white;
        }

        .professionals {
          background: #F8FAFC;
        }

        .how {
          background: white;
        }

        .benefits {
          background: #F1F5F9;
        }

        .container,
        .dashboard,
        .detail,
        .formContainer {
          max-width: 1180px;
          margin: auto;
          padding-left: 24px;
          padding-right: 24px;
        }

        .eyebrow {
          display: block;
          color: #2563EB;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.7px;
          margin-bottom: 8px;
        }

        h1,
        h2,
        h3 {
          color: #0F172A;
        }

        h2 {
          font-size: 29px;
          letter-spacing: -.7px;
          margin: 0 0 10px;
        }

        .muted {
          color: #64748B;
        }

        .categoryGrid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit,minmax(125px,1fr));
          gap: 11px;
          margin-top: 25px;
        }

        .category {
          border: 1px solid #DCE4ED;
          background: white;
          border-radius: 14px;
          padding: 13px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 12px;
          color: #405269;
        }

        .category span {
          font-size: 21px;
        }

        .category.active {
          background: #0F172A;
          border-color: #0F172A;
          color: white;
        }

        .sectionHeading,
        .sectionTop {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .linkButton {
          border: 0;
          background: transparent;
          color: #2563EB;
          font-weight: 900;
        }

        .featuredGrid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 17px;
        }

        .featuredCard {
          border: 1px solid #E0E7EF;
          border-radius: 18px;
          padding: 22px;
          background: white;
          cursor: pointer;
          transition: .2s ease;
        }

        .featuredCard:hover {
          transform: translateY(-3px);
          border-color: #BFDBFE;
          box-shadow:
            0 15px 35px rgba(15,23,42,.07);
        }

        .featuredTop {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 10px;
        }

        .featuredIcon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #EFF6FF;
          font-size: 22px;
          margin-bottom: 14px;
        }

        .featuredBadge {
          background: #FFF7D6;
          color: #8A6510;
          padding: 6px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .featuredCategory {
          color: #2563EB;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .featuredCard h3 {
          margin: 9px 0;
          font-size: 18px;
        }

        .featuredCard p {
          color: #64748B;
          font-size: 13px;
          line-height: 1.55;
          min-height: 60px;
        }

        .ratingLine,
        .serviceRating,
        .professionalRating,
        .detailRating {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ratingLine strong,
        .serviceRating strong,
        .professionalRating strong,
        .detailRating strong {
          color: #E3A500;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .ratingLine span,
        .serviceRating b,
        .professionalRating span,
        .detailRating b {
          font-weight: 900;
          font-size: 12px;
          color: #334155;
        }

        .ratingLine small,
        .serviceRating span,
        .detailRating span {
          color: #7A899B;
          font-size: 10px;
        }

        .featuredBottom {
          border-top: 1px solid #EDF1F5;
          margin-top: 16px;
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .featuredBottom span {
          color: #64748B;
          font-size: 11px;
        }

        .featuredBottom strong {
          font-size: 14px;
        }

        .professionalGrid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 17px;
          margin-top: 25px;
        }

        .professionalCard {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 17px;
          padding: 18px;
          cursor: pointer;
        }

        .professionalCard:hover {
          border-color: #BFDBFE;
        }

        .professionalAvatar {
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          border-radius: 15px;
          display: grid;
          place-items: center;
          background: #0F172A;
          color: white;
          font-size: 20px;
          font-weight: 900;
        }

        .professionalInfo {
          flex: 1;
          min-width: 0;
        }

        .professionalInfo h3 {
          margin: 0 0 4px;
          font-size: 15px;
        }

        .professionalInfo p {
          margin: 0 0 7px;
          color: #64748B;
          font-size: 11px;
        }

        .professionalRating {
          margin-bottom: 8px;
        }

        .professionalMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 8px;
        }

        .professionalMeta span {
          color: #64748B;
          background: #F1F5F9;
          padding: 4px 6px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
        }

        .professionalCategory {
          color: #1E3A8A;
          background: #EFF6FF;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
        }

        .smallView {
          border: 0;
          background: transparent;
          color: #2563EB;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .centerHeading {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 35px;
        }

        .centerHeading h2 {
          margin-bottom: 8px;
        }

        .steps {
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 17px;
        }

        .step {
          position: relative;
          border: 1px solid #E0E7EF;
          border-radius: 17px;
          padding: 22px;
          background: #F8FAFC;
        }

        .stepNumber {
          color: #2563EB;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .stepIcon {
          font-size: 28px;
          margin: 15px 0;
        }

        .step h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }

        .step p {
          color: #64748B;
          font-size: 12px;
          line-height: 1.55;
          margin: 0;
        }

        .benefitIntro {
          max-width: 650px;
          margin-bottom: 30px;
        }

        .benefitIntro h2 {
          font-size: 35px;
        }

        .benefitIntro p {
          color: #64748B;
          line-height: 1.65;
        }

        .benefitGrid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 14px;
        }

        .benefit {
          display: flex;
          gap: 15px;
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 16px;
          padding: 20px;
        }

        .benefit > span {
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #EFF6FF;
          color: #2563EB;
          font-weight: 900;
        }

        .benefit h3 {
          margin: 0 0 6px;
          font-size: 15px;
        }

        .benefit p {
          margin: 0;
          color: #64748B;
          font-size: 12px;
          line-height: 1.5;
        }

        .serviceTools {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 440px;
          max-width: 100%;
        }

        .searchBox {
          flex: 1;
          min-width: 0;
          background: white;
          border: 1px solid #DCE4ED;
          border-radius: 11px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .searchBox:focus-within {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px #DBEAFE;
        }

        .searchBox input {
          border: 0;
          outline: 0;
          width: 100%;
          padding: 13px 0;
          background: transparent;
          box-shadow: none;
        }

        .sortSelect {
          width: 150px;
          padding: 12px 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .serviceGrid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
          gap: 17px;
        }

        .serviceCard,
        .panel,
        .authCard {
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 18px;
          padding: 23px;
          box-shadow:
            0 10px 30px rgba(15,23,42,.035);
        }

        .serviceCard {
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .serviceCard:hover {
          transform: translateY(-2px);
          border-color: #BFDBFE;
          box-shadow:
            0 14px 35px rgba(15,23,42,.07);
        }

        .provider {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .provider > div:nth-child(2) {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .provider span,
        .offerUser span,
        .contact span,
        .chatHeader span {
          color: #7A899B;
          font-size: 11px;
        }

        .provider small {
          background: #EFF6FF;
          color: #1E3A8A;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
        }

        .avatar {
          width: 43px;
          height: 43px;
          flex: 0 0 auto;
          border-radius: 12px;
          background: #DBEAFE;
          display: grid;
          place-items: center;
          font-weight: 900;
          color: #1E3A8A;
        }

        .serviceCard h3 {
          margin: 17px 0 8px;
          font-size: 17px;
          line-height: 1.3;
        }

        .serviceCard p {
          color: #6C7C90;
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
        }

        .panel p {
          color: #6C7C90;
          line-height: 1.6;
        }

        .serviceRating {
          margin-top: 15px;
        }

        .serviceMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }

        .serviceMeta span {
          background: #F1F5F9;
          color: #64748B;
          padding: 5px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
        }

        .serviceBottom {
          border-top: 1px solid #EDF1F5;
          padding-top: 15px;
          margin-top: 17px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .serviceBottom small {
          display: block;
          color: #8A96A5;
          font-size: 9px;
        }

        .serviceBottom strong {
          font-size: 20px;
        }

        .view {
          border: 0;
          background: #EFF6FF;
          color: #1E3A8A;
          border-radius: 9px;
          padding: 9px 12px;
          font-weight: 800;
          font-size: 11px;
        }

        .cta {
          background: #0F172A;
          color: white;
          padding: 65px max(24px,calc((100% - 1120px)/2));
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
        }

        .cta h2 {
          color: white;
          font-size: 38px;
          line-height: 1.1;
          max-width: 650px;
        }

        .cta p {
          color: #B9C4D2;
        }

        .ctaButton {
          border: 0;
          background: white;
          color: #0F172A;
          border-radius: 10px;
          padding: 14px 20px;
          font-weight: 900;
          white-space: nowrap;
        }

        .page {
          min-height: calc(100vh - 70px);
          padding: 45px 0 80px;
        }

        .authCard {
          max-width: 520px;
          margin: 20px auto;
          text-align: center;
        }

        .accountLogo {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          margin: 0 auto 17px;
        }

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #F1F5F9;
          padding: 4px;
          border-radius: 10px;
          margin: 25px 0;
        }

        .tab {
          border: 0;
          background: transparent;
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          color: #718096;
        }

        .tab.active {
          background: white;
          color: #1E3A8A;
          box-shadow:
            0 2px 8px rgba(15,23,42,.06);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          text-align: left;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #405168;
          font-size: 12px;
          font-weight: 800;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid #D7E0E9;
          border-radius: 10px;
          padding: 12px 13px;
          outline: 0;
          background: white;
          color: #0F172A;
          font-size: 16px;
          line-height: 1.4;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px #DBEAFE;
        }

        textarea {
          min-height: 110px;
          resize: vertical;
        }

        .dashboardHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 25px;
          margin-bottom: 28px;
        }

        .dashboardHeader h1 {
          font-size: 38px;
          margin: 0 0 8px;
        }

        .dashboardHeader p {
          color: #718096;
        }

        .bigAvatar {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          background: #0F172A;
          color: white;
          font-size: 28px;
          font-weight: 900;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat {
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 15px;
          padding: 18px;
        }

        .stat span {
          font-size: 19px;
        }

        .stat strong {
          font-size: 24px;
        }

        .stat small {
          color: #718096;
          font-size: 11px;
        }

        .dashboardGrid,
        .detailGrid {
          display: grid;
          grid-template-columns:
            minmax(0,1fr) 320px;
          gap: 20px;
        }

        .requestColumns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 25px;
        }

        .profileBox {
          background: #0F172A;
          color: white;
          border-radius: 18px;
          padding: 25px;
          text-align: center;
        }

        .profileBox h3 {
          color: white;
        }

        .profileBox p {
          color: #BDC8D5;
        }

        .profileBox > span {
          background: rgba(37,99,235,.28);
          color: #DBEAFE;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
        }

        .profileAvatar {
          width: 68px;
          height: 68px;
          margin: auto;
          border-radius: 19px;
          background: white;
          color: #0F172A;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
        }

        .profileRating {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 4px;
          margin: 13px 0 15px;
        }

        .profileRating strong {
          color: #E3A500;
          letter-spacing: 2px;
        }

        .profileRating span {
          color: #AEB9C7;
          font-size: 10px;
        }

        .quick {
          margin-top: 15px;
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .quick button {
          border: 1px solid #DCE4ED;
          background: white;
          color: #334155;
          border-radius: 9px;
          padding: 11px;
          font-weight: 800;
          text-align: left;
        }

        .quick .logout {
          color: #A34D4D;
        }

        .back {
          border: 0;
          background: transparent;
          color: #1E3A8A;
          font-weight: 800;
          padding: 0;
          margin-bottom: 25px;
        }

        .detailTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .topRated {
          background: #FFF7D6;
          color: #8A6510;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .detailRating {
          margin-top: 16px;
        }

        .profileSummary {
          margin-top: 25px;
          padding: 16px;
          background: #F8FAFC;
          border: 1px solid #E6EBF1;
          border-radius: 14px;
          display: flex;
          gap: 12px;
        }

        .summaryIcon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #DBEAFE;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .profileSummary p {
          margin: 5px 0 0;
          font-size: 11px;
        }

        .infoGrid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 12px;
          margin-top: 25px;
        }

        .infoGrid div {
          background: #F1F5F9;
          padding: 15px;
          border-radius: 12px;
        }

        .infoGrid small,
        .infoGrid strong {
          display: block;
        }

        .infoGrid small {
          color: #7B8999;
          font-size: 10px;
        }

        .infoGrid strong {
          margin-top: 4px;
          font-size: 14px;
        }

        .requestPrice {
          font-size: 24px;
          font-weight: 900;
          margin: 15px 0;
        }

        .trustBox {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          border: 1px solid #E5EAF0;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .trustBox > span {
          font-size: 21px;
        }

        .trustBox div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .trustBox strong {
          font-size: 12px;
        }

        .trustBox small {
          color: #718096;
          font-size: 10px;
        }

        .notice {
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          padding: 15px;
          border-radius: 12px;
        }

        .notice strong {
          color: #1E3A8A;
        }

        .requestCard {
          border-top: 1px solid #E9EDF2;
          padding: 18px 0;
        }

        .requestTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .status {
          background: #FFF4D9;
          color: #8A6510;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .status.accepted {
          background: #E4F5EB;
          color: #267348;
        }

        .status.rejected {
          background: #F9E5E5;
          color: #A34848;
        }

        .messageQuote {
          background: #F1F5F9;
          padding: 12px;
          border-radius: 10px;
          color: #627287;
          font-size: 12px;
        }

        .requestActions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .requestActions button {
          border: 0;
          border-radius: 8px;
          padding: 9px 11px;
          font-weight: 800;
          font-size: 11px;
        }

        .accept {
          background: #E5F5EB;
          color: #267348;
        }

        .reject {
          background: #FAE7E7;
          color: #A34848;
        }

        .messageBtn {
          background: #EFF6FF;
          color: #1E3A8A;
        }

        .messagesLayout {
          display: grid;
          grid-template-columns: 300px 1fr;
          min-height: 580px;
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 18px;
          overflow: hidden;
        }

        .contacts {
          border-right: 1px solid #E5EAF0;
          padding: 20px;
        }

        .contact {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 11px;
          border-radius: 10px;
        }

        .contact.active {
          background: #EFF6FF;
        }

        .contact div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .chat {
          display: flex;
          flex-direction: column;
        }

        .chatHeader {
          padding: 17px;
          border-bottom: 1px solid #E5EAF0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chatHeader div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .chatMessages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .bubbleRow {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 9px;
        }

        .bubbleRow.mine {
          justify-content: flex-end;
        }

        .bubble {
          max-width: 75%;
          background: #F1F5F9;
          padding: 10px 13px;
          border-radius: 14px;
        }

        .bubble.mine {
          background: #0F172A;
          color: white;
        }

        .bubble p {
          margin: 0 0 5px;
        }

        .bubble small {
          font-size: 9px;
          opacity: .65;
        }

        .messageForm {
          border-top: 1px solid #E5EAF0;
          padding: 13px;
          display: flex;
          gap: 10px;
        }

        .messageForm textarea {
          min-height: 50px;
        }

        .chatEmpty {
          min-height: 300px;
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
          color: #718096;
          padding: 30px;
        }

        .chatEmpty span {
          font-size: 32px;
        }

        .offerUser {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 5px;
        }

        .offerUser div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .empty {
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 16px;
          padding: 45px;
          text-align: center;
          color: #718096;
        }

        .empty.small {
          padding: 30px 15px;
        }

        @media (max-width: 900px) {
          .featuredGrid,
          .professionalGrid {
            grid-template-columns: 1fr;
          }

          .steps {
            grid-template-columns: repeat(2,1fr);
          }
        }

        @media (max-width: 760px) {
          .headerInner {
            padding: 10px 15px;
          }

          .logoText {
            font-size: 19px;
          }

          .nav {
            gap: 2px;
          }

          .navButton {
            display: none;
          }

          .navAccount {
            padding: 9px 12px;
            font-size: 12px;
          }

          .heroInner {
            grid-template-columns: 1fr;
            padding: 48px 17px;
            min-height: auto;
            gap: 35px;
          }

          .hero h1 {
            font-size: 45px;
            letter-spacing: -2px;
          }

          .hero p {
            font-size: 16px;
          }

          .heroActions {
            flex-direction: column;
          }

          .heroActions button {
            width: 100%;
          }

          .heroCard {
            padding: 20px;
          }

          .container,
          .dashboard,
          .detail,
          .formContainer {
            padding-left: 15px;
            padding-right: 15px;
          }

          .categories,
          .services,
          .featured,
          .professionals,
          .how,
          .benefits {
            padding: 45px 0;
          }

          .categories h2,
          .services h2,
          .featured h2,
          .professionals h2,
          .how h2 {
            font-size: 25px;
          }

          .categoryGrid {
            grid-template-columns: repeat(2,1fr);
          }

          .sectionTop,
          .sectionHeading,
          .dashboardHeader,
          .cta {
            align-items: stretch;
            flex-direction: column;
          }

          .serviceTools {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .sortSelect {
            width: 100%;
          }

          .searchBox {
            width: 100%;
          }

          .serviceGrid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2,1fr);
          }

          .dashboardGrid,
          .detailGrid,
          .requestColumns {
            grid-template-columns: 1fr;
          }

          .bigAvatar {
            display: none;
          }

          .dashboardHeader h1 {
            font-size: 32px;
          }

          .infoGrid {
            grid-template-columns: 1fr;
          }

          .messagesLayout {
            grid-template-columns: 1fr;
            min-height: 650px;
          }

          .contacts {
            border-right: 0;
            border-bottom: 1px solid #E5EAF0;
            max-height: 220px;
            overflow-y: auto;
          }

          .messageForm {
            flex-direction: column;
          }

          .messageForm button {
            width: 100%;
          }

          .cta {
            padding: 50px 18px;
          }

          .cta h2 {
            font-size: 31px;
          }

          .ctaButton {
            width: 100%;
          }

          .benefitGrid,
          .steps {
            grid-template-columns: 1fr;
          }

          .benefitIntro h2 {
            font-size: 29px;
          }

          .authCard {
            margin-left: 15px;
            margin-right: 15px;
            padding: 20px;
          }

          input,
          textarea,
          select {
            font-size: 16px;
          }

          .professionalCard {
            align-items: flex-start;
          }

          .smallView {
            font-size: 9px;
          }
        }
      `}</style>

      <Header />

      {authLoading && !loggedUser ? (
        <div className="empty">
          Cargando RobLoren...
        </div>
      ) : (
        <>
          {page === "home" && <HomePage />}
          {page === "account" && <AccountPage />}
          {page === "service" && <ServicePage />}
          {page === "requests" && <RequestsPage />}
          {page === "messages" && <MessagesPage />}
          {page === "offer" && <OfferPage />}
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
