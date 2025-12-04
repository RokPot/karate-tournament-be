import {
  CreateParams,
  CreateResult,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  QueryFunctionContext,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from 'react-admin';

import { RestClient } from '~common/http';

interface IPagination<TRecord extends RaRecord = any> {
  page?: number;
  cursor?: string | number;
  nextCursor?: string | number;
  limit: number;
  items: TRecord[];
  totalItems?: number;
}

/**
 * Resolve path parameters in the form of /path/:param1/:param2
 */
export function resolvePath(path: string, record: Record<string, any>) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => record[key]);
}

export function getList<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: GetListParams & QueryFunctionContext): Promise<GetListResult<TRecord>> => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || {};

    // Create a query object with pagination and sorting
    const query: Record<string, any> = {
      limit: perPage,
      page,
    };

    // Add sort parameters
    if (field) {
      query.order = `${order === 'DESC' ? '-' : ''}${field}`;
    }

    // Add filter as a nested object - our modified RestClient will handle
    // formatting it correctly with filter[key]=value notation
    if (params.filter && Object.keys(params.filter).length > 0) {
      query.filter = params.filter;
    }

    const { data }: { data: IPagination<TRecord> } = await httpClient.get(`${resolvePath(path, params)}`, { query });

    return {
      data: data.items,
      total: data.totalItems || 0,
    };
  };
}

export function post<T extends Record<string, any>>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: any): Promise<{ data: T }> => {
    const { data } = await httpClient.post<T>(resolvePath(path, { ...(params.data ?? {}), ...(params.record ?? {}) }), {
      body: params.data,
    });
    return { data };
  };
}

export function create<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: CreateParams<TRecord>): Promise<CreateResult<TRecord>> => {
    const { data } = await httpClient.post<TRecord>(resolvePath(path, params), { body: params.data });
    return { data };
  };
}

export function getOne<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: GetOneParams & QueryFunctionContext): Promise<GetOneResult<TRecord>> => {
    const { data } = await httpClient.get<TRecord>(resolvePath(path, params));
    return { data };
  };
}

export function getMany<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: GetManyParams & QueryFunctionContext): Promise<GetManyResult<TRecord>> => {
    const { data } = await httpClient.get<TRecord[]>(resolvePath(path, params), {
      query: { ids: params.ids },
    });
    return { data };
  };
}

export function getManyReference<TRecord extends RaRecord = any>(_httpClient: RestClient, _path: string) {
  return async (
    _resource: string,
    _params: GetManyReferenceParams & QueryFunctionContext,
  ): Promise<GetManyReferenceResult<TRecord>> => {
    throw new Error('Not implemented');
    /**
     * const { page, perPage } = params.pagination;
     *     const { field, order } = params.sort || {};
     *     const query = {
     *       ...params.filter,
     *       [params.target]: params.id,
     *       _sort: field,
     *       _order: order,
     *       _start: (page - 1) * perPage,
     *       _end: page * perPage,
     *     };
     *
     *     const { data, headers } = await httpClient.get<TRecord[]>(resource, { query });
     *     const total = headers?.['x-total-count'] ? parseInt(headers['x-total-count'], 10) : 0;
     *
     *     return {
     *       data,
     *       total,
     *     };
     */
  };
}

export function update<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: UpdateParams<TRecord>): Promise<UpdateResult<TRecord>> => {
    const { data } = await httpClient.put<TRecord>(resolvePath(path, params), { body: params.data });
    return { data };
  };
}

export function updateMany<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: UpdateManyParams<TRecord>): Promise<UpdateManyResult> => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient.put<TRecord>(`${resolvePath(path, params)}/${encodeURIComponent(id)}`, { body: params.data }),
      ),
    );
    return { data: responses.map((response) => response.data.id) };
  };
}

export function deleteOne<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: DeleteParams<TRecord>): Promise<DeleteResult<TRecord>> => {
    const { data } = await httpClient.delete<TRecord>(resolvePath(path, params), {});
    return { data };
  };
}

export function deleteMany<TRecord extends RaRecord = any>(httpClient: RestClient, path: string) {
  return async (_resource: string, params: DeleteManyParams<TRecord>): Promise<DeleteManyResult> => {
    const responses = await Promise.all(
      params.ids.map((id) => httpClient.delete<TRecord>(resolvePath(path, { id }), {})),
    );
    return { data: responses.map((response) => response.data.id) };
  };
}

export function upload(httpClient: RestClient, path: string) {
  return async (_resource: string, formData: FormData): Promise<{ data: any }> => {
    const uploadPath = resolvePath(path, {});
    // Use fetch directly for FormData to avoid JSON.stringify() being applied
    const response = await fetch(`${httpClient.baseURL}${uploadPath}`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(httpClient.headersGenerator?.() || {}),
        // Important: Don't set Content-Type here - the browser will set it with the correct boundary for FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      console.error('Upload error response:', errorData);
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return { data };
  };
}

export const simpleApiDataProviderMethods = {
  getList,
  getOne,
  getMany,
  getManyReference,
  create,
  update,
  updateMany,
  delete: deleteOne,
  deleteMany,
  upload,
};
