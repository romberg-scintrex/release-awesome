import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContactForm } from "./useContactForm";

// Mock window.turnstile
const mockReset = vi.fn();
Object.defineProperty(window, "turnstile", {
  value: { reset: mockReset },
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // No turnstile site key by default
    delete (process.env as Record<string, unknown>).NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with empty fields and idle status", () => {
    const { result } = renderHook(() => useContactForm());
    const [state] = result.current;

    expect(state.status).toBe("idle");
    expect(state.errorMsg).toBeNull();
    expect(state.fields.name.value).toBe("");
    expect(state.fields.email.value).toBe("");
    expect(state.fields.subject.value).toBe("");
    expect(state.fields.message.value).toBe("");
  });

  it("bind().onChange updates field value", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      const { onChange } = result.current[1].bind("name");
      onChange({ target: { value: "John" } } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current[0].fields.name.value).toBe("John");
  });

  it("bind().onBlur sets touched and validates", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].bind("name").onBlur();
    });

    expect(result.current[0].fields.name.touched).toBe(true);
    expect(result.current[0].fields.name.error).toBe("This field is required.");
  });

  it("validates email format on blur", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      const { onChange } = result.current[1].bind("email");
      onChange({ target: { value: "invalid" } } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current[1].bind("email").onBlur();
    });

    expect(result.current[0].fields.email.error).toBe("Enter a valid email address.");
  });

  it("validates message min length", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      const { onChange } = result.current[1].bind("message");
      onChange({ target: { value: "short" } } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current[1].bind("message").onBlur();
    });

    expect(result.current[0].fields.message.error).toBe(
      "Tell me a little more — at least 10 characters.",
    );
  });

  it("subject is optional — no error when empty", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].bind("subject").onBlur();
    });

    expect(result.current[0].fields.subject.error).toBeNull();
  });

  it("submit validates all fields before sending", async () => {
    const { result } = renderHook(() => useContactForm());

    await act(async () => {
      await result.current[1].submit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    // Should have errors — fetch not called
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current[0].fields.name.error).toBe("This field is required.");
    expect(result.current[0].fields.email.error).toBe("This field is required.");
    expect(result.current[0].fields.message.error).toBe("This field is required.");
  });

  it("submit sends request and handles success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { result } = renderHook(() => useContactForm());

    // Fill fields
    act(() => {
      result.current[1].bind("name").onChange({ target: { value: "Jane" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("email").onChange({ target: { value: "jane@test.com" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("message").onChange({ target: { value: "Hello, this is my message to you." } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current[1].submit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/contact", expect.objectContaining({ method: "POST" }));
    expect(result.current[0].status).toBe("success");

    // After timeout, status resets
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current[0].status).toBe("idle");
  });

  it("submit handles API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Rate limited." }),
    });

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].bind("name").onChange({ target: { value: "Jane" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("email").onChange({ target: { value: "jane@test.com" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("message").onChange({ target: { value: "Hello, this is my message." } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current[1].submit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current[0].status).toBe("error");
    expect(result.current[0].errorMsg).toBe("Rate limited.");
  });

  it("submit handles network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].bind("name").onChange({ target: { value: "Jane" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("email").onChange({ target: { value: "jane@test.com" } } as React.ChangeEvent<HTMLInputElement>);
      result.current[1].bind("message").onChange({ target: { value: "Hello, this is my longer message." } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current[1].submit({
        preventDefault: vi.fn(),
      } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current[0].status).toBe("error");
    expect(result.current[0].errorMsg).toBe("Network error — please try again.");
  });

  it("setHoneypot updates honeypot value", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].setHoneypot("bot-value");
    });

    expect(result.current[0].honeypot).toBe("bot-value");
  });

  it("setTurnstileToken updates token", () => {
    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current[1].setTurnstileToken("test-token-123");
    });

    expect(result.current[0].turnstileToken).toBe("test-token-123");
  });
});
