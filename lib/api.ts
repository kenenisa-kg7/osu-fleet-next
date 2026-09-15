const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "osu_fleet_token";
import type { UserRole } from "../types/auth";

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
export type CentralFleetCampusSummary = {
  campus_id: string;
  campus_name: string;
  campus_code: string;
  city: string;
  total_vehicles: number;
  available_vehicles: number;
  assigned_vehicles: number;
  maintenance_vehicles: number;
  inactive_vehicles: number;
  total_trips: number;
  pending_trips: number;
  approved_trips: number;
  assigned_trips: number;
  in_progress_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  transport_count: number;
};

export type CentralFleetSummary = {
  generatedAt: string;
  totals: {
    vehicles: number;
    availableVehicles: number;
    assignedVehicles: number;
    maintenanceVehicles: number;
    inactiveVehicles: number;
    trips: number;
    pendingTrips: number;
    approvedTrips: number;
    assignedTrips: number;
    inProgressTrips: number;
    completedTrips: number;
    cancelledTrips: number;
  };
  campuses: CentralFleetCampusSummary[];
};

export type CentralUtilizationReport = {
  generatedAt: string;
  summary: {
    total_vehicles: number;
    vehicles_used: number;
    total_trips: number;
    completed_trips: number;
    active_trips: number;
    utilization_percentage: number | string;
  };
  campuses: {
    campus_id: string;
    campus_name: string;
    campus_code: string;
    city: string;
    total_vehicles: number;
    vehicles_used: number;
    total_trips: number;
    completed_trips: number;
    active_trips: number;
    utilization_percentage: number | string;
  }[];
};



export async function getCentralFleetSummary(): Promise<CentralFleetSummary> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/central/fleet-summary`, {
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
    throw new Error(body.message || "Could not load central fleet summary");
  }

  return body;
}

export async function getCentralFuelReport(filters?: {
  campusId?: string;
  from?: string;
  to?: string;
}): Promise<CentralFuelReport> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams();

  if (filters?.campusId) {
    query.set("campusId", filters.campusId);
  }

  if (filters?.from) {
    query.set("from", filters.from);
  }

  if (filters?.to) {
    query.set("to", filters.to);
  }

  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/central/fuel-report${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load central fuel report");
  }

  return body as CentralFuelReport;
}

export async function getCentralUtilizationReport(filters?: {
  campusId?: string;
  from?: string;
  to?: string;
}): Promise<CentralUtilizationReport> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams();

  if (filters?.campusId) {
    query.set("campusId", filters.campusId);
  }

  if (filters?.from) {
    query.set("from", filters.from);
  }

  if (filters?.to) {
    query.set("to", filters.to);
  }

  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/central/utilization-report${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(
      body.message || "Could not load vehicle utilization report"
    );
  }

  return body as CentralUtilizationReport;
}



export async function getCentralMaintenanceReport(filters?: {
  campusId?: string;
  from?: string;
  to?: string;
}): Promise<CentralMaintenanceReport> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams();

  if (filters?.campusId) {
    query.set("campusId", filters.campusId);
  }

  if (filters?.from) {
    query.set("from", filters.from);
  }

  if (filters?.to) {
    query.set("to", filters.to);
  }

  const queryString = query.toString();

  const response = await fetch(
    `${API_URL}/central/maintenance-report${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(
      body.message || "Could not load central maintenance report"
    );
  }

  return body as CentralMaintenanceReport;
}

