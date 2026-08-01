export const API_URL = "";

export const endpoints = {
    // Auth
    login: `/api/auth/login`,
    logout: `/api/auth/logout`,
    me: `/api/auth/me`,
    // Visitas
    visits: `/api/visits`,
    visitStatus: (id) => `/api/visits/${id}/status`,
    validateQR: `/api/visits/validate`,
    registerInternal: `/api/visits/register-internal`,
    // Departamentos
    department: `/api/department`,
    // Usuarios internos
    internUsers: `/api/intern_users`,
    // Logs
    logs: `/api/logs`,
    refresh: `/api/auth/refresh`,
    forgotPassword: `/api/auth/forgot-password`,
    resetPassword: `/api/auth/reset-password`
};

export const fetchConfig = (token) => ({
    headers: {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` })
    },
    credentials: "include"
});