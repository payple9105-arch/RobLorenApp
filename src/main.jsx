import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./supabaseClient";

const categories = [
  ["💻", "Tecnología"],
  ["🎨", "Diseño"],
  ["📣", "Marketing"],
  ["✍️", "Redacción"],
  ["📚", "Educación"],
  ["🛠️", "Servicios profesionales"],
];

const initialServices = [
  {
    id: "demo-1",
    title: "Desarrollo web",
    category: "Tecnología",
    description: "Creación y mantenimiento de sitios web.",
    price: "Consultar precio",
    professional: "Alex Rodríguez",
    profession: "Desarrollador web",
    bio: "Profesional especializado en creación de sitios web y aplicaciones.",
  },
  {
    id: "demo-2",
    title: "Diseño gráfico",
    category: "Diseño",
    description: "Logotipos, imágenes y material visual.",
    price: "Consultar precio",
    professional: "María García",
    profession: "Diseñadora gráfica",
    bio: "Diseñadora enfocada en identidad visual, logotipos y contenido digital.",
  },
  {
    id: "demo-3",
    title: "Marketing digital",
    category: "Marketing",
    description: "Estrategias para hacer crecer tu negocio.",
    price: "Consultar precio",
    professional: "Carlos Pérez",
    profession: "Especialista en marketing",
    bio: "Ayudo a negocios a mejorar su presencia digital y conseguir clientes.",
  },
  {
    id: "demo-4",
    title: "Redacción de contenidos",
    category: "Redacción",
    description: "Artículos, textos comerciales y contenido web.",
    price: "Consultar precio",
    professional: "Laura Martínez",
    profession: "Redactora profesional",
    bio: "Redactora especializada en contenidos web, artículos y comunicación comercial.",
  },
];

function mapSupabaseService(service, profile = null) {
  const profession =
    profile?.profession ||
    service.profession ||
    "Profesional";

  return {
    id: service.id,
    userId: service.user_id,
    title: service.service_title,
    category: service.category,
    description: service.description,
    price:
      service.price !== null && service.price !== undefined
        ? `$${service.price} USD`
        : "Consultar precio",
    professional:
      profile?.name ||
      service.name ||
      "Profesional RobLoren",
    profession,
    bio:
      profile?.bio ||
      `Profesional especializado en ${profession}.`,
  };
}

function buildLoggedUser(user, profile) {
  return {
    id: user.id,
    name:
      profile?.name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Usuario",
    email: user.email,
    type:
      user.user_metadata?.type ||
      "Cliente",
    profession:
      profile?.profession ||
      "Profesional",
    bio:
      profile?.bio ||
      "Perfil profesional de RobLoren.",
  };
}

async function ensureUserProfile(user) {
  if (!user) return null;

  const { data: existingProfile, error: profileError } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Error buscando perfil:",
      profileError
    );
    return null;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const profileName =
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Usuario";

  const { data: newProfile, error: insertError } =
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: profileName,
        profession:
          user.user_metadata?.profession ||
          "Profesional",
        bio:
          user.user_metadata?.bio ||
          "Perfil profesional de RobLoren.",
      })
      .select()
      .single();

  if (insertError) {
    console.error(
      "Error creando perfil:",
      insertError
    );
    return null;
  }

  return newProfile;
}