export async function createMaintenanceRecord(
  vehicleId: string,
  input: {
    maintenanceType: "inspection" | "service" | "repair" | "accident";
    description: string;
    performedAt: string;
    mileage?: number;
    cost: number;
  }
) {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/admin/vehicles/${vehicleId}/maintenance`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(
      body.message || "Could not create maintenance record"
    );
  }

  return body.maintenanceRecord;
}


export type CentralMaintenanceReport = {
  generatedAt: string;
  summary: {
    record_count: number;
    total_cost: number | string;
    average_cost: number | string;
  };
  campuses: {
    campus_id: string;
    campus_name: string;
    campus_code: string;
    record_count: number;
    total_cost: number | string;
    average_cost: number | string;
  }[];
  maintenanceTypes: {
    maintenance_type: string;
    record_count: number;
    total_cost: number | string;
    average_cost: number | string;
  }[];
  records: {
    id: string;
    vehicle_id: string;
    registration_number: string;
    make: string;
    model: string;
    campus_id: string;
    campus_name: string;
    campus_code: string;
    maintenance_type: string;
    description: string;
    performed_at: string;
    mileage: number | null;
    cost: number | string | null;
    created_by: string | null;
    created_at: string;
  }[];
};


export type CentralFuelReport = {
  generatedAt: string;
  summary: {
    record_count: number;
    total_liters: number | string;
    total_cost: number | string;
    average_cost_per_liter: number | string;
  };
  campuses: {
    campus_id: string;
    campus_name: string;
    campus_code: string;
    record_count: number;
    total_liters: number | string;
    total_cost: number | string;
    average_cost_per_liter: number | string;
  }[];
  records: {
    id: string;
    vehicle_id: string;
    registration_number: string;
    make: string;
    model: string;
    campus_id: string;
    campus_name: string;
    campus_code: string;
    fueled_at: string;
    liters: number | string;
    cost: number | string;
    odometer_km: number | null;
    fuel_type: string;
    station_name: string | null;
    notes: string | null;
  }[];
};


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
  awaiting_receipt: boolean;
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

export async function confirmVehicleReceipt(
  vehicleId: string
): Promise<Vehicle> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/admin/vehicles/${vehicleId}/receipt`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(
      body.message || "Could not confirm vehicle receipt"
    );
  }

  return body.vehicle as Vehicle;
}

export type FuelRecord = {
  id: string;
  vehicle_id: string;
  campus_id: string;
  recorded_by: string | null;
  fueled_at: string;
  liters: number;
  cost: number;
  odometer_km: number | null;
  fuel_type: "diesel" | "petrol" | "electric" | "other";
  station_name: string | null;
  notes: string | null;
  created_at: string;
};

export async function createFuelRecord(
  vehicleId: string,
  input: {
    fueledAt: string;
    liters: number;
    cost: number;
    odometerKm?: number;
    fuelType: "diesel" | "petrol" | "electric" | "other";
    stationName?: string;
    notes?: string;
  }
): Promise<FuelRecord> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/admin/vehicles/${vehicleId}/fuel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not create fuel record");
  }

  return body.fuelRecord as FuelRecord;
}

export async function getVehicleFuelRecords(
  vehicleId: string
): Promise<FuelRecord[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/admin/vehicles/${vehicleId}/fuel`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load fuel records");
  }

  return body.fuelRecords as FuelRecord[];
}


export type VehicleCampusAssignment = {
  id: string;
  vehicle_id: string;
  from_campus_id: string | null;
  from_campus_name: string | null;
  from_campus_code: string | null;
  to_campus_id: string;
  to_campus_name: string;
  to_campus_code: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_by_email: string;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_by_email: string | null;
  reason: string;
  assigned_at: string;
  received_at: string | null;
  received_by: string | null;
  received_by_name: string | null;
  received_by_email: string | null;
};

export type VehicleAssignmentHistoryResponse = {
  vehicle: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
  };
  assignments: VehicleCampusAssignment[];
};

export async function getVehicleAssignmentHistory(
  vehicleId: string
): Promise<VehicleAssignmentHistoryResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/central/vehicles/${vehicleId}/assignments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(
      body.message || "Could not load vehicle assignment history"
    );
  }

  return body as VehicleAssignmentHistoryResponse;
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

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "driver";
  is_active: boolean;
  created_at: string;
};

export type AdminUserPage = {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    role: string | null;
    search: string | null;
  };
};

export async function getAdminUsers(params: { role?: string; search?: string } = {}) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const query = new URLSearchParams({ page: "1", limit: "50" });
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);

  const response = await fetch(`${API_URL}/admin/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not load users");

  return body as AdminUserPage;
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "staff" | "driver";
};

