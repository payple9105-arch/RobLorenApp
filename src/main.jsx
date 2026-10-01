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

.professional-card .button.outline {
  width: 100%;
  min-height: 46px;
  margin-top: auto;
  padding: 11px 18px;
  border-radius: 11px;
  background: #ffffff;
  color: #1755b4;
  border: 1px solid #c3d3e8;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.05px;
  box-shadow:
    0 5px 14px rgba(33, 102, 209, 0.06);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.professional-card .button.outline:hover {
  transform: translateY(-2px);
  background: #f4f8fe;
  border-color: #a6c1e5;
  box-shadow:
    0 10px 22px rgba(33, 102, 209, 0.12);
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

  background:
    linear-gradient(
      135deg,
      #e0ecff 0%,
      #bdd3f5 100%
    );

  color: #174c9d;
  font-weight: 850;

  border: 3px solid #ffffff;

  box-shadow:
    0 6px 16px rgba(32, 65, 110, 0.09);
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
    0 8px 18px rgba(33, 102, 209, 0.17),
    0 2px 6px rgba(33, 66, 110, 0.055);
}

        .hero {
  min-height: 600px;
  width: 100%;

  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);

  gap: 55px;

  align-items: center;

  padding:
    72px
    max(20px, calc((100% - 1240px) / 2));

  background:
    radial-gradient(
      circle at 82% 18%,
      rgba(76, 138, 235, 0.18),
      transparent 30%
    ),
    radial-gradient(
      circle at 15% 85%,
      rgba(33, 102, 209, 0.08),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #fbfdff 0%,
      #f3f7fc 55%,
      #edf4fb 100%
    );

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

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.9);

  color: #2761b2;

  font-size: 12px;
  font-weight: 800;

  border: 1px solid #dce7f6;

  box-shadow:
    0 8px 20px rgba(31, 67, 112, 0.05);

  margin-bottom: 22px;

  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.hero-badge span {
  color: #2a70df;
}

.hero h1 {
  max-width: 700px;

  font-size: clamp(42px, 5.5vw, 70px);

  line-height: 0.99;

  letter-spacing: -3.5px;

  margin: 0 0 25px;

  color: #12264a;

  font-weight: 850;
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

  letter-spacing: -0.1px;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.hero-buttons .button:hover {
  transform: translateY(-2px);
}

.hero-buttons .button.primary {
  box-shadow:
    0 10px 24px rgba(33, 102, 209, 0.18);
}

.hero-buttons .button.primary:hover {
  box-shadow:
    0 14px 30px rgba(33, 102, 209, 0.24);
}

.hero-buttons .button.light {
  border: 1px solid #dbe4ef;

  box-shadow:
    0 6px 18px rgba(20, 43, 77, 0.06);
}

.hero-trust {
  display: flex;

  align-items: stretch;

  flex-wrap: wrap;

  gap: 0;

  margin-top: 42px;

  padding-top: 22px;

  border-top: 1px solid #dce5f1;
}

.hero-trust > div {
  display: flex;

  flex-direction: column;

  gap: 4px;

  min-width: 150px;

  padding: 0 24px;

  border-right: 1px solid #e2e8f1;
}

.hero-trust > div:first-child {
  padding-left: 0;
}

.hero-trust > div:last-child {
  border-right: 0;
}

.hero-trust strong {
  font-size: 16px;

  line-height: 1.2;

  color: #203653;

  font-weight: 850;

  letter-spacing: -0.2px;
}

.hero-trust span {
  color: #8a97a9;

  font-size: 12px;

  line-height: 1.3;

  font-weight: 600;
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

  background:
    rgba(41, 111, 218, 0.12);

  filter: blur(12px);
}

.hero-orbit {
  width: 320px;
  height: 320px;

  border: 1px solid rgba(39, 101, 188, 0.20);

  border-radius: 50%;

  display: grid;

  place-items: center;

  position: relative;

  background:
    radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(241, 247, 255, 0.78) 48%,
      rgba(225, 237, 251, 0.38) 100%
    );

  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7) inset,
    0 0 0 42px rgba(42, 111, 215, 0.035),
    0 0 0 84px rgba(42, 111, 215, 0.022),
    0 25px 55px rgba(32, 67, 112, 0.11);
}

