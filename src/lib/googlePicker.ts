const GOOGLE_API_SCRIPT_ID = "google-api-script";
const GOOGLE_GIS_SCRIPT_ID = "google-gis-script";
const GOOGLE_API_SCRIPT_SRC = "https://apis.google.com/js/api.js";
const GOOGLE_GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

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
};

export type OpenGooglePickerResult = {
  accessToken: string;
  files: GooglePickerFile[];
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

function requestAccessToken(existingAccessToken?: string | null): Promise<string> {
  const { clientId } = getGooglePickerConfig();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google no devolvio un access token valido."));
          return;
        }

        resolve(response.access_token);
      },
    });

    if (!tokenClient) {
      reject(new Error("No se pudo inicializar el cliente OAuth de Google."));
      return;
    }

    tokenClient.requestAccessToken({ prompt: existingAccessToken ? "" : "consent" });
  });
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
  const accessToken = await requestAccessToken(options.accessToken);
  const files = await showPicker(accessToken);

  if (!files) {
    return null;
  }

  return { accessToken, files };
}
