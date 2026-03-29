import { Box, Typography, Stack } from "@mui/material";
import { type ReactNode } from "react";
import { type PlayerWithUser } from "../hooks/useAttendance";
import {
  type AttendanceStatus,
  type Transaction,
  type OrganizationFinance,
} from "../../../shared/api/endpoints";
import PlayerAttendanceCard from "./PlayerAttendanceCard";

interface AttendanceListColumnProps {
  icon?: ReactNode;
  title: string;
  count: number;
  players: PlayerWithUser[];
  emptyMessage: string;
  isAdmin: boolean;
  currentUserId?: number;
  onUpdate: (status: AttendanceStatus, playerId: number) => void;
  updatingPlayers: Set<number>;
  hideHeader?: boolean;
  peladaTransactions?: Transaction[];
  organizationFinance?: OrganizationFinance;
  onMarkPaid?: (playerId: number, amount: number) => void;
  onReversePayment?: (playerId: number) => void;
  }

  export default function AttendanceListColumn({
  icon,
  title,
  count,
  players,
  emptyMessage,
  isAdmin,
  currentUserId,
  onUpdate,
  updatingPlayers,
  hideHeader,
  peladaTransactions,
  organizationFinance,
  onMarkPaid,
  onReversePayment,
  }: AttendanceListColumnProps) {
  return (
    <Box sx={{ width: "100%" }}>
      {!hideHeader && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {title}{" "}
            <Typography component="span" color="text.secondary">
              ({count})
            </Typography>
          </Typography>
        </Box>
      )}
      <Stack spacing={2}>
        {players.map((p) => {
          const isPaid = peladaTransactions.some(
            (t: Transaction) =>
              t.player_id === p.id &&
              t.type === "income" &&
              t.category === "diarista_fee" &&
              t.status === "paid",
          );
          return (
            <PlayerAttendanceCard
              key={p.id}
              player={p}
              isAdmin={isAdmin}
              isCurrentUser={p.user_id === currentUserId}
              onUpdate={(status) => onUpdate(status, p.id)}
              isUpdating={updatingPlayers.has(p.id)}
              isPaid={isPaid}
              organizationFinance={organizationFinance}
              onMarkPaid={
                onMarkPaid
                  ? () =>
                      onMarkPaid(p.id, organizationFinance?.diarista_price || 0)
                  : undefined
              }
              onReversePayment={
                onReversePayment ? () => onReversePayment(p.id) : undefined
              }
              data-testid={`attendance-card-${p.user.username || p.user_id}`}
            />
          );
        })}
        {players.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
          >
            {emptyMessage}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