.orbit-center {
  width: 112px;
  height: 112px;

  display: grid;

  place-items: center;

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

  letter-spacing: -2px;

  box-shadow:
    0 18px 35px rgba(26, 76, 153, 0.24),
    0 8px 18px rgba(33, 102, 209, 0.14),
    0 0 0 8px rgba(255, 255, 255, 0.42);

  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.14);

  z-index: 2;
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
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 251, 255, 0.96) 100%
    );

  border: 1px solid rgba(211, 225, 241, 0.95);

  box-shadow:
    0 20px 42px rgba(35, 68, 110, 0.11),
    0 6px 16px rgba(35, 68, 110, 0.045);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  z-index: 2;

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.floating-card:hover {
  transform: translateY(-5px);

  border-color: #cbdced;

  box-shadow:
    0 26px 52px rgba(35, 68, 110, 0.14),
    0 8px 20px rgba(35, 68, 110, 0.06);
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

  letter-spacing: -0.15px;
}

.floating-card span:last-child {
  color: #7b899b;

  font-size: 11px;

  line-height: 1.3;

  margin-top: 5px;

  font-weight: 600;

  letter-spacing: 0.05px;
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

  border: 1px solid #dce8f7;

  font-size: 21px;

  box-shadow:
    0 7px 16px rgba(33, 102, 209, 0.08),
    0 1px 3px rgba(33, 66, 110, 0.05);
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
   BUSCADOR PRINCIPAL
========================================================= */

.search-section {
  width: min(1050px, calc(100% - 40px));

  margin: -34px auto 0;

  position: relative;

  z-index: 5;
}

.search-box {
  display: flex;

  align-items: center;

  gap: 10px;

  min-height: 70px;

  padding: 8px 9px 8px 18px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.99) 0%,
      rgba(248, 251, 255, 0.98) 100%
    );

  border: 1px solid #d7e2ef;

  border-radius: 18px;

  box-shadow:
    0 22px 50px rgba(28, 59, 99, 0.12),
    0 5px 14px rgba(28, 59, 99, 0.045);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.search-box:focus-within {
  border-color: #94b6e3;

  box-shadow:
    0 24px 55px rgba(28, 59, 99, 0.14),
    0 0 0 4px rgba(33, 102, 209, 0.07);
}

.search-box.compact {
  width: 350px;

  min-height: 50px;

  box-shadow: none;
}

/* =========================================================
   ICONO
========================================================= */

.search-icon {
  width: 28px;
  min-width: 28px;

  display: grid;

  place-items: center;

  color: #6e819a;

  font-size: 25px;

  line-height: 1;

  font-weight: 500;

  transform: translateY(-1px);
}

/* =========================================================
   INPUT
========================================================= */

.search-box input {
  flex: 1;

  min-width: 0;

  border: 0;

  outline: 0;

  padding: 11px 13px;

  color: #263852;

  background: transparent;

  font-size: 15px;

  font-weight: 550;

  line-height: 1.4;
}

.search-box input::placeholder {
  color: #8a98aa;

  opacity: 1;
}

/* =========================================================
   BOTÓN BUSCAR
========================================================= */

