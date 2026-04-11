export const API_URL = "https://unexcused-temerariously-daria.ngrok-free.dev";

export const endpoints = {
    // Auth
    login: `${API_URL}/api/auth/login`,
    logout: `${API_URL}/api/auth/logout`,
    me: `${API_URL}/api/auth/me`,
    // Visitas
    visits: `${API_URL}/api/visits`,
    visitStatus: (id) => `${API_URL}/api/visits/${id}/status`,
    validateQR: `${API_URL}/api/visits/validate`,
    registerInternal: `${API_URL}/api/visits/register-internal`,
    // Departamentos
    department: `${API_URL}/api/department`,
    // Usuarios internos
    internUsers: `${API_URL}/api/intern_users`,
    // Logs
    logs: `${API_URL}/api/logs`,
    refresh: `${API_URL}/api/auth/refresh`,
    forgotPassword: `${API_URL}/api/auth/forgot-password`,
    resetPassword: `${API_URL}/api/auth/reset-password`
};

export const fetchConfig = (token) => ({
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token && { "Authorization": `Bearer ${token}` })
    },
    credentials: "include"
});