export async function createAdminUser(input: CreateUserInput) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/admin/users`, {
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

  if (!response.ok) throw new Error(body.message || "Could not create user");

  return body.user as AdminUser;
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not update user status");

  return body.user as AdminUser;
}

export async function updateUserRole(userId: string, role: "staff" | "driver") {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not update user role");

  return body.user as AdminUser;
}

export type AuditLogEntry = {
  id: string;
  actor_user_id: string;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  target_user_id: string | null;
  target_name: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getAuditLogs(page = 1): Promise<{
  auditLogs: AuditLogEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/admin/audit-logs?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not load audit logs");

  return body;
}
export async function assignTripRequest(tripId: string, driverId: string) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_URL}/admin/trip-requests/${tripId}/assign`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ driverId }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not assign trip");
  }

  return body.tripRequest as TripRequest;
}
export async function assignVehicleToTrip(tripId: string, vehicleId: string) {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_URL}/admin/trip-requests/${tripId}/vehicle`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vehicleId }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not assign vehicle");
  }

  return body.tripRequest as TripRequest;
}

export type VehicleLocation = {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  heading_degrees: number | null;
  recorded_at: string;
  registration_number: string;
  make: string;
  model: string;
  status: string;
};

export async function getVehicleLocations(): Promise<{
  vehicleLocations: VehicleLocation[];
}> {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_URL}/admin/vehicles/locations`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) throw new Error(body.message || "Could not load vehicle locations");

  return body;
}
export type Campus = {
  id: string;
  name: string;
  code: string;
  city: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getCampuses(): Promise<Campus[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/campuses`, {
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
    throw new Error(body.message || "Could not load campuses");
  }

  return body.campuses as Campus[];
}

export async function getAllCampuses(): Promise<Campus[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/super-admin/campuses`, {
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
    throw new Error(body.message || "Could not load all campuses");
  }

  return body.campuses as Campus[];
}


export type CampusInput = {
  name: string;
  code: string;
  city: string;
};

export async function createCampus(
  input: CampusInput
): Promise<Campus> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/campuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: input.name,
      code: input.code,
      city: input.city,
    }),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not create campus");
  }

  return body.campus as Campus;
}
export async function updateCampus(
  campusId: string,
  input: CampusInput
): Promise<Campus> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/super-admin/campuses/${campusId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: input.name,
      code: input.code,
      city: input.city,
    }),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update campus");
  }

  return body.campus as Campus;
}
export async function updateCampusStatus(
  campusId: string,
  isActive: boolean
): Promise<Campus> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/super-admin/campuses/${campusId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isActive,
      }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update campus status");
  }

  return body.campus as Campus;
}



export type CentralUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  campus_id: string | null;
  campus_name: string | null;
  campus_code: string | null;
  campus_city: string | null;
};
export async function updateUserCampus(
  userId: string,
  campusId: string
): Promise<CentralUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/super-admin/users/${userId}/campus`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ campusId }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update user campus");
  }

  return body.user as CentralUser;
}


export type CentralUserPage = {
  users: CentralUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    campusId: string | null;
    role: string | null;
    search: string | null;
  };
};

export type CentralUserInput = {
  name: string;
  email: string;
  password: string;
  role:
    | "admin"
    | "staff"
    | "driver"
    | "fleet_officer"
    | "transport_unit"
    | "requester"
    | "viewer"
    | "super_admin"
    | "central_fleet_manager";
  campusId: string | null;
};

export async function createCentralUser(
  input: CentralUserInput
): Promise<CentralUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/super-admin/users`, {
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
    throw new Error(body.message || "Could not create user");
  }

  return body.user as CentralUser;
}