.search-button {
  min-width: 112px;

  min-height: 50px;

  padding: 12px 20px;

  border-radius: 12px;

  font-size: 14px;

  font-weight: 800;

  letter-spacing: -0.1px;

  box-shadow:
    0 9px 20px rgba(33, 102, 209, 0.16);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.search-button:hover {
  transform: translateY(-2px);

  box-shadow:
    0 13px 25px rgba(33, 102, 209, 0.22);
}

        .section {
  width: min(1240px, calc(100% - 40px));

  margin: 0 auto;

  padding: 88px 0;
}

/* =========================================================
   SECCIONES SUAVES
========================================================= */

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

/* =========================================================
   ENCABEZADOS DE SECCIÓN
========================================================= */

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

/* =========================================================
   EYEBROW
========================================================= */

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

/* =========================================================
   TÍTULOS
========================================================= */

.section-heading h2,
.benefits-content h2 {
  margin: 0;

  color: #162f55;

  font-size: clamp(28px, 3vw, 40px);

  line-height: 1.12;

  font-weight: 800;

  letter-spacing: -1.25px;
}

.soft-section .section-heading h2 {
  color: #17345d;
}

/* =========================================================
   DESCRIPCIÓN
========================================================= */

.section-heading p {
  margin: 12px 0 0;

  max-width: 650px;

  color: #718096;

  font-size: 15px;

  line-height: 1.7;

  font-weight: 500;

  letter-spacing: -0.05px;
}

.category-section .section-heading p {
  max-width: 620px;

  color: #718096;

  font-size: 15px;

  line-height: 1.65;

  font-weight: 500;
}

/* =========================================================
   BOTÓN DE TEXTO
========================================================= */

.text-button {
  border: 0;

  background: transparent;

  color: #1758b6;

  font-size: 13px;

  font-weight: 800;

  line-height: 1.3;

  white-space: nowrap;

  padding: 7px 4px;

  border-radius: 7px;

  cursor: pointer;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.text-button:hover {
  color: #12448f;

  background: #f1f6fd;

  transform: translateX(2px);
}

/* =========================================================
   GRID DE CATEGORÍAS
========================================================= */

.category-grid {
  display: grid;

  grid-template-columns:
    repeat(5, minmax(0, 1fr));

  gap: 18px;
}

/* =========================================================
   TARJETA DE CATEGORÍA
========================================================= */

.category-card {
  min-height: 148px;

  padding: 20px;

  display: flex;

  flex-direction: column;

  justify-content: flex-start;

  border: 1px solid #d9e4ef;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f8fbff 100%
    );

  border-radius: 18px;

  text-align: left;

  box-shadow:
    0 10px 24px rgba(30, 55, 90, 0.05),
    0 2px 7px rgba(30, 55, 90, 0.022);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.category-card:hover {
  transform: translateY(-5px);

  border-color: #c5d8ed;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f6faff 100%
    );

  box-shadow:
    0 18px 36px rgba(27, 60, 102, 0.095),
    0 5px 12px rgba(27, 60, 102, 0.035);
}

/* =========================================================
   ICONO
========================================================= */

.category-big-icon {
  width: 50px;
  height: 50px;

  display: grid;

  place-items: center;

  margin-bottom: 17px;

  border-radius: 15px;

  background:
    linear-gradient(
      145deg,
      #f2f7ff 0%,
      #e5effc 100%
    );

  border: 1px solid #d8e5f4;

  font-size: 25px;

  line-height: 1;

  box-shadow:
    0 7px 16px rgba(33, 102, 209, 0.07);
}

/* =========================================================
   NOMBRE
========================================================= */

.category-card strong {
  display: block;

  color: #18345b;

  font-size: 14px;

  line-height: 1.3;

  font-weight: 850;

  letter-spacing: -0.15px;
}

/* =========================================================
   DESCRIPCIÓN
========================================================= */

.category-card span:last-child {
  display: block;

  margin-top: 7px;

  color: #71829a;

  font-size: 11px;

  line-height: 1.35;

  font-weight: 650;
}

        .services-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 24px;
}

.large-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 24px;
}

/* =========================================================
   TARJETA DE SERVICIO
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
      #f8fbff 100%
    );

  border: 1px solid #d8e3ee;

  border-radius: 20px;

  padding: 22px;

  cursor: pointer;

  box-shadow:
    0 12px 28px rgba(30, 55, 90, 0.055),
    0 3px 8px rgba(30, 55, 90, 0.025);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.service-card::before {
  content: "";

  position: absolute;

  width: 130px;
  height: 130px;

  top: -72px;
  right: -58px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(33, 102, 209, 0.07) 0%,
      rgba(33, 102, 209, 0) 70%
    );

  pointer-events: none;
}

.service-card:hover {
  transform: translateY(-6px);

  border-color: #c5d7eb;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f6faff 100%
    );

  box-shadow:
    0 22px 44px rgba(27, 60, 102, 0.105),
    0 7px 16px rgba(27, 60, 102, 0.04);
}

.service-card:hover .arrow {
  transform: translateX(3px);

  background: #eaf2fc;

  color: #1f5fb7;
}

/* =========================================================
   PARTE SUPERIOR
========================================================= */

.service-card-top {
  position: relative;

  z-index: 1;

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 10px;

  margin-bottom: 19px;
}
@media (max-width: 700px) {
  .service-card {
    padding: 18px;

    border-radius: 17px;
  }

  .service-card-top {
    margin-bottom: 15px;
  }
}

/* =========================================================
   CATEGORÍA
========================================================= */

.category-pill {
  display: inline-flex;

  align-items: center;

  gap: 6px;

  padding: 7px 11px;

  border-radius: 999px;

  background:
    linear-gradient(
      135deg,
      #f3f7ff 0%,
      #e8f1fc 100%
    );

  border: 1px solid #d3e1f0;

  color: #245da8;

  font-size: 10px;

  line-height: 1;

  font-weight: 800;

  letter-spacing: 0.15px;

  box-shadow:
    0 4px 10px rgba(33, 102, 209, 0.05);
}

