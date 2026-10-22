import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  Player,
  Pelada,
  Transaction,
  User,
} from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";
import PeladaTabsBar from "./PeladaTabsBar";
import LocationDisplay from "../../../shared/components/LocationDisplay";
import {
  isMensalista,
  formatMemberType as formatMemberTypeHelper,
  getPaidPlayerIds,
} from "../utils/playerUtils";
import { AttendanceUserResponseCard } from "./AttendanceUserResponseCard";
import { AttendanceTable } from "./AttendanceTable";
import {
  AttendanceSpotsCard,
  AttendanceWaitlistCard,
  AttendanceDailyFeesCard,
  AttendancePendingRemindersCard,
} from "./AttendanceSidebarWidgets";

interface AttendanceListDesktopViewProps {
  pelada: Pelada;
  confirmed: PlayerWithUser[];
  waitlist: PlayerWithUser[];
  declined: PlayerWithUser[];
  pending: PlayerWithUser[];
  currentPlayerAsPlayer?: PlayerWithUser;
  currentUser?: User | null;
  isAdmin: boolean;
  onUpdateAttendance: (status: "confirmed" | "declined" | "waitlist") => void;
  onUpdatePlayerAttendance?: (
    playerId: string,
    status: "confirmed" | "declined" | "waitlist",
  ) => void;
  onCloseAttendance: () => void;
  dayNumber: number;
  weekday: string;
  month: string;
  timeStr: string;
  locationStr: string;
  maxPlayers?: number;
  peladaTransactions?: Transaction[];
  diaristaPrice?: number | null;
  onMarkPaid?: (playerId: string) => void;
  onReversePayment?: (playerId: string) => void;
}

