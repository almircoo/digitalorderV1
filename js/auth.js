/**
 * Servicio de Autenticación
 * Maneja la autenticación, registro y gestión de sesión de los usuarios
 */

let currentUser = null;

// Inicializar autenticación al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  initializeAuth();
});

/**
 * Inicializar sistema de autenticación
 */
function initializeAuth() {
  // Verificar sesión guardada
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForLoggedInUser();
  }

  // Configurar eventos de autenticación
  setupAuthEventListeners();
}

/**
 * Configurar eventos de autenticación
 */
function setupAuthEventListeners() {
  // Formulario de login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Formulario de registro
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
}

/**
 * Manejar el envío del formulario de login
 */
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const accountType = formData.get("accountType");

  try {
    const user = await dataService.authenticateUser(email, password, accountType);
    
    if (user) {
      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(user));
      closeModal("loginModal");
      updateUIForLoggedInUser();
      toastr.success("¡Inicio de sesión exitoso!");
    } else {
      toastr.error("Credenciales incorrectas");
    }
  } catch (error) {
    console.error('Login error:', error);
    toastr.error("Error al iniciar sesión");
  }
}

/**
 * Manejar el envío del formulario de registro
 */
async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const accountType = formData.get("accountType");

  // Validate passwords match
  if (formData.get("password") !== formData.get("confirmPassword")) {
    toastr.error("Las contraseñas no coinciden");
    return;
  }

  const newUser = {
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    accountType: accountType,
  };

  // Add specific fields based on account type
  if (accountType === "restaurant") {
    newUser.restaurantName = formData.get("restaurantName");
    newUser.address = formData.get("address");
    newUser.phone = formData.get("phone");
    newUser.ruc = formData.get("ruc");
  } else {
    newUser.companyName = formData.get("companyName");
    newUser.address = formData.get("companyAddress");
    newUser.phone = formData.get("companyPhone");
    newUser.ruc = formData.get("companyRuc");
  }

  try {
    const createdUser = await dataService.createUser(newUser);
    
    if (createdUser) {
      closeModal("registerModal");
      toastr.success("¡Registro exitoso! Ahora puedes iniciar sesión.");
    }
  } catch (error) {
    if (error.message === 'Email already exists') {
      toastr.error("El correo electrónico ya está registrado");
    } else {
      console.error('Registration error:', error);
      toastr.error("Error al registrar usuario");
    }
  }
}

/**
 * Cerrar sesión
 */
function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  showHome();
  document.getElementById("authButtons").style.display = "flex";
  document.getElementById("userMenu").style.display = "none";
  toastr.info("Sesión cerrada");
  history.pushState(null, '', '/');
}

/**
 * Actualizar UI para usuario logueado
 */
function updateUIForLoggedInUser() {
  document.getElementById("authButtons").style.display = "none";
  document.getElementById("userMenu").style.display = "flex";
  document.getElementById("userName").textContent = currentUser.firstName || currentUser.email;

  document.getElementById("dashboardUserName").textContent = 
    currentUser.firstName + " " + currentUser.lastName;
  document.getElementById("dashboardUserType").textContent =
    currentUser.accountType === "provider"
      ? currentUser.companyName || "Provider Company"
      : currentUser.restaurantName || "Restaurant Example";

  showDashboard();
}

/**
 * Mostrar modal de login
 */
function showLogin() {
  document.getElementById("loginModal").style.display = "flex";
}

/**
 * Mostrar modal de registro
 */
function showRegister() {
  closeModal("loginModal");
  document.getElementById("registerModal").style.display = "flex";
}

/**
 * Cambiar pestaña de registro entre restaurante y proveedor
 */
function switchTab(type) {
  const tabs = document.querySelectorAll(".form-tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  document.querySelector('input[name="accountType"]').value = type;

  if (type === "restaurant") {
    document.getElementById("restaurantFields").style.display = "block";
    document.getElementById("providerFields").style.display = "none";
  } else {
    document.getElementById("restaurantFields").style.display = "none";
    document.getElementById("providerFields").style.display = "block";
  }
}

/**
 * Actualizar perfil de usuario
 */
async function updateProfile(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const updatedData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    ruc: formData.get("ruc")
  };

  if (currentUser.accountType === "provider") {
    updatedData.companyName = formData.get("businessName");
  } else {
    updatedData.restaurantName = formData.get("businessName");
  }

  try {
    const updatedUser = await dataService.updateUser(currentUser.id, updatedData);
    
    if (updatedUser) {
      currentUser = updatedUser;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      
      event.target.closest(".modal").remove();
      showAccount();
      updateUIForLoggedInUser();
      toastr.success("Perfil actualizado exitosamente");
    }
  } catch (error) {
    console.error('Profile update error:', error);
    toastr.error("Error al actualizar perfil");
  }
}

/**
 * Actualizar contraseña de usuario
 */
async function updatePassword(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (currentPassword !== currentUser.password) {
    toastr.error("La contraseña actual es incorrecta");
    return;
  }

  if (newPassword !== confirmPassword) {
    toastr.error("Las nuevas contraseñas no coinciden");
    return;
  }

  try {
    const updatedUser = await dataService.updateUser(currentUser.id, { password: newPassword });
    
    if (updatedUser) {
      currentUser = updatedUser;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      
      event.target.closest(".modal").remove();
      toastr.success("Contraseña actualizada exitosamente");
    }
  } catch (error) {
    console.error('Password update error:', error);
    toastr.error("Error al actualizar contraseña");
  }
}

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Verificar si el usuario actual es proveedor
 */
function isProvider() {
  return currentUser && currentUser.accountType === 'provider';
}

/**
 * Verificar si el usuario actual es restaurante
 */
function isRestaurant() {
  return currentUser && currentUser.accountType === 'restaurant';
}

/**
 * Obtener usuario por ID (función utilitaria)
 */
async function getUserById(userId) {
  return await dataService.getUserById(userId);
}