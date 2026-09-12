import axios from 'axios';

const getBaseUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (import.meta.env.PROD) {
        // Skip obviously invalid/placeholder values
        const isInvalid =
            !envUrl ||
            envUrl.includes("localhost") ||
            envUrl.includes("127.0.0.1") ||
            envUrl.includes("your-backend-project");

        if (isInvalid) {
            // This will only work if frontend and backend are on the same Vercel domain,
            // which is NOT the case for separate deployments.
            // ACTION REQUIRED: Set VITE_API_URL in Vercel dashboard for the client project.
            console.error(
                "[QuickDine] CRITICAL: VITE_API_URL is not configured for production.\n" +
                "Set it to your backend URL in:\n" +
                "  1. client/.env.production file, OR\n" +
                "  2. Vercel Dashboard → client project → Settings → Environment Variables\n" +
                "Example value: https://your-quickdine-server.vercel.app/api"
            );
            return "/api";
        }
        return envUrl;
    }

    // Development: use env var or fall back to localhost
    return envUrl || "http://localhost:5000/api";
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 — clear stale auth on protected pages
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            const protectedPaths = ["/dashboard", "/booking", "/owner", "/admin"];
            if (protectedPaths.some((p) => currentPath.startsWith(p))) {
                localStorage.removeItem("token");
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default api;