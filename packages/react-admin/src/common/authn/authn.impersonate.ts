import { config } from '~common/config';
import { RestClient } from '~common/http';

export async function impersonateUser(userId: string, authnToken: any, onError: (error: any) => void) {
  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken?.accessToken}`,
  }));

  try {
    const response = await httpClient.post('/admin/user/impersonate', {
      body: {
        userId,
      },
    });
    console.log('impersonate response', response);
    window.open(response.data.url, '_blank');
  } catch (error) {
    onError(error);
  }
}

export async function impersonateBizUser(
  impersonatorId: string,
  userId: string,
  authnToken: any,
  onError: (error: any) => void,
) {
  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken?.accessToken}`,
  }));

  try {
    const response = await httpClient.post('/admin/biz/biz-user/impersonate', {
      body: {
        impersonatorId,
        impersonatingUserId: userId,
      },
    });
    console.log('impersonate response', response);
    window.open(response.data.url, '_blank');
  } catch (error) {
    onError(error);
  }
}
