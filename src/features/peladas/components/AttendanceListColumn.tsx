import { Box, Typography, Stack } from "@mui/material";
import Grid from "@mui/material/Grid";
import { type ReactNode } from "react";
import { type PlayerWithUser } from "../hooks/useAttendance";
import { type AttendanceStatus } from "../../../shared/api/endpoints";
import PlayerAttendanceCard from "./PlayerAttendanceCard";

interface AttendanceListColumnProps {
  icon: ReactNode;
  title: string;
  count: number;
  players: PlayerWithUser[];
  emptyMessage: string;
  isAdmin: boolean;
  currentUserId?: number;
  onUpdate: (status: AttendanceStatus, playerId: number) => void;
  updatingPlayers: Set<number>;
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
}: AttendanceListColumnProps) {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {title}{" "}
          <Typography component="span" color="text.secondary">
            ({count})
          </Typography>
        </Typography>
      </Box>
      <Stack spacing={2}>
        {players.map((p) => (
          <PlayerAttendanceCard
            key={p.id}
            player={p}
            isAdmin={isAdmin}
            isCurrentUser={p.user_id === currentUserId}
            onUpdate={(status) => onUpdate(status, p.id)}
            isUpdating={updatingPlayers.has(p.id)}
          />
        ))}
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
    </Grid>
  );
}