export async function getCentralUsers(filters?: {
  campusId?: string;
  role?: string;
  search?: string;
}): Promise<CentralUserPage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams({
    page: "1",
    limit: "100",
  });

  if (filters?.campusId) {
    query.set("campusId", filters.campusId);
  }

  if (filters?.role) {
    query.set("role", filters.role);
  }

  if (filters?.search) {
    query.set("search", filters.search);
  }

  const response = await fetch(
    `${API_URL}/central/users?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load central users");
  }

  return body as CentralUserPage;
}

export type CentralVehicle = {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  manufacture_year: number | null;
  capacity: number;
  status: "available" | "assigned" | "maintenance" | "inactive";
  created_at: string;
  updated_at: string;
  campus_id: string;
  campus_name: string;
  campus_code: string;
  campus_city: string;
  total_trips: number;
  completed_trips: number;
  active_trips: number;
  transport_count: number;
};

export type CentralVehiclePage = {
  vehicles: CentralVehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getCentralVehicles(filters?: {
  campusId?: string;
  status?: string;
  search?: string;
}): Promise<CentralVehiclePage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams({
    page: "1",
    limit: "100",
  });

  if (filters?.campusId) query.set("campusId", filters.campusId);
  if (filters?.status) query.set("status", filters.status);
  if (filters?.search) query.set("search", filters.search);

  const response = await fetch(
    `${API_URL}/central/vehicle-report?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load vehicle report");
  }

  return body as CentralVehiclePage;
}
export async function updateVehicleCampus(
  vehicleId: string,
  campusId: string,
  reason: string,
  notes?: string
): Promise<CentralVehicle> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/super-admin/vehicles/${vehicleId}/campus`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        campusId,
        reason,
        notes: notes?.trim() || undefined,
      }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update vehicle campus");
  }

  return body.vehicle as CentralVehicle;
}

export type CentralVehicleInput = {
  registrationNumber: string;
  make: string;
  model: string;
  manufactureYear?: number;
  capacity: number;
  campusId: string;
};

export async function createCentralVehicle(
  input: CentralVehicleInput
): Promise<CentralVehicle> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/central/vehicles`, {
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
    throw new Error(body.message || "Could not register vehicle");
  }

  return body.vehicle as CentralVehicle;
}


export type CentralTrip = {
  id: string;
  purpose: string;
  origin: string;
  destination: string;
  pickup_time: string;
  passengers: number;
  department: string;
  status: string;
  campus_name: string;
  campus_code: string;
  campus_city: string;
  requester_name: string | null;
  driver_name: string | null;
  registration_number: string | null;
};

export type CentralTripPage = {
  trips: CentralTrip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getCentralTrips(filters?: {
  campusId?: string;
  status?: string;
  department?: string;
  destination?: string;
}): Promise<CentralTripPage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams({
    page: "1",
    limit: "100",
  });

  if (filters?.campusId) query.set("campusId", filters.campusId);
  if (filters?.status) query.set("status", filters.status);
  if (filters?.department) query.set("department", filters.department);
  if (filters?.destination) query.set("destination", filters.destination);

  const response = await fetch(
    `${API_URL}/central/trip-report?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load trip report");
  }

  return body as CentralTripPage;
}
export type CentralAuditLog = {
  id: string;
  actor_user_id: string;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  actor_campus_id: string | null;
  action: string;
  target_user_id: string | null;
  target_name: string | null;
  target_email: string | null;
  target_role: string | null;
  target_campus_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CentralAuditLogPage = {
  auditLogs: CentralAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function getCentralAuditLogs(): Promise<CentralAuditLogPage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/central/audit-logs?page=1&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load central audit logs");
  }

  return body as CentralAuditLogPage;
}
export async function resetCentralUserPassword(
  userId: string,
  password: string
): Promise<void> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/super-admin/users/${userId}/password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not reset password");
  }
}


export type Driver = {
  id: string;
  name: string;
  email: string;
  role: "driver";
  is_active: boolean;
  campus_id: string;
  created_at: string;
};

export type DriverPage = {
  drivers: Driver[];
};

export type CreateDriverInput = {
  name: string;
  email: string;
  password: string;
};

export async function getDrivers(search?: string): Promise<DriverPage> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const query = new URLSearchParams();

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  const queryString = query.toString();
  const response = await fetch(
    `${API_URL}/admin/drivers${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not load drivers");
  }

  return body as DriverPage;
}

export async function createDriver(input: CreateDriverInput): Promise<Driver> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/admin/drivers`, {
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
    throw new Error(body.message || "Could not create driver");
  }

  return body.driver as Driver;
}

export async function updateDriverStatus(
  userId: string,
  isActive: boolean
): Promise<Driver> {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/admin/drivers/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  const body = await response.json();

  if (response.status === 401) {
    clearToken();
    throw new Error("Your session has expired");
  }

  if (!response.ok) {
    throw new Error(body.message || "Could not update driver status");
  }

  return body.driver as Driver;
}