/* =========================================================
   PRECIO
========================================================= */

.service-price {
  color: #17488f;

  font-size: 21px;

  line-height: 1.2;

  font-weight: 850;

  letter-spacing: -0.35px;

  white-space: nowrap;
}

/* =========================================================
   ICONO DEL SERVICIO
========================================================= */

.service-icon {
  width: 58px;
  height: 58px;

  display: grid;

  place-items: center;

  border-radius: 17px;

  background:
    linear-gradient(
      145deg,
      #f5f9ff 0%,
      #e8f1fc 100%
    );

  border: 1px solid #d4e2f1;

  font-size: 27px;

  margin-bottom: 18px;

  box-shadow:
    0 9px 20px rgba(33, 102, 209, 0.075),
    0 2px 6px rgba(33, 66, 110, 0.03);
}

/* =========================================================
   TÍTULO
========================================================= */

.service-card h3 {
  margin: 0 0 10px;

  color: #17345d;

  font-size: 18px;

  line-height: 1.3;

  font-weight: 800;

  letter-spacing: -0.3px;
}

/* =========================================================
   DESCRIPCIÓN
========================================================= */

.service-card > p {
  color: #68788f;

  font-size: 13.5px;

  line-height: 1.65;

  min-height: 63px;

  margin: 0 0 18px;

  font-weight: 500;

  letter-spacing: 0;
}

/* =========================================================
   VALORACIÓN
========================================================= */

.rating {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 7px;

  margin: 9px 0 0;
}

.stars {
  color: #e9a52b;

  letter-spacing: 1.5px;

  font-size: 13px;

  line-height: 1;

  font-weight: 700;
}

.rating span {
  color: #8794a5;

  font-size: 11px;

  line-height: 1.3;

  font-weight: 600;
}

.rating strong {
  color: #263b58;

  font-size: 12px;

  line-height: 1.3;

  font-weight: 750;
}

.review-count {
  color: #8b97a8;

  font-size: 11px;

  line-height: 1.3;

  font-weight: 600;
}

        .service-provider {
  display: flex;

  align-items: center;

  gap: 11px;

  border-top: 1px solid #e7edf4;

  padding-top: 16px;

  margin-top: auto;
}

.service-provider div {
  display: flex;

  flex-direction: column;

  min-width: 0;
}

.service-provider strong {
  color: #263b59;

  font-size: 12px;

  line-height: 1.35;

  font-weight: 750;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

.service-provider span:not(.avatar) {
  color: #7d8b9e;

  font-size: 10px;

  line-height: 1.35;

  margin-top: 3px;

  font-weight: 600;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

/* =========================================================
   FLECHA
========================================================= */

.arrow {
  margin-left: auto;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  flex: 0 0 auto;

  width: 30px;
  height: 30px;

  border-radius: 50%;

  color: #2667c8;

  background: #f1f6fd;

  border: 1px solid #dce8f5;

  font-size: 17px;

  line-height: 1;

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

        .professionals-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 24px;
}

/* =========================================================
   TARJETA DE PROFESIONAL
========================================================= */

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
      #f9fbfe 100%
    );

  border: 1px solid #dce6f0;

  border-radius: 20px;

  padding: 24px;

  box-shadow:
    0 10px 24px rgba(30, 55, 90, 0.05),
    0 2px 7px rgba(30, 55, 90, 0.022);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.professional-card::before {
  content: "";

  position: absolute;

  width: 130px;
  height: 130px;

  top: -72px;
  right: -58px;

  border-radius: 50%;

  background:
    radial-gradient(
      circle,
      rgba(33, 102, 209, 0.07) 0%,
      rgba(33, 102, 209, 0) 70%
    );

  pointer-events: none;
}

.professional-card:hover {
  transform: translateY(-5px);

  border-color: #c6d8ec;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f7faff 100%
    );

  box-shadow:
    0 20px 42px rgba(27, 60, 102, 0.105),
    0 6px 14px rgba(27, 60, 102, 0.035);
}

.professional-card:active {
  transform: translateY(-1px);
}

/* =========================================================
   CABECERA DEL PROFESIONAL
========================================================= */

.professional-head {
  display: flex;

  align-items: center;

  gap: 17px;

  margin-bottom: 21px;
}

.professional-info {
  min-width: 0;
}

