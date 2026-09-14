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
    service: "Diseño de logotipos profesionales",
    category: "Diseño",
    description:
      "Diseño logotipos modernos y profesionales para marcas, negocios y emprendimientos.",
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
      "Ayudo a negocios a mejorar su presencia, contenido y alcance en redes sociales.",
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

function categoryIcon(category) {
  const found = categories.find(
    ([, name]) => name === category
  );

  return found?.[0] || "✦";
}

function App() {
  const [page, setPage] = useState("home");
  const [services, setServices] = useState(demoServices);
  const [selectedService, setSelectedService] =
    useState(null);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("Todas");
  const [sortBy, setSortBy] =
    useState("recommended");

  const [loggedUser, setLoggedUser] = useState(null);
  const [accountMode, setAccountMode] =
    useState("login");
  const [authLoading, setAuthLoading] =
    useState(true);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] =
    useState(false);
  const [updatingRequest, setUpdatingRequest] =
    useState(null);
  const [requestMessage, setRequestMessage] =
    useState("");
  const [sendingRequest, setSendingRequest] =
    useState(false);

  const [selectedContact, setSelectedContact] =
    useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] =
    useState("");
  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [sendingMessage, setSendingMessage] =
    useState(false);

  const [servicesLoading, setServicesLoading] =
    useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [publishing, setPublishing] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profession: "",
    bio: "",
  });

  const [profileForm, setProfileForm] =
    useState({
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
        user.user_metadata?.profession ||
        "Profesional",
      bio: user.user_metadata?.bio || "",
    };

    const {
      data: created,
      error: createError,
    } = await supabase
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
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setServices(demoServices);
      setServicesLoading(false);
      return;
    }

    const rows = data || [];

    const ids = [
      ...new Set(
        rows
          .map((x) => x.user_id)
          .filter(Boolean)
      ),
    ];

    let profiles = {};

    if (ids.length) {
      const { data: profileRows } =
        await supabase
          .from("profiles")
          .select("id,name,profession,bio")
          .in("id", ids);

      profiles = Object.fromEntries(
        (profileRows || []).map((p) => [
          p.id,
          p,
        ])
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
      .order("created_at", {
        ascending: false,
      });

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
          .flatMap((r) => [
            r.client_id,
            r.provider_id,
          ])
          .filter(Boolean)
      ),
    ];

    const serviceIds = [
      ...new Set(
        rows
          .map((r) => r.service_id)
          .filter(Boolean)
      ),
    ];

    let profiles = {};
    let serviceRows = {};

    if (profileIds.length) {
      const { data: ps } =
        await supabase
          .from("profiles")
          .select("id,name,profession,bio")
          .in("id", profileIds);

      profiles = Object.fromEntries(
        (ps || []).map((p) => [
          p.id,
          p,
        ])
      );
    }

    if (serviceIds.length) {
      const { data: ss } =
        await supabase
          .from("services")
          .select(
            "id,service_title,category,description,price,user_id"
          )
          .in("id", serviceIds);

      serviceRows = Object.fromEntries(
        (ss || []).map((s) => [
          s.id,
          s,
        ])
      );
    }

    setRequests(
      rows.map((r) => {
        const service =
          serviceRows[r.service_id];
        const client =
          profiles[r.client_id];
        const provider =
          profiles[r.provider_id];

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
            service?.service_title ||
            "Servicio profesional",
          serviceCategory:
            service?.category || "Otros",
          servicePrice:
            Number(service?.price) || 0,
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
      .order("created_at", {
        ascending: true,
      });

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

    const { data, error } =
      await supabase
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
      alert(error.message);
      setSendingMessage(false);
      return;
    }

    setMessages((current) => [
      ...current,
      data,
    ]);

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
      profession:
        contact.profession || "Profesional",
      requestId:
        contact.requestId || null,
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

    if (
      selectedService.userId ===
      loggedUser.id
    ) {
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
        provider_id:
          selectedService.userId,
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

  async function changeRequestStatus(
    id,
    status
  ) {
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

    const { data, error } =
      await supabase
        .from("profiles")
        .update({
          name: profileForm.name.trim(),
          profession:
            profileForm.profession.trim() ||
            "Profesional",
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
      alert(
        "Completa nombre, correo y contraseña."
      );
      return;
    }

    if (form.password.length < 6) {
      alert(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setAuthLoading(true);

    const { data, error } =
      await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            profession:
              form.profession.trim() ||
              "Profesional",
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

    if (
      !form.email.trim() ||
      !form.password
    ) {
      alert(
        "Escribe tu correo y contraseña."
      );
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
    const { error } =
      await supabase.auth.signOut();

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
      alert(
        "Completa título, descripción y precio."
      );
      return;
    }

    setPublishing(true);

    const { error } =
      await supabase
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
        profession:
          loggedUser.profession || "",
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

  function goToServices() {
    setPage("home");

    setTimeout(() => {
      document
        .getElementById("services")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  }

  useEffect(() => {
    async function startAuth() {
      setAuthLoading(true);

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session?.user) {
        await refreshUser(session.user);
      }

      setAuthLoading(false);
    }

    startAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await refreshUser(
              session.user
            );
          } else {
            setLoggedUser(null);
          }
        }
      );

    return () =>
      subscription.unsubscribe();
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
    const q = deferredSearch
      .trim()
      .toLowerCase();

    const result = services.filter(
      (service) => {
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
            String(value)
              .toLowerCase()
              .includes(q)
          );
      }
    );

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
    (r) =>
      r.provider_id === loggedUser?.id
  );

  const sent = requests.filter(
    (r) =>
      r.client_id === loggedUser?.id
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
            <span className="logoMark">
              R
            </span>

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
              onClick={goToServices}
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
    const featuredServices =
      filteredServices.slice(0, 3);

    const professionals = [];

    filteredServices.forEach(
      (service) => {
        const exists =
          professionals.some(
            (person) =>
              person.name === service.name
          );

        if (!exists) {
          professionals.push({
            name: service.name,
            profession:
              service.profession,
            category:
              service.category,
            userId: service.userId,
            service,
            rating: service.rating,
            reviews: service.reviews,
            jobs: service.jobs,
            experience:
              service.experience,
          });
        }
      }
    );

    const totalRealServices =
      services.filter((s) => !s.demo)
        .length;

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
                <span>
                  con oportunidades.
                </span>
              </h1>

              <p>
                Encuentra profesionales,
                publica tus servicios y
                conecta con clientes dentro
                de una plataforma creada para
                crecer.
              </p>

              <div className="heroActions">
                <button
                  className="primary"
                  onClick={goToServices}
                >
                  Explorar servicios
                </button>

                <button
                  className="secondary"
                  onClick={() => {
                    if (!loggedUser) {
                      setAccountMode(
                        "register"
                      );
                      setPage("account");
                    } else {
                      setPage("offer");
                    }
                  }}
                >
                  Ofrecer mis servicios
                </button>
              </div>

              <div className="heroTrust">
                <span>✓ Perfiles profesionales</span>
                <span>✓ Contacto directo</span>
                <span>✓ Sin pagos implementados todavía</span>
              </div>
            </div>

            <div className="heroCard">
              <div className="heroCardHeader">
                <div>
                  <span className="heroSmall">
                    ROBLOREN
                  </span>

                  <h3>
                    Encuentra talento
                  </h3>
                </div>

                <div className="heroRound">
                  🔎
                </div>
              </div>

              <button
                className="heroSearch"
                onClick={goToServices}
              >
                <span>🔎</span>
                <span>
                  ¿Qué servicio buscas?
                </span>
                <b>→</b>
              </button>

              <div className="tags">
                <button
                  onClick={() =>
                    setCategory(
                      "Tecnología"
                    )
                  }
                >
                  💻 Tecnología
                </button>

                <button
                  onClick={() =>
                    setCategory("Diseño")
                  }
                >
                  🎨 Diseño
                </button>

                <button
                  onClick={() =>
                    setCategory(
                      "Marketing"
                    )
                  }
                >
                  📣 Marketing
                </button>
              </div>

              <div className="miniStats">
                <div>
                  <strong>
                    +{totalRealServices + 100}
                  </strong>
                  <span>Servicios</span>
                </div>

                <div>
                  <strong>
                    +{Math.max(
                      50,
                      professionals.length
                    )}
                  </strong>
                  <span>
                    Profesionales
                  </span>
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
              EXPLORA CATEGORÍAS
            </span>

            <h2>
              Encuentra el servicio que
              necesitas
            </h2>

            <p className="muted">
              Explora diferentes especialidades
              y encuentra talento para tu
              próximo proyecto.
            </p>

            <div className="categoryGrid">
              <button
                className={
                  category === "Todas"
                    ? "category active"
                    : "category"
                }
                onClick={() =>
                  setCategory("Todas")
                }
              >
                <span>✨</span>
                <strong>Todas</strong>
                <small>
                  {services.length}
                </small>
              </button>

              {categories.map(
                ([icon, name]) => {
                  const count =
                    services.filter(
                      (service) =>
                        service.category ===
                        name
                    ).length;

                  return (
                    <button
                      key={name}
                      className={
                        category === name
                          ? "category active"
                          : "category"
                      }
                      onClick={() =>
                        setCategory(name)
                      }
                    >
                      <span>{icon}</span>
                      <strong>{name}</strong>
                      <small>
                        {count} servicios
                      </small>
                    </button>
                  );
                }
              )}
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
                  Servicios que pueden
                  ayudarte
                </h2>

                <p className="muted">
                  Descubre algunas de las
                  mejores opciones disponibles.
                </p>
              </div>

              <button
                className="linkButton"
                onClick={goToServices}
              >
                Ver todos →
              </button>
            </div>

            <div className="featuredGrid">
              {featuredServices.map(
                (service) => (
                  <article
                    key={`featured-${service.demo}-${service.id}`}
                    className="featuredCard"
                    onClick={() =>
                      openService(
                        service
                      )
                    }
                  >
                    <div className="featuredTop">
                      <div className="featuredIcon">
                        {categoryIcon(
                          service.category
                        )}
                      </div>

                      <span className="featuredBadge">
                        ⭐ DESTACADO
                      </span>
                    </div>

                    <span className="featuredCategory">
                      {service.category}
                    </span>

                    <h3>
                      {service.service}
                    </h3>

                    <p>
                      {service.description}
                    </p>

                    <div className="ratingLine">
                      <strong>
                        {stars(
                          service.rating
                        )}
                      </strong>

                      <b>
                        {service.rating.toFixed(
                          1
                        )}
                      </b>

                      <span>
                        {service.reviews}{" "}
                        reseñas
                      </span>
                    </div>

                    <div className="featuredBottom">
                      <div className="miniProvider">
                        <div className="tinyAvatar">
                          {service.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "R"}
                        </div>

                        <span>
                          {service.name}
                        </span>
                      </div>

                      <strong>
                        Desde $
                        {service.price}
                      </strong>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section className="professionals">
          <div className="container">
            <span className="eyebrow">
              TALENTO ROBLOREN
            </span>

            <h2>
              Profesionales destacados
            </h2>

            <p className="muted">
              Conoce algunos de los
              profesionales disponibles.
            </p>

            <div className="professionalGrid">
              {professionals
                .slice(0, 3)
                .map((person) => (
                  <article
                    className="professionalCard"
                    key={person.name}
                    onClick={() =>
                      openService(
                        person.service
                      )
                    }
                  >
                    <div className="professionalAvatar">
                      {person.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "R"}
                    </div>

                    <div className="professionalInfo">
                      <div className="verified">
                        ✓ Profesional
                      </div>

                      <h3>
                        {person.name}
                      </h3>

                      <p>
                        {person.profession}
                      </p>

                      <div className="professionalRating">
                        <strong>
                          {stars(
                            person.rating
                          )}
                        </strong>

                        <span>
                          {person.rating.toFixed(
                            1
                          )}
                        </span>

                        <small>
                          ({person.reviews})
                        </small>
                      </div>

                      <div className="professionalMeta">
                        <span>
                          ✓ {person.jobs}+
                          trabajos
                        </span>

                        <span>
                          🕐{" "}
                          {person.experience}
                        </span>
                      </div>

                      <span className="professionalCategory">
                        {categoryIcon(
                          person.category
                        )}{" "}
                        {person.category}
                      </span>
                    </div>

                    <button
                      className="smallView"
                      onClick={(event) => {
                        event.stopPropagation();
                        openService(
                          person.service
                        );
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
                Conectar talento nunca fue
                tan sencillo
              </h2>

              <p className="muted">
                Una plataforma pensada para
                facilitar cada paso.
              </p>
            </div>

            <div className="steps">
              {[
                [
                  "01",
                  "👤",
                  "Crea tu cuenta",
                  "Regístrate y crea un perfil profesional.",
                ],
                [
                  "02",
                  "🔎",
                  "Encuentra o publica",
                  "Busca servicios o presenta tus propias habilidades.",
                ],
                [
                  "03",
                  "💬",
                  "Conecta directamente",
                  "Habla con clientes y profesionales.",
                ],
                [
                  "04",
                  "🚀",
                  "Trabaja y crece",
                  "Gestiona oportunidades y construye reputación.",
                ],
              ].map(
                (step) => (
                  <div
                    className="step"
                    key={step[0]}
                  >
                    <div className="stepNumber">
                      {step[0]}
                    </div>

                    <div className="stepIcon">
                      {step[1]}
                    </div>

                    <h3>{step[2]}</h3>

                    <p>{step[3]}</p>
                  </div>
                )
              )}
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
                Una plataforma creada para
                crecer contigo
              </h2>

              <p>
                RobLoren busca hacer más
                sencilla la conexión entre
                quienes necesitan talento y
                quienes tienen talento para
                ofrecer.
              </p>
            </div>

            <div className="benefitGrid">
              {[
                [
                  "✓",
                  "Talento profesional",
                  "Descubre personas con diferentes habilidades y especialidades.",
                ],
                [
                  "⚡",
                  "Conexiones directas",
                  "Comunícate directamente para entender cada necesidad.",
                ],
                [
                  "🌎",
                  "Nuevas oportunidades",
                  "Conecta con clientes y profesionales dentro y fuera de tu entorno.",
                ],
                [
                  "⭐",
                  "Reputación profesional",
                  "Construye confianza mediante tu perfil, servicios y futuras valoraciones.",
                ],
              ].map(
                (item) => (
                  <div
                    className="benefit"
                    key={item[1]}
                  >
                    <span>{item[0]}</span>

                    <div>
                      <h3>{item[1]}</h3>
                      <p>{item[2]}</p>
                    </div>
                  </div>
                )
              )}
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
                  Explora, compara y encuentra
                  el servicio adecuado.
                </p>
              </div>

              <div className="resultsBadge">
                {filteredServices.length}{" "}
                resultados
              </div>
            </div>

            <div className="filterPanel">
              <div className="searchBox">
                <span>🔎</span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Buscar servicios, profesionales o categorías..."
                  autoComplete="off"
                  spellCheck="false"
                />

                {search && (
                  <button
                    className="clearSearch"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className="sortSelect"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
              >
                <option value="recommended">
                  Recomendados
                </option>

                <option value="rating">
                  ⭐ Mejor valorados
                </option>

                <option value="priceLow">
                  Precio menor
                </option>

                <option value="priceHigh">
                  Precio mayor
                </option>
              </select>
            </div>

            <div className="activeFilters">
              <span>
                Filtrando por:
              </span>

              <button
                className="filterChip active"
                onClick={() =>
                  setCategory("Todas")
                }
              >
                {category === "Todas"
                  ? "✨ Todas"
                  : `${categoryIcon(
                      category
                    )} ${category}`}
              </button>

              {category !== "Todas" && (
                <button
                  className="filterReset"
                  onClick={() =>
                    setCategory("Todas")
                  }
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            {servicesLoading ? (
              <div className="empty">
                <div className="loadingIcon">
                  ⏳
                </div>

                <strong>
                  Cargando servicios...
                </strong>

                <p>
                  Estamos buscando talento
                  disponible.
                </p>
              </div>
            ) : filteredServices.length ===
              0 ? (
              <div className="empty">
                <div className="emptyIcon">
                  🔎
                </div>

                <strong>
                  No encontramos servicios
                </strong>

                <p>
                  Prueba con otra búsqueda o
                  categoría.
                </p>

                <button
                  className="secondary"
                  onClick={() => {
                    setSearch("");
                    setCategory("Todas");
                  }}
                >
                  Ver todos los servicios
                </button>
              </div>
            ) : (
              <div className="serviceGrid">
                {filteredServices.map(
                  (service) => (
                    <article
                      key={`${service.demo ? "demo" : "real"}-${service.id}`}
                      className="serviceCard"
                    >
                      <div className="serviceCategoryIcon">
                        {categoryIcon(
                          service.category
                        )}

                        {service.demo && (
                          <span>
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="provider">
                        <div className="avatar">
                          {service.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "R"}
                        </div>

                        <div>
                          <strong>
                            {service.name}
                          </strong>

                          <span>
                            {
                              service.profession
                            }
                          </span>
                        </div>

                        <span className="verifiedDot">
                          ✓
                        </span>
                      </div>

                      <span className="serviceCategoryLabel">
                        {service.category}
                      </span>

                      <h3>
                        {service.service}
                      </h3>

                      <p>
                        {service.description}
                      </p>

                      <div className="serviceRating">
                        <strong>
                          {stars(
                            service.rating
                          )}
                        </strong>

                        <b>
                          {service.rating.toFixed(
                            1
                          )}
                        </b>

                        <span>
                          {service.reviews}{" "}
                          reseñas
                        </span>
                      </div>

                      <div className="serviceMeta">
                        <span>
                          ✓ {service.jobs}{" "}
                          trabajos
                        </span>

                        <span>
                          🕐{" "}
                          {service.experience}
                        </span>
                      </div>

                      <div className="serviceBottom">
                        <div>
                          <small>
                            Precio inicial
                          </small>

                          <strong>
                            ${service.price}
                          </strong>
                        </div>

                        <button
                          className="view"
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

        <section className="cta">
          <div>
            <span className="eyebrow">
              ROBLOREN
            </span>

            <h2>
              Tu talento merece nuevas
              oportunidades.
            </h2>

            <p>
              Crea tu perfil y comienza a
              ofrecer tus servicios.
            </p>
          </div>

          <button
            className="ctaButton"
            onClick={() => {
              if (!loggedUser) {
                setAccountMode(
                  "register"
                );
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
              Conecta talento con
              oportunidades.
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
                  accountMode ===
                  "register"
                    ? "tab active"
                    : "tab"
                }
                onClick={() =>
                  setAccountMode(
                    "register"
                  )
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
                    value={
                      form.password
                    }
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
                    value={
                      form.password
                    }
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
                    value={
                      form.profession
                    }
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
                Gestiona tu perfil,
                servicios y oportunidades
                desde un solo lugar.
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
              <strong>
                {requests.length}
              </strong>
              <small>
                Solicitudes
              </small>
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
              <small>
                Servicios publicados
              </small>
            </div>
          </div>

          <div className="dashboardGrid">
            <div className="panel">
              <span className="eyebrow">
                PERFIL PROFESIONAL
              </span>

              <h2>
                Tu información
              </h2>

              <p className="panelIntro">
                Esta información ayudará a
                los clientes a conocerte.
              </p>

              <form
                onSubmit={saveProfile}
                className="form"
              >
                <label>
                  Nombre

                  <input
                    value={
                      profileForm.name
                    }
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
                    value={
                      profileForm.profession
                    }
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
                    value={
                      profileForm.bio
                    }
                    onChange={(e) =>
                      updateProfileForm(
                        "bio",
                        e.target.value
                      )
                    }
                    placeholder="Describe tu experiencia y especialidades..."
                  />
                </label>

                <button
                  className="primary"
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

            <aside>
              <div className="profileBox">
                <div className="profileAvatar">
                  {loggedUser.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "R"}
                </div>

                <span className="profileVerified">
                  ✓ Perfil activo
                </span>

                <h3>
                  {loggedUser.name}
                </h3>

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

                <div className="profileStats">
                  <div>
                    <strong>
                      {published}
                    </strong>
                    <small>
                      Servicios
                    </small>
                  </div>

                  <div>
                    <strong>
                      {accepted}
                    </strong>
                    <small>
                      Aceptadas
                    </small>
                  </div>
                </div>
              </div>

              <div className="quick">
                <h3>
                  Acciones rápidas
                </h3>

                <button
                  onClick={() =>
                    setPage("offer")
                  }
                >
                  ➕ Publicar servicio
                </button>

                <button
                  onClick={
                    openRequests
                  }
                >
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
    if (!selectedService)
      return null;

    return (
      <section className="page">
        <div className="detail">
          <button
            className="back"
            onClick={() =>
              setPage("home")
            }
          >
            ← Volver a servicios
          </button>

          <div className="detailGrid">
            <div className="panel">
              <div className="serviceHeroIcon">
                {categoryIcon(
                  selectedService.category
                )}
              </div>

              <div className="detailTop">
                <span className="eyebrow">
                  {
                    selectedService.category
                  }
                </span>

                {selectedService.rating >=
                  4.8 && (
                  <span className="topRated">
                    🏆 Mejor valorado
                  </span>
                )}
              </div>

              <h1>
                {selectedService.service}
              </h1>

              <div className="provider detailProvider">
                <div className="avatar">
                  {selectedService.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "R"}
                </div>

                <div>
                  <strong>
                    {selectedService.name}
                  </strong>

                  <span>
                    {
                      selectedService.profession
                    }
                  </span>
                </div>

                <span className="verifiedBadge">
                  ✓ Verificado
                </span>
              </div>

              <div className="detailRating">
                <strong>
                  {stars(
                    selectedService.rating
                  )}
                </strong>

                <b>
                  {selectedService.rating.toFixed(
                    1
                  )}
                </b>

                <span>
                  {selectedService.reviews}{" "}
                  reseñas
                </span>
              </div>

              <hr />

              <h2>
                Sobre este servicio
              </h2>

              <p className="detailDescription">
                {
                  selectedService.description
                }
              </p>

              <div className="infoGrid">
                <div>
                  <small>
                    Precio inicial
                  </small>

                  <strong>
                    $
                    {
                      selectedService.price
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Trabajos realizados
                  </small>

                  <strong>
                    {
                      selectedService.jobs
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Experiencia
                  </small>

                  <strong>
                    {
                      selectedService.experience
                    }
                  </strong>
                </div>
              </div>

              <div className="profileSummary">
                <div className="summaryIcon">
                  👤
                </div>

                <div>
                  <strong>
                    {
                      selectedService.name
                    }
                  </strong>

                  <p>
                    Profesional especializado
                    en{" "}
                    {selectedService.category.toLowerCase()}.
                    Disponible para nuevos
                    proyectos.
                  </p>
                </div>
              </div>

              <div className="reviewsPreview">
                <div>
                  <span className="eyebrow">
                    VALORACIONES
                  </span>

                  <h3>
                    Lo que destaca de este
                    profesional
                  </h3>
                </div>

                <div className="reviewScore">
                  <strong>
                    {selectedService.rating.toFixed(
                      1
                    )}
                  </strong>

                  <span>
                    {stars(
                      selectedService.rating
                    )}
                  </span>

                  <small>
                    {selectedService.reviews}{" "}
                    reseñas
                  </small>
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
                Desde $
                {selectedService.price}
              </div>

              <div className="trustBox">
                <span>⭐</span>

                <div>
                  <strong>
                    Profesional valorado
                  </strong>

                  <small>
                    {selectedService.rating.toFixed(
                      1
                    )}
                    /5 ·{" "}
                    {
                      selectedService.reviews
                    }{" "}
                    reseñas
                  </small>
                </div>
              </div>

              {selectedService.demo ? (
                <div className="notice">
                  <strong>
                    Servicio de demostración
                  </strong>

                  <p>
                    Los servicios publicados
                    por usuarios sí pueden
                    recibir solicitudes.
                  </p>
                </div>
              ) : (
                <>
                  <label>
                    Mensaje para el
                    profesional

                    <textarea
                      value={
                        requestMessage
                      }
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
                    onClick={
                      sendRequest
                    }
                    disabled={
                      sendingRequest
                    }
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
                    request.status ===
                    "accepted"
                      ? "status accepted"
                      : request.status ===
                        "rejected"
                      ? "status rejected"
                      : "status"
                  }
                >
                  {statusText(
                    request.status
                  )}
                </span>

                <small>
                  {dateText(
                    request.created_at
                  )}
                </small>
              </div>

              <h3>
                {request.serviceTitle}
              </h3>

              <p>
                <strong>
                  Cliente:
                </strong>{" "}
                {request.clientName}
              </p>

              <p>
                <strong>
                  Profesional:
                </strong>{" "}
                {request.providerName}
              </p>

              <div className="messageQuote">
                “{request.message}”
              </div>

              <div className="requestActions">
                {received &&
                  request.status ===
                    "pending" && (
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
                      requestId:
                        request.id,
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
    const contacts = requests.map(
      (request) => {
        const provider =
          request.provider_id ===
          loggedUser?.id;

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
          serviceTitle:
            request.serviceTitle,
        };
      }
    );

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

              {contacts.length ===
              0 ? (
                <div className="empty small">
                  Aún no tienes
                  conversaciones.
                </div>
              ) : (
                contacts.map(
                  (contact) => (
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
                          name:
                            contact.name,
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
                          ?.toUpperCase() ||
                          "R"}
                      </div>

                      <div>
                        <strong>
                          {contact.name}
                        </strong>

                        <span>
                          {
                            contact.serviceTitle
                          }
                        </span>
                      </div>
                    </button>
                  )
                )
              )}
            </aside>

            <main className="chat">
              {!selectedContact ? (
                <div className="chatEmpty">
                  <span>💬</span>

                  <h2>
                    Selecciona una
                    conversación
                  </h2>

                  <p>
                    Elige un contacto para
                    comenzar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="chatHeader">
                    <div className="avatar">
                      {selectedContact.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "R"}
                    </div>

                    <div>
                      <strong>
                        {
                          selectedContact.name
                        }
                      </strong>

                      <span>
                        {
                          selectedContact.profession
                        }
                      </span>
                    </div>
                  </div>

                  <div className="chatMessages">
                    {loadingMessages ? (
                      <div className="empty small">
                        Cargando mensajes...
                      </div>
                    ) : messages.length ===
                      0 ? (
                      <div className="chatEmpty">
                        <span>👋</span>

                        <strong>
                          Inicia la
                          conversación
                        </strong>

                        <p>
                          Escribe un mensaje
                          para comenzar.
                        </p>
                      </div>
                    ) : (
                      messages.map(
                        (message) => {
                          const mine =
                            message.sender_id ===
                            loggedUser?.id;

                          return (
                            <div
                              key={
                                message.id
                              }
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
                                  {
                                    message.message
                                  }
                                </p>

                                <small>
                                  {dateText(
                                    message.created_at
                                  )}
                                </small>
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="messageForm"
                  >
                    <textarea
                      value={
                        messageText
                      }
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
                      disabled={
                        sendingMessage
                      }
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

          <h1>
            Publica tu servicio
          </h1>

          <p className="muted">
            Presenta tu talento de forma
            profesional y conecta con nuevos
            clientes.
          </p>

          <form
            className="panel form offerForm"
            onSubmit={publishService}
          >
            <div className="offerHeader">
              <div className="offerUser">
                <div className="avatar">
                  {loggedUser?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "R"}
                </div>

                <div>
                  <strong>
                    {loggedUser?.name}
                  </strong>

                  <span>
                    {
                      loggedUser?.profession
                    }
                  </span>
                </div>
              </div>

              <span className="offerStatus">
                ✓ Perfil activo
              </span>
            </div>

            <label>
              Título del servicio

              <input
                value={
                  offer.serviceTitle
                }
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
                {categories.map(
                  ([icon, name]) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {icon} {name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Descripción

              <textarea
                value={
                  offer.description
                }
                onChange={(e) =>
                  updateOffer(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe qué ofreces, qué incluye tu servicio y qué puede esperar el cliente..."
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

            <div className="publishNote">
              <span>💡</span>

              <p>
                Un título claro y una buena
                descripción ayudan a que los
                clientes entiendan mejor tu
                servicio.
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

        button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid #D7E0E9;
          border-radius: 11px;
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
          font-weight: 900;
        }

        .logoMark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
        }

        .logoText {
          font-size: 22px;
          font-weight: 900;
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
            radial-gradient(
              circle at 85% 20%,
              #DBEAFE,
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #EFF6FF,
              #FFFFFF 55%,
              #F1F5F9
            );
        }

        .heroInner {
          max-width: 1180px;
          min-height: 590px;
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
          max-width: 670px;
        }

        .badge {
          display: inline-block;
          padding: 8px 13px;
          border-radius: 999px;
          background: #DBEAFE;
          color: #1E3A8A;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 18px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(43px,6vw,72px);
          line-height: 1.01;
          letter-spacing: -3px;
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

        .heroTrust {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 23px;
          color: #64748B;
          font-size: 10px;
          font-weight: 700;
        }

        .heroTrust span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .heroCard {
          background: rgba(255,255,255,.96);
          border: 1px solid #DBEAFE;
          border-radius: 24px;
          padding: 28px;
          box-shadow:
            0 25px 70px rgba(15,23,42,.10);
        }

        .heroCardHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .heroSmall {
          color: #2563EB;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .heroCard h3 {
          margin: 4px 0 0;
          font-size: 21px;
        }

        .heroRound {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          background: #EFF6FF;
          border-radius: 12px;
        }

        .heroSearch {
          width: 100%;
          border: 1px solid #DCE4ED;
          background: white;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #8591A0;
          font-size: 13px;
          text-align: left;
        }

        .heroSearch b {
          margin-left: auto;
          color: #2563EB;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .tags button {
          border: 0;
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

        .miniStats div {
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
          padding: 68px 0;
        }

        .categories,
        .featured,
        .how {
          background: white;
        }

        .services,
        .professionals {
          background: #F8FAFC;
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
          font-size: 30px;
          letter-spacing: -.7px;
          margin: 0 0 10px;
        }

        .muted {
          color: #64748B;
        }

        .categoryGrid {
          display: grid;
          grid-template-columns:
            repeat(5,minmax(0,1fr));
          gap: 11px;
          margin-top: 27px;
        }

        .category {
          border: 1px solid #DCE4ED;
          background: white;
          border-radius: 15px;
          padding: 15px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: #405269;
        }

        .category:hover {
          border-color: #93C5FD;
          transform: translateY(-1px);
        }

        .category span {
          font-size: 22px;
        }

        .category strong {
          font-size: 11px;
        }

        .category small {
          color: #94A3B8;
          font-size: 9px;
        }

        .category.active {
          background: #0F172A;
          border-color: #0F172A;
          color: white;
        }

        .category.active small {
          color: #CBD5E1;
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
          gap: 18px;
        }

        .featuredCard {
          border: 1px solid #E0E7EF;
          border-radius: 19px;
          padding: 22px;
          background: white;
          cursor: pointer;
          transition: .2s ease;
        }

        .featuredCard:hover {
          transform: translateY(-4px);
          border-color: #BFDBFE;
          box-shadow:
            0 18px 40px rgba(15,23,42,.08);
        }

        .featuredTop {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 10px;
        }

        .featuredIcon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #EFF6FF;
          font-size: 23px;
        }

        .featuredBadge {
          background: #FFF7D6;
          color: #8A6510;
          padding: 6px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .featuredCategory,
        .serviceCategoryLabel {
          color: #2563EB;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .featuredCategory {
          display: block;
          margin-top: 15px;
        }

        .featuredCard h3 {
          margin: 8px 0;
          font-size: 18px;
          line-height: 1.3;
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

        .ratingLine b,
        .serviceRating b,
        .professionalRating span,
        .detailRating b {
          font-weight: 900;
          font-size: 12px;
        }

        .ratingLine span,
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

        .featuredBottom > strong {
          font-size: 14px;
        }

        .miniProvider {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .miniProvider span {
          color: #64748B;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tinyAvatar {
          width: 27px;
          height: 27px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #DBEAFE;
          color: #1E3A8A;
          font-size: 10px;
          font-weight: 900;
        }

        .professionalGrid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 17px;
          margin-top: 27px;
        }

        .professionalCard {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 18px;
          padding: 19px;
          cursor: pointer;
        }

        .professionalCard:hover {
          border-color: #93C5FD;
          box-shadow:
            0 12px 30px rgba(15,23,42,.06);
        }

        .professionalAvatar {
          width: 55px;
          height: 55px;
          flex: 0 0 auto;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #0F172A;
          color: white;
          font-size: 21px;
          font-weight: 900;
        }

        .professionalInfo {
          flex: 1;
          min-width: 0;
        }

        .verified {
          color: #267348;
          font-size: 8px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .professionalInfo h3 {
          margin: 0 0 3px;
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

        .professionalRating small {
          color: #94A3B8;
          font-size: 9px;
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
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .centerHeading {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 35px;
        }

        .steps {
          display: grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap: 17px;
        }

        .step {
          border: 1px solid #E0E7EF;
          border-radius: 17px;
          padding: 22px;
          background: #F8FAFC;
        }

        .stepNumber {
          color: #2563EB;
          font-size: 11px;
          font-weight: 900;
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

        .resultsBadge {
          background: white;
          border: 1px solid #DCE4ED;
          color: #64748B;
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .filterPanel {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .searchBox {
          flex: 1;
          min-width: 0;
          background: white;
          border: 1px solid #DCE4ED;
          border-radius: 12px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .searchBox:focus-within {
          border-color: #2563EB;
          box-shadow:
            0 0 0 3px #DBEAFE;
        }

        .searchBox input {
          border: 0;
          outline: 0;
          padding: 13px 0;
          background: transparent;
          box-shadow: none;
        }

        .clearSearch {
          border: 0;
          background: #F1F5F9;
          color: #64748B;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-weight: 900;
        }

        .sortSelect {
          width: 180px;
          font-size: 11px;
          font-weight: 700;
        }

        .activeFilters {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 23px;
          flex-wrap: wrap;
          color: #94A3B8;
          font-size: 10px;
        }

        .filterChip {
          border: 0;
          background: #EFF6FF;
          color: #1E3A8A;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
        }

        .filterReset {
          border: 0;
          background: transparent;
          color: #2563EB;
          font-size: 10px;
          font-weight: 800;
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
          position: relative;
          transition: .2s ease;
        }

        .serviceCard:hover {
          transform: translateY(-3px);
          border-color: #BFDBFE;
          box-shadow:
            0 14px 35px rgba(15,23,42,.07);
        }

        .serviceCategoryIcon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          background: #EFF6FF;
          border-radius: 13px;
          font-size: 20px;
          margin-bottom: 14px;
          position: relative;
        }

        .serviceCategoryIcon span {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #0F172A;
          color: white;
          padding: 3px 5px;
          border-radius: 5px;
          font-size: 6px;
          font-weight: 900;
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

        .verifiedDot {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #E4F5EB;
          color: #267348 !important;
          font-size: 9px !important;
          font-weight: 900;
        }

        .serviceCategoryLabel {
          display: inline-block;
          margin-top: 15px;
        }

        .serviceCard h3 {
          margin: 8px 0;
          font-size: 17px;
          line-height: 1.3;
        }

        .serviceCard p {
          color: #6C7C90;
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
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

        .view:hover {
          background: #DBEAFE;
        }

        .cta {
          background: #0F172A;
          color: white;
          padding: 68px max(24px,calc((100% - 1120px)/2));
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

        .ctaButton:hover {
          background: #EFF6FF;
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
          display: flex;
          flex-direction: column;
          gap: 4px;
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

        .panelIntro {
          margin-bottom: 20px;
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
          margin-bottom: 5px;
        }

        .profileBox p {
          color: #BDC8D5;
        }

        .profileVerified {
          display: inline-block;
          margin-top: 13px;
          background: rgba(37,99,235,.28);
          color: #DBEAFE;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
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
          margin: 13px 0;
        }

        .profileRating strong {
          color: #E3A500;
          letter-spacing: 2px;
        }

        .profileRating span {
          color: #AEB9C7;
          font-size: 10px;
        }

        .profileStats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 15px;
          margin-top: 12px;
        }

        .profileStats div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .profileStats strong {
          color: white;
          font-size: 19px;
        }

        .profileStats small {
          color: #94A3B8;
          font-size: 9px;
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

        .quick button:hover {
          background: #F8FAFC;
          border-color: #BFDBFE;
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

        .serviceHeroIcon {
          width: 58px;
          height: 58px;
          border-radius: 17px;
          background: #EFF6FF;
          display: grid;
          place-items: center;
          font-size: 27px;
          margin-bottom: 17px;
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

        .detailProvider {
          margin-top: 20px;
        }

        .verifiedBadge {
          background: #E4F5EB;
          color: #267348 !important;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 9px !important;
          font-weight: 900;
        }

        .detailRating {
          margin-top: 16px;
        }

        .detailDescription {
          font-size: 15px;
        }

        hr {
          border: 0;
          border-top: 1px solid #EDF1F5;
          margin: 25px 0;
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

        .reviewsPreview {
          margin-top: 25px;
          padding: 18px;
          border: 1px solid #E5EAF0;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .reviewsPreview h3 {
          margin: 0;
          font-size: 14px;
        }

        .reviewScore {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .reviewScore strong {
          font-size: 25px;
        }

        .reviewScore span {
          color: #E3A500;
          letter-spacing: 1px;
          font-size: 11px;
        }

        .reviewScore small {
          color: #94A3B8;
          font-size: 9px;
        }

        .requestPrice {
          font-size: 25px;
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

        .requestColumns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 25px;
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

        .offerForm {
          margin-top: 25px;
        }

        .offerHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #EDF1F5;
        }

        .offerUser {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .offerUser div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .offerStatus {
          background: #E4F5EB;
          color: #267348;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .publishNote {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          padding: 12px;
          border-radius: 11px;
        }

        .publishNote p {
          margin: 0;
          color: #64748B;
          font-size: 10px;
          line-height: 1.5;
        }

        .empty {
          background: white;
          border: 1px solid #E0E7EF;
          border-radius: 16px;
          padding: 45px;
          text-align: center;
          color: #718096;
        }

        .empty strong {
          display: block;
          color: #334155;
          margin-bottom: 5px;
        }

        .empty.small {
          padding: 30px 15px;
        }

        .emptyIcon,
        .loadingIcon {
          font-size: 30px;
          margin-bottom: 10px;
        }

        @media (max-width: 1050px) {
          .categoryGrid {
            grid-template-columns:
              repeat(5,1fr);
          }
        }

        @media (max-width: 900px) {
          .heroInner,
          .dashboardGrid,
          .detailGrid {
            grid-template-columns: 1fr;
          }

          .heroCard {
            max-width: 600px;
            width: 100%;
            margin: auto;
          }

          .featuredGrid,
          .professionalGrid {
            grid-template-columns: 1fr;
          }

          .steps {
            grid-template-columns: repeat(2,1fr);
          }

          .categoryGrid {
            grid-template-columns:
              repeat(5,1fr);
          }

          .requestColumns {
            grid-template-columns: 1fr;
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

          .heroTrust {
            display: grid;
            gap: 7px;
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
            grid-template-columns:
              repeat(2,1fr);
          }

          .sectionTop,
          .sectionHeading,
          .dashboardHeader,
          .cta {
            align-items: stretch;
            flex-direction: column;
          }

          .filterPanel {
            flex-direction: column;
          }

          .sortSelect {
            width: 100%;
          }

          .serviceGrid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2,1fr);
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

          .reviewsPreview {
            flex-direction: column;
            align-items: flex-start;
          }

          .reviewScore {
            align-items: flex-start;
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

          .professionalCard {
            align-items: flex-start;
          }

          .smallView {
            font-size: 9px;
          }

          .offerHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .detailTop {
            align-items: flex-start;
            flex-direction: column;
          }

          .detailProvider {
            flex-wrap: wrap;
          }

          .verifiedBadge {
            margin-left: 53px;
          }
        }
      `}</style>

      <Header />

      {authLoading && !loggedUser ? (
        <div className="empty">
          <div className="loadingIcon">
            ⏳
          </div>

          <strong>
            Cargando RobLoren...
          </strong>

          <p>
            Preparando la plataforma.
          </p>
        </div>
      ) : (
        <>
          {page === "home" && (
            <HomePage />
          )}

          {page === "account" && (
            <AccountPage />
          )}

          {page === "service" && (
            <ServicePage />
          )}

          {page === "requests" && (
            <RequestsPage />
          )}

          {page === "messages" && (
            <MessagesPage />
          )}

          {page === "offer" && (
            <OfferPage />
          )}
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
