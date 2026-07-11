type GoogleCredentialResponse = {
  credential?: string;
};

type GsiButtonConfiguration = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? "";
}

export function isGoogleSignInConfigured(): boolean {
  const id = getGoogleClientId();
  return Boolean(id) && !id.startsWith("your_");
}

export function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function mountGoogleSignInButton(
  parent: HTMLElement,
  onCredential: (idToken: string) => void | Promise<void>,
  onError?: (message: string) => void,
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!isGoogleSignInConfigured()) return false;

  try {
    await loadGoogleScript();
  } catch {
    onError?.("GOOGLE_SCRIPT_UNAVAILABLE");
    return false;
  }

  if (!window.google?.accounts?.id) {
    onError?.("GOOGLE_SCRIPT_UNAVAILABLE");
    return false;
  }

  parent.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response.credential) {
        onError?.("GOOGLE_NO_CREDENTIAL");
        return;
      }
      void onCredential(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  const width = Math.max(240, Math.floor(parent.clientWidth || parent.parentElement?.clientWidth || 320));
  window.google.accounts.id.renderButton(parent, {
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    width,
  });

  return true;
}
