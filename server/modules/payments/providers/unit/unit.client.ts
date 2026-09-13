export interface UnitJsonApiRequest<T = any> {
  data: {
    type: string;
    id?: string;
    attributes: T;
    relationships?: Record<string, { data: { type: string; id: string } | { type: string; id: string }[] }>;
  };
}

export interface UnitJsonApiResponse<T = any> {
  data: {
    type: string;
    id: string;
    attributes: T;
    relationships?: Record<string, any>;
  } | Array<{
    type: string;
    id: string;
    attributes: T;
    relationships?: Record<string, any>;
  }>;
  included?: any[];
  meta?: any;
  errors?: Array<{
    title: string;
    detail?: string;
    status: string;
    code?: string;
  }>;
}

export class UnitClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly isMock: boolean;

  constructor() {
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile();
      } catch {}
    }

    this.baseUrl = process.env.UNIT_API_URL || "https://api.s.unit.sh";
    this.token = process.env.UNIT_API_TOKEN || "";
    // If no token or explicit mock flag is set
    this.isMock = !this.token || process.env.UNIT_MOCK_MODE === "true";

    if (!this.isMock) {
      console.log(`[UnitClient] Initialized with endpoint ${this.baseUrl}`);
    } else {
      console.log("[UnitClient] Initialized in local sandbox simulation mode");
    }
  }

  public isMockMode(): boolean {
    return this.isMock;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string {
    return this.token;
  }

  public async request<T = any>(
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: any,
    idempotencyKey?: string
  ): Promise<UnitJsonApiResponse<T>> {
    if (this.isMock) {
      throw new Error(`Running in mock mode, external Unit API request skipped for ${path}`);
    }

    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
    };

    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    // Retries with backoff for transient issues
    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) {
          const errMsg = data.errors?.map((e: any) => `${e.title}: ${e.detail || e.code || e.status}`).join("; ") || res.statusText;
          const error: any = new Error(`Unit API error (${res.status}): ${errMsg}`);
          error.status = res.status;
          error.unitErrors = data.errors;
          throw error;
        }

        return data;
      } catch (err: any) {
        lastError = err;
        // Don't retry client 4xx errors except 429 rate limits
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
          throw err;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 400));
        }
      }
    }

    throw lastError;
  }

  public async get<T = any>(path: string): Promise<UnitJsonApiResponse<T>> {
    return this.request<T>(path, "GET");
  }

  public async post<T = any>(path: string, body: any, idempotencyKey?: string): Promise<UnitJsonApiResponse<T>> {
    return this.request<T>(path, "POST", body, idempotencyKey);
  }

  public async patch<T = any>(path: string, body: any): Promise<UnitJsonApiResponse<T>> {
    return this.request<T>(path, "PATCH", body);
  }
}

export const unitClient = new UnitClient();
