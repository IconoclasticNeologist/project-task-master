import { describe, it, expect, vi, beforeEach } from "vitest";

const lockMock = vi.fn();
const isLockEnabledMock = vi.fn();
vi.mock("@/lib/appLock", () => ({
  lock: (...a: unknown[]) => lockMock(...a),
  isLockEnabled: (...a: unknown[]) => isLockEnabledMock(...a),
}));

import { leaveQuickly, LEAVE_DESTINATION } from "./leaveNow";

type HistoryDep = Pick<History, "replaceState">;
type LocationDep = Pick<Location, "assign">;

beforeEach(() => {
  vi.clearAllMocks();
  isLockEnabledMock.mockReturnValue(false);
});

describe("leaveQuickly", () => {
  // location.replace would CONSUME the entry we just neutralized — Back would
  // land on the page before it, which is still survivor content. The exit must
  // rewrite the current entry to "/" and then PUSH (assign) the decoy site, so
  // Back lands on the neutral welcome page.
  it("rewrites the current history entry to the welcome page, then PUSHES the decoy site", () => {
    const order: string[] = [];
    const history: HistoryDep = {
      replaceState: vi.fn(() => order.push("neutralize")) as unknown as History["replaceState"],
    };
    const location: LocationDep = {
      assign: vi.fn(() => order.push("leave")) as unknown as Location["assign"],
    };

    leaveQuickly({ history, location });

    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/");
    expect(location.assign).toHaveBeenCalledWith(LEAVE_DESTINATION);
    expect(order).toEqual(["neutralize", "leave"]);
  });

  it("locks the app when a PIN is configured, so coming Back asks for the PIN", () => {
    isLockEnabledMock.mockReturnValue(true);
    const history: HistoryDep = { replaceState: vi.fn() };
    const location: LocationDep = { assign: vi.fn() };

    leaveQuickly({ history, location });

    expect(lockMock).toHaveBeenCalledTimes(1);
  });

  it("does not lock when no PIN is configured", () => {
    const history: HistoryDep = { replaceState: vi.fn() };
    const location: LocationDep = { assign: vi.fn() };

    leaveQuickly({ history, location });

    expect(lockMock).not.toHaveBeenCalled();
  });

  it("still leaves even if history cleanup or locking throws", () => {
    isLockEnabledMock.mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const history: HistoryDep = {
      replaceState: vi.fn(() => {
        throw new Error("history unavailable");
      }) as unknown as History["replaceState"],
    };
    const location: LocationDep = { assign: vi.fn() };

    leaveQuickly({ history, location });

    expect(location.assign).toHaveBeenCalledWith(LEAVE_DESTINATION);
  });
});
