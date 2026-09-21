import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";

const categories = [
  ["💻", "Tecnología"],
  ["🎨", "Diseño"],
  ["📣", "Marketing"],
  ["✍️", "Redacción"],
  ["🎓", "Educación"],
  ["📸", "Fotografía"],
  ["🎬", "Video"],
  ["🎵", "Música"],
  ["🌎", "Traducción"],
  ["✨", "Otros"],
];

const demoServices = [
  {
    id: "demo-1",
    title: "Desarrollo de páginas web profesionales",
    description:
      "Creo páginas web modernas, rápidas y adaptadas a móviles para negocios y proyectos personales.",
    price: 80,
    category: "Tecnología",
    provider_name: "Carlos Rodríguez",
    provider_email: "carlos@robloren.demo",
    provider_bio:
      "Desarrollador web especializado en crear experiencias digitales modernas para negocios y proyectos personales.",
    provider_location: "Disponible online",
    provider_skills: "HTML, CSS, JavaScript, React",
    rating: 4.9,
    reviews: 27,
    is_demo: true,
  },
  {
    id: "demo-2",
    title: "Diseño gráfico para marcas y redes sociales",
    description:
      "Diseños profesionales para logos, publicaciones, anuncios y contenido visual para tu negocio.",
    price: 35,
    category: "Diseño",
    provider_name: "Ana Martínez",
    provider_email: "ana@robloren.demo",
    provider_bio:
      "Diseñadora gráfica enfocada en identidad visual, contenido para redes y comunicación de marcas.",
    provider_location: "Disponible online",
    provider_skills: "Branding, Logos, Redes sociales, Diseño gráfico",
    rating: 4.8,
    reviews: 34,
    is_demo: true,
  },
  {
    id: "demo-3",
    title: "Marketing digital para hacer crecer tu negocio",
    description:
      "Estrategias de marketing, redes sociales y contenido para ayudarte a conseguir más clientes.",
    price: 50,
    category: "Marketing",
    provider_name: "Luis Gómez",
    provider_email: "luis@robloren.demo",
    provider_bio:
      "Especialista en marketing digital y estrategias de crecimiento para pequeños negocios.",
    provider_location: "Disponible online",
    provider_skills: "Marketing digital, Redes sociales, Estrategia",
    rating: 4.9,
    reviews: 19,
    is_demo: true,
  },
];

const defaultForm = {
  title: "",
  description: "",
  category: "Tecnología",
  price: "",
};

const defaultProfileForm = {
  full_name: "",
  username: "",
  bio: "",
  location: "",
  skills: "",
};

const defaultAuthForm = {
  email: "",
  password: "",
};

function mapService(service, profile = null) {
  const providerId =
    service.provider_id ||
    service.user_id ||
    profile?.id ||
    null;

  const profileName =
    profile?.full_name ||
    profile?.username ||
    "";

  const profileEmail = profile?.email || "";

  return {
    ...service,
    id: service.id,
    title: service.title || "Servicio profesional",
    description:
      service.description || "Servicio ofrecido en RobLoren.",
    category: service.category || "Otros",
    price: Number(service.price || 0),

    provider_id: providerId,

    provider_name:
      service.provider_name ||
      profileName ||
      service.profiles?.full_name ||
      service.profiles?.username ||
      "Profesional RobLoren",

    provider_username:
      service.provider_username ||
      profile?.username ||
      service.profiles?.username ||
      "",

    provider_email:
      service.provider_email ||
      profileEmail ||
      service.profiles?.email ||
      "",

    provider_bio:
      service.provider_bio ||
      profile?.bio ||
      service.profiles?.bio ||
      "",

    provider_location:
      service.provider_location ||
      profile?.location ||
      service.profiles?.location ||
      "",

    provider_skills:
      service.provider_skills ||
      profile?.skills ||
      service.profiles?.skills ||
      "",

    rating: Number(service.rating || 4.8),
    reviews: Number(service.reviews || 0),

    is_demo: Boolean(service.is_demo),
  };
}

function makeUser(user, profile = null) {
  if (!user) return null;

  return {
    ...user,

    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Usuario RobLoren",

    username:
      profile?.username ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "usuario",

    bio: profile?.bio || "",
    location: profile?.location || "",
    skills: profile?.skills || "",
  };
}

function statusText(status) {
  const values = {
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return values[status] || status || "Pendiente";
}

function dateText(date) {
  if (!date) return "";

  try {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getInitials(name = "RL") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "RL"
  );
}

function normalizeSkills(skills = "") {
  if (Array.isArray(skills)) {
    return skills
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  return String(skills)
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function App() {
  const [page, setPage] = useState("home");

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("Todas");

  const [loggedUser, setLoggedUser] = useState(null);
  const [accountMode, setAccountMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);

  const [authForm, setAuthForm] = useState(defaultAuthForm);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingRequest, setUpdatingRequest] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

 const [selectedContact, setSelectedContact] = useState(null);
const [conversationContacts, setConversationContacts] =
  useState([]);
const [messages, setMessages] = useState([]);
const [messageText, setMessageText] = useState("");
const [loadingMessages, setLoadingMessages] = useState(false);
const [sendingMessage, setSendingMessage] = useState(false);

  const [servicesLoading, setServicesLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [form, setForm] = useState(defaultForm);
  const [profileForm, setProfileForm] =
    useState(defaultProfileForm);

  const [offer, setOffer] = useState("");
  const [publishing, setPublishing] = useState(false);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProfileForm = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAuthForm = (field, value) => {
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateOffer = (value) => {
    setOffer(value);
  };

  const ensureProfile = async (user) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,bio,location,skills"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        return data;
      }

      const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "usuario";

     const profile = {
  id: user.id,
  full_name:
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario RobLoren",
  username,
  bio: "",
  location: "",
  skills: "",
};
      const { data: created, error: createError } =
        await supabase
          .from("profiles")
          .insert(profile)
          .select(
            "id,full_name,username,bio,location,skills"
          )
          .maybeSingle();

      if (!createError && created) {
        return created;
      }

      return profile;
    } catch {
      return null;
    }
  };

  const refreshUser = async (user) => {
  if (!user) {
    setLoggedUser(null);
    return;
  }



  const profile = await ensureProfile(user);
    const completeUser = makeUser(user, profile);

    setLoggedUser(completeUser);

    setProfileForm({
      full_name: completeUser.full_name || "",
      username: completeUser.username || "",
      bio: completeUser.bio || "",
      location: completeUser.location || "",
      skills: completeUser.skills || "",
    });
  };

  const loadServices = async () => {
    setServicesLoading(true);

    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        setServices(demoServices);
        return;
      }

      const providerIds = [
        ...new Set(
          data
            .map(
              (service) =>
                service.provider_id ||
                service.user_id
            )
            .filter(Boolean)
        ),
      ];

      let profileMap = {};

      if (providerIds.length > 0) {
        try {
          const { data: profileData } =
            await supabase
              .from("profiles")
              .select(
                "id,full_name,username,bio,location,skills"
              )
              .in("id", providerIds);

          if (profileData) {
            profileData.forEach((profile) => {
              profileMap[profile.id] = profile;
            });
          }
        } catch {
          profileMap = {};
        }
      }

      const enrichedServices = data.map((service) => {
        const providerId =
          service.provider_id ||
          service.user_id ||
          null;

        return mapService(
          service,
          profileMap[providerId] || null
        );
      });

      setServices(enrichedServices);
    } catch {
      setServices(demoServices);
    } finally {
      setServicesLoading(false);
    }
  };

 const loadRequests = async () => {
  if (!loggedUser) {
    setRequests([]);
    return;
  }

  setLoadingRequests(true);

  try {
    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .or(
        `client_id.eq.${loggedUser.id},provider_id.eq.${loggedUser.id}`
      )
      .order("created_at", {
        ascending: false,
      });

    if (error || !data) {
      setRequests([]);
      return;
    }

    const serviceIds = [
      ...new Set(
        data
          .map((request) => request.service_id)
          .filter(Boolean)
      ),
    ];

    const providerIds = [
      ...new Set(
        data
          .map((request) => request.provider_id)
          .filter(Boolean)
      ),
    ];

    let services = [];
    let providers = [];

    if (serviceIds.length > 0) {
      const {
  data: serviceData,
} = await supabase
  .from("services")
  .select("id, service_title, user_id")
  .in("id", serviceIds);

      services = serviceData || [];
    }

    if (providerIds.length > 0) {
      const {
        data: providerData,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, name, profession"
        )
        .in("id", providerIds);

      providers = providerData || [];
    }

    const enrichedRequests = data.map(
      (request) => {
        const service = services.find(
          (item) =>
            item.id === request.service_id
        );

        const provider = providers.find(
          (item) =>
            item.id === request.provider_id
        );

        return {
          ...request,

        service_title:
  service?.service_title ||
  "Servicio solicitado",

          provider_name:
            provider?.full_name ||
            provider?.name ||
            provider?.username ||
            "Profesional",

          provider_profession:
            provider?.profession ||
            "Profesional de RobLoren",
        };
      }
    );

    setRequests(enrichedRequests);
  } catch {
    setRequests([]);
  } finally {
    setLoadingRequests(false);
  }
};

