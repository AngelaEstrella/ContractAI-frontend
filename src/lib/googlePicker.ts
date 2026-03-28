const GOOGLE_API_SCRIPT_ID = "google-api-script";
const GOOGLE_GIS_SCRIPT_ID = "google-gis-script";
const GOOGLE_API_SCRIPT_SRC = "https://apis.google.com/js/api.js";
const GOOGLE_GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_ACCESS_TOKEN_BUFFER_MS = 30_000;
const GOOGLE_INTERACTIVE_ERROR_CODES = new Set([
  "account_selection_required",
  "consent_required",
  "interaction_required",
  "login_required",
]);

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const scriptPromises = new Map<string, Promise<void>>();
let pickerLibraryPromise: Promise<void> | null = null;

export type GooglePickerFile = {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
};

type GooglePickerConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};

type OpenGooglePickerOptions = {
  accessToken?: string | null;
  accessTokenExpiresAt?: number | null;
  loginHint?: string | null;
};

export type OpenGooglePickerResult = {
  accessToken: string;
  accessTokenExpiresAt: number | null;
  files: GooglePickerFile[];
};

type GoogleOAuthError = Error & {
  code?: string;
};

type GooglePickerAccessToken = {
  accessToken: string;
  accessTokenExpiresAt: number | null;
};

function getGooglePickerConfig(): GooglePickerConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;

  if (!clientId || !apiKey || !appId) {
    throw new Error("Faltan las variables de entorno de Google Picker en el frontend.");
  }

  return { clientId, apiKey, appId };
}

function loadScript(id: string, src: string, checkReady: () => boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Picker solo puede cargarse en el navegador."));
  }

  if (checkReady()) {
    return Promise.resolve();
  }

  const existingPromise = scriptPromises.get(id);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(id) as HTMLScriptElement | null;
    if (checkReady() || existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => {
      script.dataset.loaded = "true";
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      scriptPromises.delete(id);
      reject(new Error(`No se pudo cargar el script externo: ${src}`));
    };

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (!existingScript) {
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  scriptPromises.set(id, promise);
  return promise;
}

async function ensureGooglePickerReady(): Promise<void> {
  await Promise.all([
    loadScript(GOOGLE_API_SCRIPT_ID, GOOGLE_API_SCRIPT_SRC, () => Boolean(window.gapi)),
    loadScript(
      GOOGLE_GIS_SCRIPT_ID,
      GOOGLE_GIS_SCRIPT_SRC,
      () => Boolean(window.google?.accounts?.oauth2),
    ),
  ]);

  if (!pickerLibraryPromise) {
    pickerLibraryPromise = new Promise<void>((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error("La libreria base de Google API no estuvo disponible."));
        return;
      }

      if (window.google?.picker) {
        resolve();
        return;
      }

      window.gapi.load("picker", {
        callback: () => resolve(),
        onerror: () => {
          pickerLibraryPromise = null;
          reject(new Error("No se pudo cargar la libreria de Google Picker."));
        },
        timeout: 10_000,
        ontimeout: () => {
          pickerLibraryPromise = null;
          reject(new Error("La carga de Google Picker excedio el tiempo limite."));
        },
      });
    });
  }

  await pickerLibraryPromise;
}

function createGoogleOAuthError(code?: string, description?: string): GoogleOAuthError {
  const error = new Error(description ?? code ?? "No se pudo obtener un access token valido de Google.") as GoogleOAuthError;
  error.name = "GoogleOAuthError";
  error.code = code;
  return error;
}

function getGoogleAuthPopupErrorMessage(type?: string): string {
  switch (type) {
    case "popup_closed":
      return "Se cerro la ventana de autorizacion de Google antes de completar el proceso.";
    case "popup_failed_to_open":
      return "El navegador bloqueo la ventana de autorizacion de Google.";
    default:
      return "No se pudo completar la autorizacion con Google.";
  }
}

function hasFreshAccessToken(accessToken?: string | null, accessTokenExpiresAt?: number | null): accessToken is string {
  if (!accessToken || typeof accessTokenExpiresAt !== "number") {
    return false;
  }

  return accessTokenExpiresAt - GOOGLE_ACCESS_TOKEN_BUFFER_MS > Date.now();
}

