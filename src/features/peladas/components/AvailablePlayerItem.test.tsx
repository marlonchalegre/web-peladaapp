/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AvailablePlayerItem from "./AvailablePlayerItem";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

describe("AvailablePlayerItem", () => {
  const defaultPlayer = {
    id: "p1",
    user_id: "u1",
    organization_id: "o1",
    member_type: "mensalista",
    user: {
      id: "u1",
      name: "John Doe",
      position: "Midfielder",
    },
  };

  const defaultProps = {
    player: defaultPlayer as any,
    score: 8.5,
    onDragStart: vi.fn(),
  };

  it("renders player name and score", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
  });

  it("renders translated position", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("common.positions.midfielder")).toBeInTheDocument();
  });

  it("renders 'unknown' position when position is missing", () => {
    const playerNoPos = {
      ...defaultPlayer,
      user: { ...defaultPlayer.user, position: null },
    };
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} player={playerNoPos as any} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("common.positions.unknown")).toBeInTheDocument();
  });

  it("renders '-' for null score", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} score={null} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("is draggable when not locked", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} locked={false} />
      </ThemeContextProvider>,
    );
    const row = screen.getByTestId("player-row");
    expect(row).toHaveAttribute("draggable", "true");
  });

  it("is not draggable when locked", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} locked={true} />
      </ThemeContextProvider>,
    );
    const row = screen.getByTestId("player-row");
    expect(row).toHaveAttribute("draggable", "false");
    expect(row).toHaveStyle("cursor: default");
  });

  it("shows admin menu button when isAdmin and not locked", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} isAdmin={true} locked={false} />
      </ThemeContextProvider>,
    );
    expect(screen.getByTestId("SwapHorizIcon")).toBeInTheDocument();
  });

  it("hides admin menu button when locked even if isAdmin", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} isAdmin={true} locked={true} />
      </ThemeContextProvider>,
    );
    expect(screen.queryByTestId("SwapHorizIcon")).not.toBeInTheDocument();
  });

  it("opens menu and calls onMoveToTeam", () => {
    const onMoveToTeam = vi.fn();
    const teams = [{ id: "t1", name: "Team A", organization_id: "o1" }];
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          isAdmin={true}
          teams={teams as any}
          onMoveToTeam={onMoveToTeam}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/peladas\.teams\.menu\.move_to/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/peladas\.teams\.menu\.move_to/i));
    expect(onMoveToTeam).toHaveBeenCalledWith("p1", "t1");
  });

  it("shows fixed GK menu items and calls onMoveToFixedGk", () => {
    const onMoveToFixedGk = vi.fn();
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          isAdmin={true}
          hasFixedGoalkeepers={true}
          onMoveToFixedGk={onMoveToFixedGk}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByRole("button"));

    const homeGk = screen.getByTestId("move-to-home-gk-item");
    fireEvent.click(homeGk);
    expect(onMoveToFixedGk).toHaveBeenCalledWith("p1", "home");

    fireEvent.click(screen.getByRole("button"));
    const awayGk = screen.getByTestId("move-to-away-gk-item");
    fireEvent.click(awayGk);
    expect(onMoveToFixedGk).toHaveBeenCalledWith("p1", "away");
  });

  it("renders payment badge for diarista/convidado - Paid (Admin with onReversePayment)", () => {
    const onReversePayment = vi.fn();
    const player = { ...defaultPlayer, member_type: "diarista" };
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          player={player as any}
          isPaid={true}
          isAdmin={true}
          onReversePayment={onReversePayment}
        />
      </ThemeContextProvider>,
    );

    const reverseBtn = screen.getByTestId("reverse-payment-button");
    fireEvent.click(reverseBtn);
    expect(onReversePayment).toHaveBeenCalled();
  });

  it("renders static PaidIcon when isPaid and !isAdmin", () => {
    const player = { ...defaultPlayer, member_type: "diarista" };
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          player={player as any}
          isPaid={true}
          isAdmin={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("paid-icon")).toBeInTheDocument();
    expect(
      screen.queryByTestId("reverse-payment-button"),
    ).not.toBeInTheDocument();
  });

  it("renders mark-as-paid button for unpaid diarista (Admin with onMarkPaid)", () => {
    const onMarkPaid = vi.fn();
    const player = { ...defaultPlayer, member_type: "diarista" };
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          player={player as any}
          isPaid={false}
          isAdmin={true}
          onMarkPaid={onMarkPaid}
        />
      </ThemeContextProvider>,
    );

    const markPaidBtn = screen.getByTestId("mark-as-paid-button");
    fireEvent.click(markPaidBtn);
    expect(onMarkPaid).toHaveBeenCalled();
  });

  it("renders pending payment icon when unpaid and !isAdmin", () => {
    const player = { ...defaultPlayer, member_type: "diarista" };
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem
          {...defaultProps}
          player={player as any}
          isPaid={false}
          isAdmin={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("AttachMoneyIcon")).toBeInTheDocument();
    expect(screen.queryByTestId("mark-as-paid-button")).not.toBeInTheDocument();
  });

  it("does not render payment badge for mensalista", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayerItem {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.queryByTestId("paid-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("AttachMoneyIcon")).not.toBeInTheDocument();
  });
});