.professional-info h3 {
  margin: 0 0 6px;

  color: #18345b;

  font-size: 18px;

  line-height: 1.25;

  font-weight: 850;

  letter-spacing: -0.3px;
}

.professional-role {
  display: block;

  margin-top: 5px;

  color: #65758a;

  font-size: 11.5px;

  line-height: 1.35;

  font-weight: 700;

  letter-spacing: 0.05px;
}

.professional-location {
  display: block;

  margin-top: 5px;

  color: #7d8b9d;

  font-size: 11px;

  line-height: 1.35;

  font-weight: 600;

  letter-spacing: 0.02px;
}

.professional-username {
  display: block;

  margin-top: 1px;

  color: #4f78ad;

  font-size: 11.5px;

  line-height: 1.3;

  font-weight: 700;

  letter-spacing: 0.05px;
}

/* =========================================================
   DESCRIPCIÓN
========================================================= */

.professional-card > p {
  margin: 0;

  color: #6f7f92;

  font-size: 13px;

  line-height: 1.68;

  min-height: 66px;

  font-weight: 500;

  letter-spacing: -0.05px;
}

        .skill-row {
  display: flex;

  align-items: center;

  gap: 8px;

  flex-wrap: wrap;

  margin: 18px 0 21px;
}

.skill-row span,
.profile-skills span {
  display: inline-flex;

  align-items: center;

  padding: 7px 11px;

  border-radius: 999px;

  background:
    linear-gradient(
      135deg,
      #f4f8fd 0%,
      #edf3fa 100%
    );

  border: 1px solid #d9e4ef;

  color: #52667f;

  font-size: 10px;

  line-height: 1;

  font-weight: 750;

  letter-spacing: 0.05px;

  box-shadow:
    0 3px 7px rgba(30, 55, 90, 0.028);

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.skill-row span:hover,
.profile-skills span:hover {
  background:
    linear-gradient(
      135deg,
      #eef5ff 0%,
      #e7f0fc 100%
    );

  border-color: #cbdced;

  transform: translateY(-1px);
}
        .how-section {
  padding: 96px 20px;

  background:
    linear-gradient(
      180deg,
      #f1f6fb 0%,
      #eaf1f8 100%
    );

  border-top: 1px solid #dfe8f2;

  border-bottom: 1px solid #dfe8f2;
}

/* =========================================================
   PASOS
========================================================= */

.steps-grid {
  width: min(1100px, 100%);

  margin: 50px auto 0;

  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 20px;
}

.step-card {
  position: relative;

  min-width: 0;

  padding: 27px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 251, 255, 0.94) 100%
    );

  border: 1px solid #d5e1ed;

  border-radius: 19px;

  box-shadow:
    0 11px 26px rgba(30, 55, 90, 0.055),
    0 3px 8px rgba(30, 55, 90, 0.022);

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.step-card:hover {
  transform: translateY(-5px);

  border-color: #c4d6ea;

  background:
    linear-gradient(
      145deg,
      #ffffff 0%,
      #f6faff 100%
    );

  box-shadow:
    0 20px 38px rgba(30, 70, 115, 0.095),
    0 5px 12px rgba(30, 55, 90, 0.035);
}

/* =========================================================
   NÚMERO
========================================================= */

.step-number {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-width: 36px;

  height: 36px;

  padding: 0 10px;

  margin-bottom: 28px;

  border-radius: 11px;

  background:
    linear-gradient(
      135deg,
      #e8f1ff 0%,
      #dceafb 100%
    );

  border: 1px solid #cbddef;

  color: #2464bd;

  font-weight: 850;

  font-size: 11px;

  line-height: 1;

  box-shadow:
    0 6px 14px rgba(36, 100, 189, 0.075);
}

/* =========================================================
   TÍTULO
========================================================= */

.step-card h3 {
  margin: 0 0 10px;

  color: #243b5b;

  font-size: 16px;

  line-height: 1.35;

  font-weight: 800;

  letter-spacing: -0.15px;
}

/* =========================================================
   DESCRIPCIÓN
========================================================= */

.step-card p {
  margin: 0;

  color: #7b899c;

  font-size: 12.5px;

  line-height: 1.65;

  font-weight: 500;
}

        .benefits-section {
  width: min(1240px, calc(100% - 40px));

  margin: 0 auto;

  padding: 100px 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);

  gap: 80px;

  align-items: center;
}

/* =========================================================
   CONTENIDO
========================================================= */

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