export default function AttendanceListDesktopView({
  pelada,
  confirmed,
  waitlist,
  declined,
  pending,
  currentPlayerAsPlayer,
  currentUser,
  isAdmin,
  onUpdateAttendance,
  onUpdatePlayerAttendance,
  onCloseAttendance,
  dayNumber,
  weekday,
  month,
  timeStr,
  locationStr,
  maxPlayers,
  peladaTransactions = [],
  diaristaPrice,
  onMarkPaid,
  onReversePayment,
}: AttendanceListDesktopViewProps) {
  const { t } = useTranslation();

  const formatMemberType = (memberType?: string) =>
    formatMemberTypeHelper(memberType, (k, d) => (d ? t(k, d) : t(k)));

  const price = diaristaPrice ?? 0;
  const paidPlayerIds = useMemo(
    () => getPaidPlayerIds(peladaTransactions),
    [peladaTransactions],
  );

  const { totalDiariasAmount, openDiariasCount, openDiariasAmount } =
    useMemo(() => {
      const diarias = confirmed.filter((p) => !isMensalista(p.member_type));
      const totalAmount = diarias.length * price;
      const openCount = diarias.filter((p) => !paidPlayerIds.has(p.id)).length;
      const openAmount = openCount * price;
      return {
        totalDiariasAmount: totalAmount,
        openDiariasCount: openCount,
        openDiariasAmount: openAmount,
      };
    }, [confirmed, price, paidPlayerIds]);

  const handleMover = (
    player: Player,
    targetStatus: "confirmed" | "waitlist" | "declined",
  ) => {
    if (player.user_id === currentUser?.id) {
      onUpdateAttendance(targetStatus);
    } else if (onUpdatePlayerAttendance) {
      onUpdatePlayerAttendance(player.id, targetStatus);
    }
  };

  return (
    <>
      <PeladaTabsBar
        peladaId={pelada.id}
        dayStr={dayNumber}
        monthStr={month.substring(0, 3)}
        active="attendance"
        confirmedCount={confirmed.length}
        isPeladaOpen={pelada.status === "open"}
      />
      <Box
        data-testid="attendance-list-container"
        sx={{
          width: "100%",
          maxWidth: 1124,
          mx: "auto",
          pt: 3.5,
          px: { xs: 2, md: 4 },
          pb: 5,
        }}
      >
        {/* 2. Header & Action CTA */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                letterSpacing: ".16em",
                color: "text.secondary",
                textTransform: "uppercase",
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  fontSize: "inherit",
                  letterSpacing: "inherit",
                  color: "inherit",
                  textTransform: "inherit",
                }}
              >
                {pelada.organization_name || t("common.organization")} ·{" "}
                {weekday} {dayNumber}/{month.substring(0, 3)} · {timeStr}
              </Typography>
              {locationStr && (
                <>
                  <Typography
                    component="span"
                    sx={{
                      mx: 0.5,
                      fontFamily: "inherit",
                      fontWeight: "inherit",
                      fontSize: "inherit",
                      color: "inherit",
                    }}
                  >
                    ·
                  </Typography>
                  <LocationDisplay
                    location={locationStr}
                    textSx={{
                      fontFamily: "inherit",
                      fontWeight: "inherit",
                      fontSize: "inherit",
                      letterSpacing: "inherit",
                      color: "primary.main",
                      textTransform: "inherit",
                    }}
                  />
                </>
              )}
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "26px",
                color: "text.primary",
                mt: 0.8,
              }}
            >
              {t("peladas.attendance.title", "Lista de presença")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "9.5px",
                letterSpacing: ".08em",
                color: "primary.contrastText",
                bgcolor: "primary.main",
                borderRadius: "7px",
                px: 1.2,
                py: 0.8,
                textTransform: "uppercase",
              }}
            >
              {pelada.status === "attendance"
                ? t(
                    "peladas.attendance.desktop.open_list_notice",
                    "LISTA ABERTA · FECHA EM 2 DIAS",
                  )
                : pelada.status
                  ? pelada.status.toUpperCase()
                  : t("peladas.attendance.desktop.open_status", "ABERTA")}
            </Box>
            {isAdmin && (
              <Box
                component="button"
                data-testid="close-attendance-button"
                onClick={onCloseAttendance}
                sx={{
                  borderRadius: "11px",
                  bgcolor: "primary.main",
                  px: 2,
                  py: 1.4,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  color: "primary.contrastText",
                  cursor: "pointer",
                  border: "none",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                {t(
                  "peladas.attendance.desktop.close_and_draw",
                  "FECHAR LISTA E SORTEAR",
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* 3. SUA RESPOSTA Card (5b) */}
        {currentPlayerAsPlayer && (
          <AttendanceUserResponseCard
            currentUser={currentUser}
            currentPlayerAsPlayer={currentPlayerAsPlayer}
            onUpdateAttendance={onUpdateAttendance}
            formatMemberType={formatMemberType}
          />
        )}

        {/* 4. Two-column Layout */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          {/* Left column: 4 Tabs + Table */}
          <AttendanceTable
            confirmed={confirmed}
            waitlist={waitlist}
            declined={declined}
            pending={pending}
            currentUser={currentUser}
            isAdmin={isAdmin}
            paidPlayerIds={paidPlayerIds}
            price={price}
            formatMemberType={formatMemberType}
            onMarkPaid={onMarkPaid}
            onReversePayment={onReversePayment}
            handleMover={handleMover}
          />

          {/* Right column (298px) */}
          <Box sx={{ width: 298, flexShrink: 0 }}>
            {/* Vagas card */}
            <AttendanceSpotsCard
              confirmedCount={confirmed.length}
              waitlistCount={waitlist.length}
              maxPlayers={maxPlayers}
            />

            {/* Fila de espera card */}
            <AttendanceWaitlistCard
              waitlist={waitlist}
              formatMemberType={formatMemberType}
              onMovePlayer={handleMover}
            />

            {/* Diárias desta pelada card */}
            <AttendanceDailyFeesCard
              openDiariasCount={openDiariasCount}
              openDiariasAmount={openDiariasAmount}
              totalDiariasAmount={totalDiariasAmount}
              organizationName={pelada.organization_name}
            />

            {/* Pendentes card */}
            <AttendancePendingRemindersCard
              pendingCount={pending.length}
              weekday={weekday}
              dayNumber={dayNumber}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}