function shouldRetryInteractively(error: unknown): boolean {
  return error instanceof Error && "code" in error && typeof error.code === "string"
    ? GOOGLE_INTERACTIVE_ERROR_CODES.has(error.code)
    : false;
}

function requestAccessToken(prompt: "" | "consent", loginHint?: string | null): Promise<GooglePickerAccessToken> {
  const { clientId } = getGooglePickerConfig();

  return new Promise<GooglePickerAccessToken>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      login_hint: loginHint ?? undefined,
      callback: (response) => {
        if (response.error) {
          reject(createGoogleOAuthError(response.error, response.error_description));
          return;
        }

        if (!response.access_token) {
          reject(createGoogleOAuthError(undefined, "Google no devolvio un access token valido."));
          return;
        }

        resolve({
          accessToken: response.access_token,
          accessTokenExpiresAt:
            typeof response.expires_in === "number" ? Date.now() + response.expires_in * 1_000 : null,
        });
      },
      error_callback: (error) => {
        reject(createGoogleOAuthError(error.type, getGoogleAuthPopupErrorMessage(error.type)));
      },
    });

    if (!tokenClient) {
      reject(new Error("No se pudo inicializar el cliente OAuth de Google."));
      return;
    }

    tokenClient.requestAccessToken({
      prompt,
      login_hint: loginHint ?? undefined,
    });
  });
}

async function resolveAccessToken(options: OpenGooglePickerOptions): Promise<GooglePickerAccessToken> {
  if (hasFreshAccessToken(options.accessToken, options.accessTokenExpiresAt)) {
    return {
      accessToken: options.accessToken,
      accessTokenExpiresAt: options.accessTokenExpiresAt ?? null,
    };
  }

  try {
    return await requestAccessToken("", options.loginHint);
  } catch (error) {
    if (!shouldRetryInteractively(error)) {
      throw error;
    }
  }

  return requestAccessToken("consent", options.loginHint);
}

function showPicker(accessToken: string): Promise<GooglePickerFile[] | null> {
  const { apiKey, appId } = getGooglePickerConfig();
  const googleClient = window.google;

  return new Promise<GooglePickerFile[] | null>((resolve, reject) => {
    if (!googleClient?.picker) {
      reject(new Error("Google Picker no estuvo disponible despues de cargar los scripts."));
      return;
    }

    const docsView = new googleClient.picker.DocsView(googleClient.picker.ViewId.DOCS)
      .setIncludeFolders(true);

    const picker = new googleClient.picker.PickerBuilder()
      .addView(docsView)
      .enableFeature(googleClient.picker.Feature.MULTISELECT_ENABLED)
      .enableFeature(googleClient.picker.Feature.SUPPORT_DRIVES)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .setCallback((data) => {
        const action = data[googleClient.picker.Response.ACTION];

        if (action === googleClient.picker.Action.CANCEL) {
          resolve(null);
          return;
        }

        if (action !== googleClient.picker.Action.PICKED) {
          return;
        }

        const rawDocuments = data[googleClient.picker.Response.DOCUMENTS];
        const documents = Array.isArray(rawDocuments)
          ? (rawDocuments as Array<Record<string, unknown>>)
          : [];

        const files = documents
          .map((document) => ({
            id: String(document[googleClient.picker.Document.ID] ?? ""),
            name: String(document[googleClient.picker.Document.NAME] ?? "Archivo sin nombre"),
            mimeType: String(document[googleClient.picker.Document.MIME_TYPE] ?? ""),
            url:
              typeof document[googleClient.picker.Document.URL] === "string"
                ? String(document[googleClient.picker.Document.URL])
                : undefined,
          }))
          .filter((file) => file.id.length > 0);

        resolve(files);
      })
      .build();

    picker.setVisible(true);
  });
}

export async function openGooglePicker(
  options: OpenGooglePickerOptions = {},
): Promise<OpenGooglePickerResult | null> {
  await ensureGooglePickerReady();
  const { accessToken, accessTokenExpiresAt } = await resolveAccessToken(options);
  const files = await showPicker(accessToken);

  if (!files) {
    return null;
  }

  return { accessToken, accessTokenExpiresAt, files };
}
