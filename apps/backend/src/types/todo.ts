export type TodoState = "todo" | "scheduled" | "done";

export interface TodoLocation {
  text: string;
  shortText?: string;
  lat: number;
  lon: number;
}

export interface Todo {
  id: string;
  title: string;
  state: TodoState;
  location: TodoLocation;
  date: string;
}

export interface CreateTodoInput {
  title: string;
  state: TodoState;
  location: TodoLocation;
  date: string;
}

export type UpdateTodoInput = Partial<CreateTodoInput>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATES: TodoState[] = ["todo", "scheduled", "done"];

export function isValidDate(date: string): boolean {
  if (!DATE_REGEX.test(date)) {
    return false;
  }
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function isValidState(state: string): state is TodoState {
  return VALID_STATES.includes(state as TodoState);
}

export function validateLocation(
  location: unknown,
): { ok: true; data: TodoLocation } | { ok: false; error: string } {
  if (!location || typeof location !== "object") {
    return { ok: false, error: "location must be an object" };
  }

  const { text, shortText, lat, lon } = location as Record<string, unknown>;

  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, error: "location.text is required" };
  }
  if (shortText !== undefined && (typeof shortText !== "string" || shortText.trim() === "")) {
    return { ok: false, error: "location.shortText must be a non-empty string" };
  }
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "location.lat must be a number between -90 and 90" };
  }
  if (typeof lon !== "number" || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { ok: false, error: "location.lon must be a number between -180 and 180" };
  }

  return {
    ok: true,
    data: {
      text: text.trim(),
      ...(typeof shortText === "string" ? { shortText: shortText.trim() } : {}),
      lat,
      lon,
    },
  };
}

export function validateCreateInput(
  body: unknown,
): { ok: true; data: CreateTodoInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be an object" };
  }

  const { title, state, location, date } = body as Record<string, unknown>;

  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "title is required" };
  }
  if (typeof state !== "string" || !isValidState(state)) {
    return { ok: false, error: 'state must be "todo", "scheduled", or "done"' };
  }

  const locationResult = validateLocation(location);
  if (!locationResult.ok) {
    return locationResult;
  }

  if (typeof date !== "string" || !isValidDate(date)) {
    return { ok: false, error: "date must be YYYY-MM-DD" };
  }

  return {
    ok: true,
    data: {
      title: title.trim(),
      state,
      location: locationResult.data,
      date,
    },
  };
}

export function validateUpdateInput(
  body: unknown,
): { ok: true; data: UpdateTodoInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be an object" };
  }

  const input = body as Record<string, unknown>;
  const data: UpdateTodoInput = {};

  if ("title" in input) {
    if (typeof input.title !== "string" || input.title.trim() === "") {
      return { ok: false, error: "title must be a non-empty string" };
    }
    data.title = input.title.trim();
  }

  if ("state" in input) {
    if (typeof input.state !== "string" || !isValidState(input.state)) {
      return { ok: false, error: 'state must be "todo", "scheduled", or "done"' };
    }
    data.state = input.state;
  }

  if ("location" in input) {
    const locationResult = validateLocation(input.location);
    if (!locationResult.ok) {
      return locationResult;
    }
    data.location = locationResult.data;
  }

  if ("date" in input) {
    if (typeof input.date !== "string" || !isValidDate(input.date)) {
      return { ok: false, error: "date must be YYYY-MM-DD" };
    }
    data.date = input.date;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "At least one field must be provided" };
  }

  return { ok: true, data };
}