/* =========================================================
   LISTA DE BENEFICIOS
========================================================= */

.benefits-list {
  display: grid;

  gap: 18px;
}

.benefit-item {
  display: flex;

  align-items: flex-start;

  gap: 14px;
}

.benefit-item > span {
  width: 31px;
  height: 31px;

  flex: 0 0 31px;

  display: grid;

  place-items: center;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #eef5ff 0%,
      #e1edfc 100%
    );

  color: #2062c1;

  font-size: 13px;

  font-weight: 900;

  border: 1px solid #d5e4f6;

  box-shadow:
    0 6px 14px rgba(32, 98, 193, 0.075);
}

.benefit-item strong {
  color: #29405f;

  font-size: 14px;

  line-height: 1.4;

  font-weight: 750;
}

.benefit-item p {
  margin: 5px 0 0;

  color: #8793a4;

  font-size: 12px;

  line-height: 1.55;

  font-weight: 500;
}

/* =========================================================
   VISUAL
========================================================= */

.benefits-visual {
  display: grid;

  place-items: center;
}

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
      rgba(255, 255, 255, 0.95) 0%,
      rgba(239, 246, 253, 0.92) 45%,
      rgba(224, 237, 249, 0.95) 100%
    );

  border: 1px solid #d4e2ef;

  box-shadow:
    0 30px 64px rgba(31, 67, 112, 0.14),
    0 7px 18px rgba(31, 67, 112, 0.045);
}

/* =========================================================
   CENTRO ROBLOREN
========================================================= */

.network-center {
  position: absolute;

  left: 50%;
  top: 50%;

  transform:
    translate(-50%, -50%);

  width: 94px;
  height: 94px;

  display: grid;

  place-items: center;

  border-radius: 27px;

  background:
    linear-gradient(
      145deg,
      #12366f 0%,
      #1e5fbe 55%,
      #2e7be8 100%
    );

  color: #ffffff;

  font-size: 44px;

  font-weight: 900;

  border: 3px solid rgba(255, 255, 255, 0.88);

  box-shadow:
    0 22px 45px rgba(27, 72, 144, 0.25),
    0 7px 15px rgba(27, 72, 144, 0.08),
    0 0 0 10px rgba(255, 255, 255, 0.28);

  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.14);

  z-index: 3;
}

/* =========================================================
   PERSONAS
========================================================= */

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
      #f7faff 100%
    );

  border: 1px solid #d9e5f1;

  border-radius: 17px;

  font-size: 25px;

  box-shadow:
    0 12px 27px rgba(31, 67, 112, 0.12),
    0 3px 8px rgba(31, 67, 112, 0.035);

  z-index: 2;

  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.network-person:hover {
  transform: translateY(-3px);

  box-shadow:
    0 16px 32px rgba(31, 67, 112, 0.15),
    0 4px 10px rgba(31, 67, 112, 0.04);
}

/* =========================================================
   POSICIONES
========================================================= */

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

/* =========================================================
   CONEXIONES
========================================================= */

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
      #c2d6eb 0%,
      #a9c4e1 100%
    );

  opacity: 0.9;

  z-index: 1;
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
        .cta-section {
  width: min(1180px, calc(100% - 40px));

  margin: 0 auto 82px;

  padding: 60px 64px;

  position: relative;

  overflow: hidden;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 38px;

  border-radius: 28px;

  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(86, 157, 255, 0.24),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #12366f 0%,
      #1c5fbd 55%,
      #2674df 100%
    );

  color: #ffffff;

  border: 1px solid rgba(255, 255, 255, 0.14);

  box-shadow:
    0 28px 62px rgba(22, 69, 137, 0.23),
    0 7px 18px rgba(22, 69, 137, 0.08);
}

.cta-section::after {
  content: "";

  position: absolute;

  width: 260px;
  height: 260px;

  right: -105px;
  bottom: -145px;

  border-radius: 50%;

  background:
    rgba(255, 255, 255, 0.07);

  pointer-events: none;
}

.cta-section .eyebrow {
  position: relative;

  z-index: 1;

  color: #b9d7ff;

  font-weight: 800;
}

.cta-section h2 {
  position: relative;

  z-index: 1;

  margin: 0 0 11px;

  color: #ffffff;

  font-size: clamp(28px, 3vw, 41px);

  line-height: 1.1;

  font-weight: 850;

  letter-spacing: -1.5px;
}

