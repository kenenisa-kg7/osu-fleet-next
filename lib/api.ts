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

export async function getAdminTripRequests(status = "") {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams({ page: "1", limit: "50" });
  if (status) query.set("status", status);

  const response = await fetch(
    `${API_URL}/admin/trip-requests?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

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

export async function decideTripRequest(
  tripId: string,
  status: "approved" | "rejected"
) {
  const token = getToken();

  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_URL}/admin/trip-requests/${tripId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update trip request");
  }

  return body.tripRequest;
}
export type Vehicle = {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  manufacture_year?: number | null;
  capacity: number;
  status: "available" | "assigned" | "maintenance" | "inactive";
  created_at: string;
  updated_at: string;
};

export async function getVehicles(status = "") {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const query = new URLSearchParams({ page: "1", limit: "100" });
  if (status) query.set("status", status);
  const response = await fetch(`${API_URL}/admin/vehicles?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = await response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }
  if (!response.ok) throw new Error(body.message || "Could not load vehicles");
  return body as { vehicles: Vehicle[]; pagination: { total: number } };
}

export async function createVehicle(input: {
  registrationNumber: string;
  make: string;
  model: string;
  manufactureYear?: number;
  capacity: number;
}) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API_URL}/admin/vehicles`, {
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
  if (!response.ok) throw new Error(body.message || "Could not create vehicle");
  return body.vehicle as Vehicle;
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: "available" | "maintenance" | "inactive"
) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(
    `${API_URL}/admin/vehicles/${vehicleId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );
  const body = await response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }
  if (!response.ok) throw new Error(body.message || "Could not update vehicle");
  return body.vehicle as Vehicle;
}

export async function getDriverTripRequests() {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API_URL}/driver/trip-requests?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = await response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }
  if (!response.ok) throw new Error(body.message || "Could not load assigned trips");
  return body as { tripRequests: TripRequest[] };
}

export async function updateDriverTripStatus(
  tripId: string,
  status: "in_progress"
) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(
    `${API_URL}/driver/trip-requests/${tripId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );
  const body = await response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }
  if (!response.ok) throw new Error(body.message || "Could not update trip status");
  return body.tripRequest as TripRequest;
}

export async function completeDriverTrip(
  tripId: string,
  endMileage: number,
  completionNotes: string
) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(
    `${API_URL}/driver/trip-requests/${tripId}/complete`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endMileage, completionNotes }),
    }
  );
  const body = await response.json();
  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }
  if (!response.ok) throw new Error(body.message || "Could not complete trip");
  return body.tripRequest as TripRequest;
}

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  related_trip_request_id?: string | null;
  related_vehicle_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export async function getNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not load notifications");

  return body;
}

export async function markNotificationRead(notificationId: string) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not update notification");

  return body.notification as { id: string; is_read: boolean };
}