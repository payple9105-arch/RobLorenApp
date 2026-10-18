import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";
import "./index.css";
import StorePage from "./StorePage";
import ProductForm from "./ProductForm";
import PlansPage from "./PlansPage";
import CommissionsPage from "./CommissionsPage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage, { addToCart } from "./CartPage";

const PAYPAL_CLIENT_ID =
  "BAA_Ux_XQQKppjplmdc2V6jZZGOlSQATrlf2UKoc4Pi1lRIbKqtejqk2di8a9hRJ5e0xZFL46K_xfEYt-I";

function loadPayPal() {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (window.__roblorenPayPal) return window.__roblorenPayPal;

  window.__roblorenPayPal = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card,paylater`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("PayPal no cargó"));
    document.head.appendChild(script);
  });

  return window.__roblorenPayPal;
}

function money(value) {
  return (Math.round(Number(value || 0) * 100) / 100).toFixed(2);
}

function PayPalCheckout({ amount, description, onPaid }) {
  const host = useRef(null);
  const paid = useRef(onPaid);
  paid.current = onPaid;

  useEffect(() => {
    let alive = true;

    loadPayPal()
      .then((paypal) => {
        if (!alive || !host.current || !paypal) return;
        host.current.innerHTML = "";

        const order = {
          createOrder: (_data, actions) =>
            actions.order.create({
              purchase_units: [
                {
                  description,
                  amount: {
                    currency_code: "USD",
                    value: money(amount),
                  },
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            const details = await actions.order.capture();
            paid.current?.(details);
          },
          onError: () => {
            alert("No se pudo completar el pago. Inténtalo de nuevo.");
          },
        };

        const buttons = [
          paypal.Buttons({
            ...order,
            fundingSource: paypal.FUNDING.PAYPAL,
            style: { shape: "rect", color: "gold", label: "paypal" },
          }),
          paypal.Buttons({
            ...order,
            fundingSource: paypal.FUNDING.CARD,
            style: { shape: "rect", color: "black", label: "pay" },
          }),
        ];

        return Promise.all(
          buttons
            .filter((button) => button.isEligible())
            .map((button) => button.render(host.current))
        );
      })
      .catch(() => {
        if (host.current) {
          host.current.textContent = "No se pudo abrir PayPal en este momento.";
        }
      });

    return () => {
      alive = false;
    };
  }, [amount, description]);

  return <div className="paypal-slot" ref={host} />;
}

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


const media = (name) => `${import.meta.env.BASE_URL}media/${name}`;

const photoCategories = [
  { name: "Programación", icon: "</>", tone: "code", filter: "Tecnología" },
  { name: "Diseño gráfico", icon: "◐", tone: "design", filter: "Diseño" },
  { name: "Edición de video", icon: "▷", tone: "video", filter: "Video" },
  { name: "Traducción y redacción", icon: "A", tone: "write", filter: "Traducción" },
  { name: "Redes sociales", icon: "◉", tone: "social", filter: "Marketing" },
  { name: "Asistencia virtual", icon: "☺", tone: "assist", filter: "Otros" },
  { name: "Música y audio", icon: "♪", tone: "music", filter: "Música" },
  { name: "Otros servicios", icon: "▦", tone: "other", filter: "Otros" },
];

const photoServices = [
  { title: "Desarrollo de sitios web modernos y responsivos", cat: "Programación", seller: "CarlosMDev", rating: "5.0", reviews: 28, price: 50, image: "code.jpg", filter: "Tecnología" },
  { title: "Diseño de logotipos e identidad visual profesional", cat: "Diseño gráfico", seller: "YuleisyDiseña", rating: "5.0", reviews: 42, price: 30, image: "design.jpg", filter: "Diseño" },
  { title: "Edición de videos para redes sociales y YouTube", cat: "Edición de video", seller: "JavierEdita", rating: "5.0", reviews: 19, price: 25, image: "video.jpg", filter: "Video" },
  { title: "Traducción de textos (Inglés – Español)", cat: "Traducción y redacción", seller: "AnaTraduce", rating: "5.0", reviews: 16, price: 15, image: "translate.jpg", filter: "Traducción" },
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

const PROFILE_PHOTOS_KEY = "robloren-profile-photos";

function readProfilePhotos(userId) {
  if (!userId) return { avatar: "", cover: "" };

  try {
    const all = JSON.parse(
      localStorage.getItem(PROFILE_PHOTOS_KEY) || "{}"
    );
    return {
      avatar: all[userId]?.avatar || "",
      cover: all[userId]?.cover || "",
    };
  } catch {
    return { avatar: "", cover: "" };
  }
}

function writeProfilePhotos(userId, photos) {
  const all = JSON.parse(
    localStorage.getItem(PROFILE_PHOTOS_KEY) || "{}"
  );
  all[userId] = photos;
  localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(all));
}

function fileToImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("La imagen no es válida."));

      image.onload = () => {
        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

const SERVICE_MEDIA_KEY = "robloren-service-media";

function readServiceMedia(serviceId) {
  if (!serviceId) return { photos: [] };

  try {
    const all = JSON.parse(localStorage.getItem(SERVICE_MEDIA_KEY) || "{}");
    const item = all[serviceId] || {};
    return { photos: Array.isArray(item.photos) ? item.photos : [] };
  } catch {
    return { photos: [] };
  }
}

function writeServicePhotos(serviceId, photos) {
  const all = JSON.parse(localStorage.getItem(SERVICE_MEDIA_KEY) || "{}");
  all[serviceId] = { ...(all[serviceId] || {}), photos };
  localStorage.setItem(SERVICE_MEDIA_KEY, JSON.stringify(all));
}

function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(",");
  const mime = (head.match(/:(.*?);/) || [])[1] || "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

function openMediaDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("robloren-media", 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("videos")) {
        request.result.createObjectStore("videos");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveServiceVideo(serviceId, file) {
  const db = await openMediaDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").put(file, String(serviceId));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

async function loadServiceVideoUrl(serviceId) {
  try {
    const db = await openMediaDb();
    const file = await new Promise((resolve, reject) => {
      const tx = db.transaction("videos", "readonly");
      const request = tx.objectStore("videos").get(String(serviceId));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return file ? URL.createObjectURL(file) : "";
  } catch {
    return "";
  }
}

function servicePhoto(service) {
  if (!service) return "";
  if (service.image_url) return service.image_url;
  return readServiceMedia(service.id).photos[0] || "";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [hearts, setHearts] = useState({});

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState("Todas");

  const [loggedUser, setLoggedUser] = useState(null);
  const [accountMode, setAccountMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [oauthName, setOauthName] = useState("");

  const [authForm, setAuthForm] = useState(defaultAuthForm);
const [newPassword, setNewPassword] = useState("");
const [confirmNewPassword, setConfirmNewPassword] = useState("");

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
const [profileSettings, setProfileSettings] = useState(false);
const [sendingRequest, setSendingRequest] = useState(false);

  const [form, setForm] = useState(defaultForm);
  const [offerMedia, setOfferMedia] = useState([]);
  const [viewMedia, setViewMedia] = useState({ photos: [], video: "" });
  const [profileForm, setProfileForm] =
    useState(defaultProfileForm);
  const [profilePhotos, setProfilePhotos] = useState({
    avatar: "",
    cover: "",
  });

  const [offer, setOffer] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

    setProfilePhotos(readProfilePhotos(user.id));
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

  const confirmPayPalPayment = async (details) => {
    if (!loggedUser || !selectedService) {
      setRequestMessage(
        "Pago recibido en PayPal. Inicia sesión con el mismo correo para dejar la solicitud."
      );
      return;
    }

    const providerId =
      selectedService.provider_id || selectedService.user_id || null;
    const orderId = details?.id || "";

    try {
      const payload = {
        service_id: selectedService.id,
        client_id: loggedUser.id,
        provider_id: providerId,
        message: `Pago confirmado por PayPal ${orderId}. ${
          offer.trim() || "Me interesa contratar este servicio."
        }`,
        status: "pending",
      };
      const { error } = await supabase
        .from("service_requests")
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        setRequestMessage(
          "El pago ya entró en PayPal. La solicitud no se pudo guardar en la página."
        );
        return;
      }

      setOffer("");
      setRequestMessage(
        "Pago recibido correctamente. El profesional ya puede ver tu solicitud."
      );
    } catch {
      setRequestMessage("El pago ya entró en PayPal.");
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

  const pickProfilePhoto = async (kind, file) => {
    if (!loggedUser || !file) return;

    if (!file.type.startsWith("image/")) {
      alert("Elige una imagen.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("La imagen es muy grande. Usa una de menos de 8 MB.");
      return;
    }

    try {
      const dataUrl = await fileToImage(
        file,
        kind === "cover" ? 1400 : 512,
        kind === "cover" ? 480 : 512
      );
      const next = {
        ...readProfilePhotos(loggedUser.id),
        [kind]: dataUrl,
      };

      writeProfilePhotos(loggedUser.id, next);
      setProfilePhotos(next);

      const column = kind === "cover" ? "cover_url" : "avatar_url";
      supabase
        .from("profiles")
        .update({ [column]: dataUrl })
        .eq("id", loggedUser.id)
        .then(() => {});
    } catch (error) {
      alert(error?.message || "No se pudo usar esa imagen.");
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
            emailRedirectTo: window.location.origin,
          },
        });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        setAuthForm(defaultAuthForm);

        if (!data.session) {
          alert(
            "Cuenta creada. Revisa tu correo electrónico y haz clic en el enlace de confirmación para activar tu cuenta."
          );
          setPage("login");
        } else {
          await refreshUser(data.user);
          setPage("home");
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

   const requestPasswordReset = async () => {
    const email = authForm.email.trim();
    if (!email) {
      alert(
        "Escribe tu correo electrónico para recuperar tu contraseña."
      );
      return;
    }
    setAuthLoading(true);
    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        });
      if (error) {
        alert(
          "No se pudo enviar el correo: " + error.message
        );
        return;
      }
      setAccountMode("login");
      alert(
        "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam."
      );
    } catch (error) {
      alert(
        "Ocurrió un error: " +
          (error?.message || "Error desconocido")
      );
    } finally {
      setAuthLoading(false);
    }
  };
  const saveNewPassword = async () => {
    if (newPassword.length < 6) {
      alert(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        alert(
          "No se pudo actualizar la contraseña: " +
            error.message
        );
        return;
      }
      await supabase.auth.signOut();
      setNewPassword("");
      setConfirmNewPassword("");
      setAuthForm(defaultAuthForm);
      setAccountMode("login");
      setPage("account");
      alert(
        "¡Contraseña actualizada correctamente! Ya puedes iniciar sesión."
      );
    } catch (error) {
      alert(
        "Ocurrió un error al cambiar la contraseña: " +
          (error?.message || "Error desconocido")
      );
    } finally {
      setAuthLoading(false);
    }
  };
  const loginWithProvider = async (provider, label) => {
    setOauthName(label);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        },
      });
      if (error) {
        alert(
          "No se pudo iniciar sesión con " +
            label +
            ": " +
            error.message
        );
        setOauthName("");
        setAuthLoading(false);
      }
    } catch (error) {
      alert(
        "Ocurrió un error al conectar con " +
          label +
          ": " +
          (error?.message || "Error desconocido")
      );
      setOauthName("");
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();

    setLoggedUser(null);
    setProfilePhotos({ avatar: "", cover: "" });
    setProfileSettings(false);
    setRequests([]);
    setMessages([]);
    setSelectedContact(null);
    setPage("home");
  };

  const addOfferPhotos = async (fileList) => {
    const files = [...fileList].filter((file) => file.type.startsWith("image/"));
    const room = 4 - offerMedia.filter((item) => item.kind === "photo").length;

    if (room <= 0) {
      alert("Puedes subir hasta 4 fotos.");
      return;
    }

    const next = [];

    for (const file of files.slice(0, room)) {
      if (file.size > 12 * 1024 * 1024) {
        alert("Usa una foto de menos de 12 MB.");
        continue;
      }

      try {
        const dataUrl = await fileToImage(file, 1400, 1400);
        next.push({
          id: `${Date.now()}-${next.length}`,
          kind: "photo",
          name: file.name,
          preview: dataUrl,
          dataUrl,
        });
      } catch {
        alert("No se pudo usar una de las fotos.");
      }
    }

    if (next.length) {
      setOfferMedia((items) => [...items, ...next]);
    }
  };

  const addOfferVideo = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Elige un video.");
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      alert("El video es muy grande. Usa uno de menos de 40 MB.");
      return;
    }

    setOfferMedia((items) => {
      items
        .filter((item) => item.kind === "video" && item.preview)
        .forEach((item) => URL.revokeObjectURL(item.preview));

      return [
        ...items.filter((item) => item.kind !== "video"),
        {
          id: `video-${Date.now()}`,
          kind: "video",
          name: file.name,
          preview: URL.createObjectURL(file),
          file,
        },
      ];
    });
  };

  const removeOfferMedia = (id) => {
    setOfferMedia((items) => {
      const item = items.find((entry) => entry.id === id);
      if (item?.kind === "video" && item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return items.filter((entry) => entry.id !== id);
    });
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

      if (data?.id && offerMedia.length) {
        const photos = offerMedia
          .filter((item) => item.kind === "photo")
          .map((item) => item.dataUrl);
        const video = offerMedia.find((item) => item.kind === "video");

        try {
          if (photos.length) writeServicePhotos(data.id, photos);
        } catch {
          // El servicio ya quedó publicado.
        }

        if (video?.file) {
          try {
            await saveServiceVideo(data.id, video.file);
          } catch {
            // El servicio ya quedó publicado.
          }
        }

        try {
          const folder = `${loggedUser.id}/${data.id}`;
          const photoUrls = [];

          for (let index = 0; index < photos.length; index += 1) {
            const path = `${folder}/photo-${index}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("service-media")
              .upload(path, dataUrlToBlob(photos[index]), {
                upsert: true,
                contentType: "image/jpeg",
              });

            if (uploadError) throw uploadError;

            photoUrls.push(
              supabase.storage.from("service-media").getPublicUrl(path).data
                .publicUrl
            );
          }

          let videoUrl = "";

          if (video?.file) {
            const ext = (video.file.name.split(".").pop() || "mp4").toLowerCase();
            const path = `${folder}/video.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from("service-media")
              .upload(path, video.file, {
                upsert: true,
                contentType: video.file.type || "video/mp4",
              });

            if (uploadError) throw uploadError;

            videoUrl = supabase.storage
              .from("service-media")
              .getPublicUrl(path).data.publicUrl;
          }

          if (photoUrls[0] || videoUrl) {
            await supabase
              .from("services")
              .update({
                image_url: photoUrls[0] || null,
                video_url: videoUrl || null,
              })
              .eq("id", data.id);
          }
        } catch {
          // Si Supabase no tiene el almacén, las fotos siguen en este dispositivo.
        }
      }

      offerMedia.forEach((item) => {
        if (item.kind === "video" && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
      setOfferMedia([]);
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
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setAccountMode("reset");
          setPage("account");
          setNewPassword("");
          setConfirmNewPassword("");
        }
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

  useEffect(() => {
    let cancel = false;
    const serviceId = selectedService?.id;

    if (!serviceId) {
      setViewMedia({ photos: [], video: "" });
      return undefined;
    }

    const photos = [
      ...(selectedService.image_url ? [selectedService.image_url] : []),
      ...readServiceMedia(serviceId).photos,
    ].filter((url, index, list) => url && list.indexOf(url) === index);

    setViewMedia({
      photos,
      video: selectedService.video_url || "",
    });

    loadServiceVideoUrl(serviceId).then((url) => {
      if (!cancel && url) {
        setViewMedia((current) => ({
          ...current,
          video: current.video || url,
        }));
      }
    });

    return () => {
      cancel = true;
    };
  }, [selectedService]);
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
  const go = (next, anchor) => {
    setPage(next);
    setMenuOpen(false);
    window.setTimeout(() => {
      if (anchor) {
        document
          .getElementById(anchor)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 30);
  };

  const Header = () => (
    <header className="header">
      <div className="header-inner">
        <button className="brand" onClick={() => go("home")} aria-label="Ir al inicio">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">RobLoren</div>
            <div className="brand-slogan">Conecta talento con oportunidades</div>
          </div>
        </button>

        <nav className={menuOpen ? "nav open" : "nav"}>
          <button className={page === "home" ? "nav-link active" : "nav-link"} onClick={() => go("home")}>
            Inicio
          </button>
          <button className={page === "market" ? "nav-link active" : "nav-link"} onClick={() => go("market")}>
            Panel
          </button>
          <button className={page === "services" ? "nav-link active" : "nav-link"} onClick={() => go("services")}>
            Explorar servicios
          </button>
          <button className={page === "store" ? "nav-link active" : "nav-link"} onClick={() => go("store")}>
            Tienda
          </button>
          {loggedUser && (
            <button className={page === "publish-product" ? "nav-link active" : "nav-link"} onClick={() => go("publish-product")}>
              Publicar producto
            </button>
          )}
          {loggedUser && (
            <button className={page === "plans" ? "nav-link active" : "nav-link"} onClick={() => go("plans")}>
              Planes
            </button>
          )}
          {loggedUser && (
            <button className={page === "commissions" ? "nav-link active" : "nav-link"} onClick={() => go("commissions")}>
              Comisiones
            </button>
          )}
          <button className={page === "cart" ? "nav-link active" : "nav-link"} onClick={() => go("cart")}>
            Carrito
          </button>
          <button className="nav-link" onClick={() => go("home", "como")}>
            Cómo funciona
          </button>
          <button className="nav-link" onClick={() => go("home", "categorias")}>
            Categorías
          </button>
          <button className={page === "blog" ? "nav-link active" : "nav-link"} onClick={() => go("blog")}>
            Blog
          </button>
          {loggedUser && (
            <button className={page === "requests" ? "nav-link active" : "nav-link"} onClick={() => go("requests")}>
              Solicitudes
              {pendingRequests > 0 && <span className="nav-badge">{pendingRequests}</span>}
            </button>
          )}
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="Buscar" onClick={() => go("services")}>
            ⌕
          </button>
          {loggedUser ? (
            <>
              <button className="profile-mini" onClick={() => go("account")}>
                <span className="avatar small">{getInitials(loggedUser.full_name)}</span>
                <span className="profile-mini-name">{loggedUser.full_name}</span>
              </button>
              <button className="button ghost" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <button
                className="button ghost"
                onClick={() => {
                  setAccountMode("login");
                  go("account");
                }}
              >
                Iniciar sesión
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setAccountMode("register");
                  go("account");
                }}
              >
                Registrarse
              </button>
            </>
          )}
          <button
            className="menu-button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
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
        {servicePhoto(service) && (
          <img
            className="service-card-photo"
            src={servicePhoto(service)}
            alt=""
          />
        )}
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
      <section className="photo-hero">
        <div className="photo-hero-copy">
          <h1>
            Encuentra el <span>talento</span> que necesitas, o ofrece{" "}
            <span>tus habilidades</span> al mundo
          </h1>
          <p>
            RobLoren es una plataforma donde profesionales de todo tipo ofrecen
            sus servicios y clientes de todo el mundo los contratan. Tú pones el
            talento, nosotros conectamos.
          </p>
          <form
            className="photo-search"
            onSubmit={(event) => {
              event.preventDefault();
              setPage("services");
            }}
          >
            <span className="search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="¿Qué servicio necesitas?"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Categoría"
            >
              <option value="Todas">Todas las categorías</option>
              {categories.map(([, name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button className="button primary" type="submit">
              Buscar
            </button>
          </form>
          <button
            type="button"
            className="button light market-entry"
            onClick={() => go("market")}
          >
            Ver panel del mercado
          </button>
          <ul className="photo-trust">
            <li>Perfiles verificados y seguros</li>
            <li>Calificaciones reales de clientes</li>
            <li>Proceso rápido y sencillo</li>
            <li>Desde Cuba para el mundo</li>
          </ul>
        </div>
        <div className="photo-hero-media">
          <img src={media("hero.jpg")} alt="Profesional trabajando junto a la bandera de Cuba" />
          <p className="photo-script">
            Grandes proyectos comienzan con una buena <span>conexión</span>
          </p>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="section-heading">
          <h2>Categorías populares</h2>
          <button className="text-button" onClick={() => setPage("services")}>
            Ver todas →
          </button>
        </div>
        <div className="photo-cats">
          {photoCategories.map((item) => (
            <button
              key={item.name}
              className="photo-cat"
              onClick={() => {
                setCategory(item.filter);
                setPage("services");
              }}
            >
              <span className={`photo-cat-icon tone-${item.tone}`}>{item.icon}</span>
              <strong>{item.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Servicios destacados</h2>
          <button className="text-button" onClick={() => setPage("services")}>
            Ver todos →
          </button>
        </div>
        <div className="photo-cards">
          {photoServices.map((service) => (
            <article className="photo-card" key={service.seller}>
              <button
                className="photo-card-hit"
                onClick={() => {
                  setCategory(service.filter);
                  setSearch("");
                  setPage("services");
                }}
              >
                <img src={media(service.image)} alt="" />
                <span className="category-pill">{service.cat}</span>
                <h3>{service.title}</h3>
              </button>
              <button
                type="button"
                className={hearts[service.seller] ? "photo-heart on" : "photo-heart"}
                aria-label="Guardar"
                onClick={() =>
                  setHearts((current) => ({
                    ...current,
                    [service.seller]: !current[service.seller],
                  }))
                }
              >
                ♡
              </button>
              <div className="photo-card-meta">
                <span className="avatar">{service.seller.slice(0, 1)}</span>
                <div>
                  <strong>{service.seller}</strong>
                  <span>
                    ★ {service.rating} ({service.reviews})
                  </span>
                </div>
                <b>Desde ${service.price} USD</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="como">
        <div className="section-heading centered">
          <h2>¿Cómo funciona RobLoren?</h2>
          <p>Es muy fácil. En solo unos pasos estarás conectado con el talento que necesitas.</p>
        </div>
        <div className="steps-grid">
          {[
            ["1", "Regístrate", "Crea tu cuenta como cliente o como proveedor de servicios."],
            ["2", "Busca o publica", "Encuentra el servicio que necesitas o comparte lo que sabes hacer."],
            ["3", "Coordina", "Habla con la otra parte, acuerda detalles y precio."],
            ["4", "¡Listo!", "Completa el servicio y deja tu calificación."],
          ].map(([number, title, text]) => (
            <div className="step-card" key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="photo-cta">
        <img src={media("cta.jpg")} alt="" />
        <div>
          <h2>¿Listo para empezar?</h2>
          <p>
            Únete a miles de personas que ya están generando ingresos y encontrando
            el talento que necesitan en RobLoren.
          </p>
          <button
            className="button primary"
            onClick={() => {
              if (!loggedUser) {
                setAccountMode("register");
                setPage("account");
              } else {
                setPage("offer");
              }
            }}
          >
            Crear cuenta gratis →
          </button>
        </div>
        <p className="photo-script light">Tu talento también vale</p>
      </section>
    </main>
  );

  const ServicesPage = () => (
    <main className="page-container">
      <section className="page-header">
        <span className="eyebrow">
          SERVICIOS
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
          <div className="pro-profile">
            <article className="pro-profile-card">
              <div className="pro-profile-top">
                <label className="avatar profile-avatar pro-avatar">
                  {profilePhotos.avatar ? (
                    <img src={profilePhotos.avatar} alt="" />
                  ) : (
                    getInitials(loggedUser.full_name)
                  )}
                  <span className="avatar-photo-button">Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      pickProfilePhoto("avatar", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <div className="pro-profile-id">
                  <h1>{loggedUser.full_name}</h1>
                  <p>
                    {String(profileForm.skills || "")
                      .split(",")[0]
                      .trim() || "Profesional RobLoren"}
                  </p>
                  <p>ID: {loggedUser.username}</p>
                </div>
              </div>
            </article>

            <button
              type="button"
              className="profile-settings-button"
              onClick={() => setProfileSettings((open) => !open)}
            >
              {profileSettings ? "Ver perfil" : "Configuración del perfil"}
            </button>

            {profileSettings ? (
              <div className="profile-settings">
                <div className="section-heading small">
                  <div>
                    <span className="eyebrow">INFORMACIÓN PROFESIONAL</span>
                    <h2>Tus datos</h2>
                  </div>
                </div>

                <div className="settings-photos">
                  <label className="cover-photo-button">
                    {profilePhotos.avatar ? "Cambiar foto" : "Foto de perfil"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        pickProfilePhoto("avatar", event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <label className="cover-photo-button">
                    {profilePhotos.cover ? "Cambiar portada" : "Agregar portada"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        pickProfilePhoto("cover", event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {profilePhotos.cover && (
                  <img
                    className="settings-cover"
                    src={profilePhotos.cover}
                    alt=""
                  />
                )}

                <div className="form-grid">
                  <label>
                    Nombre completo
                    <input
                      value={profileForm.full_name}
                      onChange={(event) =>
                        updateProfileForm("full_name", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Nombre de usuario
                    <input
                      value={profileForm.username}
                      onChange={(event) =>
                        updateProfileForm("username", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Ubicación
                    <input
                      value={profileForm.location}
                      onChange={(event) =>
                        updateProfileForm("location", event.target.value)
                      }
                      placeholder="Ciudad / País"
                    />
                  </label>
                  <label>
                    Habilidades
                    <input
                      value={profileForm.skills}
                      onChange={(event) =>
                        updateProfileForm("skills", event.target.value)
                      }
                      placeholder="Ej. Diseño, React, Marketing"
                    />
                  </label>
                </div>
                <label>
                  Sobre ti
                  <textarea
                    value={profileForm.bio}
                    onChange={(event) =>
                      updateProfileForm("bio", event.target.value)
                    }
                    placeholder="Cuéntales a otros profesionales y clientes quién eres y qué haces."
                  />
                </label>
                <button
                  className="button primary"
                  onClick={saveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Guardando..." : "Guardar perfil"}
                </button>
              </div>
            ) : (
              <>
                <h2 className="pro-section-title">Categorías de servicio</h2>
                <div className="pro-categories">
                  {services.filter(
                    (service) =>
                      service.provider_id === loggedUser.id ||
                      service.user_id === loggedUser.id
                  ).length === 0 ? (
                    <button
                      type="button"
                      className="pro-category"
                      onClick={() => setPage("offer")}
                    >
                      <span className="pro-category-bar">Publicar</span>
                      <span className="pro-category-body">
                        Todavía no tienes servicios. Publica el primero.
                      </span>
                    </button>
                  ) : (
                    services
                      .filter(
                        (service) =>
                          service.provider_id === loggedUser.id ||
                          service.user_id === loggedUser.id
                      )
                      .map((service) => (
                        <button
                          type="button"
                          className="pro-category"
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            setRequestMessage("");
                            setPage("service");
                          }}
                        >
                          <span className="pro-category-bar">
                            <span>
                              {categories.find(
                                (item) => item[1] === service.category
                              )?.[0] || "✨"}
                            </span>
                            {service.category || "Servicio"}
                          </span>
                          <span className="pro-category-body">
                            {service.service_title ||
                              service.title ||
                              "Servicio profesional"}
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </>
            )}
          </div>
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
          {accountMode === "reset" ? (
            <>
              <h2>Crear nueva contraseña</h2>
              <p>
                Escribe tu nueva contraseña y confírmala
                para recuperar el acceso a tu cuenta.
              </p>
              <label>
                Nueva contraseña
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirmar nueva contraseña
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(event.target.value)
                  }
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
              </label>
              <button
                type="button"
                className="button primary full large"
                disabled={authLoading}
                onClick={saveNewPassword}
              >
                {authLoading
                  ? "Guardando..."
                  : "Guardar nueva contraseña"}
              </button>
              <button
                type="button"
                className="button full"
                disabled={authLoading}
                onClick={() => setAccountMode("login")}
              >
                Volver a iniciar sesión
              </button>
            </>
          ) : (
            <>
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

              {accountMode === "login" && (
                <button
                  type="button"
                  className="forgot-password"
                  onClick={requestPasswordReset}
                  disabled={authLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}

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

              <p className="social-or">o continúa con</p>
              <div className="social-logins">
                <button
                  type="button"
                  className="button social full large"
                  onClick={() => loginWithProvider("google", "Google")}
                  disabled={authLoading}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
                    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
                    <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.5l4-3.1z" />
                    <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z" />
                  </svg>
                  {authLoading && oauthName === "Google"
                    ? "Conectando con Google..."
                    : "Continuar con Google"}
                </button>
                <button
                  type="button"
                  className="button social full large"
                  onClick={() => loginWithProvider("facebook", "Facebook")}
                  disabled={authLoading}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#1877F2" d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8v2.2h3.3l-.5 3.5h-2.8V24C19.6 23 24 18.1 24 12.1z" />
                  </svg>
                  {authLoading && oauthName === "Facebook"
                    ? "Conectando con Facebook..."
                    : "Continuar con Facebook"}
                </button>
                <button
                  type="button"
                  className="button social full large"
                  onClick={() => loginWithProvider("apple", "Apple")}
                  disabled={authLoading}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M16.7 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.8-2.2c.6-1 1.1-2 1.4-3.1-3.7-1.4-3.8-5.2-2.8-6zM14.8 6.3c.6-.8 1-1.8.9-2.8-1 .1-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.7-1.4z" />
                  </svg>
                  {authLoading && oauthName === "Apple"
                    ? "Conectando con Apple..."
                    : "Continuar con Apple"}
                </button>
              </div>

             <p className="form-note">
                Al continuar aceptas utilizar
                RobLoren de manera responsable y
                profesional.
              </p>
                </>
              )}
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

    const providerPhotos = readProfilePhotos(providerId);

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

            {(viewMedia.photos.length > 0 || viewMedia.video) && (
              <div className="service-gallery">
                {viewMedia.photos.map((src) => (
                  <img key={src.slice(0, 80)} src={src} alt="" />
                ))}
                {viewMedia.video && (
                  <video src={viewMedia.video} controls playsInline />
                )}
              </div>
            )}

            <Rating
              rating={service.rating}
              reviews={service.reviews}
            />

            {providerPhotos.cover && (
              <div
                className="account-cover profile-public-cover"
                style={{
                  backgroundImage: `url(${providerPhotos.cover})`,
                }}
              />
            )}

            <div className="detail-provider">
              <div
                className={
                  providerPhotos.avatar
                    ? "avatar profile-avatar"
                    : "avatar large"
                }
              >
                {providerPhotos.avatar ? (
                  <img
                    src={providerPhotos.avatar}
                    alt=""
                  />
                ) : (
                  getInitials(
                    service.provider_name
                  )
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

            {!service.is_demo && !ownService && Number(service.price || 0) > 0 && (
              <div className="pay-box">
                <h3>Pagar en esta página</h3>
                <p className="secure-note">
                  Puedes pagar con PayPal o con tarjeta. El dinero entra en la misma cuenta.
                </p>
                <p>
                  Precio del servicio
                  <strong> ${money(service.price)}</strong>
                </p>
                <p>
                  Comisión del cliente, 1%
                  <strong> ${money(Number(service.price) * 0.01)}</strong>
                </p>
                <p className="pay-total">
                  Total a pagar
                  <strong> ${money(Number(service.price) * 1.01)}</strong>
                </p>
                <p className="secure-note">
                  El profesional también aporta 1%. De este trabajo recibe $
                  {money(Number(service.price) * 0.99)}.
                </p>
                {loggedUser ? (
                  <PayPalCheckout
                    amount={Number(service.price) * 1.01}
                    description={`${service.service_title || service.title || "Servicio RobLoren"} + comisión 1%`}
                    onPaid={confirmPayPalPayment}
                  />
                ) : (
                  <button
                    type="button"
                    className="button primary full"
                    onClick={() => {
                      setAccountMode("login");
                      setPage("account");
                    }}
                  >
                    Inicia sesión para pagar
                  </button>
                )}
              </div>
            )}
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
          Muestra tu trabajo con fotos y un video.
          El título, la categoría y el precio siguen igual.
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

          <div className="media-uploader">
            <div>
              <strong>Fotos y video</strong>
              <p>Hasta 4 fotos y 1 video desde tu dispositivo.</p>
            </div>
            <div className="media-actions">
              <label className="button outline">
                Subir fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    addOfferPhotos(event.target.files || []);
                    event.target.value = "";
                  }}
                />
              </label>
              <label className="button outline">
                Subir video
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(event) => {
                    addOfferVideo(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {offerMedia.length > 0 && (
              <div className="media-preview-row">
                {offerMedia.map((item) => (
                  <div className="media-thumb" key={item.id}>
                    {item.kind === "photo" ? (
                      <img src={item.preview} alt="" />
                    ) : (
                      <video src={item.preview} muted />
                    )}
                    <button
                      type="button"
                      onClick={() => removeOfferMedia(item.id)}
                      aria-label="Quitar archivo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
            {offerMedia.some((item) => item.kind === "photo") ? (
              <img
                className="preview-photo"
                src={offerMedia.find((item) => item.kind === "photo").preview}
                alt=""
              />
            ) : (
              <div className="service-icon">
                {categories.find(
                  (item) => item[1] === form.category
                )?.[0] || "✨"}
              </div>
            )}

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

  const MarketPage = () => {
    const people = [];
    const seen = new Set();

    services.forEach((service) => {
      const key =
        service.provider_id ||
        service.provider_username ||
        service.provider_name;
      if (!key || seen.has(key)) return;
      seen.add(key);
      people.push(service);
    });

    const bars = categories
      .map(([icon, name]) => ({
        icon,
        name,
        count: services.filter((service) => service.category === name).length,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
    const maxBar = Math.max(1, ...bars.map((item) => item.count));
    const notes = [];

    if (loggedUser && pendingRequests > 0) {
      notes.push(["Solicitud", `${pendingRequests} solicitudes pendientes`]);
    }
    if (loggedUser && acceptedRequests > 0) {
      notes.push(["Trabajo", `${acceptedRequests} trabajos aceptados`]);
    }

    services.slice(0, 4).forEach((service) => {
      notes.push([
        service.category || "Aviso",
        `${service.service_title || service.title} · ${service.provider_name}`,
      ]);
    });

    const dots = [
      [80, 80],
      [140, 60],
      [210, 100],
      [280, 70],
      [350, 120],
      [430, 80],
      [510, 130],
      [170, 170],
      [300, 190],
      [420, 180],
    ];

    return (
      <main className="market-page">
        <div className="market-wrap">
          <header className="market-top">
            <div>
              <span className="eyebrow">MERCADO</span>
              <h1>Conecta talento en todo el mundo</h1>
            </div>
            <button type="button" className="button light" onClick={() => go("services")}>
              Buscar
            </button>
          </header>

          <div className="market-grid">
            <aside className="market-side">
              <section className="market-card">
                <div className="market-card-head">
                  <h2>Conexiones</h2>
                  <span>{people.length}</span>
                </div>
                <div className="market-people">
                  {people.slice(0, 4).map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => {
                        setSelectedService(person);
                        setRequestMessage("");
                        setPage("service");
                      }}
                    >
                      <span className="avatar">{getInitials(person.provider_name)}</span>
                      {person.provider_name}
                    </button>
                  ))}
                  {people.length === 0 && <p>Aún no hay profesionales publicados.</p>}
                </div>
              </section>

              <section className="market-card">
                <h2>Soluciones</h2>
                <div className="market-solutions">
                  {["Tecnología", "Diseño", "Marketing", "Video"].map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        setCategory(name);
                        go("services");
                      }}
                    >
                      <span>
                        {categories.find((item) => item[1] === name)?.[0] || "✨"}
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </section>
            </aside>

            <section className="market-stage">
              <div className="market-map">
                <svg viewBox="0 0 640 280" className="market-svg" aria-hidden="true">
                  <line x1="80" y1="80" x2="210" y2="100" />
                  <line x1="210" y1="100" x2="350" y2="120" />
                  <line x1="350" y1="120" x2="510" y2="130" />
                  <line x1="140" y1="60" x2="300" y2="190" />
                  <line x1="430" y1="80" x2="420" y2="180" />
                  {dots.map(([x, y]) => (
                    <g key={`${x}-${y}`}>
                      <circle cx={x} cy={y} r="10" className="market-glow" />
                      <circle cx={x} cy={y} r="3.5" className="market-dot" />
                    </g>
                  ))}
                </svg>
                <div className="market-actions">
                  <button
                    type="button"
                    className="button light"
                    onClick={() =>
                      loggedUser
                        ? go("offer")
                        : (setAccountMode("register"), go("account"))
                    }
                  >
                    Haz crecer tu negocio
                  </button>
                  <button type="button" className="button ghost" onClick={() => go("services")}>
                    Encontrar profesionales
                  </button>
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => {
                      setSearch("");
                      setCategory("Todas");
                      go("services");
                    }}
                  >
                    Llegar a más países
                  </button>
                </div>
              </div>

              <div className="market-lower">
                <section className="market-card">
                  <h2>Actividad del mercado</h2>
                  <div className="market-bars">
                    {bars.map((item) => (
                      <div key={item.name}>
                        <span>
                          {item.icon} {item.name}
                        </span>
                        <span className="market-bar">
                          <span style={{ width: `${(item.count / maxBar) * 100}%` }} />
                        </span>
                        <b>{item.count}</b>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="button primary" onClick={() => go("services")}>
                    Conectar
                  </button>
                </section>

                <section className="market-card">
                  <div className="market-card-head">
                    <h2>Avisos</h2>
                    <span>{notes.length}</span>
                  </div>
                  <ul className="market-notes">
                    {notes.map(([label, text]) => (
                      <li key={text}>
                        <b>{label}</b>
                        {text}
                      </li>
                    ))}
                    {notes.length === 0 && <li>No hay avisos todavía.</li>}
                  </ul>
                </section>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  };

  const renderPage = () => {
  switch (page) {
    case "services":
      return ServicesPage();

    case "store":
      return selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          user={loggedUser}
          onBack={() => setSelectedProduct(null)}
          onAddToCart={(product) => {
            addToCart(product);
          }}
          onOrderCreated={() => {
            setSelectedProduct(null);
            alert("Pedido creado y comisión registrada");
          }}
        />
      ) : (
        <StorePage
          onViewProduct={(product) => setSelectedProduct(product)}
          onAddToCart={(product) => {
            addToCart(product);
            alert("Producto añadido al carrito");
          }}
        />
      );

    case "publish-product":
      return (
        <main className="page-container">
          <ProductForm
            user={loggedUser}
            onPublished={() => {
              alert("Producto publicado correctamente");
              go("store");
            }}
          />
        </main>
      );

    case "plans":
      return (
        <PlansPage
          user={loggedUser}
          onPlanChanged={(planId) => console.log("Nuevo plan:", planId)}
        />
      );

    case "commissions":
      return <CommissionsPage user={loggedUser} />;

    case "cart":
      return (
        <CartPage
          user={loggedUser}
          onBack={() => go("store")}
        />
      );

    case "market":
      return MarketPage();

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

    case "blog":
      return (
        <main className="page-container">
          <section className="page-header">
            <span className="eyebrow">BLOG</span>
            <h1>Notas de RobLoren</h1>
            <p>Ideas cortas para ofrecer un servicio o encontrar a la persona adecuada.</p>
          </section>
          <div className="requests-grid">
            {[
              ["Empieza desde donde estás", "Un perfil claro y un precio de entrada bastan para el primer encargo."],
              ["Qué se está pidiendo", "Páginas, diseño, video y traducción son los encargos que más se abren."],
              ["Cómo escribir tu servicio", "Di qué entregas, en cuántos días y qué queda fuera."],
            ].map(([title, body]) => (
              <article className="request-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </main>
      );

    default:
      return HomePage();
  }
};

  return (
    <>


      {Header()}

      {renderPage()}

      <nav className="bottom-nav" aria-label="Navegación">
        <button className={page === "home" ? "active" : ""} onClick={() => go("home")}>Inicio</button>
        <button className={page === "services" ? "active" : ""} onClick={() => go("services")}>Buscar</button>
        <button className={page === "store" ? "active" : ""} onClick={() => go("store")}>Tienda</button>
        <button onClick={() => (loggedUser ? go("offer") : (setAccountMode("register"), go("account")))}>Publicar</button>
        <button className={page === "messages" ? "active" : ""} onClick={() => (loggedUser ? go("messages") : (setAccountMode("login"), go("account")))}>Mensajes</button>
        <button className={page === "account" ? "active" : ""} onClick={() => go("account")}>Perfil</button>
      </nav>
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h3>R RobLoren</h3>
            <p>Conecta talento con oportunidades</p>
          </div>
          <div className="footer-links">
            <button onClick={() => go("home")}>Inicio</button>
            <button onClick={() => go("services")}>Explorar servicios</button>
            <button onClick={() => go("market")}>Panel</button>
            <button onClick={() => go("home", "como")}>Cómo funciona</button>
          </div>
          <div className="footer-links">
            <button onClick={() => go("home", "categorias")}>Categorías</button>
            <button onClick={() => go("blog")}>Blog</button>
            <button onClick={() => go("account")}>Contacto</button>
          </div>
          <div className="footer-links">
            <span>Facebook</span>
            <span>Instagram</span>
            <span>X</span>
            <span>YouTube</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} RobLoren. Todos los derechos reservados.</span>
          <span>Términos de uso · Política de privacidad · Ayuda</span>
        </div>
      </footer>
    </>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);








