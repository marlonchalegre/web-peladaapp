import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import OrganizationStatisticsDesktopView from "./OrganizationStatisticsDesktopView";
import { clearAvatarCache } from "../../../shared/utils/avatar-cache";
import type {
  Organization,
  OrganizationPlayerStats,
  WeeklyPresence,
} from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../shared/api/client", () => ({
  api: {
    apiBaseUrl: "http://test-api",
  },
}));

type ViewProps = ComponentProps<typeof OrganizationStatisticsDesktopView>;

const mkStat = (
  id: string,
  name: string,
  goal: number,
  assist: number,
  extra: Partial<OrganizationPlayerStats> = {},
): OrganizationPlayerStats =>
  ({
    player_id: id,
    user_id: id,
    player_name: name,
    avatar_filename: `${id}-avatar.jpg`,
    peladas_played: 20,
    goal,
    assist,
    own_goal: 0,
    avg_rating: 7,
    titles: 0,
    total_peladas: 28,
    ...extra,
  }) as OrganizationPlayerStats;

describe("OrganizationStatisticsDesktopView", () => {
  const org = { id: "org-1", name: "100Fôlego" } as Organization;

  const stats: OrganizationPlayerStats[] = [
    mkStat("u1", "Rafael Duarte", 30, 5, {
      titles: 9,
      avg_rating: 7.6,
      peladas_played: 28,
    }),
    mkStat("u2", "Zé Ricardo", 20, 8, {
      peladas_played: 28,
      avg_rating: 7.4,
    }),
    mkStat("u3", "Bruno S.", 18, 6),
    mkStat("u4", "Léo Prado", 17, 35, { avg_rating: 8.1 }),
    mkStat("u5", "Igor Matos", 16, 32, { avg_rating: 7.2 }),
    mkStat("u6", "Caio Bastos", 12, 4),
    mkStat("u7", "Marcos Vinícius", 10, 3),
    mkStat("u8", "Pedro", 8, 2),
  ];

  const weeklyPresence: WeeklyPresence[] = [
    { week_start: "2026-01-05", confirmed: 24 },
    { week_start: "2026-01-12", confirmed: 22 },
  ];

  const defaultProps: ViewProps = {
    org,
    stats,
    totalPeladas: 28,
    totalGoals: 142,
    avgGoals: "5.1",
    year: 2026,
    years: ["2026", "2025", "2024"],
    onYearChange: vi.fn(),
    currentUser: {
      id: "u5",
      name: "Igor Matos",
      username: "igor",
      email: "igor@example.com",
    },
    isAdmin: false,
    onOpenImport: vi.fn(),
    onOpenExport: vi.fn(),
    weeklyPresence,
  };

  const renderView = (props: Partial<ViewProps> = {}) =>
    render(
      <MemoryRouter>
        <OrganizationStatisticsDesktopView {...defaultProps} {...props} />
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    clearAvatarCache();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["test-image-content"], { type: "image/png" }),
        ),
    });

    global.URL.createObjectURL = vi
      .fn()
      .mockReturnValue("blob:http://test-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders desktop view with stats and SecureAvatars for podium and ranking", async () => {
    renderView();

    // Podiums exist
    expect(screen.getAllByText("Rafael Duarte").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Zé Ricardo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bruno S.").length).toBeGreaterThan(0);

    // Verify SecureAvatar initiated fetch for players with avatars
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/user/u1/avatar?t=u1-avatar.jpg"),
        expect.anything(),
      );
    });
  });

  it("switches metric tabs properly", () => {
    renderView();

    const assistsTab = screen.getByText("ASSISTÊNCIAS");
    fireEvent.click(assistsTab);
    expect(screen.getAllByText("Léo Prado").length).toBeGreaterThan(0);
  });
});
