import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DragEvent } from "react";
import TeamCard from "./TeamCard";
import type {
  Player,
  Team,
  User,
  Transaction,
} from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { score?: string | number; name?: string }) => {
      if (key === "peladas.team_card.average") return `AVG: ${params?.score}`;
      if (key === "peladas.teams.menu.move_to")
        return `Move to ${params?.name}`;
      if (key.startsWith("common.positions.")) return key.split(".").pop();
      return key;
    },
  }),
}));

// Mock useOrganizationFinance
vi.mock("../../../shared/hooks/useOrganizationFinance", () => ({
  useOrganizationFinance: vi.fn(() => ({
    organizationFinance: { diarista_price: 30, mensalista_price: 120 },
    loadingFinance: false,
  })),
}));

describe("TeamCard", () => {
  const mockTeam: Team = { id: "t1", pelada_id: "p1", name: "Team Alpha" };
  const otherTeam: Team = { id: "t2", pelada_id: "p1", name: "Team Beta" };

  const mockPlayers: (Player & {
    user: User;
    displayScore?: string;
    member_type?: string;
  })[] = [
    {
      id: "pl1",
      user_id: "u1",
      organization_id: "org1",
      member_type: "diarista",
      user: {
        id: "u1",
        name: "Player 1",
        username: "player1",
        email: "p1@e.com",
        position: "Goalkeeper",
      },
      displayScore: "8.5",
    },
    {
      id: "pl2",
      user_id: "u2",
      organization_id: "org1",
      member_type: "mensalista",
      user: {
        id: "u2",
        name: "Player 2",
        username: "player2",
        email: "p2@e.com",
        position: "Striker",
      },
      displayScore: "7.0",
    },
    {
      id: "pl3",
      user_id: "u3",
      organization_id: "org1",
      member_type: "convidado",
      user: {
        id: "u3",
        name: "Player 3",
        username: "player3",
        email: "p3@e.com",
        position: "Midfielder",
      },
      displayScore: "6.5",
    },
  ];

  const onDelete = vi.fn<() => void>();
  const onDrop = vi.fn<(e: DragEvent<HTMLElement>) => void>();
  const onDragStartPlayer =
    vi.fn<(e: DragEvent<HTMLElement>, playerId: string) => void>();
  const onMoveToTeam = vi.fn<(playerId: string, teamId: string) => void>();
  const onSendToBench = vi.fn<(playerId: string) => void>();
  const onMoveToFixedGk =
    vi.fn<(playerId: string, side: "home" | "away") => void>();
  const onMarkPaid = vi.fn<(playerId: string, amount: number) => void>();
  const onReversePayment = vi.fn<(playerId: string) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeContextProvider>
        <TeamCard
          team={mockTeam}
          players={mockPlayers}
          averageScore={7.33}
          maxPlayers={5}
          onDelete={onDelete}
          onDrop={onDrop}
          onDragStartPlayer={onDragStartPlayer}
          onMoveToTeam={onMoveToTeam}
          onSendToBench={onSendToBench}
          onMoveToFixedGk={onMoveToFixedGk}
          teams={[mockTeam, otherTeam]}
          locked={false}
          isAdminOverride={true}
          hasFixedGoalkeepers={false}
          peladaTransactions={[]}
          teamOrganizationId="org1"
          onMarkPaid={onMarkPaid}
          onReversePayment={onReversePayment}
          {...props}
        />
      </ThemeContextProvider>,
    );
  };

  it("renders team name and average score chip", () => {
    renderComponent();
    expect(screen.getByTestId("team-card-name")).toHaveTextContent(
      "Team Alpha",
    );
    expect(screen.getByText("AVG: 7.3")).toBeInTheDocument();
  });

  it("shows empty slots based on maxPlayers limit", () => {
    renderComponent({ maxPlayers: 5 }); // 3 players, so 2 empty slots
    expect(screen.getAllByText("peladas.team_card.empty_slot")).toHaveLength(2);
  });

  it("calls onDelete when delete team button is clicked", () => {
    renderComponent();
    const deleteBtn = screen.getByLabelText("peladas.team_card.delete");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });

  it("supports dragging and dropping", () => {
    renderComponent();
    const dropzone = screen.getByTestId("team-card");
    fireEvent.dragOver(dropzone, {
      dataTransfer: { dropEffect: "" },
    });
    fireEvent.drop(dropzone);
    expect(onDrop).toHaveBeenCalled();
  });

  it("opens player options menu and triggers move actions", async () => {
    renderComponent({ hasFixedGoalkeepers: true });

    // Click swap icon on Player 1 to open the menu
    const swapButtons = screen.getAllByTestId("SwapHorizIcon");
    fireEvent.click(swapButtons[0]);

    // Check menu items
    expect(screen.getByText("Move to Team Beta")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.teams.menu.send_to_bench"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.teams.menu.move_to_home_gk"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.teams.menu.move_to_away_gk"),
    ).toBeInTheDocument();

    // Move to beta
    fireEvent.click(screen.getByText("Move to Team Beta"));
    expect(onMoveToTeam).toHaveBeenCalledWith("pl1", "t2");

    // Reopen menu for bench move
    fireEvent.click(swapButtons[0]);
    fireEvent.click(screen.getByText("peladas.teams.menu.send_to_bench"));
    expect(onSendToBench).toHaveBeenCalledWith("pl1");

    // Reopen menu for GKs
    fireEvent.click(swapButtons[0]);
    fireEvent.click(screen.getByText("peladas.teams.menu.move_to_home_gk"));
    expect(onMoveToFixedGk).toHaveBeenCalledWith("pl1", "home");

    // Reopen for away GK
    fireEvent.click(swapButtons[0]);
    fireEvent.click(screen.getByText("peladas.teams.menu.move_to_away_gk"));
    expect(onMoveToFixedGk).toHaveBeenCalledWith("pl1", "away");
  });

  it("handles payment marking when diarista/convidado is unpaid", () => {
    renderComponent();

    // Player 1 (diarista) and Player 3 (convidado) should have mark-as-paid buttons
    const payButtons = screen.getAllByTestId("mark-as-paid-button");
    expect(payButtons).toHaveLength(2);

    fireEvent.click(payButtons[0]);
    expect(onMarkPaid).toHaveBeenCalledWith("pl1", 30); // 30 is organizationFinance.diarista_price
  });

  it("handles payment reversal when diarista is already paid", () => {
    const transactions: Transaction[] = [
      {
        id: "tx1",
        organization_id: "org1",
        player_id: "pl1",
        type: "income",
        category: "diarista_fee",
        status: "paid",
        amount: 25,
        payment_date: "2024-05-25T10:00:00Z",
        description: "",
      },
    ];

    renderComponent({ peladaTransactions: transactions });

    // Mark as paid button should not be present for Player 1, instead reverse payment button is shown
    const reverseBtn = screen.getByTestId("reverse-payment-button");
    fireEvent.click(reverseBtn);

    expect(onReversePayment).toHaveBeenCalledWith("pl1");
    expect(screen.getAllByTestId("mark-as-paid-button")).toHaveLength(1); // Player 3 (convidado) still has pay button
  });

  it("renders non-admin view correctly with no action buttons", () => {
    const transactions: Transaction[] = [
      {
        id: "tx1",
        organization_id: "org1",
        player_id: "pl1",
        type: "income",
        category: "diarista_fee",
        status: "paid",
        amount: 25,
        payment_date: "2024-05-25T10:00:00Z",
        description: "",
      },
    ];

    renderComponent({
      isAdminOverride: false,
      peladaTransactions: transactions,
    });

    expect(
      screen.queryByLabelText("peladas.team_card.delete"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("SwapHorizIcon")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("reverse-payment-button"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("mark-as-paid-button")).not.toBeInTheDocument();

    // Should show static paid icon (PaidIcon)
    expect(screen.getByTestId("PaidIcon")).toBeInTheDocument();
  });

  it("handles payment marking when diarista_temporario is unpaid", () => {
    const tempDiaristaPlayer: Player & { user: User } = {
      id: "pl_temp_diarista",
      user_id: "u_temp_diarista",
      organization_id: "org1",
      member_type: "diarista_temporario",
      user: {
        id: "u_temp_diarista",
        name: "Temp Diarista Player",
        username: "temp_diarista",
        email: "temp_diarista@e.com",
        position: "Defender",
      },
    };

    render(
      <ThemeContextProvider>
        <TeamCard
          team={mockTeam}
          players={[tempDiaristaPlayer]}
          averageScore={7.33}
          maxPlayers={5}
          onDelete={onDelete}
          onDrop={onDrop}
          onDragStartPlayer={onDragStartPlayer}
          onMoveToTeam={onMoveToTeam}
          onSendToBench={onSendToBench}
          onMoveToFixedGk={onMoveToFixedGk}
          teams={[mockTeam, otherTeam]}
          locked={false}
          isAdminOverride={true}
          hasFixedGoalkeepers={false}
          peladaTransactions={[]}
          teamOrganizationId="org1"
          onMarkPaid={onMarkPaid}
          onReversePayment={onReversePayment}
        />
      </ThemeContextProvider>,
    );

    const payButtons = screen.getAllByTestId("mark-as-paid-button");
    expect(payButtons).toHaveLength(1);

    fireEvent.click(payButtons[0]);
    expect(onMarkPaid).toHaveBeenCalledWith("pl_temp_diarista", 30);
  });
});
