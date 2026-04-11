# Proyecto Kairos — Intranet Dashboard

Sistema de control de visitas presenciales desarrollado como proyecto académico. Este repositorio contiene el dashboard de administración (Intranet) construido con Next.js, para uso exclusivo del personal interno de la institución.

---

## 🧰 Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 15 | Framework principal del dashboard |
| React 19 | Componentes de interfaz de usuario |
| jsQR | Lectura de códigos QR desde la cámara |
| sessionStorage | Persistencia del token JWT durante la sesión |
| ngrok | Conexión con el backend en red local |

---

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── layout.js                   # Layout global
│   │   ├── page.js                     # Redirige a /login
│   │   ├── login/
│   │   │   └── page.js                 # Pantalla de inicio de sesión
│   │   ├── forgot-password/
│   │   │   └── page.js                 # Solicitar recuperación de contraseña
│   │   ├── reset-password/
│   │   │   └── page.js                 # Restablecer contraseña con token
│   │   └── dashboard/
│   │       ├── layout.js               # Layout con sidebar y verificación de sesión
│   │       ├── page.js                 # Lista de visitas con filtros y acciones
│   │       ├── validate/
│   │       │   └── page.js             # Validar QR con cámara o manual
│   │       ├── departments/
│   │       │   └── page.js             # CRUD de departamentos
│   │       ├── users/
│   │       │   └── page.js             # CRUD de usuarios internos
│   │       └── logs/
│   │           └── page.js             # Historial de logs del sistema
│   ├── config/
│   │   └── api.js                      # URLs centralizadas del backend
│   └── lib/
│       └── fetchApi.js                 # Wrapper de fetch con token automático
├── package.json
└── .env.local                          # Variables de entorno (no se sube a git)
```

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/OMAR-R3/intranet_KAIROS.git
cd kairos-intranet

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
# No se requieren variables de entorno adicionales,
# la URL del backend se configura directamente en src/config/api.js

# 4. Configurar la URL del backend en src/config/api.js
# Cambiar API_URL por la URL de ngrok o la URL del servidor

# 5. Iniciar en modo desarrollo
npm run dev
```

El dashboard quedará disponible en `http://localhost:3001`.

---

## 🔗 Configuración del Backend

Edita el archivo `src/config/api.js` y actualiza la URL del backend:

```javascript
export const API_URL = "https://tu-url-de-ngrok.ngrok-free.app";
// o en producción:
// export const API_URL = "https://api.tu-dominio.com";
```

> ⚠️ Si la URL de ngrok cambia, solo es necesario actualizar este archivo.

---

## 🔐 Sistema de Autenticación

El dashboard utiliza **JWT** almacenado en `sessionStorage` para autenticar todas las peticiones al backend.

### Flujo de autenticación
1. El usuario ingresa sus credenciales en `/login`
2. El backend valida y devuelve un token JWT
3. El token se guarda en `sessionStorage`
4. Todas las peticiones incluyen el token en el header `Authorization: Bearer <token>`
5. Si el token expira, el sistema redirige automáticamente a `/login`

### Protección de rutas
- El **layout del dashboard** verifica que exista sesión activa al cargar
- Cada **página restringida** verifica el rol del usuario y redirige si no tiene acceso
- **`fetchApi`** detecta respuestas 401 y redirige al login automáticamente

---

## 👥 Roles y Módulos

| Módulo | Administrador | Recepcionista | Guardia |
|---|---|---|---|
| Ver visitas | ✅ | ✅ | ✅ |
| Aprobar visita | ✅ | ✅ | ❌ |
| Cancelar / Finalizar | ✅ | ✅ | ✅ |
| Validar QR | ✅ | ✅ | ✅ |
| Departamentos | ✅ | ❌ | ❌ |
| Usuarios internos | ✅ | ❌ | ❌ |
| Logs del sistema | ✅ | ❌ | ❌ |

---

## ⏱️ Control de Sesiones

- **Duración:** 8 horas por sesión
- **Cuenta regresiva:** visible en tiempo real en el sidebar
- **Aviso:** indicador naranja cuando quedan menos de 10 minutos
- **Renovación automática:** el token se renueva sin intervención cuando quedan 30 minutos
- **Multisesiones:** permitidas — cada dispositivo tiene su propio token independiente
- **Dispositivo:** el navegador detectado se muestra en el sidebar

---

## 🔑 Recuperación de Contraseña

1. El usuario accede a `/forgot-password` desde el link en el login
2. Ingresa su correo institucional registrado
3. Recibe un correo con un enlace válido por **15 minutos**
4. Accede al enlace e ingresa su nueva contraseña
5. El sistema actualiza la contraseña y redirige al login

---

## 📦 Dependencias Principales

```json
{
  "next": "15.x",
  "react": "19.x",
  "react-dom": "19.x",
  "jsqr": "latest"
}
```

---

## 👥 Equipo

Proyecto académico — DS03SV-25
Materia: Desarrollo de Sitios Web Dinámicos  
Profesor: Héctor Saldaña Benítez

- Estrada Fragoso César Eduardo
- García Cruz José Omar
- Hernández Orozco Antonio Jesús
- Ruiz Loredo Miriam Wendoline