/* Cargar personas con las que ya existen conversaciones */
const loadConversationContacts = async () => {
  if (!loggedUser?.id) {
    setConversationContacts([]);
    return;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, created_at")
      .or(
        `sender_id.eq.${loggedUser.id},receiver_id.eq.${loggedUser.id}`
      )
      .order("created_at", {
        ascending: false,
      });

    if (error || !data) {
      setConversationContacts([]);
      return;
    }

    const contactIds = [
      ...new Set(
        data.map((message) =>
          message.sender_id === loggedUser.id
            ? message.receiver_id
            : message.sender_id
        )
      ),
    ];

    if (contactIds.length === 0) {
      setConversationContacts([]);
      return;
    }

    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from("profiles")
      .select(
        "id, full_name, username, name, profession"
      )
      .in("id", contactIds);

    if (profilesError || !profiles) {
      setConversationContacts([]);
      return;
    }

    setConversationContacts(profiles);
  } catch {
    setConversationContacts([]);
  }
};
    const loadMessages = async (contact) => {
    if (!loggedUser || !contact?.id) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${loggedUser.id},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${loggedUser.id})`
        )
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error cargando mensajes:",
          error
        );

        setMessages([]);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error(
        "Error inesperado cargando mensajes:",
        error
      );

      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (
      !loggedUser ||
      !selectedContact?.id ||
      !messageText.trim()
    ) {
      return;
    }

    setSendingMessage(true);

    try {
      const payload = {
        sender_id: loggedUser.id,
        receiver_id: selectedContact.id,
        message: messageText.trim(),
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
  console.error(
    "Error guardando mensaje:",
    error
  );

  alert(
    "No se pudo enviar el mensaje:\n\n" +
      error.message
  );

  return;
}

      setMessages((current) => [
        ...current,
        data || payload,
      ]);

      setMessageText("");
    } catch {
      alert("Ocurrió un error al enviar el mensaje.");
    } finally {
      setSendingMessage(false);
    }
  };

  const openMessaging = (contact) => {
    if (!loggedUser) {
      setPage("account");
      setAccountMode("login");
      return;
    }

    const contactId =
      contact?.id ||
      contact?.provider_id ||
      contact?.user_id ||
      null;

    if (!contactId) {
      alert(
        "Este servicio todavía no está asociado a un profesional registrado."
      );
      return;
    }

    if (contactId === loggedUser.id) {
      alert(
        "No puedes iniciar una conversación contigo mismo."
      );
      return;
    }

    const normalized = {
      id: contactId,
      full_name:
        contact.full_name ||
        contact.provider_name ||
        contact.username ||
        "Profesional",
      username:
        contact.username ||
        contact.provider_username ||
        "",
      email:
        contact.email ||
        contact.provider_email ||
        "",
    };

    setSelectedContact(normalized);
    setMessages([]);
    setPage("messages");
    loadMessages(normalized);
  };

  const sendRequest = async () => {
    if (!loggedUser) {
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!selectedService) return;

    if (selectedService.is_demo) {
      setRequestMessage(
        "Este servicio de demostración todavía no está asociado a un profesional registrado."
      );
      return;
    }

    const providerId =
      selectedService.provider_id ||
      selectedService.user_id ||
      null;

    if (!providerId) {
      setRequestMessage(
        "Este servicio todavía no está asociado a un profesional registrado."
      );
      return;
    }

    if (providerId === loggedUser.id) {
      setRequestMessage(
        "No puedes contratar tu propio servicio."
      );
      return;
    }

    setSendingRequest(true);
    setRequestMessage("");

    try {
      const payload = {
        service_id: selectedService.id,
        client_id: loggedUser.id,
        provider_id: providerId,
        message:
          offer.trim() ||
          "Me interesa contratar este servicio.",
        status: "pending",
      };

      const { data, error } = await supabase
        .from("service_requests")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        setRequestMessage(
          "No se pudo enviar la solicitud. Comprueba que el servicio y el profesional estén correctamente configurados."
        );
      } else {
        setRequests((current) => [
          data || payload,
          ...current,
        ]);

        setOffer("");

        setRequestMessage(
          "Solicitud enviada correctamente."
        );
      }
    } catch {
      setRequestMessage(
        "Ocurrió un error al enviar la solicitud."
      );
    } finally {
      setSendingRequest(false);
    }
  };

 const changeRequestStatus = async (
  requestId,
  status
) => {
  if (!requestId) return;

  setUpdatingRequest(requestId);

  try {
    const { data, error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", requestId)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        "Error actualizando solicitud:",
        error
      );

      alert(
        "No se pudo actualizar la solicitud:\n\n" +
          error.message
      );

      return;
    }

    if (!data) {
      alert(
        "La solicitud no se pudo actualizar. " +
          "Supabase no devolvió ningún registro."
      );

      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: data.status,
            }
          : request
      )
    );

    alert(
      `Solicitud actualizada: ${statusText(
        data.status
      )}`
    );
  } catch (error) {
    console.error(
      "Error inesperado:",
      error
    );

    alert(
      "Ocurrió un error al actualizar la solicitud:\n\n" +
        (error?.message || "Error desconocido")
    );
  } finally {
    setUpdatingRequest(null);
  }
};

  const saveProfile = async () => {
  if (!loggedUser) return;

  if (!profileForm.full_name.trim()) {
    alert("Escribe tu nombre completo.");
    return;
  }

  if (!profileForm.username.trim()) {
    alert("Escribe un nombre de usuario.");
    return;
  }

  setSavingProfile(true);

  try {
    const payload = {
      full_name: profileForm.full_name.trim(),
      username: profileForm.username.trim(),
      bio: profileForm.bio.trim(),
      location: profileForm.location.trim(),
      skills: profileForm.skills.trim(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", loggedUser.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        "Error actualizando perfil:",
        error
      );

      alert(
        "No se pudo guardar el perfil:\n\n" +
          error.message
      );

      return;
    }

    if (!data) {
      alert(
        "El perfil no se pudo actualizar. " +
          "Supabase no devolvió ningún registro."
      );

      return;
    }

    setLoggedUser((current) => ({
      ...current,
      ...data,
    }));

    setProfileForm({
      full_name: data.full_name || "",
      username: data.username || "",
      bio: data.bio || "",
      location: data.location || "",
      skills: data.skills || "",
    });

    await loadServices();

    alert("Perfil actualizado correctamente.");
  } catch (error) {
    console.error(
      "Error inesperado:",
      error
    );

    alert(
      "Ocurrió un error al guardar el perfil:\n\n" +
        (error?.message || "Error desconocido")
    );
  } finally {
    setSavingProfile(false);
  }
};
  const register = async () => {
    const email = authForm.email.trim();
    const password = authForm.password;

    if (!profileForm.full_name.trim()) {
      alert("Escribe tu nombre.");
      return;
    }

    if (!profileForm.username.trim()) {
      alert("Escribe un nombre de usuario.");
      return;
    }

    if (!email) {
      alert("Escribe tu correo electrónico.");
      return;
    }

    if (!password || password.length < 6) {
      alert(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name:
                profileForm.full_name.trim(),
              username:
                profileForm.username.trim(),
            },
          },
        });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        await refreshUser(data.user);

        setAuthForm(defaultAuthForm);

        setPage("home");

        if (!data.session) {
          alert(
            "Cuenta creada. Si Supabase tiene activada la confirmación de correo, revisa tu email para confirmar la cuenta."
          );
        }
      }
    } catch {
      alert("Ocurrió un error al crear la cuenta.");
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async () => {
    const email = authForm.email.trim();
    const password = authForm.password;

    if (!email || !password) {
      alert("Escribe tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        await refreshUser(data.user);

        setAuthForm(defaultAuthForm);

        setPage("home");
      }
    } catch {
      alert("Ocurrió un error al iniciar sesión.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();

    setLoggedUser(null);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
  };

  const publishService = async () => {
    if (!loggedUser) {
      setPage("account");
      setAccountMode("login");
      return;
    }

    if (!form.title.trim()) {
      alert("Escribe el título del servicio.");
      return;
    }

    if (!form.description.trim()) {
      alert("Escribe una descripción.");
      return;
    }

    const numericPrice = Number(form.price);

    if (
      form.price !== "" &&
      (!Number.isFinite(numericPrice) ||
        numericPrice < 0)
    ) {
      alert("Escribe un precio válido.");
      return;
    }

    setPublishing(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: numericPrice || 0,
        provider_id: loggedUser.id,
        user_id: loggedUser.id,
      };

      const { data, error } = await supabase
        .from("services")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        alert(
          "No se pudo publicar el servicio: " +
            error.message
        );
        return;
      }

      if (data) {
        setServices((current) => [
          mapService(data, loggedUser),
          ...current,
        ]);
      }

      setForm(defaultForm);
      setPage("services");

      alert("Servicio publicado correctamente.");
    } catch {
      alert("Ocurrió un error al publicar el servicio.");
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          await refreshUser(session.user);
        }
      } catch {
        // Sin acción
      }
    };

    initialize();
    loadServices();

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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

   useEffect(() => {
  if (loggedUser) {
    loadRequests();
  } else {
    setRequests([]);
  }
}, [loggedUser]);

useEffect(() => {
  if (loggedUser) {
    loadConversationContacts();
  } else {
    setConversationContacts([]);
  }
}, [loggedUser]);

  const filteredServices = useMemo(() => {
    const text = deferredSearch
      .trim()
      .toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        category === "Todas" ||
        service.category === category;

      if (!text) return matchesCategory;

      const content = [
        service.title,
        service.description,
        service.category,
        service.provider_name,
        service.provider_username,
        service.provider_bio,
        service.provider_location,
        service.provider_skills,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        content.includes(text)
      );
    });
  }, [
    services,
    deferredSearch,
    category,
  ]);

  const featuredServices = useMemo(
    () => filteredServices.slice(0, 3),
    [filteredServices]
  );

  const professionals = useMemo(() => {
    const unique = new Map();

    filteredServices.forEach((service) => {
      const key =
        service.provider_id ||
        service.provider_username ||
        service.provider_name ||
        service.id;

      if (!unique.has(key)) {
        unique.set(key, service);
      }
    });

    return [...unique.values()].slice(0, 3);
  }, [filteredServices]);

  const publishedCount = services.filter(
    (service) =>
      service.provider_id === loggedUser?.id ||
      service.user_id === loggedUser?.id
  ).length;

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  ).length;

  const Header = () => (
    <header className="header">
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => setPage("home")}
          aria-label="Ir al inicio"
        >
          <div className="brand-mark">R</div>

          <div>
            <div className="brand-name">
              RobLoren
            </div>

            <div className="brand-slogan">
              Conecta talento con oportunidades.
            </div>
          </div>
        </button>

        <nav className="nav">
          <button
            className={
              page === "home"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() => setPage("home")}
          >
            Inicio
          </button>

          <button
            className={
              page === "services"
                ? "nav-link active"
                : "nav-link"
            }
            onClick={() => setPage("services")}
          >
            Servicios
          </button>

          {loggedUser && (
            <>
              <button
                className={
                  page === "requests"
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={() => setPage("requests")}
              >
                Solicitudes

                {pendingRequests > 0 && (
                  <span className="nav-badge">
                    {pendingRequests}
                  </span>
                )}
              </button>

              <button
                className={
                  page === "messages"
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={() => setPage("messages")}
              >
                Mensajes
              </button>
            </>
          )}
        </nav>

        <div className="header-actions">
          {loggedUser ? (
            <>
              <button
                className="profile-mini"
                onClick={() => setPage("account")}
              >
                <span className="avatar small">
                  {getInitials(
                    loggedUser.full_name
                  )}
                </span>

                <span className="profile-mini-name">
                  {loggedUser.full_name}
                </span>
              </button>

              <button
                className="button ghost"
                onClick={logout}
              >
                Salir
              </button>
            </>
          ) : (
            <button
              className="button primary"
              onClick={() => {
                setAccountMode("login");
                setPage("account");
              }}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const Rating = memo(function Rating({
    rating,
    reviews,
  }) {
    return (
      <div className="rating">
        <span className="stars">
          ★★★★★
        </span>

        <strong>
          {Number(rating || 4.8).toFixed(1)}
        </strong>

        <span className="review-count">
          ({Number(reviews || 0)} valoraciones)
        </span>
      </div>
    );
  });

  const ServiceCard = memo(function ServiceCard({
    service,
    featured = false,
  }) {
    const icon =
      categories.find(
        (item) =>
          item[1] === service.category
      )?.[0] || "✨";

    return (
      <article
        className={
          featured
            ? "service-card featured-card"
            : "service-card"
        }
        onClick={() => {
          setSelectedService(service);
          setRequestMessage("");
          setPage("service");
        }}
      >
        <div className="service-card-top">
          <span className="category-pill">
            {icon} {service.category}
          </span>

          <span className="service-price">
            ${Number(service.price || 0)}
          </span>
        </div>

        <div className="service-icon">
          {icon}
        </div>

        <h3>{service.title}</h3>

        <p>{service.description}</p>

        <Rating
          rating={service.rating}
          reviews={service.reviews}
        />

        <div className="service-provider">
          <span className="avatar">
            {getInitials(
              service.provider_name
            )}
          </span>

          <div>
            <strong>
              {service.provider_name}
            </strong>

            <span>
              {service.provider_username
                ? `@${service.provider_username}`
                : service.provider_location ||
                  "Profesional RobLoren"}
            </span>
          </div>

          <span className="arrow">
            →
          </span>
        </div>
      </article>
    );
  });

  const ProfessionalCard = memo(
    function ProfessionalCard({ service }) {
      const skills = normalizeSkills(
        service.provider_skills
      ).slice(0, 3);

      return (
        <article className="professional-card">
          <div className="professional-head">
            <div className="avatar large">
              {getInitials(
                service.provider_name
              )}
            </div>

            <div className="professional-info">
              <h3>
                {service.provider_name}
              </h3>

              {service.provider_username && (
                <span className="professional-username">
                  @{service.provider_username}
                </span>
              )}

              <span className="professional-role">
                {service.category} · Profesional
              </span>

              {service.provider_location && (
                <span className="professional-location">
                  📍 {service.provider_location}
                </span>
              )}

              <Rating
                rating={service.rating}
                reviews={service.reviews}
              />
            </div>
          </div>

          <p>
            {service.provider_bio ||
              `Profesional especializado en ${service.category.toLowerCase()}. Disponible para nuevos proyectos y colaboraciones.`}
          </p>

          <div className="skill-row">
            {(skills.length > 0
              ? skills
              : [
                  service.category,
                  "Proyectos profesionales",
                ]
            ).map((skill) => (
              <span key={skill}>
                {skill}
              </span>
            ))}
          </div>

          <button
            className="button outline full"
            onClick={(event) => {
              event.stopPropagation();

              setSelectedService(service);
              setRequestMessage("");
              setPage("service");
            }}
          >
            Ver perfil
          </button>
        </article>
      );
    }
  );

  const HomePage = () => (
    <main>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✦</span>
            El marketplace profesional de nueva
            generación
          </div>

          <h1>
            Encuentra el talento.
            <br />
            <span>
              Impulsa tus proyectos.
            </span>
          </h1>

          <p>
            RobLoren conecta clientes con
            profesionales capaces de convertir ideas
            en resultados. Encuentra servicios,
            publica tu talento y crea nuevas
            oportunidades.
          </p>

          <div className="hero-buttons">
            <button
              className="button primary large"
              onClick={() =>
                setPage("services")
              }
            >
              Explorar servicios{" "}
              <span>→</span>
            </button>

            <button
              className="button light large"
              onClick={() => {
                if (!loggedUser) {
                  setAccountMode("register");
                  setPage("account");
                } else {
                  setPage("offer");
                }
              }}
            >
              Ofrecer un servicio
            </button>
          </div>

          <div className="hero-trust">
            <div>
              <strong>
                Profesionales
              </strong>
              <span>conectados</span>
            </div>

            <div>
              <strong>Servicios</strong>
              <span>profesionales</span>
            </div>

            <div>
              <strong>Conexiones</strong>
              <span>directas</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow"></div>

          <div className="floating-card card-one">
            <span className="floating-icon">
              💻
            </span>

            <div>
              <strong>
                Desarrollo web
              </strong>
              <span>
                ★★★★★ 4.9
              </span>
            </div>
          </div>

          <div className="floating-card card-two">
            <span className="floating-icon">
              🎨
            </span>

            <div>
              <strong>
                Diseño creativo
              </strong>

              <span>
                Disponible ahora
              </span>
            </div>
          </div>

          <div className="hero-orbit">
            <div className="orbit-center">
              R
            </div>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="search-box">
          <span className="search-icon">
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="¿Qué servicio necesitas?"
          />

          <button
            className="button primary search-button"
            onClick={() =>
              setPage("services")
            }
          >
            Buscar
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              EXPLORA
            </span>

            <h2>
              Encuentra exactamente lo que
              necesitas
            </h2>
          </div>

          <button
            className="text-button"
            onClick={() =>
              setPage("services")
            }
          >
            Ver todos →
          </button>
        </div>

        <div className="category-grid">
          {categories.map(
            ([icon, name]) => (
              <button
                className="category-card"
                key={name}
                onClick={() => {
                  setCategory(name);
                  setPage("services");
                }}
              >
                <span className="category-big-icon">
                  {icon}
                </span>

                <strong>{name}</strong>

                <span>
                  Explorar →
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <section className="section soft-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              SELECCIÓN ROBLOREN
            </span>

            <h2>
              Servicios destacados
            </h2>

            <p>
              Una selección de servicios para
              ayudarte a comenzar tu próximo
              proyecto.
            </p>
          </div>

          <button
            className="text-button"
            onClick={() =>
              setPage("services")
            }
          >
            Explorar servicios →
          </button>
        </div>

        <div className="services-grid">
          {featuredServices.length > 0 ? (
            featuredServices.map(
              (service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  featured
                />
              )
            )
          ) : (
            <div className="empty-state">
              No encontramos servicios con esos
              criterios.
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              TALENTO
            </span>

            <h2>
              Profesionales destacados
            </h2>

            <p>
              Conoce a las personas detrás de los
              servicios que pueden ayudarte.
            </p>
          </div>
        </div>

        <div className="professionals-grid">
          {professionals.map(
            (service) => (
              <ProfessionalCard
                key={
                  service.provider_id ||
                  service.provider_name
                }
                service={service}
              />
            )
          )}
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading centered">
          <span className="eyebrow">
            ASÍ DE FÁCIL
          </span>

          <h2>
            Cómo funciona RobLoren
          </h2>

          <p>
            Todo lo que necesitas para conectar
            talento y oportunidades en un mismo
            lugar.
          </p>
        </div>

        <div className="steps-grid">
          {[
            [
              "01",
              "Crea tu cuenta",
              "Regístrate como cliente o profesional.",
            ],
            [
              "02",
              "Encuentra o publica",
              "Busca un servicio o muestra lo que sabes hacer.",
            ],
            [
              "03",
              "Conecta directamente",
              "Habla con profesionales y clientes.",
            ],
            [
              "04",
              "Trabaja y crece",
              "Completa proyectos y construye tu reputación.",
            ],
          ].map(
            ([number, title, text]) => (
              <div
                className="step-card"
                key={number}
              >
                <span className="step-number">
                  {number}
                </span>

                <h3>{title}</h3>

                <p>{text}</p>
              </div>
            )
          )}
        </div>
      </section>

      <section className="benefits-section">
        <div className="benefits-content">
          <span className="eyebrow">
            POR QUÉ ROBLOREN
          </span>

          <h2>
            Una plataforma creada para
            <span>
              {" "}
              abrir oportunidades.
            </span>
          </h2>

          <p>
            RobLoren busca crear conexiones
            profesionales reales, dando visibilidad
            al talento y facilitando que los clientes
            encuentren las personas adecuadas para
            sus proyectos.
          </p>

          <div className="benefits-list">
            {[
              [
                "✓",
                "Talento profesional",
                "Encuentra personas con habilidades reales.",
              ],
              [
                "✓",
                "Conexiones directas",
                "Comunícate sin complicaciones.",
              ],
              [
                "✓",
                "Nuevas oportunidades",
                "Convierte tus habilidades en proyectos.",
              ],
              [
                "✓",
                "Reputación profesional",
                "Construye confianza con cada trabajo.",
              ],
            ].map(
              ([icon, title, text]) => (
                <div
                  className="benefit-item"
                  key={title}
                >
                  <span>{icon}</span>

                  <div>
                    <strong>
                      {title}
                    </strong>

                    <p>{text}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="benefits-visual">
          <div className="network-card">
            <div className="network-line line-a"></div>
            <div className="network-line line-b"></div>
            <div className="network-line line-c"></div>

            <div className="network-person p1">
              👨‍💻
            </div>

            <div className="network-person p2">
              👩‍🎨
            </div>

            <div className="network-person p3">
              👨‍💼
            </div>

            <div className="network-person p4">
              👩‍💻
            </div>

            <div className="network-center">
              R
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="eyebrow">
            TU PRÓXIMA OPORTUNIDAD
          </span>

          <h2>
            Tu talento puede llegar más lejos.
          </h2>

          <p>
            Únete a RobLoren y comienza a conectar
            con nuevas oportunidades.
          </p>
        </div>

        <button
          className="button white large"
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
    </main>
  );

  const ServicesPage = () => (
    <main className="page-container">
      <section className="page-header">
        <span className="eyebrow">
          MARKETPLACE
        </span>

        <h1>
          Servicios profesionales
        </h1>

        <p>
          Encuentra especialistas para llevar tus
          proyectos al siguiente nivel.
        </p>
      </section>

      <div className="filters-bar">
        <div className="search-box compact">
          <span className="search-icon">
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar servicios..."
          />
        </div>

        <div className="category-scroll">
          <button
            className={
              category === "Todas"
                ? "filter active"
                : "filter"
            }
            onClick={() =>
              setCategory("Todas")
            }
          >
            Todas
          </button>

          {categories.map(
            ([icon, name]) => (
              <button
                className={
                  category === name
                    ? "filter active"
                    : "filter"
                }
                key={name}
                onClick={() =>
                  setCategory(name)
                }
              >
                {icon} {name}
              </button>
            )
          )}
        </div>
      </div>

      <div className="results-heading">
        <strong>
          {filteredServices.length} servicios
          encontrados
        </strong>

        {(search || category !== "Todas") && (
          <button
            className="clear-button"
            onClick={() => {
              setSearch("");
              setCategory("Todas");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {servicesLoading ? (
        <div className="loading-state">
          Cargando servicios...
        </div>
      ) : (
        <div className="services-grid large-grid">
          {filteredServices.map(
            (service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            )
          )}
        </div>
      )}

      {!servicesLoading &&
        filteredServices.length === 0 && (
          <div className="empty-state big">
            <div>🔎</div>

            <h3>
              No encontramos ese servicio
            </h3>

            <p>
              Prueba con otra búsqueda o
              selecciona una categoría diferente.
            </p>
          </div>
        )}
    </main>
  );

  const AccountPage = () => (
    <main className="account-page">
      <div className="account-card">
        {loggedUser ? (
          <>
            <div className="account-cover"></div>

            <div className="account-main">
              <div className="account-profile-head">
                <div className="avatar profile-avatar">
                  {getInitials(
                    loggedUser.full_name
                  )}
                </div>

                <div>
                  <span className="eyebrow">
                    MI PERFIL
                  </span>

                  <h1>
  {loggedUser.full_name}
</h1>

<p>
  @{loggedUser.username}
</p>

<span className="profile-tagline">
  Profesional RobLoren · Conecta talento con oportunidades.
</span>
                </div>
              </div>

              <div className="dashboard-grid">
  <button
    type="button"
    className="stat-card"
    onClick={() => setPage("services")}
  >
    <span>
      Servicios publicados
    </span>

    <strong>
      {publishedCount}
    </strong>
  </button>

  <button
    type="button"
    className="stat-card"
    onClick={() => {
      setPage("requests");
    }}
  >
    <span>
      Solicitudes pendientes
    </span>

    <strong>
      {pendingRequests}
    </strong>
  </button>

  <button
    type="button"
    className="stat-card"
    onClick={() => {
      setPage("requests");
    }}
  >
    <span>
      Trabajos aceptados
    </span>

    <strong>
      {acceptedRequests}
    </strong>
  </button>
</div>
              <div className="profile-form">
                <div className="section-heading small">
                  <div>
                    <span className="eyebrow">
                      INFORMACIÓN PROFESIONAL
                    </span>

                    <h2>
                      Tu perfil
                    </h2>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Nombre completo

                    <input
                      value={
                        profileForm.full_name
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "full_name",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Nombre de usuario

                    <input
                      value={
                        profileForm.username
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "username",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Ubicación

                    <input
                      value={
                        profileForm.location
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "location",
                          event.target.value
                        )
                      }
                      placeholder="Ciudad / País"
                    />
                  </label>

                  <label>
                    Habilidades

                    <input
                      value={
                        profileForm.skills
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "skills",
                          event.target.value
                        )
                      }
                      placeholder="Ej. Diseño, React, Marketing"
                    />
                  </label>
                </div>

                <label>
                  Sobre ti

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
                    placeholder="Cuéntales a otros profesionales y clientes quién eres y qué haces."
                  />
                </label>

                <button
                  className="button primary"
                  onClick={saveProfile}
                  disabled={
                    savingProfile
                  }
                >
                  {savingProfile
                    ? "Guardando..."
                    : "Guardar perfil"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="auth-layout">
            <div className="auth-brand">
              <div className="brand-mark huge">
                R
              </div>

              <h1>
                Bienvenido a RobLoren
              </h1>

              <p>
                Conecta con profesionales,
                encuentra oportunidades y lleva tus
                proyectos más lejos.
              </p>
            </div>

            <div className="auth-form">
              <div className="auth-tabs">
                <button
                  className={
                    accountMode === "login"
                      ? "active"
                      : ""
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
                      ? "active"
                      : ""
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

              {accountMode ===
                "register" && (
                <>
                  <label>
                    Nombre completo

                    <input
                      value={
                        profileForm.full_name
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "full_name",
                          event.target.value
                        )
                      }
                      placeholder="Tu nombre"
                    />
                  </label>

                  <label>
                    Nombre de usuario

                    <input
                      value={
                        profileForm.username
                      }
                      onChange={(event) =>
                        updateProfileForm(
                          "username",
                          event.target.value
                        )
                      }
                      placeholder="@usuario"
                    />
                  </label>
                </>
              )}

              <label>
                Correo electrónico

                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    updateAuthForm(
                      "email",
                      event.target.value
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
                  value={authForm.password}
                  onChange={(event) =>
                    updateAuthForm(
                      "password",
                      event.target.value
                    )
                  }
                  placeholder="••••••••"
                  autoComplete={
                    accountMode ===
                    "login"
                      ? "current-password"
                      : "new-password"
                  }
                />
              </label>

              <button
                className="button primary full large"
                disabled={authLoading}
                onClick={
                  accountMode ===
                  "login"
                    ? login
                    : register
                }
              >
                {authLoading
                  ? "Procesando..."
                  : accountMode ===
                    "login"
                  ? "Entrar a RobLoren"
                  : "Crear mi cuenta"}
              </button>

              <p className="form-note">
                Al continuar aceptas utilizar
                RobLoren de manera responsable y
                profesional.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  const ServicePage = () => {
    if (!selectedService) {
      return (
        <main className="page-container">
          <div className="empty-state big">
            <h3>
              Servicio no encontrado
            </h3>

            <button
              className="button primary"
              onClick={() =>
                setPage("services")
              }
            >
              Volver a servicios
            </button>
          </div>
        </main>
      );
    }

    const service = selectedService;

    const skills = normalizeSkills(
      service.provider_skills
    );

    const providerId =
      service.provider_id ||
      service.user_id ||
      null;

    const ownService =
      loggedUser &&
      providerId === loggedUser.id;

    return (
      <main className="page-container">
        <button
          className="back-button"
          onClick={() =>
            setPage("services")
          }
        >
          ← Volver a servicios
        </button>

        <div className="service-detail">
          <div className="service-detail-main">
            <span className="category-pill">
              {categories.find(
                (item) =>
                  item[1] ===
                  service.category
              )?.[0] || "✨"}{" "}
              {service.category}
            </span>

            <h1>{service.title}</h1>

            <Rating
              rating={service.rating}
              reviews={service.reviews}
            />

            <div className="detail-provider">
              <div className="avatar large">
                {getInitials(
                  service.provider_name
                )}
              </div>

              <div className="provider-detail-info">
                <span className="eyebrow">
                  PROFESIONAL
                </span>

                <h3>
                  {service.provider_name}
                </h3>

                {service.provider_username && (
                  <p>
                    @
                    {
                      service.provider_username
                    }
                  </p>
                )}

                {service.provider_location && (
                  <p>
                    📍{" "}
                    {
                      service.provider_location
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="professional-profile-box">
              <h2>
                Sobre el profesional
              </h2>

              <p>
                {service.provider_bio ||
                  `Profesional especializado en ${service.category.toLowerCase()} y disponible para nuevos proyectos.`}
              </p>

              {skills.length > 0 && (
                <>
                  <h3>
                    Habilidades
                  </h3>

                  <div className="profile-skills">
                    {skills.map(
                      (skill) => (
                        <span
                          key={skill}
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="detail-description">
              <h2>
                Sobre este servicio
              </h2>

              <p>
                {service.description}
              </p>

              <h3>
                Qué puedes esperar
              </h3>

              <div className="expect-list">
                <span>
                  ✓ Comunicación directa
                </span>

                <span>
                  ✓ Trabajo profesional
                </span>

                <span>
                  ✓ Atención personalizada
                </span>

                <span>
                  ✓ Seguimiento del proyecto
                </span>
              </div>
            </div>
          </div>

          <aside className="hire-card">
            <div className="hire-price">
              <span>
                Desde
              </span>

              <strong>
                $
                {Number(
                  service.price || 0
                )}
              </strong>
            </div>

            <div className="hire-divider"></div>

            <h3>
              Solicitar este servicio
            </h3>

            <textarea
              value={offer}
              onChange={(event) =>
                updateOffer(
                  event.target.value
                )
              }
              placeholder="Cuéntale al profesional qué necesitas..."
            />

            {requestMessage && (
              <div
                className={
                  requestMessage.includes(
                    "correctamente"
                  )
                    ? "request-message success"
                    : "request-message error"
                }
              >
                {requestMessage}
              </div>
            )}

            <button
              className="button primary full large"
              onClick={sendRequest}
              disabled={
                sendingRequest ||
                Boolean(ownService) ||
                Boolean(
                  service.is_demo
                )
              }
            >
              {service.is_demo
                ? "Servicio de demostración"
                : ownService
                ? "Es tu propio servicio"
                : sendingRequest
                ? "Enviando..."
                : "Solicitar servicio"}
            </button>

            <button
              className="button outline full"
              onClick={() =>
                openMessaging({
                  id: providerId,
                  provider_id:
                    providerId,
                  provider_name:
                    service.provider_name,
                  provider_username:
                    service.provider_username,
                  provider_email:
                    service.provider_email,
                })
              }
              disabled={
                !providerId ||
                Boolean(ownService) ||
                Boolean(
                  service.is_demo
                )
              }
            >
              💬 Contactar profesional
            </button>

            <p className="secure-note">
              🔒 Tu solicitud se gestiona de
              forma segura.
            </p>
          </aside>
        </div>
      </main>
    );
  };

  const RequestColumn = memo(
  function RequestColumn({
  request,
}) {
  const isProvider =
    loggedUser?.id === request.provider_id;

  const isClient =
    loggedUser?.id === request.client_id;

  return (
    <article className="request-card">
      <div className="request-head">
        <div>
          <span className="request-label">
            {isProvider
              ? "SOLICITUD RECIBIDA"
              : "SOLICITUD ENVIADA"}
          </span>

          <h3>
            {request.service_title ||
              "Servicio solicitado"}
          </h3>
        </div>

        <span
          className={`status ${
            request.status || "pending"
          }`}
        >
          {statusText(request.status)}
        </span>
      </div>

      <p>
        {request.message ||
          "Sin mensaje adicional."}
      </p>

      {isProvider && (
        <div className="request-person">
          <strong>Cliente</strong>

          <span>
            Solicitud recibida para tu servicio
          </span>
        </div>
      )}

      {isClient && (
        <div className="request-person">
          <strong>Tu solicitud</strong>

          <span>
            Has solicitado este servicio
          </span>
        </div>
      )}

      <div className="request-meta">
        <span>
          📅 {dateText(request.created_at)}
        </span>
      </div>

      {/* ACCIONES DEL PROFESIONAL */}
      {isProvider &&
        request.status === "pending" && (
          <div className="request-actions">
            <button
              className="button primary"
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
              Aceptar
            </button>

            <button
              className="button danger"
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
          </div>
        )}

      {/* ACCIONES DEL CLIENTE */}
      {isClient &&
        request.status === "accepted" && (
          <div className="request-actions">
            <button
              className="button primary"
              onClick={() =>
                openMessaging({
                  id: request.provider_id,
                  provider_id:
                    request.provider_id,
                })
              }
            >
              💬 Enviar mensaje
            </button>
          </div>
        )}

      {/* SOLICITUD COMPLETADA */}
      {isClient &&
        request.status === "completed" && (
          <div className="request-completed">
            ✓ Servicio completado
          </div>
        )}

      {/* SOLICITUD RECHAZADA */}
      {isClient &&
        request.status === "rejected" && (
          <div className="request-rejected">
            Solicitud rechazada
          </div>
        )}
    </article>
  );
}
);

  const RequestsPage = () => (
    <main className="page-container">
      <section className="page-header">
        <span className="eyebrow">
          GESTIÓN
        </span>

        <h1>
          Mis solicitudes
        </h1>

        <p>
          Administra tus proyectos y solicitudes
          de servicios.
        </p>
      </section>

      {loadingRequests ? (
        <div className="loading-state">
          Cargando solicitudes...
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state big">
          <div>💼</div>

          <h3>
            Aún no tienes solicitudes
          </h3>

          <p>
            Cuando solicites o recibas un servicio,
            aparecerá aquí.
          </p>

          <button
            className="button primary"
            onClick={() =>
              setPage("services")
            }
          >
            Explorar servicios
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map(
            (request) => (
              <RequestColumn
                request={request}
                key={request.id}
              />
            )
          )}
        </div>
      )}
    </main>
  );

  const MessagesPage = () => (
    <main className="page-container messages-page">
      <section className="page-header">
        <span className="eyebrow">
          COMUNICACIÓN
        </span>

        <h1>Mensajes</h1>

        <p>
          Conecta directamente con otros usuarios
          de RobLoren.
        </p>
      </section>

      <div className="messages-layout">
        <aside className="contacts-panel">
          <div className="contacts-title">
            Conversaciones
          </div>

      {conversationContacts.length > 0 ? (
  conversationContacts.map((contact) => (
    <button
      key={contact.id}
      className={
        selectedContact?.id === contact.id
          ? "contact active"
          : "contact"
      }
      onClick={() => {
        setSelectedContact(contact);
        loadMessages(contact);
      }}
    >
      <span className="avatar">
        {getInitials(
          contact.full_name ||
            contact.name ||
            "Usuario"
        )}
      </span>

      <span>
        <strong>
          {contact.full_name ||
            contact.name ||
            "Usuario"}
        </strong>

        <small>
          {contact.profession ||
            "Usuario de RobLoren"}
        </small>
      </span>
    </button>
  ))
) : (
  <div className="contacts-empty">
    Aún no tienes conversaciones.
  </div>
)}
        </aside>

        <section className="chat-panel">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <span className="avatar">
                 {getInitials(
  selectedContact.full_name ||
    selectedContact.name ||
    "Usuario"
)}
                </span>

                <div>
                  <strong>
  {selectedContact.full_name ||
    selectedContact.name ||
    "Usuario"}
</strong>

                  <span>
                    {selectedContact.username
                      ? `@${selectedContact.username}`
                      : "RobLoren"}
                  </span>
                </div>
              </div>

              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="loading-state">
                    Cargando mensajes...
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="chat-empty">
                    <div>💬</div>

                    <h3>
                      Comienza la conversación
                    </h3>

                    <p>
                      Escribe un mensaje para
                      conectar con este
                      profesional.
                    </p>
                  </div>
                ) : (
                  messages.map(
                    (
                      message,
                      index
                    ) => {
                      const mine =
                        message.sender_id ===
                        loggedUser.id;

                      return (
                        <div
                          key={
                            message.id ||
                            index
                          }
                          className={
                            mine
                              ? "message mine"
                              : "message"
                          }
                        >
                          <div>
                            {
                           message.message
                            }
                          </div>

                          <small>
                            {dateText(
                              message.created_at
                            )}
                          </small>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              <div className="chat-input">
                <input
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                />

                <button
                  className="button primary"
                  disabled={
                    sendingMessage ||
                    !messageText.trim()
                  }
                  onClick={
                    sendMessage
                  }
                >
                  →
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty full">
              <div>💬</div>

              <h3>
                Tus conversaciones aparecerán aquí
              </h3>

              <p>
                Entra en un servicio y pulsa
                “Contactar profesional”.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );

  const OfferPage = () => (
    <main className="page-container">
      <section className="page-header">
        <span className="eyebrow">
          PROFESIONALES
        </span>

        <h1>
          Publica tu servicio
        </h1>

        <p>
          Muestra tus habilidades y conecta con
          clientes que necesitan lo que sabes hacer.
        </p>
      </section>

      <div className="offer-layout">
        <div className="offer-form">
          <label>
            Título del servicio

            <input
              value={form.title}
              onChange={(event) =>
                updateForm(
                  "title",
                  event.target.value
                )
              }
              placeholder="Ej. Diseño de logo profesional"
            />
          </label>

          <label>
            Categoría

            <select
              value={form.category}
              onChange={(event) =>
                updateForm(
                  "category",
                  event.target.value
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
            Describe tu servicio

            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm(
                  "description",
                  event.target.value
                )
              }
              placeholder="Explica qué ofreces, qué incluye y qué puede esperar el cliente."
            />
          </label>

          <label>
            Precio inicial

            <div className="price-input">
              <span>$</span>

              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) =>
                  updateForm(
                    "price",
                    event.target.value
                  )
                }
                placeholder="50"
              />
            </div>
          </label>

          <button
            className="button primary large"
            disabled={publishing}
            onClick={
              publishService
            }
          >
            {publishing
              ? "Publicando..."
              : "Publicar servicio →"}
          </button>
        </div>

        <div className="preview-card">
          <span className="eyebrow">
            VISTA PREVIA
          </span>

          <div className="preview-service">
            <div className="service-icon">
              {categories.find(
                (item) =>
                  item[1] ===
                  form.category
              )?.[0] || "✨"}
            </div>

            <span className="category-pill">
              {form.category}
            </span>

            <h2>
              {form.title ||
                "Título de tu servicio"}
            </h2>

            <p>
              {form.description ||
                "Aquí aparecerá la descripción de tu servicio."}
            </p>

            <Rating
              rating={5}
              reviews={0}
            />

            <div className="preview-price">
              Desde{" "}
              <strong>
                $
                {Number(
                  form.price || 0
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  const renderPage = () => {
    switch (page) {
      case "services":
        return <ServicesPage />;

      case "account":
        return <AccountPage />;

      case "service":
        return <ServicePage />;

      case "requests":
        return <RequestsPage />;

      case "messages":
        return <MessagesPage />;

      case "offer":
        return <OfferPage />;

      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        :root {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #152238;
          background: #f7f9fc;
          font-synthesis: none;
          text-rendering: optimizeLegibility;
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

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.94);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid #e8edf4;
        }

        .header-inner {
          width: min(1240px, calc(100% - 40px));
          min-height: 76px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          border: 0;
          background: transparent;
          padding: 0;
          text-align: left;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg,#132f67,#2166d1);
          color: white;
          font-size: 23px;
          font-weight: 900;
          box-shadow: 0 10px 25px rgba(25,77,160,.22);
        }

        .brand-mark.huge {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          font-size: 40px;
          margin-bottom: 25px;
        }

        .brand-name {
          font-size: 21px;
          font-weight: 900;
          letter-spacing: -.6px;
          color: #132b55;
        }

        .brand-slogan {
          color: #718096;
          font-size: 10px;
          margin-top: 2px;
        }

      .nav {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
}

.nav button {
  display: inline-flex !important;
  align-items: center !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.nav-link {
  display: inline-flex;
  position: relative;
  border: 0;
  background: transparent;
  padding: 10px 13px;
  color: #68768a;
  font-weight: 700;
  font-size: 14px;
  border-radius: 9px;
}

.nav-link:hover,
.nav-link.active {
  color: #1755b4;
  background: #f0f5ff;
}

.nav-badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  margin-left: 5px;
  border-radius: 20px;
  background: #2166d1;
  color: white;
  font-size: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.button {
  border: 0;
  border-radius: 11px;
  padding: 11px 17px;
  font-weight: 800;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}

.button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button.primary {
  background: #185cc2;
  color: white;
  box-shadow: 0 9px 22px rgba(24,92,194,.18);
}

.button.primary:hover:not(:disabled) {
  background: #124a9f;
  box-shadow: 0 12px 28px rgba(24,92,194,.25);
}

.button.ghost {
  background: #f1f4f8;
  color: #41516a;
}

.button.outline {
  background: white;
  color: #1755b4;
  border: 1px solid #cbd8eb;
  box-shadow: none;
}

.button.light {
  background: white;
  color: #163a75;
}

.button.white {
  background: white;
  color: #1856ae;
}

.button.danger {
  background: #fff1f1;
  color: #c83d3d;
}

.button.large {
  padding: 14px 21px;
  font-size: 15px;
}

.button.full {
  width: 100%;
}

.profile-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 0;
  color: #23334d;
  font-weight: 800;
}

.profile-mini-name {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


/* ===== CORRECCIÓN DEL ANCHO DE LA PÁGINA ===== */

html,
body,
#root {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

.header,
.header-inner {
  width: 100%;
  max-width: 100%;
}

main {
  width: 100%;
  max-width: 100%;
}

section {
  max-width: 100%;
}
        .avatar {
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg,#dbe9ff,#b9d0f7);
          color: #174c9d;
          font-weight: 900;
          border: 3px solid white;
          box-shadow: 0 5px 15px rgba(32,65,110,.1);
        }

        .avatar.small {
          width: 32px;
          height: 32px;
          font-size: 11px;
        }

        .avatar.large {
          width: 58px;
          height: 58px;
          font-size: 17px;
        }

        .hero {
          min-height: 620px;
          width: 100%;
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 40px;
          align-items: center;
          padding: 75px max(20px, calc((100% - 1240px)/2));
          background:
            radial-gradient(circle at 80% 20%, rgba(76,138,235,.15), transparent 32%),
            linear-gradient(135deg,#f8fbff,#eef4fb);
          overflow: hidden;
        }

        .hero-content {
          max-width: 680px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 30px;
          background: white;
          color: #2761b2;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #dce7f6;
          box-shadow: 0 8px 20px rgba(31,67,112,.05);
          margin-bottom: 22px;
        }

        .hero-badge span {
          color: #2a70df;
        }

        .hero h1 {
          font-size: clamp(42px, 5.5vw, 70px);
          line-height: .99;
          letter-spacing: -3.5px;
          margin: 0 0 25px;
          color: #12264a;
        }

        .hero h1 span {
          color: #2166d1;
        }

        .hero p {
          max-width: 640px;
          font-size: 18px;
          line-height: 1.7;
          color: #66768c;
          margin: 0 0 30px;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .hero-trust {
          display: flex;
          gap: 35px;
          margin-top: 42px;
          padding-top: 22px;
          border-top: 1px solid #dce5f1;
        }

        .hero-trust div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .hero-trust strong {
          font-size: 16px;
          color: #203653;
        }

        .hero-trust span {
          color: #8a97a9;
          font-size: 12px;
        }

        .hero-visual {
          min-height: 480px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .hero-glow {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: rgba(41,111,218,.12);
          filter: blur(12px);
        }

        .hero-orbit {
          width: 300px;
          height: 300px;
          border: 1px solid rgba(39,101,188,.18);
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
          box-shadow:
            0 0 0 40px rgba(42,111,215,.025),
            0 0 0 80px rgba(42,111,215,.02);
        }

        .orbit-center {
          width: 105px;
          height: 105px;
          display: grid;
          place-items: center;
          border-radius: 31px;
          background: linear-gradient(145deg,#183c7d,#2372db);
          color: white;
          font-size: 52px;
          font-weight: 900;
          box-shadow: 0 25px 60px rgba(26,76,153,.32);
        }

        .floating-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(255,255,255,.94);
          border: 1px solid rgba(215,226,241,.9);
          box-shadow: 0 20px 45px rgba(35,68,110,.12);
          z-index: 2;
        }

        .floating-card strong,
        .floating-card span {
          display: block;
        }

        .floating-card strong {
          color: #233a5d;
          font-size: 13px;
        }

        .floating-card span:last-child {
          color: #7b899b;
          font-size: 11px;
          margin-top: 4px;
        }

        .floating-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eef5ff;
          font-size: 21px;
        }

        .card-one {
          top: 75px;
          right: 5%;
        }

        .card-two {
          bottom: 75px;
          left: 2%;
        }

        .search-section {
          width: min(1050px, calc(100% - 40px));
          margin: -34px auto 0;
          position: relative;
          z-index: 5;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #dce5f0;
          border-radius: 15px;
          min-height: 64px;
          padding: 7px 8px 7px 20px;
          box-shadow: 0 18px 45px rgba(28,59,99,.12);
        }

        .search-box.compact {
          width: 350px;
          min-height: 50px;
          box-shadow: none;
        }

        .search-icon {
          color: #8492a6;
          font-size: 27px;
          line-height: 1;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          padding: 10px 13px;
          color: #263852;
          background: transparent;
        }

        .search-box input::placeholder {
          color: #9ba7b6;
        }

        .search-button {
          min-width: 105px;
        }

        .section {
          width: min(1240px, calc(100% - 40px));
          margin: auto;
          padding: 90px 0;
        }

        .soft-section {
          width: 100%;
          padding-left: max(20px, calc((100% - 1240px)/2));
          padding-right: max(20px, calc((100% - 1240px)/2));
          background: #f1f5fa;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 35px;
        }

        .section-heading.centered {
          display: block;
          text-align: center;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-heading.small {
          margin-bottom: 20px;
        }

        .eyebrow {
          display: block;
          color: #2667c8;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.7px;
          margin-bottom: 10px;
        }

        .section-heading h2,
        .benefits-content h2 {
          margin: 0;
          color: #162c4e;
          font-size: clamp(27px, 3vw, 39px);
          letter-spacing: -1.4px;
        }

        .section-heading p {
          margin: 10px 0 0;
          color: #748196;
          line-height: 1.6;
        }

        .text-button {
          border: 0;
          background: transparent;
          color: #1758b6;
          font-weight: 800;
          white-space: nowrap;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(5,1fr);
          gap: 13px;
        }

        .category-card {
          min-height: 145px;
          padding: 20px;
          border: 1px solid #e1e8f1;
          background: white;
          border-radius: 16px;
          text-align: left;
          transition: .2s ease;
        }

        .category-card:hover {
          transform: translateY(-4px);
          border-color: #b9d0f0;
          box-shadow: 0 15px 35px rgba(31,68,112,.09);
        }

        .category-big-icon {
          display: block;
          font-size: 28px;
          margin-bottom: 18px;
        }

        .category-card strong,
        .category-card span:last-child {
          display: block;
        }

        .category-card strong {
          color: #233754;
          font-size: 14px;
        }

        .category-card span:last-child {
          margin-top: 8px;
          color: #8a96a8;
          font-size: 11px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 20px;
        }

        .large-grid {
          grid-template-columns: repeat(3,1fr);
        }

      .services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.large-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.service-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e1e8f1;
  border-radius: 18px;
  padding: 21px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(30, 55, 90, 0.04);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.service-card:hover {
  transform: translateY(-4px);
  border-color: #c6d8ee;
  box-shadow: 0 18px 38px rgba(27, 60, 102, 0.10);
}

.service-card:active {
  transform: translateY(-1px);
}

.featured-card {
  box-shadow: 0 10px 30px rgba(28, 64, 108, 0.06);
}

.service-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 19px;
}
@media (max-width: 700px) {
  .service-card {
    padding: 18px;
    border-radius: 16px;
  }

  .service-card-top {
    margin-bottom: 15px;
  }
}

        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 8px;
          background: #edf4ff;
          color: #2361b8;
          font-size: 10px;
          font-weight: 900;
        }

        .service-price {
          color: #183d77;
          font-size: 20px;
          font-weight: 900;
        }

        .service-icon {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #f0f5fc;
          font-size: 27px;
          margin-bottom: 17px;
        }

        .service-card h3 {
          margin: 0 0 9px;
          color: #1d3353;
          font-size: 17px;
          line-height: 1.35;
        }

        .service-card > p {
          color: #78869a;
          font-size: 13px;
          line-height: 1.65;
          min-height: 63px;
          margin: 0 0 15px;
        }

        .rating {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0;
        }

        .stars {
          color: #f0a928;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .rating strong {
          color: #263b58;
          font-size: 12px;
        }

        .review-count {
          color: #8b97a8;
          font-size: 11px;
        }

        .service-provider {
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #edf1f5;
          padding-top: 15px;
          margin-top: 15px;
        }

        .service-provider div {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .service-provider strong {
          color: #2b3d58;
          font-size: 12px;
        }

        .service-provider span:not(.avatar) {
          color: #8c98a8;
          font-size: 10px;
          margin-top: 3px;
        }

        .arrow {
          margin-left: auto;
          color: #2667c8;
          font-size: 18px;
        }

        .professionals-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 20px;
        }

        .professional-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 10px 28px rgba(28,58,95,.04);
        }

        .professional-head {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 18px;
        }

        .professional-info {
          min-width: 0;
        }

        .professional-info h3 {
          margin: 0 0 3px;
          color: #213958;
          font-size: 17px;
        }

        .professional-role,
        .professional-username,
        .professional-location {
          display: block;
          color: #8490a2;
          font-size: 11px;
          margin-top: 3px;
        }

        .professional-username {
          color: #2866bf;
          font-weight: 800;
        }

        .professional-location {
          color: #738196;
        }

        .professional-card > p {
          color: #758297;
          font-size: 13px;
          line-height: 1.65;
          min-height: 63px;
        }

        .skill-row {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin: 15px 0;
        }

        .skill-row span,
        .profile-skills span {
          padding: 6px 9px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #647287;
          font-size: 10px;
          font-weight: 800;
        }

        .how-section {
          padding: 95px 20px;
          background: #eaf1f9;
        }

        .steps-grid {
          width: min(1100px,100%);
          margin: 50px auto 0;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 15px;
        }

        .step-card {
          padding: 25px;
          background: rgba(255,255,255,.68);
          border: 1px solid rgba(214,225,239,.9);
          border-radius: 16px;
        }

        .step-number {
          display: inline-block;
          color: #2b6dce;
          font-weight: 900;
          font-size: 12px;
          margin-bottom: 35px;
        }

        .step-card h3 {
          margin: 0 0 9px;
          color: #243b5b;
          font-size: 16px;
        }

        .step-card p {
          margin: 0;
          color: #7b899c;
          font-size: 12px;
          line-height: 1.6;
        }

        .benefits-section {
          width: min(1240px,calc(100% - 40px));
          margin: auto;
          padding: 100px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .benefits-content h2 span {
          color: #2468cc;
        }

        .benefits-content > p {
          color: #748196;
          line-height: 1.7;
          max-width: 580px;
          margin: 20px 0 30px;
        }

        .benefits-list {
          display: grid;
          gap: 15px;
        }

        .benefit-item {
          display: flex;
          gap: 13px;
        }

        .benefit-item > span {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #e9f2ff;
          color: #2062c1;
          font-weight: 900;
        }

        .benefit-item strong {
          color: #29405f;
          font-size: 14px;
        }

        .benefit-item p {
          margin: 4px 0 0;
          color: #8793a4;
          font-size: 12px;
        }

        .benefits-visual {
          display: grid;
          place-items: center;
        }

        .network-card {
          width: 390px;
          height: 390px;
          max-width: 100%;
          border-radius: 40px;
          background: linear-gradient(145deg,#edf4ff,#dfeaf8);
          position: relative;
          box-shadow: 0 25px 60px rgba(31,67,112,.12);
          overflow: hidden;
        }

        .network-center {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          width: 90px;
          height: 90px;
          border-radius: 28px;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg,#183c7d,#2671da);
          color: white;
          font-size: 43px;
          font-weight: 900;
          box-shadow: 0 20px 40px rgba(27,72,144,.25);
          z-index: 3;
        }

        .network-person {
          position: absolute;
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          background: white;
          border-radius: 18px;
          font-size: 25px;
          box-shadow: 0 10px 25px rgba(31,67,112,.12);
          z-index: 2;
        }

        .p1 { left: 50px; top: 55px; }
        .p2 { right: 50px; top: 65px; }
        .p3 { left: 45px; bottom: 55px; }
        .p4 { right: 48px; bottom: 50px; }

        .network-line {
          position: absolute;
          height: 2px;
          width: 160px;
          background: #b9cce5;
          left: 50%;
          top: 50%;
          transform-origin: left center;
          z-index: 1;
        }

        .line-a { transform: rotate(-143deg); }
        .line-b { transform: rotate(-37deg); }
        .line-c { transform: rotate(145deg); }

        .cta-section {
          width: min(1180px,calc(100% - 40px));
          margin: 0 auto 80px;
          padding: 55px 60px;
          border-radius: 25px;
          background: linear-gradient(135deg,#153873,#216bd4);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
          box-shadow: 0 25px 55px rgba(22,69,137,.22);
        }

        .cta-section .eyebrow {
          color: #a9ceff;
        }

        .cta-section h2 {
          margin: 0 0 8px;
          font-size: clamp(27px,3vw,40px);
          letter-spacing: -1.5px;
        }

        .cta-section p {
          margin: 0;
          color: #d4e3fb;
        }

        .page-container {
          width: min(1240px,calc(100% - 40px));
          margin: auto;
          padding: 65px 0 100px;
        }

        .page-header {
          margin-bottom: 35px;
        }

        .page-header h1 {
          margin: 0 0 10px;
          color: #172e51;
          font-size: clamp(34px,4vw,52px);
          letter-spacing: -2px;
        }

        .page-header p {
          color: #78869a;
          margin: 0;
          line-height: 1.6;
        }

        .filters-bar {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .category-scroll {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 3px;
          scrollbar-width: thin;
        }

        .filter {
          white-space: nowrap;
          border: 1px solid #dce4ee;
          background: white;
          color: #6e7d91;
          border-radius: 9px;
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 800;
        }

        .filter.active {
          background: #185cc2;
          color: white;
          border-color: #185cc2;
        }

        .results-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          color: #52627a;
          font-size: 13px;
        }

        .clear-button {
          border: 0;
          background: transparent;
          color: #2164c0;
          font-weight: 800;
          font-size: 12px;
        }

        .back-button {
          border: 0;
          background: transparent;
          color: #2866bf;
          font-weight: 800;
          padding: 0;
          margin-bottom: 25px;
        }

        .service-detail {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 60px;
          align-items: start;
        }

        .service-detail-main {
          background: white;
          border: 1px solid #e1e8f0;
          border-radius: 22px;
          padding: 38px;
        }

        .service-detail-main > h1 {
          margin: 20px 0 12px;
          color: #172e51;
          font-size: clamp(32px,4vw,48px);
          line-height: 1.1;
          letter-spacing: -2px;
        }

        .detail-provider {
          display: flex;
          gap: 15px;
          align-items: center;
          padding: 23px 0;
          margin: 25px 0;
          border-top: 1px solid #edf1f5;
          border-bottom: 1px solid #edf1f5;
        }

        .detail-provider h3 {
          margin: 0;
          color: #263c5b;
        }

        .detail-provider p {
          margin: 4px 0 0;
          color: #8491a2;
          font-size: 12px;
        }

        .provider-detail-info p {
          margin: 4px 0 0;
        }

        .professional-profile-box {
          background: #f5f8fc;
          border: 1px solid #e5ebf2;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .professional-profile-box h2 {
          color: #233958;
          font-size: 19px;
          margin: 0 0 10px;
        }

        .professional-profile-box h3 {
          color: #2c405e;
          margin: 20px 0 10px;
          font-size: 14px;
        }

        .professional-profile-box > p {
          color: #718096;
          line-height: 1.7;
          margin: 0;
        }

        .profile-skills {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .detail-description h2 {
          color: #233958;
          font-size: 21px;
        }

        .detail-description h3 {
          color: #2c405e;
          margin-top: 30px;
          font-size: 15px;
        }

        .detail-description > p {
          color: #718096;
          line-height: 1.8;
        }

        .expect-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          color: #617086;
          font-size: 13px;
        }

        .hire-card {
  position: sticky;
  top: 105px;
  background: #ffffff;
  border: 1px solid #dde6f0;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 18px 45px rgba(28, 59, 99, 0.08);
  overflow: hidden;
}

.hire-card textarea {
  width: 100%;
  min-height: 120px;
  margin: 14px 0;
  resize: vertical;
}

.hire-card .button {
  margin-top: 8px;
}

@media (max-width: 700px) {
  .hire-card {
    position: relative;
    top: auto;
    padding: 20px;
    border-radius: 17px;
    box-shadow: 0 10px 28px rgba(28, 59, 99, 0.07);
  }

  .hire-card textarea {
    min-height: 110px;
    font-size: 16px;
  }
}

        .hire-price {
          display: flex;
          justify-content: space-between;
          align-items: end;
        }

        .hire-price span {
          color: #8995a5;
          font-size: 12px;
        }

        .hire-price strong {
          color: #183d77;
          font-size: 34px;
        }

        .hire-divider {
          height: 1px;
          background: #edf1f5;
          margin: 20px 0;
        }

        .hire-card h3 {
          color: #263b58;
          margin: 0 0 12px;
        }

        textarea {
          width: 100%;
          min-height: 115px;
          resize: vertical;
          border: 1px solid #d9e2ed;
          border-radius: 11px;
          outline: 0;
          padding: 13px;
          color: #30415b;
          background: #fbfcfe;
          line-height: 1.5;
        }

        textarea:focus,
        input:focus,
        select:focus {
          border-color: #6d9fdc;
          box-shadow: 0 0 0 3px rgba(52,111,192,.08);
        }

        .hire-card .button {
          margin-top: 10px;
        }

        .request-message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.5;
        }

        .request-message.success {
          background: #edf7ef;
          color: #28753b;
        }

        .request-message.error {
          background: #fff2f2;
          color: #bd3f3f;
        }

        .secure-note,
        .form-note {
          color: #98a2b0;
          font-size: 10px;
          text-align: center;
          line-height: 1.5;
        }

        .account-page {
          width: min(1050px,calc(100% - 40px));
          margin: auto;
          padding: 60px 0 100px;
        }

        .account-card {
          background: white;
          border: 1px solid #dfe7f0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 55px rgba(28,59,99,.07);
        }

        .account-cover {
          height: 145px;
          background: linear-gradient(135deg,#153873,#2b75db);
        }

        .account-main {
          padding: 0 40px 45px;
        }

        .account-profile-head {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: -34px;
          margin-bottom: 35px;
        }

        .profile-avatar {
          width: 85px;
          height: 85px;
          font-size: 23px;
          border: 5px solid white;
        }

        .account-profile-head h1 {
          margin: 0;
          color: #1c3455;
          font-size: 27px;
        }

        .account-profile-head p {
          margin: 3px 0 0;
          color: #8792a3;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 13px;
          margin-bottom: 45px;
        }

      .stat-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e3e9f1;
  padding: 22px;
  border-radius: 16px;
  width: 100%;
  min-height: 105px;
  text-align: left;
  font: inherit;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(30, 55, 90, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: #cbd8e8;
  box-shadow: 0 12px 26px rgba(30, 55, 90, 0.09);
}

.stat-card:active {
  transform: translateY(-1px);
}

.stat-card span {
  display: block;
  color: #718096;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.stat-card strong {
  display: block;
  color: #1b4e9c;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
}
    .profile-tagline {
  display: block;
  margin-top: 8px;
  color: #6b7a90;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.profile-form {
  display: grid;
  gap: 20px;
  padding: 24px;
  border: 1px solid #e4eaf2;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(30, 55, 90, 0.06);
}
label {
  display: grid;
  gap: 8px;
  color: #506078;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

input,
select,
textarea {
  width: 100%;
  min-height: 46px;
  border: 1px solid #d9e2ed;
  border-radius: 11px;
  outline: 0;
  padding: 11px 13px;
  background: #fbfcfe;
  color: #30415b;
  font-size: 14px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2f6fed;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.10);
}

textarea {
  min-height: 120px;
  resize: vertical;
}
        .auth-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 600px;
        }

        .auth-brand {
          padding: 65px;
          background: linear-gradient(145deg,#153873,#2267cd);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-brand h1 {
          font-size: 40px;
          letter-spacing: -2px;
          margin: 0 0 15px;
        }

        .auth-brand p {
          max-width: 430px;
          color: #d7e5fb;
          line-height: 1.7;
        }

        .auth-form {
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #f1f4f8;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 12px;
        }

        .auth-tabs button {
          border: 0;
          background: transparent;
          padding: 11px;
          border-radius: 7px;
          color: #718096;
          font-weight: 800;
        }

        .auth-tabs button.active {
          background: white;
          color: #185cc2;
          box-shadow: 0 3px 10px rgba(30,55,88,.07);
        }

        .requests-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.request-card {
  background: white;
  border: 1px solid #e0e7ef;
  border-radius: 17px;
  padding: 21px;
  min-width: 0;
  box-sizing: border-box;
}

.request-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.request-label {
  color: #8b98a9;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

.request-card h3 {
  margin: 5px 0 0;
  color: #293e5b;
  font-size: 15px;
  line-height: 1.3;
  word-break: break-word;
}

.request-card > p {
  color: #788598;
  font-size: 12px;
  line-height: 1.6;
  margin: 14px 0;
  word-break: break-word;
}

.status {
  height: fit-content;
  flex-shrink: 0;
  padding: 6px 9px;
  border-radius: 7px;
  background: #fff5db;
  color: #9a7019;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}

.status.accepted {
  background: #eaf7ed;
  color: #26743a;
}

.status.rejected {
  background: #fff0f0;
  color: #bd3f3f;
}

.status.completed {
  background: #eaf2ff;
  color: #225cb0;
}

.request-person {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 12px 0;
  padding: 10px 12px;
  background: #f7f9fc;
  border-radius: 10px;
}

.request-person strong {
  color: #293e5b;
  font-size: 11px;
}

.request-person span {
  color: #8b98a9;
  font-size: 10px;
}

.request-meta {
  color: #9aa5b4;
  font-size: 10px;
  margin: 14px 0 15px;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.request-actions .button {
  flex: 1;
  min-width: 110px;
}

.request-completed,
.request-rejected {
  margin-top: 10px;
  padding: 9px 11px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 800;
}

.request-completed {
  background: #eaf2ff;
  color: #225cb0;
}

.request-rejected {
  background: #fff0f0;
  color: #bd3f3f;
}

/* Solicitudes en móvil */
@media (max-width: 700px) {
  .requests-grid {
    grid-template-columns: 1fr;
    gap: 14px;
    width: 100%;
  }

  .request-card {
    width: 100%;
    padding: 17px;
    border-radius: 15px;
  }

  .request-head {
    gap: 10px;
  }

  .request-card h3 {
    font-size: 14px;
  }

  .request-actions {
    width: 100%;
  }

  .request-actions .button {
    min-width: 0;
  }
}
     .messages-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  min-height: 570px;
  background: #ffffff;
  border: 1px solid #dfe7ef;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(38, 58, 82, 0.06);
}

.contacts-panel {
  border-right: 1px solid #e6ebf2;
  background: #f8fafc;
  min-width: 0;
}

.contacts-title {
  padding: 20px;
  font-weight: 900;
  color: #293d5a;
  font-size: 13px;
  letter-spacing: 0.2px;
  border-bottom: 1px solid #e7edf3;
}

.contact {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 15px;
  border: 0;
  border-bottom: 1px solid #edf1f5;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.contact:hover {
  background: #f0f5fa;
}

.contact.active {
  background: #eaf2ff;
  box-shadow: inset 3px 0 0 #2f6fed;
}

.contact strong,
.contact small {
  display: block;
}

.contact strong {
  color: #31445f;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.contact small {
  color: #8a97a8;
  font-size: 10px;
  margin-top: 4px;
  line-height: 1.3;
}

.contacts-empty {
  padding: 20px;
  color: #8a97a8;
  font-size: 11px;
  line-height: 1.6;
}

 .chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 68px;
  padding: 14px 20px;
  border-bottom: 1px solid #e7edf3;
  background: #ffffff;
}

.chat-header strong,
.chat-header span {
  display: block;
}

.chat-header strong {
  color: #2b3e5a;
  font-size: 13px;
  font-weight: 800;
}

.chat-header div span {
  color: #8b97a8;
  font-size: 10px;
  margin-top: 3px;
}

.chat-messages {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  background: #fbfcfe;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 14px;
}

.message.mine {
  align-items: flex-end;
}

.message div {
  max-width: min(70%, 520px);
  padding: 11px 14px;
  border-radius: 15px 15px 15px 4px;
  background: #e9eef5;
  color: #3e4d62;
  font-size: 12px;
  line-height: 1.55;
  word-break: break-word;
  box-shadow: 0 2px 5px rgba(40, 58, 80, 0.04);
}

.message.mine div {
  border-radius: 15px 15px 4px 15px;
  background: #185cc2;
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(24, 92, 194, 0.16);
}

.message small {
  margin-top: 5px;
  color: #9aa4b2;
  font-size: 8px;
}

.chat-input {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 14px 15px;
  border-top: 1px solid #e6ebf2;
  background: #ffffff;
}

.chat-input input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border: 1px solid #dce4ed;
  border-radius: 12px;
  background: #f8fafc;
  color: #334760;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.chat-input input:focus {
  border-color: #8fb2e8;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.08);
}

.chat-input input::placeholder {
  color: #a0aab7;
}

.chat-input button {
  min-width: 46px;
  height: 42px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 800;
  padding: 0 13px;
}

.chat-empty {
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #8591a1;
  padding: 25px;
  box-sizing: border-box;
}

.chat-empty.full {
  flex: 1;
}

.chat-empty div {
  font-size: 40px;
  margin-bottom: 10px;
}

.chat-empty h3 {
  color: #334760;
  margin: 0 0 6px;
  font-size: 17px;
}

.chat-empty p {
  margin: 0;
  font-size: 12px;
  max-width: 350px;
  line-height: 1.5;
}

        .offer-layout {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 30px;
          align-items: start;
        }

        .offer-form {
          display: grid;
          gap: 18px;
          background: white;
          padding: 30px;
          border: 1px solid #dfe7ef;
          border-radius: 20px;
        }

        .offer-form textarea {
          min-height: 180px;
        }

        .price-input {
          display: flex;
          align-items: center;
          border: 1px solid #d9e2ed;
          border-radius: 10px;
          background: #fbfcfe;
        }

        .price-input span {
          padding-left: 13px;
          color: #68788e;
          font-weight: 900;
        }

        .price-input input {
          border: 0;
          background: transparent;
        }

        .preview-card {
          position: sticky;
          top: 105px;
          background: #edf3fa;
          padding: 25px;
          border-radius: 20px;
        }

        .preview-service {
          background: white;
          border-radius: 16px;
          padding: 22px;
          margin-top: 15px;
          border: 1px solid #e1e8f0;
        }

        .preview-service h2 {
          color: #273c5a;
          font-size: 19px;
          line-height: 1.4;
          margin: 15px 0 10px;
        }

        .preview-service p {
          color: #7d8999;
          font-size: 12px;
          line-height: 1.6;
          min-height: 60px;
        }

        .preview-price {
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid #edf1f5;
          color: #8a95a5;
          font-size: 11px;
        }

        .preview-price strong {
          color: #1b478c;
          font-size: 23px;
          margin-left: 5px;
        }

        .loading-state,
        .empty-state {
          padding: 45px;
          text-align: center;
          color: #7f8c9e;
          background: white;
          border: 1px dashed #d8e1ec;
          border-radius: 16px;
        }

        .empty-state.big {
          padding: 75px 20px;
        }

        .empty-state.big > div {
          font-size: 42px;
        }

        .empty-state h3 {
          color: #344861;
        }

        .footer {
          width: 100%;
          padding: 35px max(20px, calc((100% - 1240px)/2));
          border-top: 1px solid #e2e8f0;
          background: white;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          color: #8a96a6;
          font-size: 11px;
        }

        .footer div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer strong {
          color: #203958;
          font-size: 15px;
        }

        @media (max-width: 1000px) {
          .nav {
            display: none;
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .hero-visual {
            min-height: 350px;
          }

          .category-grid {
            grid-template-columns: repeat(3,1fr);
          }

          .services-grid,
          .large-grid,
          .professionals-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .steps-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .benefits-section {
            grid-template-columns: 1fr;
          }

          .service-detail {
            grid-template-columns: 1fr;
          }

          .hire-card {
            position: static;
          }
        }

        @media (max-width: 700px) {
          .header-inner {
            width: calc(100% - 25px);
            min-height: 65px;
          }

          .brand-slogan,
          .profile-mini-name,
          .header-actions .button.ghost {
            display: none;
          }

          .hero {
            padding: 55px 20px 70px;
          }

          .hero h1 {
            letter-spacing: -2.5px;
          }

          .hero p {
            font-size: 15px;
          }

          .hero-trust {
            gap: 15px;
          }

          .hero-trust strong {
            font-size: 12px;
          }

          .hero-visual {
            min-height: 290px;
          }

          .hero-orbit {
            width: 220px;
            height: 220px;
          }

          .orbit-center {
            width: 80px;
            height: 80px;
            font-size: 36px;
          }

          .floating-card {
            transform: scale(.8);
          }

          .card-one {
            right: -25px;
            top: 20px;
          }

          .card-two {
            left: -25px;
            bottom: 15px;
          }

          .search-section {
            width: calc(100% - 25px);
            margin-top: -25px;
          }

          .search-box {
            min-height: 58px;
          }

          .search-button {
            min-width: auto;
          }

          .section {
            width: calc(100% - 25px);
            padding: 60px 0;
          }

          .soft-section {
            width: 100%;
            padding-left: 12px;
            padding-right: 12px;
          }

          .section-heading {
            display: block;
          }

          .section-heading .text-button {
            margin-top: 15px;
          }

          .category-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .services-grid,
          .large-grid,
          .professionals-grid,
          .requests-grid,
          .dashboard-grid,
          .form-grid,
          .offer-layout,
          .auth-layout {
            grid-template-columns: 1fr;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }

          .benefits-section {
            width: calc(100% - 25px);
            padding: 65px 0;
          }

          .network-card {
            width: 310px;
            height: 310px;
          }

          .cta-section {
            width: calc(100% - 25px);
            padding: 35px 25px;
            display: block;
          }

          .cta-section .button {
            margin-top: 25px;
          }

          .page-container,
          .account-page {
            width: calc(100% - 25px);
            padding-top: 45px;
          }

          .filters-bar {
            display: block;
          }

          .search-box.compact {
            width: 100%;
            margin-bottom: 10px;
          }

          .service-detail-main {
            padding: 24px;
          }

          .expect-list {
            grid-template-columns: 1fr;
          }

          .account-main {
            padding: 0 20px 30px;
          }

          .account-profile-head {
            align-items: flex-end;
          }

          .auth-brand,
          .auth-form {
            padding: 35px 25px;
          }

          .auth-brand {
            min-height: 300px;
          }

          .auth-brand h1 {
            font-size: 30px;
          }

          .messages-layout {
            grid-template-columns: 1fr;
          }

          .contacts-panel {
            border-right: 0;
            border-bottom: 1px solid #e6ebf2;
          }

          .chat-messages {
            min-height: 350px;
          }

          .preview-card {
            position: static;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .professional-head {
            align-items: center;
          }
        }
      `}</style>

      <Header />

      {renderPage()}

      <footer className="footer">
        <div>
          <strong>
            RobLoren
          </strong>

          <span>
            Conecta talento con oportunidades.
          </span>
        </div>

        <span>
          © {new Date().getFullYear()} RobLoren.
          Todos los derechos reservados.
        </span>
      </footer>
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
