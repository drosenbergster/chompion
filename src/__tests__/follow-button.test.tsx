import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FollowButton } from "@/components/profile/follow-button";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: () => ({
        eq: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    }),
  }),
}));

describe("FollowButton", () => {
  it("renders nothing when currentUserId is null", () => {
    const { container } = render(
      <FollowButton
        targetUserId="user-2"
        currentUserId={null}
        isFollowing={false}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when viewing own profile", () => {
    const { container } = render(
      <FollowButton
        targetUserId="user-1"
        currentUserId="user-1"
        isFollowing={false}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows Follow when not following", () => {
    render(
      <FollowButton
        targetUserId="user-2"
        currentUserId="user-1"
        isFollowing={false}
      />
    );
    expect(screen.getByText("Follow")).toBeInTheDocument();
  });

  it("shows Following when already following", () => {
    render(
      <FollowButton
        targetUserId="user-2"
        currentUserId="user-1"
        isFollowing={true}
      />
    );
    expect(screen.getByText("Following")).toBeInTheDocument();
  });
});
