
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5106';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Не вдалося підключитися до сервера. Перевірте з’єднання або спробуйте пізніше.'
      );
    }

    throw error;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API request failed: ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
