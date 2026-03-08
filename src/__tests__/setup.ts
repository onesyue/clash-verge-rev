/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

// Polyfill localStorage for Node 22+ (which has a partial localStorage without clear())
if (
  typeof globalThis.localStorage !== "undefined" &&
  !globalThis.localStorage.clear
) {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (i: number) => [...store.keys()][i] ?? null,
    },
    writable: true,
    configurable: true,
  });
}

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

vi.mock("tauri-plugin-mihomo-api", () => ({
  getVersion: vi.fn(() => Promise.resolve({ premium: true, version: "test" })),
  getClashConfig: vi.fn(() => Promise.resolve({})),
  getProxies: vi.fn(() => Promise.resolve({ proxies: {} })),
  closeAllConnections: vi.fn(() => Promise.resolve()),
  MihomoWebSocket: { cleanupAll: vi.fn() },
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

// Mock react-router
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/", search: "", hash: "" }),
  };
});
