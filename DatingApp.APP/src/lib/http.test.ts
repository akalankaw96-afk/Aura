import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NETWORK_ERROR, SESSION_KEY, apiJson, apiRequest, setAccessToken, toApiError } from "./http";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** fetch stand-in: answers each call with the next response in the list. */
function mockFetch(...responses: Array<Response | (() => Promise<Response>)>) {
  const fn = vi.fn((_url: string, _init?: RequestInit) => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected fetch");
    return typeof next === "function" ? next() : Promise.resolve(next);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const authHeader = (init?: RequestInit) => (init?.headers as Record<string, string> | undefined)?.Authorization;

beforeEach(() => setAccessToken(null));
afterEach(() => vi.useRealTimers());

describe("toApiError (ProblemDetails → ApiError)", () => {
  it("uses title, status, code and the extras", async () => {
    const err = await toApiError(
      json({ title: "Monthly limit reached", code: "LIMIT_REACHED", feature: "searches", limit: 5, planId: "free", resetsAt: "2026-12-01" }, 402),
      "fallback",
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Monthly limit reached");
    expect(err.status).toBe(402);
    expect(err.code).toBe("LIMIT_REACHED");
    expect(err.extras).toMatchObject({ feature: "searches", limit: 5, planId: "free", resetsAt: "2026-12-01" });
  });

  it("falls back to `message`, then to the fallback text", async () => {
    expect((await toApiError(json({ message: "Code expired", attemptsLeft: 2 }, 400), "x")).message).toBe("Code expired");
    expect((await toApiError(json({ attemptsLeft: 2 }, 400), "x")).extras.attemptsLeft).toBe(2);
    expect((await toApiError(json({}, 500), "Please try again.")).message).toBe("Please try again.");
  });

  it("copes with a body that is not JSON", async () => {
    const err = await toApiError(new Response("<html>Bad gateway</html>", { status: 502 }), "Server unavailable");
    expect(err.message).toBe("Server unavailable");
    expect(err.status).toBe(502);
    expect(err.code).toBeUndefined();
  });
});

describe("apiJson", () => {
  it("returns the parsed body on 2xx", async () => {
    mockFetch(json({ id: 1 }));
    await expect(apiJson("/thing", { auth: false })).resolves.toEqual({ id: 1 });
  });

  it("returns undefined on 204", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiJson("/thing", { auth: false })).resolves.toBeUndefined();
  });

  it("throws ApiError with the server's message on non-2xx", async () => {
    mockFetch(json({ title: "Profile not found", code: "NOT_FOUND" }, 404));
    const err = await apiJson("/profiles/x", { auth: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Profile not found", status: 404, code: "NOT_FOUND" });
  });

  it("uses fallbackError when the server gives no message", async () => {
    mockFetch(json({}, 500));
    await expect(apiJson("/x", { auth: false, fallbackError: "We couldn’t load your chats." })).rejects.toThrow("We couldn’t load your chats.");
  });

  it("sends a JSON body with the right header", async () => {
    const fetchFn = mockFetch(json({ ok: true }));
    await apiJson("/x", { auth: false, method: "POST", json: { a: 1 } });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toMatch(/\/x$/);
    expect(init?.body).toBe('{"a":1}');
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init?.credentials).toBe("include");
  });
});

describe("apiRequest errors", () => {
  it("turns a failed fetch into ApiError NETWORK (status 0)", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const err = await apiRequest("/x", { auth: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 0, code: "NETWORK", message: NETWORK_ERROR });
  });

  it("turns a slow answer into ApiError TIMEOUT", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    const pending = apiRequest("/slow", { auth: false, timeoutMs: 1000 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("returns non-2xx responses as they are (no throw)", async () => {
    mockFetch(json({ title: "Nope" }, 403));
    const res = await apiRequest("/x", { auth: false });
    expect(res.status).toBe(403);
  });
});

describe("apiRequest auth", () => {
  it("sends no token when nobody is signed in", async () => {
    const fetchFn = mockFetch(json({}));
    await apiRequest("/x");
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(authHeader(fetchFn.mock.calls[0][1])).toBeUndefined();
  });

  it("sends the in-memory token as a Bearer header", async () => {
    setAccessToken("abc");
    const fetchFn = mockFetch(json({}));
    await apiRequest("/x");
    expect(authHeader(fetchFn.mock.calls[0][1])).toBe("Bearer abc");
  });

  it("on 401 refreshes once and retries with the new token", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ profileId: "p1" }));
    setAccessToken("old");
    const fetchFn = mockFetch(json({ title: "Expired" }, 401), json({ token: "new" }), json({ id: 7 }));

    await expect(apiJson("/me")).resolves.toEqual({ id: 7 });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(authHeader(fetchFn.mock.calls[0][1])).toBe("Bearer old");
    expect(fetchFn.mock.calls[1][0]).toMatch(/\/auth\/refresh$/);
    expect(authHeader(fetchFn.mock.calls[2][1])).toBe("Bearer new");
  });

  it("after a reload (no token in memory) restores it from the refresh cookie first", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ profileId: "p1" }));
    const fetchFn = mockFetch(json({ token: "restored" }), json({ ok: true }));
    await apiJson("/me");
    expect(fetchFn.mock.calls[0][0]).toMatch(/\/auth\/refresh$/);
    expect(authHeader(fetchFn.mock.calls[1][1])).toBe("Bearer restored");
  });

  it("when the refresh fails the 401 is returned and no retry is made", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ profileId: "p1" }));
    setAccessToken("old");
    const fetchFn = mockFetch(json({ title: "Expired" }, 401), json({}, 401));
    const res = await apiRequest("/me");
    expect(res.status).toBe(401);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
