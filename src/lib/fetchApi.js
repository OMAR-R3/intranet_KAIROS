export async function fetchApi(url, options = {}) {
    const token = sessionStorage.getItem("token");

    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(token && { "Authorization": `Bearer ${token}` }),
            ...options.headers
        }
    });

    // Si el token expiró o es inválido, redirigir al login
    if (res.status === 401) {
        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("token");
        window.location.href = "/login";
        return res;
    }

    return res;
}