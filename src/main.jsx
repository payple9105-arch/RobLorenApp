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
    title:
  service.service_title ||
  service.title ||
  "Servicio profesional",
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
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
const [reviewRating, setReviewRating] = useState(0);
const [reviewComment, setReviewComment] = useState("");
const [savingReview, setSavingReview] = useState(false);
const [reviewedRequests, setReviewedRequests] = useState({});

 const [selectedContact, setSelectedContact] = useState(null);
const [conversationContacts, setConversationContacts] =
  useState([]);
const [messages, setMessages] = useState([]);
const [messageText, setMessageText] = useState("");
const [loadingMessages, setLoadingMessages] = useState(false);
const [sendingMessage, setSendingMessage] = useState(false);

  const [servicesLoading, setServicesLoading] = useState(true);
const [savingProfile, setSavingProfile] = useState(false);
const [sendingRequest, setSendingRequest] = useState(false);

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

const loadReviewedRequests = async () => {
  if (!loggedUser?.id) {
    setReviewedRequests({});
    return;
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("request_id, rating, comment")
      .eq("reviewer_id", loggedUser.id);

    if (error) {
      console.error(
        "Error cargando valoraciones:",
        error
      );
      return;
    }

    const map = {};

    (data || []).forEach((review) => {
      map[review.request_id] = review;
    });

    setReviewedRequests(map);
  } catch (error) {
    console.error(
      "Error inesperado cargando valoraciones:",
      error
    );
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

const submitReview = async (request) => {
  if (!loggedUser?.id || !request?.id) {
    return;
  }

  if (reviewRating < 1 || reviewRating > 5) {
    alert(
      "Selecciona una valoración de 1 a 5 estrellas."
    );
    return;
  }

  setSavingReview(true);

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        request_id: request.id,
        reviewer_id: loggedUser.id,
        reviewed_id: request.provider_id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error guardando valoración:",
        error
      );

      alert(
        "No se pudo publicar la valoración:\n\n" +
          error.message
      );

      return;
    }

    setReviewedRequests((current) => ({
      ...current,
      [request.id]: {
        request_id: request.id,
        rating: data.rating,
        comment: data.comment,
      },
    }));

    setReviewingRequestId(null);
    setReviewRating(0);
    setReviewComment("");

    alert(
      "⭐ Valoración publicada correctamente."
    );
  } catch (error) {
    console.error(
      "Error inesperado guardando valoración:",
      error
    );

    alert(
      "Ocurrió un error al publicar la valoración."
    );
  } finally {
    setSavingReview(false);
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
  name: form.title.trim(),
  service_title: form.title.trim(),
  description: form.description.trim(),
  category: form.category,
  profession: form.category,
  price: numericPrice || 0,
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
    loadReviewedRequests();
  } else {
    setRequests([]);
    setReviewedRequests({});
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
        service.service_title,
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

        <h3>
  {service.service_title ||
    service.title ||
    "Servicio profesional"}
</h3>

        <p>{service.description}</p>

        {/* 
<Rating
  rating={service.rating}
  reviews={service.reviews}
/>
*/}

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

            <h1>{service.service_title || service.title || "Servicio profesional"}</h1>

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

  const RequestColumn = function RequestColumn({
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
      <div>
        ✓ Servicio completado
      </div>

      {!reviewedRequests[request.id] &&
        reviewingRequestId !== request.id && (
          <button
            className="button primary"
            onClick={() => {
              setReviewingRequestId(request.id);
              setReviewRating(0);
              setReviewComment("");
            }}
          >
            ⭐ Valorar servicio
          </button>
        )}

      {reviewedRequests[request.id] && (
        <div className="review-published">
          ⭐ Ya valoraste este servicio
        </div>
      )}
    </div>
  )}

{/* FORMULARIO DE VALORACIÓN */}
{reviewingRequestId === request.id && (
  <div className="review-form">
    <strong>Valora este servicio</strong>

    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={
            star <= reviewRating
              ? "star selected"
              : "star"
          }
          onClick={() =>
            setReviewRating(star)
          }
          aria-label={`${star} estrellas`}
        >
          ★
        </button>
      ))}
    </div>

    <textarea
      value={reviewComment}
      onChange={(event) =>
        setReviewComment(event.target.value)
      }
      placeholder="Escribe un comentario (opcional)"
      rows={4}
    />

    <div className="review-actions">
      <button
        className="button primary"
        disabled={
          savingReview || reviewRating === 0
        }
        onClick={() => submitReview(request)}
      >
        {savingReview
          ? "Publicando..."
          : "Publicar valoración"}
      </button>

      <button
        className="button"
        type="button"
        disabled={savingReview}
        onClick={() => {
          setReviewingRequestId(null);
          setReviewRating(0);
          setReviewComment("");
        }}
      >
        Cancelar
      </button>
    </div>
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
};
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
          {requests.map((request) =>
  RequestColumn({
    request,
  })
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
      return ServicesPage();

    case "account":
      return AccountPage();

    case "service":
      return ServicePage();

    case "requests":
      return RequestsPage();

    case "messages":
      return MessagesPage();

    case "offer":
      return OfferPage();

    default:
      return HomePage();
  }
};

  return (
    <>
      <style>{`
  /* =========================================================
     ROBLOREN — SISTEMA VISUAL PRINCIPAL
  ========================================================= */

  * {
    box-sizing: border-box;
  }

  :root {
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;

    color: #152238;
    background: #f7f9fc;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body,
  #root {
    width: 100%;
    max-width: 100%;
    min-width: 320px;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  body {
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

  main,
  section {
    width: 100%;
    max-width: 100%;
  }

  img {
    max-width: 100%;
  }

  /* =========================================================
     HEADER
  ========================================================= */

    .header {
    position: sticky;
    top: 0;
    z-index: 50;
    background:
      rgba(255,255,255,.92);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(216,226,237,.88);
    box-shadow:
      0 4px 18px rgba(30,55,90,.035);
  }
  .header-inner {
    width: min(1240px, calc(100% - 40px));
    min-height: 76px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  /* =========================================================
     NAV
  ========================================================= */

    .nav {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    flex: 0 1 auto;
  }
  .nav button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  .nav-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 40px;
    border: 1px solid transparent;
    background: transparent;
    padding: 9px 13px;
    color: #64748a;
    font-family: inherit;
    font-size: 13px;
    font-weight: 750;
    line-height: 1.2;
    border-radius: 10px;
    white-space: nowrap;
    cursor: pointer;
    transition:
      color .2s ease,
      background .2s ease,
      border-color .2s ease,
      transform .2s ease,
      box-shadow .2s ease;
  }
  .nav-link:hover {
    color: #1f5fb7;
    background:
      linear-gradient(
        135deg,
        #f5f9ff 0%,
        #edf4fd 100%
      );
    border-color: #e0eaf5;
    transform: translateY(-1px);
  }
  .nav-link.active {
    color: #1755b4;
    background:
      linear-gradient(
        135deg,
        #eef5ff 0%,
        #e6f0fc 100%
      );
    border-color: #d5e3f2;
    box-shadow:
      0 5px 13px rgba(33,102,209,.055);
  }
  .nav-link.active::after {
    content: "";
    position: absolute;
    left: 13px;
    right: 13px;
    bottom: 3px;
    height: 2px;
    border-radius: 999px;
    background:
      linear-gradient(
        90deg,
        #185cc2 0%,
        #2e7be8 100%
      );
    opacity: .95;
  }
  .nav-badge {
    display: inline-grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    margin-left: 5px;
    border-radius: 999px;
    background:
      linear-gradient(
        135deg,
        #185cc2 0%,
        #2e7be8 100%
      );
    color: #ffffff;
    font-size: 9px;
    font-weight: 850;
    line-height: 1;
    box-shadow:
      0 4px 9px rgba(33,102,209,.16);
  }

    /* =========================================================
     HEADER ACTIONS
  ========================================================= */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
  }
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 43px;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 11px 17px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      background .2s ease,
      border-color .2s ease,
      color .2s ease,
      opacity .2s ease;
  }
  .button:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  .button:active:not(:disabled) {
    transform: translateY(0);
  }
  .button:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 4px rgba(33,102,209,.10);
  }
  .button:disabled {
    cursor: not-allowed;
    opacity: .55;
    transform: none;
    box-shadow: none;
  }
  .button.primary {
    background:
      linear-gradient(
        135deg,
        #185cc2 0%,
        #2674dc 100%
      );
    color: #ffffff;
    border-color: #185cc2;
    box-shadow:
      0 9px 22px rgba(24,92,194,.18);
  }
  .button.primary:hover:not(:disabled) {
    background:
      linear-gradient(
        135deg,
        #1454b2 0%,
        #2169ca 100%
      );
    border-color: #1454b2;
    box-shadow:
      0 13px 29px rgba(24,92,194,.25);
  }
  .button.ghost {
    background:
      linear-gradient(
        135deg,
        #f5f8fc 0%,
        #edf2f7 100%
      );
    color: #41516a;
    border-color: #e0e7ef;
    box-shadow:
      0 4px 10px rgba(30,55,90,.025);
  }
  .button.ghost:hover:not(:disabled) {
    background:
      linear-gradient(
        135deg,
        #eef4fb 0%,
        #e6eef7 100%
      );
    color: #245da8;
    border-color: #d2deeb;
    box-shadow:
      0 8px 17px rgba(30,55,90,.055);
  }
  .button.outline {
    background:
      linear-gradient(
        135deg,
        #ffffff 0%,
        #f8fbff 100%
      );
    color: #1755b4;
    border: 1px solid #c7d6e8;
    box-shadow:
      0 5px 13px rgba(30,55,90,.035);
  }
  .button.outline:hover:not(:disabled) {
    background: #f3f8ff;
    color: #124b9f;
    border-color: #a9c2df;
    box-shadow:
      0 10px 21px rgba(33,102,209,.09);
  }
  .button.light {
    background:
      linear-gradient(
        135deg,
        #ffffff 0%,
        #f7faff 100%
      );
    color: #163a75;
    border-color: #d9e4ef;
    box-shadow:
      0 6px 15px rgba(30,55,90,.04);
  }
  .button.light:hover:not(:disabled) {
    background: #f3f8ff;
    border-color: #c5d7eb;
    box-shadow:
      0 10px 21px rgba(30,55,90,.07);
  }
  .button.white {
    background: #ffffff;
    color: #1856ae;
    border-color: rgba(255,255,255,.78);
    box-shadow:
      0 7px 17px rgba(10,35,75,.10);
  }
  .button.white:hover:not(:disabled) {
    background: #f7faff;
    color: #124b9f;
    box-shadow:
      0 11px 24px rgba(10,35,75,.15);
  }
  .button.danger {
    background:
      linear-gradient(
        135deg,
        #fff5f5 0%,
        #ffeded 100%
      );
    color: #c83d3d;
    border-color: #f1d2d2;
  }
  .button.danger:hover:not(:disabled) {
    background:
      linear-gradient(
        135deg,
        #ffeded 0%,
        #ffe3e3 100%
      );
    color: #b83232;
    border-color: #e9bcbc;
    box-shadow:
      0 9px 19px rgba(200,61,61,.09);
  }
  .button.large {
    min-height: 48px;
    padding: 14px 21px;
    font-size: 15px;
    border-radius: 13px;
  }
  .button.full {
    width: 100%;
  }

    .profile-mini {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    background:
      linear-gradient(
        135deg,
        #f7faff 0%,
        #eef4fb 100%
      );
    border: 1px solid #dce6f0;
    border-radius: 11px;
    padding: 3px 7px 3px 4px;
    color: #23334d;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow:
      0 4px 11px rgba(30,55,90,.035);
    transition:
      background .2s ease,
      border-color .2s ease,
      box-shadow .2s ease,
      transform .2s ease;
  }
  .profile-mini:hover {
    background:
      linear-gradient(
        135deg,
        #f2f7fd 0%,
        #e9f1fa 100%
      );
    border-color: #cbd9e8;
    box-shadow:
      0 7px 16px rgba(30,55,90,.065);
    transform: translateY(-1px);
  }
  .profile-mini:active {
    transform: translateY(0);
  }
  .profile-mini-name {
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #29405f;
    line-height: 1.2;
  }
  /* =========================================================
     AVATARES
  ========================================================= */
  .avatar {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background:
      linear-gradient(
        145deg,
        #e9f2ff 0%,
        #c9dcf5 100%
      );
    color: #174c9d;
    font-size: 12px;
    font-weight: 850;
    line-height: 1;
    border: 2px solid #ffffff;
    box-shadow:
      0 6px 16px rgba(32,65,110,.09);
    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }
  .profile-mini:hover .avatar {
    transform: scale(1.03);
    box-shadow:
      0 8px 18px rgba(32,65,110,.13);
  }

  .avatar.small {
    width: 32px;
    height: 32px;

    font-size: 11px;
  }

  .avatar.large {
    width: 62px;
    height: 62px;

    min-width: 62px;

    display: grid;
    place-items: center;

    border-radius: 18px;

    font-size: 18px;
    font-weight: 850;

    color: #ffffff;

    background:
      linear-gradient(
        145deg,
        #12366f 0%,
        #1d5fbe 55%,
        #2e7be8 100%
      );

    border: 3px solid #ffffff;

    box-shadow:
      0 8px 18px rgba(33,102,209,.17),
      0 2px 6px rgba(33,66,110,.055);
  }

  /* =========================================================
     HERO
  ========================================================= */

    .hero {
    min-height: 600px;
    width: 100%;
    display: grid;
    grid-template-columns:
      minmax(0,1.05fr)
      minmax(0,.95fr);
    gap: 55px;
    align-items: center;
    padding:
      76px
      max(20px, calc((100% - 1240px) / 2));
    position: relative;
    background:
      radial-gradient(
        circle at 82% 18%,
        rgba(76,138,235,.19),
        transparent 30%
      ),
      radial-gradient(
        circle at 15% 85%,
        rgba(33,102,209,.085),
        transparent 28%
      ),
      radial-gradient(
        circle at 54% 48%,
        rgba(255,255,255,.72),
        transparent 34%
      ),
      linear-gradient(
        135deg,
        #fbfdff 0%,
        #f3f7fc 55%,
        #edf4fb 100%
      );
    overflow: hidden;
  }
  .hero::before {
    content: "";
    position: absolute;
    width: 520px;
    height: 520px;
    right: -250px;
    top: -285px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(78,143,239,.11) 0%,
        rgba(78,143,239,0) 70%
      );
    pointer-events: none;
  }
  .hero::after {
    content: "";
    position: absolute;
    width: 430px;
    height: 430px;
    left: -260px;
    bottom: -270px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.065) 0%,
        rgba(33,102,209,0) 70%
      );
    pointer-events: none;
  }
  .hero-content {
    max-width: 680px;
    position: relative;
    z-index: 1;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background:
      linear-gradient(
        135deg,
        rgba(255,255,255,.96) 0%,
        rgba(246,250,255,.94) 100%
      );
    color: #2761b2;
    font-size: 11px;
    font-weight: 850;
    line-height: 1.2;
    border: 1px solid #d9e5f3;
    box-shadow:
      0 9px 22px rgba(31,67,112,.055),
      0 2px 6px rgba(31,67,112,.025);
    margin-bottom: 23px;
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);
  }
  .hero-badge span {
    color: #2a70df;
  }
  .hero h1 {
    max-width: 700px;
    margin: 0 0 24px;
    color: #12264a;
    font-size: clamp(42px,5.5vw,70px);
    line-height: .99;
    letter-spacing: -3.5px;
    font-weight: 900;
  }
  .hero h1 span {
    color: #2166d1;
  }
  .hero p {
    max-width: 640px;
    margin: 0 0 31px;
    color: #66768c;
    font-size: 18px;
    line-height: 1.7;
    font-weight: 500;
  }
  .hero-buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 4px;
  }
  .hero-buttons .button {
    min-height: 50px;
    padding: 13px 22px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -.1px;
  }
  .hero-buttons .button:hover {
    transform: translateY(-2px);
  }
  .hero-buttons .button.primary {
    box-shadow:
      0 11px 25px rgba(33,102,209,.19);
  }
  .hero-buttons .button.primary:hover {
    box-shadow:
      0 15px 31px rgba(33,102,209,.25);
  }
  .hero-buttons .button.light {
    border: 1px solid #d8e3ef;
    box-shadow:
      0 7px 18px rgba(20,43,77,.055);
  }
  .hero-buttons .button.light:hover {
    border-color: #c3d5e8;
    box-shadow:
      0 11px 23px rgba(20,43,77,.075);
  }
  .hero-trust {
    display: flex;
    align-items: stretch;
    flex-wrap: wrap;
    margin-top: 43px;
    padding-top: 22px;
    border-top: 1px solid #dce5f1;
  }
  .hero-trust > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 150px;
    padding: 0 24px;
    border-right: 1px solid #e0e7f0;
  }
  .hero-trust > div:first-child {
    padding-left: 0;
  }
  .hero-trust > div:last-child {
    border-right: 0;
  }
  .hero-trust strong {
    color: #203653;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 850;
  }
  .hero-trust span {
    color: #8a97a9;
    font-size: 11px;
    line-height: 1.35;
    font-weight: 650;
  }

  /* =========================================================
     HERO VISUAL
  ========================================================= */

    .hero-visual {
    min-height: 480px;
    position: relative;
    display: grid;
    place-items: center;
    isolation: isolate;
  }
  .hero-glow {
    position: absolute;
    width: 350px;
    height: 350px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(41,111,218,.17) 0%,
        rgba(41,111,218,.08) 45%,
        rgba(41,111,218,0) 72%
      );
    filter: blur(10px);
    pointer-events: none;
    z-index: 0;
  }
  .hero-orbit {
    width: 320px;
    height: 320px;
    position: relative;
    display: grid;
    place-items: center;
    border: 1px solid rgba(39,101,188,.22);
    border-radius: 50%;
    background:
      radial-gradient(
        circle at center,
        rgba(255,255,255,.98) 0%,
        rgba(241,247,255,.84) 48%,
        rgba(225,237,251,.42) 100%
      );
    box-shadow:
      0 0 0 1px rgba(255,255,255,.75) inset,
      0 0 0 42px rgba(42,111,215,.038),
      0 0 0 84px rgba(42,111,215,.024),
      0 27px 58px rgba(32,67,112,.12);
    z-index: 1;
    transition:
      transform .3s ease,
      box-shadow .3s ease;
  }
  .hero-orbit::before {
    content: "";
    position: absolute;
    inset: 30px;
    border: 1px dashed rgba(49,111,205,.18);
    border-radius: 50%;
    pointer-events: none;
  }
  .hero-orbit::after {
    content: "";
    position: absolute;
    inset: 70px;
    border: 1px solid rgba(49,111,205,.10);
    border-radius: 50%;
    pointer-events: none;
  }
  .hero-visual:hover .hero-orbit {
    transform: translateY(-3px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,.78) inset,
      0 0 0 42px rgba(42,111,215,.045),
      0 0 0 84px rgba(42,111,215,.028),
      0 32px 65px rgba(32,67,112,.15);
  }
  .orbit-center {
    width: 112px;
    height: 112px;
    display: grid;
    place-items: center;
    position: relative;
    border-radius: 31px;
    background:
      linear-gradient(
        145deg,
        #12366f 0%,
        #1d5fbe 55%,
        #2e7be8 100%
      );
    color: #ffffff;
    font-size: 55px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -2px;
    border: 2px solid rgba(255,255,255,.88);
    box-shadow:
      0 19px 38px rgba(26,76,153,.25),
      0 8px 18px rgba(33,102,209,.14),
      0 0 0 8px rgba(255,255,255,.40);
    text-shadow:
      0 2px 8px rgba(0,0,0,.14);
    z-index: 2;
    transition:
      transform .25s ease,
      box-shadow .25s ease;
  }
  .hero-visual:hover .orbit-center {
    transform: scale(1.035);
    box-shadow:
      0 23px 43px rgba(26,76,153,.29),
      0 9px 20px rgba(33,102,209,.17),
      0 0 0 8px rgba(255,255,255,.45);
  }
  .floating-card {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 205px;
    padding: 15px 16px;
    border-radius: 17px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.985) 0%,
        rgba(248,251,255,.965) 100%
      );
    border: 1px solid rgba(207,223,239,.98);
    box-shadow:
      0 20px 42px rgba(35,68,110,.11),
      0 6px 16px rgba(35,68,110,.045);
    backdrop-filter: blur(13px);
    -webkit-backdrop-filter: blur(13px);
    z-index: 3;
    transition:
      transform .25s ease,
      box-shadow .25s ease,
      border-color .25s ease;
  }
  .floating-card:hover {
    transform: translateY(-6px);
    border-color: #c4d8ed;
    box-shadow:
      0 27px 54px rgba(35,68,110,.15),
      0 9px 21px rgba(35,68,110,.065);
  }
  .floating-card strong,
  .floating-card span {
    display: block;
  }
  .floating-card strong {
    color: #203653;
    font-size: 13px;
    line-height: 1.25;
    font-weight: 850;
  }
  .floating-card span:last-child {
    margin-top: 5px;
    color: #7b899b;
    font-size: 11px;
    line-height: 1.3;
    font-weight: 600;
  }
  .floating-icon {
    width: 44px;
    height: 44px;
    min-width: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background:
      linear-gradient(
        145deg,
        #f3f8ff 0%,
        #e8f1ff 100%
      );
    border: 1px solid #d8e6f6;
    font-size: 21px;
    box-shadow:
      0 7px 16px rgba(33,102,209,.08),
      0 1px 3px rgba(33,66,110,.05);
    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }
  .floating-card:hover .floating-icon {
    transform: scale(1.04);
    box-shadow:
      0 9px 19px rgba(33,102,209,.11);
  }
  .card-one {
    top: 62px;
    right: 2%;
  }
  .card-two {
    bottom: 62px;
    left: 2%;
  }

  /* =========================================================
     BUSCADOR
  ========================================================= */

      .search-section {
    width: min(1080px, calc(100% - 40px));
    margin: -38px auto 0;
    position: relative;
    z-index: 5;
  }
  .search-box {
    display: flex;
    align-items: center;
    gap: 11px;
    min-height: 72px;
    padding: 8px 9px 8px 20px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.995) 0%,
        rgba(247,250,255,.985) 100%
      );
    border: 1px solid #d5e1ee;
    border-radius: 19px;
    box-shadow:
      0 24px 55px rgba(28,59,99,.13),
      0 6px 16px rgba(28,59,99,.05);
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      transform .2s ease;
  }
  .search-box:hover {
    border-color: #c9d9e9;
    box-shadow:
      0 27px 60px rgba(28,59,99,.15),
      0 7px 18px rgba(28,59,99,.055);
  }
  .search-box:focus-within {
    border-color: #9fbce0;
    box-shadow:
      0 25px 57px rgba(28,59,99,.15),
      0 0 0 4px rgba(33,102,209,.07);
  }
  .search-box.compact {
    width: 350px;
    min-height: 50px;
    box-shadow:
      0 7px 18px rgba(28,59,99,.045);
  }
  .search-icon {
    width: 28px;
    min-width: 28px;
    display: grid;
    place-items: center;
    color: #6e819a;
    font-size: 25px;
    line-height: 1;
    transition:
      color .2s ease,
      transform .2s ease;
  }
  .search-box:focus-within .search-icon {
    color: #2166d1;
    transform: scale(1.04);
  }
  .search-box input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    padding: 13px 14px;
    color: #1f3149;
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.45;
  }
  .search-box input::placeholder {
    color: #8a98aa;
    opacity: 1;
  }
  .search-button {
    min-width: 116px;
    min-height: 50px;
    padding: 12px 21px;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    background:
      linear-gradient(
        135deg,
        #185cc2 0%,
        #2674dc 100%
      );
    color: #ffffff;
    border: 1px solid #185cc2;
    box-shadow:
      0 9px 20px rgba(33,102,209,.16);
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      background .2s ease,
      border-color .2s ease;
  }
  .search-button:hover {
    transform: translateY(-2px);
    background:
      linear-gradient(
        135deg,
        #1454b2 0%,
        #2169ca 100%
      );
    border-color: #1454b2;
    box-shadow:
      0 13px 27px rgba(33,102,209,.23);
  }
  .search-button:active {
    transform: translateY(0);
  }

  /* =========================================================
     SECCIONES
  ========================================================= */

  .section {
    width: min(1240px, calc(100% - 40px));

    margin: 0 auto;

    padding: 88px 0;
  }

  .soft-section {
    width: 100%;

    padding-top: 82px;
    padding-bottom: 82px;

    padding-left:
      max(20px, calc((100% - 1240px) / 2));

    padding-right:
      max(20px, calc((100% - 1240px) / 2));

    background:
      linear-gradient(
        180deg,
        #f8fafc 0%,
        #f2f6fa 100%
      );

    border-top: 1px solid #e8eef5;
    border-bottom: 1px solid #e8eef5;
  }

  .section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    gap: 32px;

    margin-bottom: 40px;
  }

  .section-heading.centered {
    display: block;

    text-align: center;

    max-width: 700px;

    margin-left: auto;
    margin-right: auto;
  }

  .section-heading.small {
    margin-bottom: 22px;
  }

  .eyebrow {
    display: block;

    margin-bottom: 10px;

    color: #2b67b7;

    font-size: 10px;
    line-height: 1.3;

    font-weight: 850;

    letter-spacing: 1.8px;

    text-transform: uppercase;
  }

  .section-heading h2,
  .benefits-content h2 {
    margin: 0;

    color: #162f55;

    font-size: clamp(28px,3vw,40px);

    line-height: 1.12;

    font-weight: 800;

    letter-spacing: -1.25px;
  }

  .soft-section .section-heading h2 {
    color: #17345d;
  }

  .section-heading p {
    margin: 12px 0 0;

    max-width: 650px;

    color: #718096;

    font-size: 15px;

    line-height: 1.7;

    font-weight: 500;
  }

  .category-section .section-heading p {
    max-width: 620px;
  }

  .text-button {
    border: 0;

    background: transparent;

    color: #1758b6;

    font-size: 13px;
    font-weight: 800;

    white-space: nowrap;

    padding: 7px 4px;

    border-radius: 7px;
  }

  .text-button:hover {
    color: #12448f;

    background: #f1f6fd;

    transform: translateX(2px);
  }

  /* =========================================================
     CATEGORÍAS
  ========================================================= */

    .category-grid {
    display: grid;
    grid-template-columns:
      repeat(5,minmax(0,1fr));
    gap: 18px;
  }
  .category-card {
    min-height: 148px;
    padding: 21px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    position: relative;
    overflow: hidden;
    border: 1px solid #d8e3ef;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );
    border-radius: 19px;
    text-align: left;
    box-shadow:
      0 12px 26px rgba(30,55,90,.055),
      0 3px 8px rgba(30,55,90,.025);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }
  .category-card::before {
    content: "";
    position: absolute;
    width: 120px;
    height: 120px;
    top: -65px;
    right: -55px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.07) 0%,
        rgba(33,102,209,0) 70%
      );
    pointer-events: none;
  }
  .category-card:hover {
    transform: translateY(-6px);
    border-color: #c2d6ec;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );
    box-shadow:
      0 21px 42px rgba(27,60,102,.105),
      0 6px 15px rgba(27,60,102,.04);
  }
  .category-big-icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    position: relative;
    z-index: 1;
    margin-bottom: 17px;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        #f3f8ff 0%,
        #e4eefc 100%
      );
    border: 1px solid #d6e4f4;
    font-size: 26px;
    box-shadow:
      0 5px 12px rgba(33,102,209,.035);
    transition:
      transform .22s ease,
      background .22s ease,
      box-shadow .22s ease;
  }
  .category-card:hover .category-big-icon {
    transform: scale(1.045);
    background:
      linear-gradient(
        145deg,
        #edf5ff 0%,
        #dceafc 100%
      );
    box-shadow:
      0 8px 16px rgba(33,102,209,.07);
  }
  .category-card strong {
    display: block;
    position: relative;
    z-index: 1;
    color: #18345b;
    font-size: 14px;
    font-weight: 850;
    line-height: 1.3;
    letter-spacing: -.1px;
  }
  .category-card span:last-child {
    display: block;
    position: relative;
    z-index: 1;
    margin-top: 7px;
    color: #71829a;
    font-size: 11px;
    line-height: 1.4;
    font-weight: 650;
  }

  /* =========================================================
     SERVICIOS
  ========================================================= */

      .service-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );
    border: 1px solid #d6e2ee;
    border-radius: 21px;
    padding: 23px;
    cursor: pointer;
    box-shadow:
      0 13px 30px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }
  .service-card::before {
    content: "";
    position: absolute;
    width: 155px;
    height: 155px;
    top: -82px;
    right: -68px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.08) 0%,
        rgba(33,102,209,0) 70%
      );
    pointer-events: none;
  }
  .service-card:hover {
    transform: translateY(-6px);
    border-color: #bfd4eb;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );
    box-shadow:
      0 24px 48px rgba(27,60,102,.115),
      0 7px 18px rgba(27,60,102,.045);
  }
  .service-card:hover .arrow {
    transform: translateX(3px);
    background: #e8f1fc;
    color: #1f5fb7;
  }
  .service-card-top {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    background:
      linear-gradient(
        135deg,
        #f1f6ff 0%,
        #e5effc 100%
      );
    border: 1px solid #cfdeee;
    color: #245da8;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .15px;
    box-shadow:
      0 3px 8px rgba(33,102,209,.035);
  }
  .service-price {
    color: #17488f;
    font-size: 21px;
    font-weight: 900;
    white-space: nowrap;
    letter-spacing: -.3px;
  }
  .service-icon {
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    position: relative;
    z-index: 1;
    border-radius: 17px;
    background:
      linear-gradient(
        145deg,
        #f4f9ff 0%,
        #e6f0fc 100%
      );
    border: 1px solid #d2e1f1;
    font-size: 28px;
    margin-bottom: 18px;
    box-shadow:
      0 6px 14px rgba(33,102,209,.045);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      background .22s ease;
  }
  .service-card:hover .service-icon {
    transform: translateY(-3px);
    background:
      linear-gradient(
        145deg,
        #edf5ff 0%,
        #dceafc 100%
      );
    box-shadow:
      0 9px 19px rgba(33,102,209,.09);
  }
  .service-card h3 {
    margin: 0 0 10px;
    position: relative;
    z-index: 1;
    color: #17345d;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 850;
    letter-spacing: -.3px;
  }
  .service-card > p {
    position: relative;
    z-index: 1;
    color: #68788f;
    font-size: 13.5px;
    line-height: 1.65;
    min-height: 63px;
    margin: 0 0 18px;
  }
  .rating {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin: 9px 0 0;
    position: relative;
    z-index: 1;
  }
  .stars {
    color: #e9a52b;
    letter-spacing: 1.5px;
    font-size: 13px;
    line-height: 1;
  }
  .rating span,
  .review-count {
    color: #8794a5;
    font-size: 11px;
  }
  .rating strong {
    color: #263b58;
    font-size: 12px;
    font-weight: 850;
  }
  .service-provider {
    display: flex;
    align-items: center;
    gap: 11px;
    border-top: 1px solid #e5ebf3;
    padding-top: 17px;
    margin-top: auto;
    position: relative;
    z-index: 1;
  }
  .service-provider div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .service-provider strong {
    color: #263b59;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .service-provider span:not(.avatar) {
    color: #7d8b9e;
    font-size: 10px;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .arrow {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 33px;
    height: 33px;
    border-radius: 50%;
    color: #2667c8;
    background:
      linear-gradient(
        135deg,
        #f3f8ff 0%,
        #eaf2fc 100%
      );
    border: 1px solid #d5e3f2;
    font-size: 17px;
    box-shadow:
      0 4px 10px rgba(33,102,209,.035);
    transition:
      transform .2s ease,
      background .2s ease,
      color .2s ease,
      box-shadow .2s ease;
  }
  .service-card:hover .arrow {
    box-shadow:
      0 6px 14px rgba(33,102,209,.11);
  }

  /* =========================================================
     PROFESIONALES
  ========================================================= */

      .professionals-grid {
    display: grid;
    grid-template-columns:
      repeat(3,minmax(0,1fr));
    gap: 24px;
  }
  .professional-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );
    border: 1px solid #d8e3ee;
    border-radius: 21px;
    padding: 24px;
    box-shadow:
      0 13px 30px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }
  .professional-card::before {
    content: "";
    position: absolute;
    width: 150px;
    height: 150px;
    top: -80px;
    right: -66px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.08) 0%,
        rgba(33,102,209,0) 70%
      );
    pointer-events: none;
  }
  .professional-card:hover {
    transform: translateY(-6px);
    border-color: #bfd4eb;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );
    box-shadow:
      0 24px 48px rgba(27,60,102,.11),
      0 7px 17px rgba(27,60,102,.04);
  }
  .professional-card:active {
    transform: translateY(-1px);
  }
  .professional-head {
    display: flex;
    align-items: center;
    gap: 17px;
    margin-bottom: 21px;
    position: relative;
    z-index: 1;
  }
  .professional-info {
    min-width: 0;
  }
  .professional-info h3 {
    margin: 0 0 6px;
    color: #18345b;
    font-size: 18px;
    font-weight: 850;
    line-height: 1.3;
    letter-spacing: -.25px;
  }
  .professional-role,
  .professional-location,
  .professional-username {
    display: block;
    margin-top: 5px;
    font-size: 11px;
    line-height: 1.35;
  }
  .professional-role {
    color: #65758a;
    font-weight: 750;
  }
  .professional-location {
    color: #7d8b9d;
    font-weight: 600;
  }
  .professional-username {
    color: #4f78ad;
    font-weight: 700;
  }
  .professional-card > p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: #6f7f92;
    font-size: 13px;
    line-height: 1.68;
    min-height: 66px;
  }
  .skill-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 18px 0 21px;
    position: relative;
    z-index: 1;
  }
  .skill-row span,
  .profile-skills span {
    display: inline-flex;
    align-items: center;
    padding: 7px 12px;
    border-radius: 999px;
    background:
      linear-gradient(
        135deg,
        #f3f7fd 0%,
        #eaf1f9 100%
      );
    border: 1px solid #d7e2ee;
    color: #52667f;
    font-size: 10px;
    font-weight: 750;
    box-shadow:
      0 3px 8px rgba(30,55,90,.025);
    transition:
      transform .18s ease,
      background .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
  }
  .skill-row span:hover,
  .profile-skills span:hover {
    background:
      linear-gradient(
        135deg,
        #eef5ff 0%,
        #e5effc 100%
      );
    border-color: #c7d9ed;
    transform: translateY(-1px);
    box-shadow:
      0 5px 11px rgba(33,102,209,.055);
  }
  .professional-card .button.outline {
    width: 100%;
    min-height: 47px;
    margin-top: auto;
    padding: 11px 18px;
    border-radius: 12px;
    background:
      linear-gradient(
        135deg,
        #ffffff 0%,
        #f8fbff 100%
      );
    color: #1755b4;
    border: 1px solid #c1d2e7;
    font-size: 13px;
    font-weight: 800;
    box-shadow:
      0 6px 15px rgba(33,102,209,.065);
    transition:
      transform .2s ease,
      background .2s ease,
      border-color .2s ease,
      box-shadow .2s ease;
  }
  .professional-card .button.outline:hover {
    transform: translateY(-2px);
    background:
      linear-gradient(
        135deg,
        #f3f8ff 0%,
        #eaf2fc 100%
      );
    border-color: #a4bee2;
    box-shadow:
      0 11px 23px rgba(33,102,209,.12);
  }

  /* =========================================================
     CÓMO FUNCIONA
  ========================================================= */

      .how-section {
    padding: 96px 20px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 8% 18%,
        rgba(33,102,209,.055),
        transparent 25%
      ),
      radial-gradient(
        circle at 92% 82%,
        rgba(61,126,215,.045),
        transparent 27%
      ),
      linear-gradient(
        180deg,
        #f1f6fb 0%,
        #eaf1f8 100%
      );
    border-top: 1px solid #dfe8f2;
    border-bottom: 1px solid #dfe8f2;
  }
  .steps-grid {
    width: min(1100px,100%);
    margin: 52px auto 0;
    display: grid;
    grid-template-columns:
      repeat(4,minmax(0,1fr));
    gap: 21px;
  }
  .step-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    padding: 28px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.99) 0%,
        rgba(248,251,255,.95) 100%
      );
    border: 1px solid #d4e0ec;
    border-radius: 20px;
    box-shadow:
      0 13px 30px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }
  .step-card::after {
    content: "";
    position: absolute;
    width: 120px;
    height: 120px;
    right: -65px;
    bottom: -65px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.065) 0%,
        rgba(33,102,209,0) 70%
      );
    pointer-events: none;
  }
  .step-card:hover {
    transform: translateY(-6px);
    border-color: #bdd2e9;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );
    box-shadow:
      0 22px 43px rgba(30,70,115,.105),
      0 6px 15px rgba(30,70,115,.04);
  }
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    min-width: 40px;
    height: 40px;
    padding: 0 11px;
    margin-bottom: 28px;
    border-radius: 13px;
    background:
      linear-gradient(
        135deg,
        #e7f0ff 0%,
        #d8e8fb 100%
      );
    border: 1px solid #c7dced;
    color: #2464bd;
    font-weight: 900;
    font-size: 11px;
    box-shadow:
      0 6px 14px rgba(33,102,209,.075);
    transition:
      transform .2s ease,
      background .2s ease,
      box-shadow .2s ease;
  }
  .step-card:hover .step-number {
    transform: translateY(-2px);
    background:
      linear-gradient(
        135deg,
        #e0edff 0%,
        #d2e4fa 100%
      );
    box-shadow:
      0 8px 17px rgba(33,102,209,.10);
  }
  .step-card h3 {
    position: relative;
    z-index: 1;
    margin: 0 0 10px;
    color: #243b5b;
    font-size: 16px;
    line-height: 1.35;
    font-weight: 850;
    letter-spacing: -.15px;
  }
  .step-card p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: #7b899c;
    font-size: 12.5px;
    line-height: 1.68;
  }

  /* =========================================================
     BENEFICIOS
  ========================================================= */

      .benefits-section {
    width: min(1240px, calc(100% - 40px));
    margin: 0 auto;
    padding: 100px 0;
    display: grid;
    grid-template-columns:
      minmax(0,1fr)
      minmax(0,1fr);
    gap: 80px;
    align-items: center;
  }
  .benefits-content {
    min-width: 0;
  }
  .benefits-content h2 span {
    color: #2468cc;
  }
  .benefits-content > p {
    max-width: 580px;
    margin: 20px 0 30px;
    color: #718096;
    font-size: 15px;
    line-height: 1.7;
    font-weight: 500;
  }
  .benefits-list {
    display: grid;
    gap: 16px;
  }
  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 13px 14px;
    border: 1px solid transparent;
    border-radius: 15px;
    transition:
      background .2s ease,
      border-color .2s ease,
      transform .2s ease,
      box-shadow .2s ease;
  }
  .benefit-item:hover {
    background:
      linear-gradient(
        135deg,
        #f8fbff 0%,
        #f1f6fc 100%
      );
    border-color: #e0e9f3;
    transform: translateX(3px);
    box-shadow:
      0 7px 18px rgba(30,55,90,.04);
  }
  .benefit-item > span {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background:
      linear-gradient(
        135deg,
        #edf5ff 0%,
        #dfecfc 100%
      );
    color: #2062c1;
    font-size: 13px;
    font-weight: 900;
    border: 1px solid #d2e2f5;
    box-shadow:
      0 5px 12px rgba(33,102,209,.065);
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }
  .benefit-item:hover > span {
    transform: scale(1.04);
    background:
      linear-gradient(
        135deg,
        #e5f0ff 0%,
        #d7e8fb 100%
      );
    box-shadow:
      0 7px 15px rgba(33,102,209,.09);
  }
  .benefit-item strong {
    display: block;
    color: #29405f;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 800;
  }
  .benefit-item p {
    margin: 5px 0 0;
    color: #8793a4;
    font-size: 12px;
    line-height: 1.58;
    font-weight: 500;
  }
  .benefits-visual {
    display: grid;
    place-items: center;
    min-width: 0;
    position: relative;
  }

  /* =========================================================
     NETWORK
  ========================================================= */

      .network-card {
    width: 390px;
    height: 390px;
    max-width: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 32px;
    background:
      radial-gradient(
        circle at 50% 50%,
        rgba(255,255,255,.99) 0%,
        rgba(243,248,254,.97) 45%,
        rgba(224,238,251,.98) 100%
      );
    border: 1px solid #cfdeec;
    box-shadow:
      0 31px 66px rgba(31,67,112,.135),
      0 9px 21px rgba(31,67,112,.05);
    transition:
      transform .25s ease,
      box-shadow .25s ease,
      border-color .25s ease;
  }
  .network-card::before {
    content: "";
    position: absolute;
    width: 330px;
    height: 330px;
    left: -145px;
    top: -190px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.16) 0%,
        rgba(255,255,255,0) 70%
      );
    pointer-events: none;
    z-index: 0;
  }
  .network-card::after {
    content: "";
    position: absolute;
    width: 300px;
    height: 300px;
    right: -110px;
    bottom: -160px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(72,132,211,.07) 0%,
        rgba(72,132,211,.02) 45%,
        rgba(72,132,211,0) 72%
      );
    pointer-events: none;
    z-index: 0;
  }
  .network-card:hover {
    transform: translateY(-5px);
    border-color: #bfd3e8;
    box-shadow:
      0 37px 74px rgba(31,67,112,.17),
      0 11px 25px rgba(31,67,112,.06);
  }
  .network-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    width: 96px;
    height: 96px;
    display: grid;
    place-items: center;
    border-radius: 28px;
    background:
      linear-gradient(
        145deg,
        #102f63 0%,
        #1c5bb4 54%,
        #2e7be8 100%
      );
    color: #ffffff;
    font-size: 45px;
    font-weight: 900;
    line-height: 1;
    border: 3px solid rgba(255,255,255,.92);
    box-shadow:
      0 23px 47px rgba(27,72,144,.25),
      0 8px 17px rgba(27,72,144,.09),
      0 0 0 7px rgba(255,255,255,.32);
    text-shadow:
      0 2px 7px rgba(0,0,0,.13);
    z-index: 3;
    transition:
      transform .25s ease,
      box-shadow .25s ease;
  }
  .network-card:hover .network-center {
    transform: translate(-50%,-50%) scale(1.04);
    box-shadow:
      0 27px 53px rgba(27,72,144,.29),
      0 10px 20px rgba(27,72,144,.11),
      0 0 0 8px rgba(255,255,255,.38);
  }
  .network-person {
    position: absolute;
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9fe 100%
      );
    border: 1px solid #d4e1ed;
    border-radius: 17px;
    font-size: 25px;
    box-shadow:
      0 13px 28px rgba(31,67,112,.11),
      0 3px 8px rgba(31,67,112,.035);
    z-index: 2;
    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }
  .network-person:hover {
    transform: translateY(-5px) scale(1.025);
    border-color: #bfd4ea;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f1f7ff 100%
      );
    box-shadow:
      0 18px 36px rgba(31,67,112,.16),
      0 5px 11px rgba(31,67,112,.045);
  }
  .p1 {
    left: 50px;
    top: 55px;
  }
  .p2 {
    right: 50px;
    top: 65px;
  }
  .p3 {
    left: 45px;
    bottom: 55px;
  }
  .p4 {
    right: 48px;
    bottom: 50px;
  }
  .network-line {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 160px;
    height: 2px;
    transform-origin: left center;
    background:
      linear-gradient(
        90deg,
        #bfd3e8 0%,
        #9fbddd 100%
      );
    opacity: .9;
    z-index: 1;
    box-shadow:
      0 1px 4px rgba(55,99,151,.06);
    transition:
      opacity .22s ease,
      height .22s ease,
      box-shadow .22s ease;
  }
  .network-card:hover .network-line {
    opacity: 1;
    height: 2.5px;
    box-shadow:
      0 1px 5px rgba(55,99,151,.10);
  }
  .line-a {
    transform: rotate(-143deg);
  }
  .line-b {
    transform: rotate(-37deg);
  }
  .line-c {
    transform: rotate(145deg);
  }

  /* =========================================================
     CTA
  ========================================================= */

      .cta-section {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto 88px;
    padding: 68px 70px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 42px;
    border-radius: 30px;
    background:
      radial-gradient(
        circle at 84% 18%,
        rgba(101,171,255,.32),
        transparent 31%
      ),
      radial-gradient(
        circle at 8% 100%,
        rgba(80,139,225,.18),
        transparent 35%
      ),
      radial-gradient(
        circle at 52% 50%,
        rgba(73,139,232,.10),
        transparent 40%
      ),
      linear-gradient(
        135deg,
        #0f2d5f 0%,
        #1958ae 52%,
        #2878e4 100%
      );
    color: #ffffff;
    border: 1px solid rgba(255,255,255,.12);
    box-shadow:
      0 31px 70px rgba(22,69,137,.25),
      0 8px 21px rgba(22,69,137,.085);
    transition:
      transform .25s ease,
      box-shadow .25s ease,
      border-color .25s ease;
  }
  .cta-section:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,.16);
    box-shadow:
      0 38px 80px rgba(22,69,137,.30),
      0 11px 26px rgba(22,69,137,.11);
  }
  .cta-section::before {
    content: "";
    position: absolute;
    width: 360px;
    height: 360px;
    left: -155px;
    top: -205px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.11) 0%,
        rgba(255,255,255,0) 70%
      );
    pointer-events: none;
  }
  .cta-section::after {
    content: "";
    position: absolute;
    width: 330px;
    height: 330px;
    right: -120px;
    bottom: -175px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.11) 0%,
        rgba(255,255,255,.025) 45%,
        rgba(255,255,255,0) 72%
      );
    pointer-events: none;
  }
  .cta-section .eyebrow {
    position: relative;
    z-index: 1;
    display: inline-block;
    margin-bottom: 9px;
    color: #c7e0ff;
    font-size: 11px;
    line-height: 1.3;
    font-weight: 850;
    letter-spacing: .2px;
  }
  .cta-section h2 {
    position: relative;
    z-index: 1;
    max-width: 650px;
    margin: 0 0 13px;
    color: #ffffff;
    font-size: clamp(30px,3.2vw,44px);
    line-height: 1.06;
    font-weight: 900;
    letter-spacing: -1.8px;
  }
  .cta-section p {
    position: relative;
    z-index: 1;
    max-width: 620px;
    margin: 0;
    color: #dceaff;
    font-size: 14px;
    line-height: 1.72;
    font-weight: 500;
  }
  .cta-section .button {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    min-height: 50px;
    padding: 13px 23px;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 850;
    box-shadow:
      0 10px 23px rgba(7,35,78,.16);
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }
  .cta-section .button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 14px 29px rgba(7,35,78,.22);
  }

  /* =========================================================
     PÁGINAS INTERNAS
  ========================================================= */

    .page-container {
    width: min(1240px, calc(100% - 40px));

    margin: 0 auto;

    padding: 78px 0 108px;
  }

  .page-header {
    margin-bottom: 42px;

    position: relative;
  }

  .page-header h1 {
    margin: 0 0 12px;

    color: #172f54;

    font-size: clamp(36px,4vw,54px);

    line-height: 1.08;

    font-weight: 850;

    letter-spacing: -2px;
  }

  .page-header p {
    max-width: 700px;

    margin: 0;

    color: #748399;

    font-size: 15px;

    line-height: 1.72;

    font-weight: 500;
  }

  /* =========================================================
     FILTROS
  ========================================================= */

    .filters-bar {
    display: flex;
    align-items: center;

    gap: 16px;

    margin-bottom: 30px;
  }

  .category-scroll {
    display: flex;
    align-items: center;

    gap: 10px;

    overflow-x: auto;

    padding: 4px 3px 9px;

    scrollbar-width: thin;
    scrollbar-color: #c6d6e8 transparent;

    scroll-behavior: smooth;
  }

  .category-scroll::-webkit-scrollbar {
    height: 5px;
  }

  .category-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .category-scroll::-webkit-scrollbar-thumb {
    background: #c6d6e8;

    border-radius: 999px;
  }

  .filter {
    white-space: nowrap;

    border: 1px solid #d4e1ed;

    background:
      linear-gradient(
        135deg,
        #ffffff 0%,
        #f7faff 100%
      );

    color: #61738a;

    border-radius: 999px;

    padding: 10px 16px;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;

    box-shadow:
      0 3px 8px rgba(30,55,90,.025);

    transition:
      transform .18s ease,
      border-color .18s ease,
      color .18s ease,
      background .18s ease,
      box-shadow .18s ease;
  }

  .filter:hover {
    border-color: #bcd1e8;

    color: #2163bc;

    background:
      linear-gradient(
        135deg,
        #ffffff 0%,
        #f2f7fd 100%
      );

    transform: translateY(-1px);

    box-shadow:
      0 5px 12px rgba(30,55,90,.055);
  }

  .filter.active {
    background:
      linear-gradient(
        135deg,
        #185cc2 0%,
        #2674dc 100%
      );

    color: #ffffff;

    border-color: #185cc2;

    box-shadow:
      0 8px 18px rgba(24,92,194,.19);
  }

  .filter.active:hover {
    color: #ffffff;

    border-color: #185cc2;

    transform: translateY(-1px);

    box-shadow:
      0 10px 21px rgba(24,92,194,.22);
  }

  .results-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    margin-bottom: 21px;

    color: #52627a;

    font-size: 13px;

    font-weight: 650;
  }

  .clear-button,
  .back-button {
    border: 0;

    background: transparent;

    color: #2164c0;

    padding: 7px 6px;

    font-size: 12px;

    font-weight: 800;

    border-radius: 8px;

    transition:
      color .18s ease,
      background .18s ease,
      transform .18s ease;
  }

  .clear-button:hover {
    color: #174b96;

    background: #f1f6fd;
  }

  .back-button {
    display: inline-flex;

    align-items: center;

    gap: 7px;

    margin-bottom: 27px;

    font-size: 13px;
  }

  .back-button:hover {
    color: #174b96;

    background: #f1f6fd;

    transform: translateX(-2px);
  }

  /* =========================================================
     DETALLE DE SERVICIO
  ========================================================= */

    .service-detail {
    width: min(1240px, calc(100% - 40px));

    margin: 0 auto;

    padding: 60px 0 105px;
  }

  .service-detail-main {
    display: grid;

    grid-template-columns:
      minmax(0,1.55fr)
      minmax(300px,.75fr);

    gap: 32px;

    align-items: start;
  }

  .service-detail-content,
  .service-detail-main > article {
    min-width: 0;
  }

  .detail-card,
  .detail-provider,
  .professional-profile-box,
  .hire-card {
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d7e3ee;

    border-radius: 23px;

    box-shadow:
      0 14px 32px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);

    transition:
      border-color .22s ease,
      box-shadow .22s ease;
  }

  .detail-card:hover,
  .detail-provider:hover,
  .professional-profile-box:hover,
  .hire-card:hover {
    border-color: #c9d9e9;

    box-shadow:
      0 18px 38px rgba(30,55,90,.075),
      0 5px 12px rgba(30,55,90,.03);
  }

  .detail-card {
    padding: 32px;
  }

  .detail-provider {
    padding: 23px;

    margin-top: 23px;
  }

  .professional-profile-box {
    padding: 25px;

    margin-top: 23px;
  }

  .detail-provider-head {
    display: flex;

    align-items: center;

    gap: 15px;
  }

  .detail-provider-info {
    min-width: 0;
  }

  .detail-provider-info strong {
    display: block;

    color: #1b365b;

    font-size: 16px;

    font-weight: 800;

    line-height: 1.35;
  }

  .detail-provider-info span {
    display: block;

    margin-top: 5px;

    color: #78879a;

    font-size: 12px;

    line-height: 1.4;
  }

  .profile-skills {
    display: flex;

    flex-wrap: wrap;

    gap: 8px;

    margin-top: 19px;
  }

  .detail-description {
    color: #68788f;

    font-size: 14px;

    line-height: 1.85;
  }

  .expect-list {
    display: grid;

    gap: 12px;

    margin: 21px 0 0;

    padding: 0;

    list-style: none;
  }

  .expect-list li {
    display: flex;

    align-items: flex-start;

    gap: 11px;

    color: #5f7189;

    font-size: 13px;

    line-height: 1.6;
  }

  .expect-list li::before {
    content: "✓";

    flex: 0 0 auto;

    width: 20px;
    height: 20px;

    display: grid;
    place-items: center;

    margin-top: 1px;

    border-radius: 50%;

    background: #eef5ff;

    border: 1px solid #d5e4f5;

    color: #2166d1;

    font-size: 10px;

    font-weight: 900;
  }

  .hire-card {
    padding: 27px;

    position: sticky;

    top: 100px;
  }

  .hire-card h3 {
    margin: 0 0 9px;

    color: #17345d;

    font-size: 20px;

    line-height: 1.3;

    font-weight: 850;
  }

  .hire-card .price {
    color: #1859b5;

    font-size: 28px;

    font-weight: 900;

    line-height: 1.2;

    margin-bottom: 21px;
  }

  .secure-note {
    margin-top: 16px;

    padding: 12px 13px;

    border-radius: 11px;

    background:
      linear-gradient(
        135deg,
        #f4f8fd 0%,
        #edf4fb 100%
      );

    border: 1px solid #dce7f2;

    color: #718096;

    font-size: 11px;

    line-height: 1.55;
  }

  .form-note {
    color: #8491a3;

    font-size: 11px;

    line-height: 1.55;

    margin-top: 9px;
  }

  /* =========================================================
     FORMULARIOS
  ========================================================= */

    .form-group {
    display: grid;

    gap: 8px;

    margin-bottom: 17px;
  }

  .form-group label,
  .form-label {
    color: #334a68;

    font-size: 12px;

    font-weight: 800;

    line-height: 1.35;
  }

  .form-group input,
  .form-group textarea,
  .form-group select,
  .profile-form input,
  .profile-form textarea,
  .profile-form select,
  .offer-form input,
  .offer-form textarea,
  .offer-form select {
    width: 100%;

    border: 1px solid #d3dfeb;

    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #fbfdff 100%
      );

    color: #243852;

    border-radius: 12px;

    padding: 13px 14px;

    outline: none;

    font-size: 13px;

    line-height: 1.45;

    box-shadow:
      0 3px 8px rgba(30,55,90,.025);

    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .form-group input:hover,
  .form-group textarea:hover,
  .form-group select:hover,
  .profile-form input:hover,
  .profile-form textarea:hover,
  .profile-form select:hover,
  .offer-form input:hover,
  .offer-form textarea:hover,
  .offer-form select:hover {
    border-color: #c1d2e4;
  }

  .form-group textarea,
  .profile-form textarea,
  .offer-form textarea {
    min-height: 120px;

    resize: vertical;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus,
  .profile-form input:focus,
  .profile-form textarea:focus,
  .profile-form select:focus,
  .offer-form input:focus,
  .offer-form textarea:focus,
  .offer-form select:focus {
    border-color: #8eafe0;

    background: #ffffff;

    box-shadow:
      0 0 0 4px rgba(33,102,209,.07),
      0 6px 15px rgba(30,55,90,.04);
  }

  /* =========================================================
     CUENTA / PERFIL
  ========================================================= */

    .account-page {
    width: min(1100px, calc(100% - 40px));

    margin: 0 auto;

    padding: 60px 0 105px;
  }

  .account-card {
    overflow: hidden;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d7e3ee;

    border-radius: 25px;

    box-shadow:
      0 20px 46px rgba(30,55,90,.075),
      0 4px 11px rgba(30,55,90,.025);
  }

  .account-cover {
    height: 195px;

    position: relative;

    background:
      radial-gradient(
        circle at 80% 25%,
        rgba(101,171,255,.30),
        transparent 31%
      ),
      radial-gradient(
        circle at 12% 100%,
        rgba(74,133,218,.17),
        transparent 35%
      ),
      linear-gradient(
        135deg,
        #12366f 0%,
        #1e5fbe 55%,
        #2e7be8 100%
      );
  }

  .account-main {
    padding: 0 32px 35px;
  }

  .account-profile-head {
    display: flex;

    align-items: flex-end;

    gap: 19px;

    margin-top: -44px;

    margin-bottom: 30px;

    position: relative;

    z-index: 2;
  }

  .profile-avatar {
    width: 90px;
    height: 90px;

    display: grid;
    place-items: center;

    flex: 0 0 90px;

    border-radius: 25px;

    border: 5px solid #ffffff;

    background:
      linear-gradient(
        145deg,
        #12366f 0%,
        #2e7be8 100%
      );

    color: #ffffff;

    font-size: 25px;

    font-weight: 900;

    box-shadow:
      0 14px 28px rgba(25,76,150,.21);
  }

  .profile-head-info {
    min-width: 0;

    padding-bottom: 4px;
  }

  .profile-head-info h1 {
    margin: 0;

    color: #17345d;

    font-size: 28px;

    line-height: 1.2;

    font-weight: 850;

    letter-spacing: -.7px;
  }

  .profile-tagline {
    color: #718096;

    font-size: 13px;

    line-height: 1.45;

    margin-top: 6px;
  }

  .profile-form {
    display: grid;

    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap: 18px;
  }

  .profile-form .full {
    grid-column: 1 / -1;
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

    .dashboard-grid {
    display: grid;

    grid-template-columns:
      repeat(4,minmax(0,1fr));

    gap: 20px;

    margin-bottom: 30px;
  }

  .stat-card {
    position: relative;

    overflow: hidden;

    padding: 23px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 20px;

    box-shadow:
      0 12px 27px rgba(30,55,90,.055),
      0 3px 8px rgba(30,55,90,.025);

    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease;
  }

  .stat-card::after {
    content: "";

    position: absolute;

    width: 110px;
    height: 110px;

    right: -55px;
    top: -55px;

    border-radius: 50%;

    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.08) 0%,
        rgba(33,102,209,0) 70%
      );

    pointer-events: none;
  }

  .stat-card:hover {
    transform: translateY(-4px);

    border-color: #c3d6ea;

    box-shadow:
      0 18px 36px rgba(30,55,90,.085),
      0 5px 12px rgba(30,55,90,.03);
  }

  .stat-card span {
    display: block;

    position: relative;

    z-index: 1;

    color: #7d8da1;

    font-size: 11px;

    line-height: 1.35;

    font-weight: 750;
  }

  .stat-card strong {
    display: block;

    position: relative;

    z-index: 1;

    margin-top: 8px;

    color: #19375f;

    font-size: 29px;

    line-height: 1.15;

    font-weight: 900;

    letter-spacing: -.5px;
  }

  /* =========================================================
     SOLICITUDES
  ========================================================= */

    .requests-grid {
    display: grid;

    grid-template-columns:
      repeat(2,minmax(0,1fr));

    gap: 22px;
  }

  .request-card {
    position: relative;

    overflow: hidden;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 21px;

    padding: 23px;

    box-shadow:
      0 12px 28px rgba(30,55,90,.055),
      0 3px 8px rgba(30,55,90,.025);

    transition:
      transform .22s ease,
      box-shadow .22s ease,
      border-color .22s ease,
      background .22s ease;
  }

  .request-card::after {
    content: "";

    position: absolute;

    width: 125px;
    height: 125px;

    right: -63px;
    top: -63px;

    border-radius: 50%;

    background:
      radial-gradient(
        circle,
        rgba(33,102,209,.07) 0%,
        rgba(33,102,209,0) 70%
      );

    pointer-events: none;
  }

  .request-card:hover {
    transform: translateY(-5px);

    border-color: #c3d6ea;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );

    box-shadow:
      0 20px 40px rgba(30,55,90,.09),
      0 6px 14px rgba(30,55,90,.035);
  }

  .request-head {
    display: flex;

    justify-content: space-between;
    align-items: flex-start;

    gap: 16px;

    margin-bottom: 16px;

    position: relative;

    z-index: 1;
  }

  .request-label {
    display: block;

    color: #2b67b7;

    font-size: 10px;

    font-weight: 850;

    letter-spacing: 1px;

    line-height: 1.3;

    text-transform: uppercase;
  }

  .request-card h3 {
    margin: 8px 0 0;

    color: #1c385e;

    font-size: 16px;

    line-height: 1.35;

    font-weight: 800;
  }

  .status {
    display: inline-flex;

    align-items: center;
    justify-content: center;

    padding: 7px 11px;

    border-radius: 999px;

    background:
      linear-gradient(
        135deg,
        #f2f6fb 0%,
        #eaf1f8 100%
      );

    border: 1px solid #d7e3ee;

    color: #52708f;

    font-size: 10px;

    line-height: 1.2;

    font-weight: 800;

    white-space: nowrap;
  }

  .request-card p {
    position: relative;

    z-index: 1;

    color: #718096;

    font-size: 13px;

    line-height: 1.65;

    margin: 0;
  }

  .request-actions {
    display: flex;

    flex-wrap: wrap;

    gap: 9px;

    margin-top: 19px;

    position: relative;

    z-index: 1;
  }

  /* =========================================================
     MENSAJES
  ========================================================= */

    .messages-layout {
    display: grid;

    grid-template-columns:
      290px
      minmax(0,1fr);

    min-height: 600px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 22px;

    overflow: hidden;

    box-shadow:
      0 18px 40px rgba(30,55,90,.065),
      0 4px 10px rgba(30,55,90,.025);
  }

  .conversation-list {
    border-right: 1px solid #dfe7f0;

    background:
      linear-gradient(
        180deg,
        #f7faff 0%,
        #f2f6fb 100%
      );
  }

  .conversation-item {
    width: 100%;

    display: flex;

    align-items: center;

    gap: 11px;

    padding: 15px;

    border: 0;

    border-bottom: 1px solid #e3eaf2;

    background: transparent;

    color: #53667f;

    text-align: left;

    cursor: pointer;

    transition:
      background .18s ease,
      color .18s ease,
      transform .18s ease;
  }

  .conversation-item:hover {
    background: #edf4fd;

    color: #245da8;
  }

  .conversation-item.active {
    background:
      linear-gradient(
        90deg,
        #e7f1ff 0%,
        #eef5fd 100%
      );

    color: #1d5db4;

    box-shadow:
      inset 3px 0 0 #2468cc;
  }

  .chat-panel {
    min-width: 0;

    display: flex;

    flex-direction: column;

    background: #ffffff;
  }

  .chat-header {
    padding: 19px 21px;

    border-bottom: 1px solid #e1e9f1;

    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #fbfdff 100%
      );

    color: #1c385e;

    font-size: 14px;

    font-weight: 800;
  }

  .messages-list {
    flex: 1;

    padding: 24px;

    overflow-y: auto;

    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(33,102,209,.035),
        transparent 28%
      ),
      linear-gradient(
        180deg,
        #fbfcfe 0%,
        #f4f8fc 100%
      );
  }

  .message-bubble {
    max-width: min(72%, 520px);

    padding: 12px 15px;

    margin-bottom: 11px;

    border-radius: 16px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d9e4ef;

    color: #4e6078;

    font-size: 13px;

    line-height: 1.6;

    box-shadow:
      0 6px 15px rgba(30,55,90,.045);
  }

  .message-bubble.sent {
    margin-left: auto;

    background:
      linear-gradient(
        135deg,
        #185cc2 0%,
        #2674dc 100%
      );

    border-color: #185cc2;

    color: #ffffff;

    box-shadow:
      0 8px 17px rgba(24,92,194,.16);
  }

  .message-form {
    display: flex;

    gap: 10px;

    padding: 16px;

    border-top: 1px solid #e1e9f1;

    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #f9fbfe 100%
      );
  }

  .message-form input {
    flex: 1;

    min-width: 0;

    border: 1px solid #d3dfeb;

    background: #ffffff;

    color: #243852;

    border-radius: 12px;

    padding: 12px 14px;

    outline: none;

    font-size: 13px;

    transition:
      border-color .2s ease,
      box-shadow .2s ease;
  }

  .message-form input:focus {
    border-color: #8eafe0;

    box-shadow:
      0 0 0 4px rgba(33,102,209,.07);
  }

  /* =========================================================
     OFRECER SERVICIO
  ========================================================= */

    .offer-layout {
    display: grid;

    grid-template-columns:
      minmax(0,1.25fr)
      minmax(300px,.75fr);

    gap: 28px;

    align-items: start;
  }

  .offer-form {
    padding: 31px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 23px;

    box-shadow:
      0 16px 35px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);

    transition:
      border-color .22s ease,
      box-shadow .22s ease;
  }

  .offer-form:hover {
    border-color: #c9d9e9;

    box-shadow:
      0 20px 42px rgba(30,55,90,.075),
      0 5px 12px rgba(30,55,90,.03);
  }

  .preview-card {
    padding: 27px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 23px;

    position: sticky;

    top: 100px;

    box-shadow:
      0 16px 35px rgba(30,55,90,.06),
      0 3px 9px rgba(30,55,90,.025);

    transition:
      border-color .22s ease,
      box-shadow .22s ease,
      transform .22s ease;
  }

  .preview-card:hover {
    transform: translateY(-3px);

    border-color: #c9d9e9;

    box-shadow:
      0 21px 43px rgba(30,55,90,.08),
      0 5px 13px rgba(30,55,90,.03);
  }

  .preview-card h3 {
    margin: 0 0 19px;

    color: #18345b;

    font-size: 18px;

    line-height: 1.3;

    font-weight: 850;
  }

  /* =========================================================
     AUTENTICACIÓN
  ========================================================= */

    .auth-layout {
    min-height: calc(100vh - 76px);

    display: grid;

    grid-template-columns:
      minmax(0,1fr)
      minmax(380px,.75fr);

    background:
      linear-gradient(
        180deg,
        #f7faff 0%,
        #eef4fa 100%
      );
  }

  .auth-brand {
    display: flex;

    flex-direction: column;

    justify-content: center;

    padding:
      70px
      max(30px, calc((100vw - 1240px) / 2));

    position: relative;

    overflow: hidden;

    background:
      radial-gradient(
        circle at 80% 20%,
        rgba(101,171,255,.28),
        transparent 31%
      ),
      radial-gradient(
        circle at 12% 100%,
        rgba(74,133,218,.18),
        transparent 35%
      ),
      linear-gradient(
        135deg,
        #102f63 0%,
        #1855aa 55%,
        #2775df 100%
      );

    color: #ffffff;
  }

  .auth-brand::before {
    content: "";

    position: absolute;

    width: 390px;
    height: 390px;

    top: -190px;
    right: -145px;

    border-radius: 50%;

    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.10) 0%,
        rgba(255,255,255,0) 70%
      );

    pointer-events: none;
  }

  .auth-brand::after {
    content: "";

    position: absolute;

    width: 300px;
    height: 300px;

    left: -150px;
    bottom: -155px;

    border-radius: 50%;

    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.07) 0%,
        rgba(255,255,255,0) 70%
      );

    pointer-events: none;
  }

  .auth-brand h1 {
    max-width: 650px;

    margin: 0 0 18px;

    position: relative;

    z-index: 1;

    color: #ffffff;

    font-size: clamp(36px,5vw,62px);

    line-height: 1.02;

    letter-spacing: -2.5px;

    font-weight: 900;
  }

  .auth-brand p {
    max-width: 560px;

    margin: 0;

    position: relative;

    z-index: 1;

    color: #dceafd;

    font-size: 16px;

    line-height: 1.7;

    font-weight: 500;
  }

  .auth-form {
    width: min(460px, calc(100% - 50px));

    margin: auto;

    padding: 37px;

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f8fbff 100%
      );

    border: 1px solid #d6e2ee;

    border-radius: 24px;

    box-shadow:
      0 22px 50px rgba(30,55,90,.085),
      0 5px 13px rgba(30,55,90,.025);

    transition:
      border-color .22s ease,
      box-shadow .22s ease;
  }

  .auth-form:hover {
    border-color: #cbdbea;

    box-shadow:
      0 26px 56px rgba(30,55,90,.10),
      0 7px 16px rgba(30,55,90,.03);
  }

  .auth-form h2 {
    margin: 0 0 8px;

    color: #17345d;

    font-size: 27px;

    line-height: 1.25;

    font-weight: 850;

    letter-spacing: -.5px;
  }

  .auth-form > p {
    margin: 0 0 26px;

    color: #7b899c;

    font-size: 13px;

    line-height: 1.65;

    font-weight: 500;
  }

  .auth-tabs {
    display: grid;

    grid-template-columns:
      repeat(2,1fr);

    gap: 5px;

    padding: 4px;

    margin-bottom: 26px;

    border-radius: 12px;

    background:
      linear-gradient(
        135deg,
        #eef3f8 0%,
        #e8eff7 100%
      );

    border: 1px solid #e0e8f1;
  }

  .auth-tabs button {
    border: 0;

    padding: 11px;

    border-radius: 9px;

    background: transparent;

    color: #738196;

    font-size: 12px;

    font-weight: 800;

    transition:
      color .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      transform .18s ease;
  }

  .auth-tabs button:hover {
    color: #2a5f9f;

    background: rgba(255,255,255,.55);
  }

  .auth-tabs button.active {
    background: #ffffff;

    color: #185cc2;

    box-shadow:
      0 4px 11px rgba(30,55,90,.07);
  }

  /* =========================================================
     ESTADOS
  ========================================================= */

    .loading-state,
  .empty-state {
    width: 100%;
    padding: 68px 28px;
    text-align: center;
    border: 1px dashed #c9d8e8;
    border-radius: 20px;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f7faff 100%
      );
    color: #7b899c;
    box-shadow:
      0 10px 25px rgba(30,55,90,.035);
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }
  .loading-state strong,
  .empty-state strong {
    display: block;
    margin-bottom: 8px;
    color: #294565;
    font-size: 15px;
    line-height: 1.35;
    font-weight: 800;
  }
  .loading-state p,
  .empty-state p {
    max-width: 520px;
    margin: 0 auto;
    color: #7b899c;
    font-size: 13px;
    line-height: 1.65;
    font-weight: 500;
  }
  .loading-state:hover,
  .empty-state:hover {
    border-color: #b9cce1;
    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #f5f9ff 100%
      );
    box-shadow:
      0 15px 31px rgba(30,55,90,.055);
  }

  /* =========================================================
     FOOTER
  ========================================================= */

    .footer {
    width: 100%;
    padding:
      64px
      max(20px, calc((100% - 1240px) / 2))
      32px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 88% 12%,
        rgba(67,135,226,.16),
        transparent 28%
      ),
      radial-gradient(
        circle at 8% 100%,
        rgba(42,103,190,.12),
        transparent 30%
      ),
      linear-gradient(
        180deg,
        #10284c 0%,
        #0b203d 100%
      );
    color: #ffffff;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .footer::before {
    content: "";
    position: absolute;
    width: 360px;
    height: 360px;
    right: -170px;
    top: -190px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(255,255,255,.06) 0%,
        rgba(255,255,255,0) 70%
      );
    pointer-events: none;
  }
  .footer-grid {
    width: 100%;
    display: grid;
    grid-template-columns:
      1.4fr
      repeat(3,1fr);
    gap: 48px;
    padding-bottom: 39px;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(255,255,255,.11);
  }
  .footer h3,
  .footer h4 {
    margin: 0 0 15px;
    color: #ffffff;
    line-height: 1.3;
    font-weight: 800;
  }
  .footer h3 {
    font-size: 20px;
    letter-spacing: -.3px;
  }
  .footer h4 {
    font-size: 13px;
    letter-spacing: .1px;
  }
  .footer p,
  .footer span {
    color: #aebed3;
    font-size: 12px;
    line-height: 1.7;
  }
  .footer-links {
    display: grid;
    gap: 10px;
  }
  .footer-links button {
    width: fit-content;
    border: 0;
    padding: 2px 0;
    background: transparent;
    color: #aebed3;
    font-size: 12px;
    line-height: 1.4;
    text-align: left;
    cursor: pointer;
    transition:
      color .18s ease,
      transform .18s ease;
  }
  .footer-links button:hover {
    color: #ffffff;
    transform: translateX(3px);
  }
  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 27px;
    position: relative;
    z-index: 1;
  }
  .footer-bottom span {
    color: #8fa3bc;
    font-size: 11px;
  }

  /* =========================================================
     TABLET
  ========================================================= */

    @media (max-width: 1100px) {
    .hero {
      grid-template-columns:
        minmax(0,1fr)
        minmax(310px,.85fr);
      gap: 32px;
    }
    .category-grid {
      grid-template-columns:
        repeat(3,minmax(0,1fr));
      gap: 18px;
    }
    .services-grid,
    .large-grid,
    .professionals-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 18px;
    }
    .benefits-section {
      gap: 42px;
    }
    .steps-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 18px;
    }
  }

  /* =========================================================
     TABLET / HEADER
  ========================================================= */

    @media (max-width: 980px) {
    .header-inner {
      width: min(calc(100% - 28px),1240px);
      gap: 12px;
    }
    .brand-slogan {
      display: none;
    }
    .nav {
      gap: 3px !important;
    }
    .nav-link {
      padding: 9px 10px;
      font-size: 13px;
      border-radius: 9px;
    }
    .profile-mini-name {
      max-width: 90px;
    }
    .header-actions .button.ghost {
      padding-left: 11px;
      padding-right: 11px;
    }
    .hero {
      min-height: auto;
      padding-top: 65px;
      padding-bottom: 70px;
      gap: 30px;
    }
    .hero h1 {
      font-size: clamp(40px,6vw,58px);
    }
    .hero-visual {
      min-height: 390px;
    }
    .hero-orbit {
      width: 285px;
      height: 285px;
    }
    .hero-glow {
      width: 300px;
      height: 300px;
    }
    .floating-card {
      min-width: 185px;
    }
    .service-detail-main,
    .offer-layout {
      grid-template-columns: 1fr;
      gap: 22px;
    }
    .hire-card,
    .preview-card {
      position: static;
    }
    .dashboard-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 18px;
    }
    .auth-layout {
      grid-template-columns: 1fr;
    }
    .auth-brand {
      min-height: 360px;
      padding: 55px 30px;
    }
    .auth-form {
      margin: 34px auto;
      width: min(460px, calc(100% - 40px));
    }
  }

  /* =========================================================
     MÓVIL
  ========================================================= */

    @media (max-width: 700px) {
    .header {
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .header-inner {
      width: calc(100% - 16px);
      min-height: 58px;
      padding: 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 7px;
    }
    .brand {
      min-width: 0;
      flex: 0 1 auto;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      font-size: 20px;
    }
    .brand-name {
      font-size: 19px;
    }
    .brand-slogan {
      display: none;
    }
    .header-actions {
      gap: 5px;
      flex: 0 0 auto;
    }
    .profile-mini {
      padding: 3px;
      border-radius: 10px;
    }
    .profile-mini-name {
      display: none;
    }
    .header-actions .button.ghost {
      min-height: 36px;
      padding: 7px 10px;
      font-size: 12px;
    }
    .nav {
      order: 3;
      width: 100% !important;
      flex: 1 0 100%;
      display: flex !important;
      justify-content: flex-start;
      gap: 3px !important;
      overflow-x: auto !important;
      overflow-y: hidden;
      scrollbar-width: none;
      padding: 1px 0 2px;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .nav::-webkit-scrollbar {
      display: none;
    }
    .nav-link {
      flex: 1 0 auto;
      min-height: 38px;
      padding: 8px 11px;
      font-size: 12px;
      border-radius: 9px;
      white-space: nowrap;
    }
    .nav-link.active::after {
      left: 11px;
      right: 11px;
      bottom: 2px;
    }
    .nav-badge {
      min-width: 17px;
      height: 17px;
      margin-left: 4px;
      font-size: 9px;
    }
    .hero {
      min-height: auto;
      grid-template-columns: 1fr;
      gap: 35px;
      padding:
        55px 20px
        75px;
      text-align: center;
    }
    .hero-content {
      max-width: 100%;
    }
    .hero-badge {
      margin-bottom: 18px;
    }
    .hero h1 {
      max-width: 100%;
      font-size: clamp(38px,11vw,52px);
      letter-spacing: -2.5px;
    }
    .hero p {
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      font-size: 16px;
    }
    .hero-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }
    .hero-trust {
      justify-content: center;
      margin-top: 32px;
    }
    .hero-trust > div {
      min-width: 120px;
      padding: 0 14px;
    }
    .hero-visual {
      min-height: 355px;
      order: 2;
    }
    .hero-orbit {
      width: 260px;
      height: 260px;
    }
    .hero-glow {
      width: 270px;
      height: 270px;
    }
    .orbit-center {
      width: 90px;
      height: 90px;
      border-radius: 25px;
      font-size: 43px;
    }
    .floating-card {
      min-width: 170px;
      padding: 12px;
      gap: 9px;
    }
    .floating-icon {
      width: 38px;
      height: 38px;
      min-width: 38px;
      font-size: 18px;
    }
    .card-one {
      top: 18px;
      right: 0;
    }
    .card-two {
      bottom: 18px;
      left: 0;
    }
    .search-section {
      width: calc(100% - 24px);
      margin-top: -28px;
    }
    .search-box {
      min-height: 62px;
      padding: 7px 7px 7px 12px;
      border-radius: 15px;
      gap: 6px;
    }
    .search-icon {
      width: 23px;
      min-width: 23px;
      font-size: 21px;
    }
    .search-box input {
      min-width: 0;
      padding: 9px 6px;
      font-size: 13px;
    }
    .search-button {
      min-width: 88px;
      min-height: 46px;
      padding: 10px 13px;
      font-size: 12px;
    }
    .search-box.compact {
      width: 100%;
    }
    .section {
      width: calc(100% - 24px);
      padding: 65px 0;
    }
    .soft-section {
      padding-top: 65px;
      padding-bottom: 65px;
      padding-left: 12px;
      padding-right: 12px;
    }
    .section-heading {
      display: block;
      margin-bottom: 28px;
    }
    .section-heading h2,
    .benefits-content h2 {
      font-size: 29px;
      letter-spacing: -1px;
    }
    .section-heading p {
      font-size: 13px;
    }
    .text-button {
      display: inline-flex;
      margin-top: 12px;
    }
    .category-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 12px;
    }
    .category-card {
      min-height: 135px;
      padding: 16px;
      border-radius: 16px;
    }
    .category-big-icon {
      width: 45px;
      height: 45px;
      margin-bottom: 13px;
      font-size: 22px;
    }
    .services-grid,
    .large-grid,
    .professionals-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .service-card {
      padding: 18px;
      border-radius: 17px;
    }
    .service-card-top {
      margin-bottom: 15px;
    }
    .service-card h3 {
      font-size: 17px;
    }
    .professional-card {
      padding: 20px;
      border-radius: 18px;
    }
    .steps-grid {
      grid-template-columns: 1fr;
      margin-top: 32px;
    }
    .how-section {
      padding: 70px 12px;
    }
    .benefits-section {
      width: calc(100% - 24px);
      grid-template-columns: 1fr;
      gap: 45px;
      padding: 70px 0;
    }
    .benefits-content > p {
      font-size: 13px;
    }
    .network-card {
      width: 320px;
      height: 320px;
    }
    .cta-section {
      width: calc(100% - 24px);
      margin-bottom: 55px;
      padding: 40px 25px;
      display: block;
      border-radius: 22px;
    }
    .cta-section .button {
      margin-top: 24px;
    }
    .page-container {
      width: calc(100% - 24px);
      padding: 50px 0 75px;
    }
    .page-header {
      margin-bottom: 28px;
    }
    .page-header h1 {
      font-size: 35px;
      letter-spacing: -1.5px;
    }
    .filters-bar {
      margin-bottom: 20px;
      overflow: hidden;
    }
    .category-scroll {
      width: 100%;
    }
    .results-heading {
      align-items: flex-start;
    }
    .service-detail {
      width: calc(100% - 24px);
      padding: 35px 0 70px;
    }
    .service-detail-main {
      grid-template-columns: 1fr;
      gap: 18px;
    }
    .detail-card,
    .detail-provider,
    .professional-profile-box,
    .hire-card {
      border-radius: 18px;
    }
    .detail-card {
      padding: 22px;
    }
    .hire-card {
      padding: 20px;
    }
    .account-page {
      width: calc(100% - 24px);
      padding: 35px 0 70px;
    }
    .account-cover {
      height: 140px;
    }
    .account-main {
      padding-left: 18px;
      padding-right: 18px;
    }
    .account-profile-head {
      align-items: flex-start;
      flex-direction: column;
      margin-top: -38px;
    }
    .profile-avatar {
      width: 76px;
      height: 76px;
      font-size: 21px;
    }
    .profile-form {
      grid-template-columns: 1fr;
    }
    .profile-form .full {
      grid-column: auto;
    }
    .dashboard-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 12px;
    }
    .stat-card {
      padding: 17px;
    }
    .stat-card strong {
      font-size: 23px;
    }
    .requests-grid {
      grid-template-columns: 1fr;
    }
    .messages-layout {
      grid-template-columns: 1fr;
      min-height: 650px;
    }
    .conversation-list {
      display: flex;
      overflow-x: auto;
      border-right: 0;
      border-bottom: 1px solid #e4ebf2;
    }
    .conversation-item {
      min-width: 190px;
      border-bottom: 0;
    }
    .message-bubble {
      max-width: 86%;
    }
    .offer-layout {
      grid-template-columns: 1fr;
    }
    .offer-form,
    .preview-card {
      padding: 20px;
      border-radius: 18px;
    }
    .auth-layout {
      min-height: auto;
    }
    .auth-brand {
      min-height: 300px;
      padding: 50px 24px;
    }
    .auth-brand h1 {
      font-size: 40px;
    }
    .auth-form {
      width: calc(100% - 28px);
      margin: 25px auto 40px;
      padding: 24px;
      border-radius: 18px;
    }
    .footer {
      padding:
        45px 18px 25px;
    }
    .footer-grid {
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .footer-bottom {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  /* =========================================================
     TELÉFONOS PEQUEÑOS
  ========================================================= */

    @media (max-width: 420px) {
    .header-inner {
      width: calc(100% - 16px);
      gap: 6px;
    }
    .brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      font-size: 19px;
    }
    .brand-name {
      font-size: 18px;
    }
    .nav {
      gap: 2px !important;
      padding-bottom: 2px;
    }
    .nav-link {
      padding-left: 9px;
      padding-right: 9px;
      font-size: 11px;
    }
    .header-actions .button.ghost {
      padding-left: 8px;
      padding-right: 8px;
    }
    .nav-badge {
      min-width: 16px;
      height: 16px;
      margin-left: 3px;
      font-size: 8px;
    }
    .hero {
      padding-left: 16px;
      padding-right: 16px;
    }
    .hero h1 {
      font-size: 37px;
      letter-spacing: -2px;
    }
    .hero-buttons {
      flex-direction: column;
      width: 100%;
    }
    .hero-buttons .button {
      width: 100%;
    }
    .hero-trust {
      display: grid;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap: 15px;
      text-align: left;
    }
    .hero-trust > div {
      min-width: 0;
      padding: 0;
      border-right: 0;
    }
    .hero-visual {
      min-height: 300px;
    }
    .hero-orbit {
      width: 225px;
      height: 225px;
    }
    .hero-glow {
      width: 230px;
      height: 230px;
    }
    .orbit-center {
      width: 76px;
      height: 76px;
      font-size: 36px;
      border-radius: 21px;
    }
    .floating-card {
      min-width: 145px;
      padding: 10px;
      gap: 7px;
    }
    .floating-card strong {
      font-size: 11px;
    }
    .floating-card span:last-child {
      font-size: 9px;
    }
    .floating-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 10px;
      font-size: 15px;
    }
    .card-one {
      top: 7px;
      right: -5px;
    }
    .card-two {
      bottom: 7px;
      left: -5px;
    }
    .search-section {
      width: calc(100% - 20px);
    }
    .search-box {
      min-height: 58px;
      padding-left: 9px;
    }
    .search-button {
      min-width: 78px;
      padding-left: 10px;
      padding-right: 10px;
    }
    .section {
      width: calc(100% - 20px);
    }
    .soft-section {
      padding-left: 10px;
      padding-right: 10px;
    }
    .category-grid {
      gap: 9px;
    }
    .category-card {
      min-height: 125px;
      padding: 14px;
    }
    .category-card strong {
      font-size: 13px;
    }
    .category-card span:last-child {
      font-size: 10px;
    }
    .service-card {
      padding: 18px;
      border-radius: 17px;
    }
    .service-detail {
      width: calc(100% - 20px);
    }
    .service-detail-main {
      gap: 15px;
    }
    .detail-card {
      padding: 18px;
    }
    .hire-card {
      padding: 18px;
    }
    .cta-section {
      width: calc(100% - 20px);
      padding: 30px 20px;
    }
    .page-container,
    .account-page {
      width: calc(100% - 20px);
    }
    .account-cover {
      height: 125px;
    }
    .account-main {
      padding-left: 16px;
      padding-right: 16px;
    }
    .profile-avatar {
      width: 72px;
      height: 72px;
      font-size: 20px;
    }
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
    .network-card {
      width: 290px;
      height: 290px;
    }
    .network-center {
      width: 78px;
      height: 78px;
      font-size: 36px;
    }
    .network-person {
      width: 45px;
      height: 45px;
      border-radius: 14px;
      font-size: 20px;
    }
    .p1 {
      left: 32px;
      top: 38px;
    }
    .p2 {
      right: 32px;
      top: 42px;
    }
    .p3 {
      left: 30px;
      bottom: 38px;
    }
    .p4 {
      right: 30px;
      bottom: 35px;
    }
    .network-line {
      width: 120px;
    }
    .footer {
      padding-left: 16px;
      padding-right: 16px;
    }
    .footer-grid {
      grid-template-columns: 1fr;
    }
  }
`}</style>

      {Header()}

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