.cta-section p {
  position: relative;

  z-index: 1;

  margin: 0;

  max-width: 620px;

  color: #d9e8fb;

  font-size: 14px;

  line-height: 1.65;

  font-weight: 500;
}

        .page-container {
  width: min(1240px, calc(100% - 40px));

  margin: 0 auto;

  padding: 72px 0 105px;
}

/* =========================================================
   ENCABEZADO DE PÁGINA
========================================================= */

.page-header {
  margin-bottom: 38px;
}

.page-header h1 {
  margin: 0 0 11px;

  color: #172f54;

  font-size: clamp(35px, 4vw, 53px);

  line-height: 1.1;

  font-weight: 850;

  letter-spacing: -1.9px;
}

.page-header p {
  max-width: 690px;

  margin: 0;

  color: #78869a;

  font-size: 15px;

  line-height: 1.7;

  font-weight: 500;
}

        .filters-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.category-scroll {
  display: flex;
  align-items: center;
  gap: 9px;
  overflow-x: auto;
  padding: 3px 2px 7px;

  scrollbar-width: thin;
  scrollbar-color: #c9d7e7 transparent;
}

.category-scroll::-webkit-scrollbar {
  height: 5px;
}

.category-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.category-scroll::-webkit-scrollbar-thumb {
  background: #c9d7e7;
  border-radius: 999px;
}

.filter {
  white-space: nowrap;

  border: 1px solid #d6e2ee;

  background:
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f7faff 100%
    );

  color: #62738a;

  border-radius: 999px;

  padding: 10px 15px;

  font-size: 11px;
  line-height: 1;
  font-weight: 800;

  cursor: pointer;

  box-shadow:
    0 4px 10px rgba(30, 65, 110, 0.035);

  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.filter:hover {
  border-color: #bfd3e9;
  color: #2163bc;
  transform: translateY(-1px);

  box-shadow:
    0 6px 13px rgba(30, 65, 110, 0.055);
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
    0 7px 16px rgba(24, 92, 194, 0.18);
}

/* =========================================================
   RESULTADOS
========================================================= */

.results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-bottom: 20px;

  color: #52627a;

  font-size: 13px;
  line-height: 1.4;
  font-weight: 650;
}

.clear-button {
  border: 0;

  background: transparent;

  color: #2164c0;

  padding: 6px 4px;

  font-size: 12px;
  font-weight: 800;

  cursor: pointer;

  border-radius: 7px;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.clear-button:hover {
  color: #174b96;

  background: #f1f6fd;

  transform: translateX(2px);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  border: 0;

  background: transparent;

  color: #2866bf;

  padding: 6px 4px;

  margin-bottom: 25px;

  font-size: 13px;
  line-height: 1.3;
  font-weight: 800;

  border-radius: 7px;

  cursor: pointer;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.back-button:hover {
  color: #174b96;

  background: #f1f6fd;

  transform: translateX(-2px);
}

        .benefits-section {
  width: min(1240px, calc(100% - 40px));

  margin: 0 auto;

  padding: 100px 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);

  gap: 80px;

  align-items: center;
}

/* =========================================================
   CONTENIDO
========================================================= */

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

/* =========================================================
   LISTA DE BENEFICIOS
========================================================= */

.benefits-list {
  display: grid;

  gap: 18px;
}

.benefit-item {
  display: flex;

  align-items: flex-start;

  gap: 14px;
}

.benefit-item > span {
  width: 31px;
  height: 31px;

  flex: 0 0 31px;

  display: grid;

  place-items: center;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #eef5ff 0%,
      #e1edfc 100%
    );

  color: #2062c1;

  font-size: 13px;

  font-weight: 900;

  border: 1px solid #d5e4f6;

  box-shadow:
    0 6px 14px rgba(32, 98, 193, 0.075);
}

.benefit-item strong {
  color: #29405f;

  font-size: 14px;

  line-height: 1.4;

  font-weight: 750;
}

.benefit-item p {
  margin: 5px 0 0;

  color: #8793a4;

  font-size: 12px;

  line-height: 1.55;

  font-weight: 500;
}

/* =========================================================
   VISUAL
========================================================= */

.benefits-visual {
  display: grid;

  place-items: center;
}

/* =========================================================
RESPONSIVE — TABLET
========================================================= */

