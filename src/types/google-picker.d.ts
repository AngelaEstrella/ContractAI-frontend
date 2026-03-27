declare global {
  interface Window {
    gapi?: GoogleApiLoader;
    google?: GoogleClientNamespace;
  }
}

interface GoogleApiLoader {
  load(apiName: string, callback: GoogleApiLoadCallback | (() => void)): void;
}

interface GoogleApiLoadCallback {
  callback: () => void;
  onerror?: () => void;
  timeout?: number;
  ontimeout?: () => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  prompt?: string;
  token_type?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
}

interface GoogleAccountsNamespace {
  oauth2: {
    initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
  };
}

interface GooglePickerDocsView {
  setIncludeFolders(includeFolders: boolean): GooglePickerDocsView;
}

interface GooglePickerInstance {
  setVisible(visible: boolean): void;
}

interface GooglePickerBuilder {
  addView(view: GooglePickerDocsView): GooglePickerBuilder;
  enableFeature(feature: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setCallback(callback: (data: GooglePickerCallbackData) => void): GooglePickerBuilder;
  build(): GooglePickerInstance;
}

interface GooglePickerCallbackData {
  [key: string]: unknown;
}

interface GooglePickerNamespace {
  DocsView: new (viewId: string) => GooglePickerDocsView;
  PickerBuilder: new () => GooglePickerBuilder;
  ViewId: {
    DOCS: string;
  };
  Feature: {
    MULTISELECT_ENABLED: string;
    SUPPORT_DRIVES: string;
  };
  Action: {
    PICKED: string;
    CANCEL: string;
  };
  Response: {
    ACTION: string;
    DOCUMENTS: string;
  };
  Document: {
    ID: string;
    NAME: string;
    MIME_TYPE: string;
    URL: string;
  };
}

interface GoogleClientNamespace {
  accounts: GoogleAccountsNamespace;
  picker: GooglePickerNamespace;
}

export {};
