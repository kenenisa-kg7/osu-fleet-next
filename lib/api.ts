const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "osu_fleet_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "Login failed");
  }

  localStorage.setItem(TOKEN_KEY, body.token);
  return body.user;
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    clearToken();
    return null;
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "Could not restore session");
  }

  return body.user;
}

export async function logout() {
  const token = getToken();

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }

  clearToken();
}

export type FleetSummary = {
  generatedAt: string;
  trips: {
    total: number;
    pending: number;
    approved: number;
    assigned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  vehicles: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    inactive: number;
  };
  notifications: {
    unread: number;
  };
};

export async function getFleetSummary(): Promise<FleetSummary> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/admin/fleet-summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load fleet summary");
  }

  return body;
}

export type TripRequest = {
  id: string;
  purpose: string;
  origin: string;
  destination: string;
  pickup_time: string;
  passengers: number;
  requested_by: string;
  department: string;
  status: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  created_at: string;
};

export type TripRequestPage = {
  tripRequests: TripRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateTripRequestInput = {
  purpose: string;
  origin: string;
  destination: string;
  pickupTime: string;
  passengers: number;
  department: string;
  durationMinutes?: number;
};

export async function getMyTripRequests(): Promise<TripRequestPage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/trip-requests?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load trip requests");
  }

  return body;
}

export async function createTripRequest(input: CreateTripRequestInput) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/trip-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not create trip request");
  }

  return body.tripRequest as TripRequest;
}