function App() {
  const [page, setPage] = useState("home");

  const [selectedService, setSelectedService] =
    useState(null);

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("");

  const [services, setServices] =
    useState(initialServices);

  const [accountMode, setAccountMode] =
    useState("login");

  const [account, setAccount] = useState({
    name: "",
    email: "",
    password: "",
    type: "Cliente",
  });

  const [loggedUser, setLoggedUser] =
    useState(null);

  const [loadingAuth, setLoadingAuth] =
    useState(true);

  const [loadingServices, setLoadingServices] =
    useState(true);

  const [requestMessage, setRequestMessage] =
    useState("");

  const [sendingRequest, setSendingRequest] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    profession: "",
    title: "",
    description: "",
    category: "Tecnología",
    price: "",
  });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data, error } =
        await supabase.auth.getUser();

      if (error) {
        console.error(
          "Error obteniendo usuario:",
          error
        );
      }

      const user = data?.user;

      if (active && user) {
        const profile =
          await ensureUserProfile(user);

        setLoggedUser(
          buildLoggedUser(user, profile)
        );
      }

      if (active) {
        setLoadingAuth(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!active) return;

          const user = session?.user;

          if (!user) {
            setLoggedUser(null);
            setLoadingAuth(false);
            return;
          }

          const profile =
            await ensureUserProfile(user);

          if (!active) return;

          setLoggedUser(
            buildLoggedUser(user, profile)
          );

          setLoadingAuth(false);
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);

      const { data, error } =
        await supabase
          .from("services")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Error cargando servicios:",
          error
        );

        setLoadingServices(false);
        return;
      }

      const serviceRows = data || [];

      const userIds = [
        ...new Set(
          serviceRows
            .map(
              (service) =>
                service.user_id
            )
            .filter(Boolean)
        ),
      ];

      let profiles = [];

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id,name,profession,bio"
          )
          .in("id", userIds);

        if (profileError) {
          console.error(
            "Error cargando perfiles:",
            profileError
          );
        } else {
          profiles = profileData || [];
        }
      }

      const profileMap =
        Object.fromEntries(
          profiles.map((profile) => [
            profile.id,
            profile,
          ])
        );

      const databaseServices =
        serviceRows.map(
          (service) =>
            mapSupabaseService(
              service,
              profileMap[
                service.user_id
              ]
            )
        );

      setServices([
        ...databaseServices,
        ...initialServices,
      ]);

      setLoadingServices(false);
    }

    loadServices();
  }, []);

  const filteredServices =
    services.filter((service) => {
      const text =
        `${service.title} ${service.description} ${service.category} ${service.professional} ${service.profession}`.toLowerCase();

      return (
        text.includes(
          search.toLowerCase()
        ) &&
        (category === "" ||
          service.category === category)
      );
    });

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  }

  function handleAccountChange(event) {
    setAccount({
      ...account,
      [event.target.name]:
        event.target.value,
    });
  }

  async function handleAccountSubmit(event) {
    event.preventDefault();

    if (
      !account.email ||
      !account.password
    ) {
      alert(
        "Completa el correo y la contraseña."
      );
      return;
    }

    if (
      accountMode === "register" &&
      !account.name
    ) {
      alert("Escribe tu nombre.");
      return;
    }

    if (account.password.length < 6) {
      alert(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (accountMode === "register") {
      const { data, error } =
        await supabase.auth.signUp({
          email: account.email,
          password:
            account.password,
          options: {
            data: {
              name: account.name,
              type: account.type,
            },
          },
        });

      if (error) {
        alert(error.message);
        return;
      }

      if (
        data.user &&
        !data.session
      ) {
        alert(
          "Cuenta creada correctamente. Revisa tu correo para confirmar tu cuenta."
        );

        setAccount({
          name: "",
          email: account.email,
          password: "",
          type: account.type,
        });

        setAccountMode("login");
        return;
      }

      if (data.user) {
        const profile =
          await ensureUserProfile(
            data.user
          );

        setLoggedUser(
          buildLoggedUser(
            data.user,
            profile
          )
        );
      }

      alert(
        "¡Cuenta creada correctamente!"
      );

      setPage("home");
      return;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword(
        {
          email: account.email,
          password:
            account.password,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    const profile =
      await ensureUserProfile(user);

    setLoggedUser(
      buildLoggedUser(
        user,
        profile
      )
    );

    alert("¡Sesión iniciada!");

    setPage("home");
  }

  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setLoggedUser(null);

    alert("Sesión cerrada.");

    setPage("home");
  }

  async function publishService(event) {
    event.preventDefault();

    if (!loggedUser) {
      alert(
        "Debes iniciar sesión para publicar un servicio."
      );

      setAccountMode("login");
      setPage("account");

      return;
    }

    if (
      !form.name ||
      !form.profession ||
      !form.title ||
      !form.description ||
      !form.price
    ) {
      alert(
        "Completa todos los campos antes de publicar."
      );

      return;
    }

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      alert(
        "Tu sesión ha expirado. Inicia sesión nuevamente."
      );

      setAccountMode("login");
      setPage("account");

      return;
    }

    const profile =
      await ensureUserProfile(user);

    let updatedProfile = profile;

    if (profile) {
      const profileUpdates = {
        name: form.name,
        profession:
          form.profession,
        bio: `Profesional especializado en ${form.profession}.`,
      };

      const {
        data: savedProfile,
        error:
          profileUpdateError,
      } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user.id)
        .select()
        .single();

      if (profileUpdateError) {
        console.error(
          "Error actualizando perfil:",
          profileUpdateError
        );

        alert(
          `No se pudo actualizar tu perfil: ${profileUpdateError.message}`
        );

        return;
      }

      updatedProfile =
        savedProfile;

      setLoggedUser(
        buildLoggedUser(
          user,
          savedProfile
        )
      );
    }

    const { data, error } =
      await supabase
        .from("services")
        .insert({
          user_id: user.id,
          name: form.name,
          profession:
            form.profession,
          service_title:
            form.title,
          category:
            form.category,
          description:
            form.description,
          price: Number(
            form.price
          ),
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Error publicando servicio:",
        error
      );

      alert(
        `No se pudo publicar el servicio: ${error.message}`
      );

      return;
    }

    const newService =
      mapSupabaseService(
        data,
        updatedProfile
      );

    setServices(
      (currentServices) => [
        newService,
        ...currentServices,
      ]
    );

    setForm({
      name: "",
      profession: "",
      title: "",
      description: "",
      category: "Tecnología",
      price: "",
    });

    alert(
      "¡Tu servicio fue publicado en RobLoren!"
    );

    setPage("services");
  }

  async function requestService() {
    if (!loggedUser) {
      alert(
        "Inicia sesión para contratar un servicio."
      );

      setAccountMode("login");
      setPage("account");

      return;
    }

    if (!selectedService) {
      return;
    }

    if (!selectedService.userId) {
      alert(
        "Este es un servicio de demostración. Selecciona un servicio publicado por un profesional para realizar una solicitud real."
      );

      return;
    }

    if (
      selectedService.userId ===
      loggedUser.id
    ) {
      alert(
        "No puedes contratar tu propio servicio."
      );

      return;
    }

    setSendingRequest(true);

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setSendingRequest(false);

      alert(
        "Tu sesión ha expirado. Inicia sesión nuevamente."
      );

      setAccountMode("login");
      setPage("account");

      return;
    }

    const { data, error } =
      await supabase
        .from("service_requests")
        .insert({
          service_id:
            selectedService.id,
          client_id: user.id,
          provider_id:
            selectedService.userId,
          status: "pending",
          message:
            requestMessage.trim() ||
            null,
        })
        .select()
        .single();

    setSendingRequest(false);

    if (error) {
      console.error(
        "Error creando solicitud:",
        error
      );

      alert(
        `No se pudo crear la solicitud: ${error.message}`
      );

      return;
    }

    console.log(
      "Solicitud creada:",
      data
    );

    setRequestMessage("");

    alert(
      "¡Solicitud enviada correctamente! El profesional podrá revisar tu solicitud."
    );
  }

  function openProfile(service) {
    setSelectedService(service);
    setRequestMessage("");
    setPage("profile");
  }

  if (loadingAuth) {
    return (
      <div style={styles.loading}>
        <h2>RobLoren</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  if (page === "account") {
    return (
      <div style={styles.app}>
        <Header
          setPage={setPage}
          loggedUser={loggedUser}
          logout={logout}
        />

        <main
          style={styles.formContainer}
        >
          <div
            style={styles.accountCard}
          >
            <h1>
              {accountMode === "login"
                ? "🔐 Iniciar sesión"
                : "👤 Crear cuenta"}
            </h1>

            <p
              style={styles.subtitle}
            >
              {accountMode === "login"
                ? "Accede a tu cuenta de RobLoren."
                : "Únete a la comunidad de RobLoren."}
            </p>

            <form
              onSubmit={
                handleAccountSubmit
              }
              style={styles.form}
            >
              {accountMode ===
                "register" && (
                <>
                  <label>
                    Nombre
                  </label>

                  <input
                    name="name"
                    value={
                      account.name
                    }
                    onChange={
                      handleAccountChange
                    }
                    placeholder="Tu nombre"
                    style={
                      styles.input
                    }
                  />

                  <label>
                    Tipo de cuenta
                  </label>

                  <select
                    name="type"
                    value={
                      account.type
                    }
                    onChange={
                      handleAccountChange
                    }
                    style={
                      styles.input
                    }
                  >
                    <option value="Cliente">
                      Cliente
                    </option>

                    <option value="Profesional">
                      Profesional
                    </option>
                  </select>
                </>
              )}

              <label>
                Correo electrónico
              </label>

              <input
                name="email"
                type="email"
                value={
                  account.email
                }
                onChange={
                  handleAccountChange
                }
                placeholder="tu@email.com"
                style={
                  styles.input
                }
              />

              <label>
                Contraseña
              </label>

              <input
                name="password"
                type="password"
                value={
                  account.password
                }
                onChange={
                  handleAccountChange
                }
                placeholder="Mínimo 6 caracteres"
                style={
                  styles.input
                }
              />

              <button
                type="submit"
                style={
                  styles.publishButton
                }
              >
                {accountMode ===
                "login"
                  ? "Iniciar sesión"
                  : "Crear mi cuenta"}
              </button>
            </form>

            <button
              style={
                styles.linkButton
              }
              onClick={() => {
                setAccountMode(
                  accountMode ===
                    "login"
                    ? "register"
                    : "login"
                );
              }}
            >
              {accountMode ===
              "login"
                ? "¿No tienes cuenta? Crear una"
                : "¿Ya tienes cuenta? Iniciar sesión"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (
    page === "profile" &&
    selectedService
  ) {
    return (
      <div style={styles.app}>
        <Header
          setPage={setPage}
          loggedUser={loggedUser}
          logout={logout}
        />

        <main
          style={
            styles.profileContainer
          }
        >
          <button
            style={
              styles.backButton
            }
            onClick={() =>
              setPage("services")
            }
          >
            ← Volver a servicios
          </button>

          <div
            style={
              styles.profileCard
            }
          >
            <div
              style={styles.avatar}
            >
              {selectedService.professional
                .charAt(0)
                .toUpperCase()}
            </div>

            <h1>
              {
                selectedService.professional
              }
            </h1>

            <h3>
              {
                selectedService.profession
              }
            </h3>

            <p
              style={styles.bio}
            >
              {selectedService.bio}
            </p>

            <div
              style={
                styles.profileSection
              }
            >
              <span
                style={styles.badge}
              >
                {
                  selectedService.category
                }
              </span>

              <h2>
                {
                  selectedService.title
                }
              </h2>

              <p>
                {
                  selectedService.description
                }
              </p>

              <div
                style={styles.price}
              >
                {
                  selectedService.price
                }
              </div>
            </div>

            {selectedService.userId && (
              <>
                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    marginTop: "25px",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Mensaje para el profesional
                </label>

                <textarea
                  value={
                    requestMessage
                  }
                  onChange={(e) =>
                    setRequestMessage(
                      e.target.value
                    )
                  }
                  placeholder="Hola, estoy interesado en este servicio..."
                  style={{
                    ...styles.input,
                    minHeight:
                      "100px",
                  }}
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
                    ? "Enviando solicitud..."
                    : "🤝 Contratar servicio"}
                </button>
              </>
            )}

            <button
              style={
                styles.contactButton
              }
              onClick={() => {
                if (!loggedUser) {
                  alert(
                    "Inicia sesión para contactar al profesional."
                  );

                  setAccountMode(
                    "login"
                  );

                  setPage(
                    "account"
                  );

                  return;
                }

                alert(
                  `Hola ${loggedUser.name}. La mensajería real será conectada en el siguiente paso.`
                );
              }}
            >
              💬 Contactar
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (page === "services") {
    return (
      <div style={styles.app}>
        <Header
          setPage={setPage}
          loggedUser={loggedUser}
          logout={logout}
        />

        <main style={styles.main}>
          <h1>
            Buscar servicios
          </h1>

          <p
            style={styles.subtitle}
          >
            Encuentra profesionales para lo que necesitas.
          </p>

          <input
            type="text"
            placeholder="¿Qué servicio necesitas?"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={styles.search}
          />

          <div
            style={
              styles.categories
            }
          >
            <button
              onClick={() =>
                setCategory("")
              }
              style={{
                ...styles.categoryButton,
                ...(category === ""
                  ? styles.selected
                  : {}),
              }}
            >
              Todos
            </button>

            {categories.map(
              ([icon, name]) => (
                <button
                  key={name}
                  onClick={() =>
                    setCategory(
                      name
                    )
                  }
                  style={{
                    ...styles.categoryButton,
                    ...(category ===
                    name
                      ? styles.selected
                      : {}),
                  }}
                >
                  {icon} {name}
                </button>
              )
            )}
          </div>

          {loadingServices ? (
            <p
              style={{
                textAlign:
                  "center",
              }}
            >
              Cargando servicios...
            </p>
          ) : (
            <section
              style={styles.grid}
            >
              {filteredServices.map(
                (service) => (
                  <div
                    key={
                      service.id
                    }
                    style={styles.card}
                  >
                    <div
                      style={
                        styles.avatarSmall
                      }
                    >
                      {service.professional
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span
                      style={
                        styles.badge
                      }
                    >
                      {
                        service.category
                      }
                    </span>

                    <h2>
                      {
                        service.title
                      }
                    </h2>

                    <p>
                      {
                        service.description
                      }
                    </p>

                    <p>
                      <strong>
                        {
                          service.professional
                        }
                      </strong>
                      <br />
                      {
                        service.profession
                      }
                    </p>

                    <strong>
                      {
                        service.price
                      }
                    </strong>

                    <br />
                    <br />

                    <button
                      style={
                        styles.darkButton
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
                )
              )}

              {filteredServices.length ===
                0 && (
                <p>
                  No encontramos servicios con esa búsqueda.
                </p>
              )}
            </section>
          )}
        </main>
      </div>
    );
  }

  if (page === "offer") {
    return (
      <div style={styles.app}>
        <Header
          setPage={setPage}
          loggedUser={loggedUser}
          logout={logout}
        />

        <main
          style={
            styles.formContainer
          }
        >
          <h1>
            Ofrece tus servicios
          </h1>

          <p
            style={styles.subtitle}
          >
            Crea tu publicación profesional en RobLoren.
          </p>

          {!loggedUser && (
            <div
              style={styles.welcome}
            >
              🔐 Debes iniciar sesión para publicar un servicio.
            </div>
          )}

          <form
            onSubmit={
              publishService
            }
            style={styles.form}
          >
            <label>
              Tu nombre
            </label>

            <input
              name="name"
              value={form.name}
              onChange={
                handleChange
              }
              placeholder="Ej. Roberto Pérez"
              style={styles.input}
            />

            <label>
              Profesión o especialidad
            </label>

            <input
              name="profession"
              value={
                form.profession
              }
              onChange={
                handleChange
              }
              placeholder="Ej. Diseñador gráfico"
              style={styles.input}
            />

            <label>
              Nombre del servicio
            </label>

            <input
              name="title"
              value={
                form.title
              }
              onChange={
                handleChange
              }
              placeholder="Ej. Diseño de logotipos"
              style={styles.input}
            />

            <label>
              Categoría
            </label>

            <select
              name="category"
              value={
                form.category
              }
              onChange={
                handleChange
              }
              style={styles.input}
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

            <label>
              Descripción
            </label>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              placeholder="Describe lo que ofreces..."
              style={{
                ...styles.input,
                minHeight:
                  "120px",
              }}
            />

            <label>
              Precio inicial (USD)
            </label>

            <input
              name="price"
              type="number"
              min="1"
              value={form.price}
              onChange={
                handleChange
              }
              placeholder="Ej. 25"
              style={styles.input}
            />

            <button
              type="submit"
              style={
                styles.publishButton
              }
            >
              Publicar mi servicio
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Header
        setPage={setPage}
        loggedUser={loggedUser}
        logout={logout}
      />

      <main style={styles.main}>
        <h1
          style={styles.heroTitle}
        >
          Encuentra el talento que necesitas.
        </h1>

        <p
          style={styles.subtitle}
        >
          RobLoren conecta clientes con profesionales que ofrecen servicios desde cualquier lugar.
        </p>

        {loggedUser && (
          <div
            style={styles.welcome}
          >
            👋 Hola,{" "}
            <strong>
              {
                loggedUser.name
              }
            </strong>
            <br />
            Cuenta:{" "}
            {
              loggedUser.type
            }
          </div>
        )}

        <div
          style={styles.actions}
        >
          <button
            style={
              styles.darkButton
            }
            onClick={() =>
              setPage("services")
            }
          >
            Buscar servicios
          </button>

          <button
            style={
              styles.lightButton
            }
            onClick={() =>
              setPage("offer")
            }
          >
            Ofrecer mis servicios
          </button>
        </div>

        <section
          style={styles.grid}
        >
          {categories.map(
            ([icon, name]) => (
              <div
                key={name}
                style={styles.card}
              >
                <div
                  style={{
                    fontSize:
                      "35px",
                  }}
                >
                  {icon}
                </div>

                <h3>
                  {name}
                </h3>

                <p>
                  Profesionales especializados.
                </p>
              </div>
            )
          )}
        </section>
      </main>

      <footer
        style={styles.footer}
      >
        © 2026 RobLoren — Marketplace de servicios profesionales
      </footer>
    </div>
  );
}

function Header({
  setPage,
  loggedUser,
  logout,
}) {
  return (
    <header
      style={styles.header}
    >
      <button
        style={
          styles.logoButton
        }
        onClick={() =>
          setPage("home")
        }
      >
        RobLoren
      </button>

      <div
        style={
          styles.headerActions
        }
      >
        <button
          style={
            styles.darkButton
          }
          onClick={() =>
            setPage("home")
          }
        >
          Inicio
        </button>

        {loggedUser ? (
          <button
            style={
              styles.accountButton
            }
            onClick={() => {
              if (
                window.confirm(
                  "¿Quieres cerrar sesión?"
                )
              ) {
                logout();
              }
            }}
          >
            👤{" "}
            {
              loggedUser.name
            }
          </button>
        ) : (
          <button
            style={
              styles.accountButton
            }
            onClick={() =>
              setPage("account")
            }
          >
            👤 Cuenta
          </button>
        )}
      </div>
    </header>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    fontFamily:
      "Arial, sans-serif",
    background: "#f5f7fb",
    color: "#172033",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "Arial, sans-serif",
    background: "#f5f7fb",
    color: "#172033",
  },

  header: {
    background: "#ffffff",
    padding: "20px 25px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid #e5e7eb",
    gap: "15px",
  },

  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  logoButton: {
    border: "none",
    background:
      "transparent",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#172033",
    cursor: "pointer",
  },

  accountButton: {
    padding: "12px 16px",
    border:
      "1px solid #172033",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    cursor: "pointer",
  },

  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 25px",
  },

  heroTitle: {
    fontSize:
      "clamp(38px, 7vw, 64px)",
    textAlign: "center",
    marginBottom: "20px",
  },

  subtitle: {
    fontSize: "19px",
    color: "#5b6475",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: "700px",
    margin:
      "0 auto 35px",
  },

  actions: {
    display: "flex",
    gap: "12px",
    justifyContent:
      "center",
    flexWrap: "wrap",
  },

  darkButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "15px",
    cursor: "pointer",
  },

  lightButton: {
    padding: "12px 20px",
    border:
      "1px solid #172033",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "15px",
    cursor: "pointer",
  },

  backButton: {
    border: "none",
    background:
      "transparent",
    color: "#172033",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom:
      "20px",
  },

  search: {
    display: "block",
    width: "100%",
    maxWidth: "700px",
    margin:
      "30px auto",
    padding: "16px",
    border:
      "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "17px",
    boxSizing:
      "border-box",
  },

  categories: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent:
      "center",
    marginBottom:
      "40px",
  },

  categoryButton: {
    padding: "10px 15px",
    border:
      "1px solid #d1d5db",
    borderRadius: "20px",
    background: "#ffffff",
    cursor: "pointer",
  },

  selected: {
    background: "#172033",
    color: "#ffffff",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "14px",
    border:
      "1px solid #e5e7eb",
  },

  badge: {
    display:
      "inline-block",
    fontSize: "13px",
    color: "#5b6475",
    marginTop:
      "12px",
  },

  avatarSmall: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "20px",
    fontWeight: "bold",
  },

  formContainer: {
    maxWidth: "650px",
    margin: "0 auto",
    padding:
      "60px 25px",
  },

  form: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "15px",
    border:
      "1px solid #e5e7eb",
    display: "flex",
    flexDirection:
      "column",
    gap: "10px",
  },

  input: {
    padding: "14px",
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    marginBottom:
      "10px",
    boxSizing:
      "border-box",
    width: "100%",
  },

  publishButton: {
    padding:
      "14px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },

  hireButton: {
    width: "100%",
    marginTop: "15px",
    padding: "15px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "17px",
    cursor: "pointer",
  },

  linkButton: {
    border: "none",
    background:
      "transparent",
    color: "#172033",
    textDecoration:
      "underline",
    cursor: "pointer",
    marginTop:
      "20px",
    fontSize: "15px",
  },

  accountCard: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "15px",
    border:
      "1px solid #e5e7eb",
  },

  welcome: {
    maxWidth: "500px",
    margin:
      "30px auto",
    padding: "20px",
    background: "#ffffff",
    borderRadius: "12px",
    textAlign: "center",
    border:
      "1px solid #e5e7eb",
  },

  profileContainer: {
    maxWidth: "700px",
    margin: "0 auto",
    padding:
      "50px 25px",
  },

  profileCard: {
    background: "#ffffff",
    padding:
      "40px 30px",
    borderRadius: "18px",
    border:
      "1px solid #e5e7eb",
    textAlign: "center",
  },

  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    fontSize: "38px",
    fontWeight: "bold",
    margin:
      "0 auto 20px",
  },

  bio: {
    color: "#5b6475",
    lineHeight: 1.6,
  },

  profileSection: {
    marginTop: "30px",
    padding: "25px",
    background: "#f5f7fb",
    borderRadius: "12px",
    textAlign: "left",
  },

  price: {
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "20px",
  },

  contactButton: {
    width: "100%",
    marginTop: "25px",
    padding: "15px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "17px",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },
};

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
