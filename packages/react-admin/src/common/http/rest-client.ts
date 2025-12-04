export class RestError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly cause?: unknown;
  public readonly errors?: Record<string, { type: string; message: string }>;
  constructor(input: string | object, data?: { cause?: Error; code?: string; status?: number }) {
    if (typeof input === 'string') {
      super(input);
      this.code = data?.code ?? 'unknown';
      this.cause = data?.cause;
      return;
    } else {
      super(
        input && 'message' in input && typeof input.message === 'string'
          ? input.message
          : 'toString' in input
            ? input.toString()
            : 'unknown',
      );
      this.code = data?.code || ('code' in input && typeof input.code === 'string' ? input.code : 'unknown');
      this.cause = data;
      if ('errors' in input) {
        // fingers crossed
        this.errors = input.errors as Record<string, { type: string; message: string }>;
      }
    }
  }
}

interface FullResponse<Response> {
  data: Response;
  headers: Record<string, any>;
}

export class RestClient {
  constructor(
    public readonly baseURL: string,
    public readonly headersGenerator?: () => Record<string, any>,
  ) {}

  public get<
    Response extends Record<string, any> = Record<string, any>,
    RequestQuery extends Record<string, any> = Record<string, any>,
  >(
    path: string,
    payload?: {
      query?: RequestQuery;
      accessToken?: string | null;
    },
    requestInit?: RequestInit,
  ): Promise<FullResponse<Response>> {
    return this.request<Response, never, RequestQuery>('GET', path, payload, requestInit);
  }

  public post<
    Response extends Record<string, any> = Record<string, any>,
    RequestBody extends Record<string, any> = Record<string, any>,
    RequestQuery extends Record<string, any> = Record<string, any>,
  >(
    path: string,
    payload: {
      body?: RequestBody;
      query?: RequestQuery;
      accessToken?: string | null;
    },
    requestInit?: RequestInit,
  ): Promise<FullResponse<Response>> {
    return this.request<Response, RequestBody, RequestQuery>('POST', path, payload, requestInit);
  }

  public put<
    Response extends Record<string, any> = Record<string, any>,
    RequestBody extends Record<string, any> = Record<string, any>,
    RequestQuery extends Record<string, any> = Record<string, any>,
  >(
    path: string,
    payload: {
      body?: RequestBody;
      query?: RequestQuery;
      accessToken?: string | null;
    },
    requestInit?: RequestInit,
  ): Promise<FullResponse<Response>> {
    return this.request<Response, RequestBody, RequestQuery>('PUT', path, payload, requestInit);
  }

  public delete<
    Response extends Record<string, any> = Record<string, any>,
    RequestBody extends Record<string, any> = Record<string, any>,
    RequestQuery extends Record<string, any> = Record<string, any>,
  >(
    path: string,
    payload: {
      body?: RequestBody;
      query?: RequestQuery;
      accessToken?: string | null;
    },
    requestInit?: RequestInit,
  ): Promise<FullResponse<Response>> {
    return this.request<Response, RequestBody, RequestQuery>('DELETE', path, payload, requestInit);
  }

  public async request<
    Response extends Record<string, any> = Record<string, any>,
    RequestBody extends Record<string, any> = Record<string, any>,
    RequestQuery extends Record<string, any> = Record<string, any>,
  >(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    payload: {
      body?: RequestBody;
      query?: RequestQuery;
      accessToken?: string | null;
    } = {},
    requestInit?: RequestInit,
  ): Promise<FullResponse<Response>> {
    let response;
    try {
      // Build URL with query parameters if they exist
      let url = `${this.baseURL}${path}`;

      if (payload.query && Object.keys(payload.query).length > 0) {
        // Special handling for NestJS filter objects
        const queryObject: Record<string, string> = {};

        Object.entries(payload.query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'filter') {
              // For filter objects, send as URL-encoded object notation with brackets
              // For example: filter[year]=2023&filter[uploadedFromFileType]=msa
              if (typeof value === 'object' && value !== null) {
                Object.entries(value as Record<string, any>).forEach(([filterKey, filterValue]) => {
                  if (filterValue !== undefined && filterValue !== null) {
                    queryObject[`filter[${filterKey}]`] = String(filterValue);
                  }
                });
              }
            } else {
              // Other parameters are handled normally
              queryObject[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
            }
          }
        });

        const searchParams = new URLSearchParams();
        Object.entries(queryObject).forEach(([key, value]) => {
          searchParams.append(key, value);
        });

        const queryString = searchParams.toString();
        if (queryString) {
          url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
        }
      }

      response = await fetch(url, {
        ...requestInit,
        method,
        ...(payload.body ? { body: JSON.stringify(payload.body) } : {}),
        headers: {
          'Content-Type': 'application/json',
          ...(this.headersGenerator?.() || {}),
          ...(requestInit?.headers ? requestInit.headers : {}),
          ...(payload.accessToken ? { Authorization: `Bearer ${payload.accessToken}` } : {}),
        },
      });
    } catch (e: any) {
      if (e instanceof RestError) {
        throw e;
      }
      throw new RestError(e, { code: 'network-error', status: response?.status });
    }
    let data;

    if (response.status === 204) {
      return { data: {} as Response, headers: Object.fromEntries(response.headers.entries()) };
    }

    try {
      data = await response.json();
    } catch (e: any) {
      throw new RestError('Invalid response', { code: 'invalid-response', cause: e, status: response?.status });
    }

    if (response?.ok) {
      return { data, headers: Object.fromEntries(response.headers.entries()) };
    }
    throw new RestError(data);
  }
}
