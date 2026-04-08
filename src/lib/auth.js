import { endpoints, fetchConfig } from "@/config/api";

export async function getMe() {
    try {
        const res = await fetch(endpoints.me, {
            ...fetchConfig(),
            credentials: "include"
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
    } catch {
        return null;
    }
}