@media (max-width: 980px) {
  .header-inner {
    width: min(calc(100% - 28px), 1240px);

    gap: 12px;
  }

  .brand-slogan {
    display: none;
  }

  .nav {
    gap: 2px !important;
  }

  .nav-link {
    padding: 9px 10px;

    font-size: 13px;
  }

  .profile-mini-name {
    max-width: 90px;
  }

  .header-actions .button.ghost {
    padding-left: 11px;
    padding-right: 11px;
  }
}

/* =========================================================
RESPONSIVE — MÓVIL
========================================================= */

@media (max-width: 700px) {
  .header {
    position: sticky;
    top: 0;
  }

  .services-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .header-inner {
    width: calc(100% - 16px);

    min-height: 58px;

    padding: 8px 0;

    display: flex;

    align-items: center;

    gap: 8px;
  }

  .brand {
    min-width: 0;
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
    width: 100% !important;

    justify-content: stretch;

    gap: 3px !important;

    overflow-x: auto !important;
    overflow-y: hidden;

    scrollbar-width: none;

    padding-bottom: 1px;
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
}

/* =========================================================
   RESPONSIVE — TELÉFONOS PEQUEÑOS
   RobLoren — ajuste visual
========================================================= */

@media (max-width: 420px) {

  /* ---------- HEADER ---------- */

  .header-inner {
    width: calc(100% - 16px);
    min-height: 64px;
    gap: 8px;
  }

  .brand {
    gap: 8px;
    min-width: 0;
  }

  .brand-mark {
    width: 36px;
    height: 36px;

    min-width: 36px;

    border-radius: 10px;

    font-size: 19px;
  }

  .brand-name {
    font-size: 18px;
    letter-spacing: -0.5px;
  }

  .nav {
    gap: 2px !important;
  }

  .nav-link {
    min-height: 36px;

    padding-left: 8px;
    padding-right: 8px;

    border-radius: 9px;

    font-size: 11px;
  }

  .nav-link.active::after {
    left: 9px;
    right: 9px;
  }

  .header-actions {
    gap: 5px;
  }

  .header-actions .button.ghost {
    padding-left: 8px;
    padding-right: 8px;
  }

  .nav-badge {
    min-width: 16px;
    height: 16px;

    margin-left: 3px;

    padding: 0 4px;

    font-size: 8px;
  }

  .avatar.small {
    width: 32px;
    height: 32px;
    min-width: 32px;

    border-radius: 9px;

    font-size: 11px;
  }

  /* ---------- HERO ---------- */

  .hero {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero h1 {
    font-size: clamp(32px, 10vw, 42px);
    letter-spacing: -1.8px;
  }

  .hero p {
    font-size: 14px;
    line-height: 1.6;
  }

  .hero-buttons {
    gap: 9px;
  }

  .hero-trust {
    gap: 10px;
  }

  /* ---------- BUSCADOR ---------- */

  .search-section {
    width: calc(100% - 20px);
  }

  .search-box {
    gap: 6px;
    padding: 5px;
    border-radius: 14px;
  }

  .search-box input {
    font-size: 13px;
  }

  .search-button {
    min-width: 44px;
    padding-left: 11px;
    padding-right: 11px;
  }

  /* ---------- SECCIONES ---------- */

  .section {
    width: calc(100% - 20px);
  }

  .section-heading h2,
  .benefits-content h2 {
    font-size: 25px;
  }

  /* ---------- CATEGORÍAS ---------- */

  .category-grid {
    gap: 10px;
  }

  .category-card {
    min-height: 125px;

    padding: 15px;

    border-radius: 15px;
  }

  /* ---------- SERVICIOS ---------- */

  .service-card {
    padding: 18px;
    border-radius: 17px;
  }

  /* ---------- DETALLE DEL SERVICIO ---------- */

  .service-detail-main {
    padding: 20px;
  }

  .service-detail-main > h1 {
    font-size: 28px;
  }

  .hire-card {
    padding: 18px;
  }

  /* ---------- CTA ---------- */

  .cta-section {
    width: calc(100% - 20px);

    padding: 30px 20px;

    border-radius: 17px;
  }

  /* ---------- PÁGINAS ---------- */

  .page-container,
  .account-page {
    width: calc(100% - 20px);
  }

  /* ---------- CUENTA ---------- */

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

  .account-profile-head h1 {
    font-size: 21px;
  }

  /* ---------- RED VISUAL ---------- */

  .network-card {
    width: 290px;
    height: 290px;

    max-width: 82vw;
    max-height: 82vw;
  }

  /* ---------- FOOTER ---------- */

  .footer {
    padding-left: 16px;
    padding-right: 16px;
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
