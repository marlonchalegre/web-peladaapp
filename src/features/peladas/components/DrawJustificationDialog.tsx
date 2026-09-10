import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import GroupsIcon from "@mui/icons-material/Groups";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import type {
  DrawChemistryTeam,
  DrawJustification,
  DrawPairEvidence,
  DrawPlayer,
  DrawTacticalTeam,
} from "../../../shared/api/endpoints";
import { formatDecimal } from "../utils/formatNumber";

interface DrawJustificationDialogProps {
  open: boolean;
  onClose: () => void;
  justification: DrawJustification | null;
}

const pairName = (pair: DrawPairEvidence) => pair.players.join(" + ");

function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        minWidth: 108,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 900,
          fontSize: "0.6rem",
          color: "text.secondary",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, lineHeight: 1.3 }}>{value}</Typography>
    </Paper>
  );
}

function Evidence({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ display: "flex", color: "text.secondary", mt: "2px" }}>
        {icon}
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {children}
      </Typography>
    </Stack>
  );
}

/** An evidence line that disappears when there is nothing to show. */
function EvidenceList<T>({
  icon,
  label,
  items,
  format,
  fallback,
  separator = "; ",
}: {
  icon: ReactNode;
  label: string;
  items: T[] | undefined;
  format: (item: T) => string;
  fallback?: string;
  separator?: string;
}) {
  if (!items?.length) {
    return fallback ? <Evidence icon={icon}>{fallback}</Evidence> : null;
  }
  return (
    <Evidence icon={icon}>
      {label}: {items.map(format).join(separator)}
    </Evidence>
  );
}

function PlayerLine({ player }: { player: DrawPlayer }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", py: 0.25 }}>
      <Chip
        size="small"
        label={player.position_code}
        sx={{ fontWeight: 900, height: 20, minWidth: 28, fontSize: "0.65rem" }}
      />
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {player.name.trim()}
        {player.is_anchor ? " ★" : ""}
        {player.short_history ? " *" : ""}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>
        {formatDecimal(player.grade)}
      </Typography>
    </Stack>
  );
}

export default function DrawJustificationDialog({
  open,
  onClose,
  justification,
}: DrawJustificationDialogProps) {
  const { t } = useTranslation();
  if (!justification) return null;

  const { algorithm, history, benched } = justification;

  const summaryMetrics: { label: string; value: ReactNode }[] =
    justification.algorithm === "gpt"
      ? [
          [
            "metric.squad_mean",
            formatDecimal(justification.metrics.squad_mean),
          ],
          [
            "metric.team_mean_gap",
            formatDecimal(justification.metrics.team_mean_gap, 3),
          ],
          [
            "metric.sector_gap",
            formatDecimal(justification.metrics.sector_gap, 3),
          ],
          [
            "metric.short_history",
            String(justification.metrics.max_short_history_per_team ?? "-"),
          ],
        ].map(([key, value]) => ({
          label: t(`peladas.detail.draw_report.${key}`),
          value,
        }))
      : [
          [
            "metric.squad_mean",
            formatDecimal(justification.metrics.squad_mean),
          ],
          [
            "metric.overall_gap",
            formatDecimal(justification.metrics.overall_gap, 3),
          ],
          [
            "metric.defense_gap",
            formatDecimal(justification.metrics.defense_gap, 3),
          ],
          [
            "metric.offense_gap",
            formatDecimal(justification.metrics.offense_gap, 3),
          ],
        ].map(([key, value]) => ({
          label: t(`peladas.detail.draw_report.${key}`),
          value,
        }));

  const tacticalEvidence = (team: DrawTacticalTeam) => (
    <>
      <EvidenceList
        icon={<EmojiEventsIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.champion_pairs")}
        items={team.champion_pairs}
        format={(pair) =>
          `${pairName(pair)} (${pair.titles_together}/${pair.title_opportunities})`
        }
        fallback={t("peladas.detail.draw_report.no_champion_pairs")}
      />
      <EvidenceList
        icon={<GroupsIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.top_pairs")}
        items={team.top_pairs}
        format={(pair) =>
          `${pairName(pair)} (${pair.nights_together}/${pair.nights_both_present})`
        }
      />
      <EvidenceList
        icon={<SwapHorizIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.assist_links")}
        items={team.assist_links}
        format={(link) => `${link.from} → ${link.to} (${link.count})`}
      />
      <EvidenceList
        icon={<HourglassBottomIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.short_history_players")}
        items={team.short_history}
        format={(name) => name}
        separator=", "
      />
    </>
  );

  const chemistryEvidence = (team: DrawChemistryTeam) => (
    <>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <MetricChip
          label={t("peladas.detail.draw_report.metric.overall")}
          value={formatDecimal(team.overall)}
        />
        <MetricChip
          label={t("peladas.detail.draw_report.metric.defense")}
          value={formatDecimal(team.defense)}
        />
        <MetricChip
          label={t("peladas.detail.draw_report.metric.offense")}
          value={formatDecimal(team.offense)}
        />
      </Stack>
      <EvidenceList
        icon={<EmojiEventsIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.top_winner")}
        items={team.top_winner ? [team.top_winner] : []}
        format={(winner) => `${winner.name.trim()} (${winner.titles})`}
      />
      <EvidenceList
        icon={<HourglassBottomIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.longest_drought")}
        items={team.longest_drought ? [team.longest_drought] : []}
        format={(entry) => `${entry.name.trim()} (${entry.drought})`}
      />
      <EvidenceList
        icon={<GroupsIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.new_pairs")}
        items={team.new_pairs}
        format={(pair) => `${pairName(pair)} (${pair.faced_each_other})`}
      />
      <EvidenceList
        icon={<EmojiEventsIcon fontSize="small" />}
        label={t("peladas.detail.draw_report.champion_pairs")}
        items={team.champion_pairs}
        format={(pair) => `${pairName(pair)} (${pair.titles_together})`}
      />
    </>
  );

  const renderTeam = (team: DrawTacticalTeam | DrawChemistryTeam) => {
    const tactical = justification.algorithm === "gpt";
    const anchors = tactical ? (team as DrawTacticalTeam).anchors : undefined;
    const titlesTotal = tactical
      ? undefined
      : (team as DrawChemistryTeam).titles_total;
    return (
      <Accordion
        key={team.index}
        disableGutters
        elevation={0}
        data-testid={`draw-report-team-${team.index}`}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          "&:before": { display: "none" },
          mb: 1,
          overflow: "hidden",
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap", width: "100%" }}
          >
            <Typography sx={{ fontWeight: 900 }}>{team.name}</Typography>
            <Chip
              size="small"
              label={`${t("peladas.detail.draw_report.mean")} ${formatDecimal(team.mean)}`}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={team.formation}
              sx={{ fontWeight: 700 }}
            />
            {anchors?.length ? (
              <Tooltip title={t("peladas.detail.draw_report.anchor_hint")}>
                <Chip
                  size="small"
                  color="primary"
                  icon={<StarIcon />}
                  label={anchors.join(", ")}
                  sx={{ fontWeight: 700 }}
                />
              </Tooltip>
            ) : null}
            {typeof titlesTotal === "number" ? (
              <Chip
                size="small"
                variant="outlined"
                icon={<EmojiEventsIcon />}
                label={titlesTotal}
                sx={{ fontWeight: 700 }}
              />
            ) : null}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Box>
              {team.players.map((player) => (
                <PlayerLine key={player.id} player={player} />
              ))}
            </Box>
            <Divider />
            {justification.algorithm === "gpt"
              ? tacticalEvidence(team as DrawTacticalTeam)
              : chemistryEvidence(team as DrawChemistryTeam)}
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <span>{t("peladas.detail.draw_report.title")}</span>
          <Chip
            size="small"
            color="primary"
            label={t(`peladas.detail.draw.algorithm.${algorithm}.name`)}
            sx={{ fontWeight: 900 }}
          />
          <Chip
            size="small"
            variant="outlined"
            label={
              history.enabled
                ? t("peladas.detail.draw_report.history_on")
                : t("peladas.detail.draw_report.history_off")
            }
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {t("peladas.detail.draw_report.players_considered", {
            count: justification.players_considered,
          })}{" "}
          {justification.source === "confirmed_attendance"
            ? t("peladas.detail.draw_report.source_attendance")
            : t("peladas.detail.draw_report.source_board")}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2 }}>
          {summaryMetrics.map((metric) => (
            <MetricChip
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </Stack>

        <Stack spacing={1}>
          {justification.algorithm === "gpt" ? (
            <EvidenceList
              icon={<StarIcon fontSize="small" />}
              label={t("peladas.detail.draw_report.anchors")}
              items={justification.metrics.anchors}
              format={(name) => name}
              separator=", "
            />
          ) : null}

          {history.enabled && history.changed_vs_baseline ? (
            <EvidenceList
              icon={<SwapHorizIcon fontSize="small" />}
              label={t("peladas.detail.draw_report.history_changed")}
              items={history.moves}
              format={(move) => `${move.name.trim()} (${move.from}→${move.to})`}
            />
          ) : null}

          {history.enabled && history.changed_vs_baseline === false ? (
            <Evidence icon={<SwapHorizIcon fontSize="small" />}>
              {t("peladas.detail.draw_report.history_unchanged")}
            </Evidence>
          ) : null}

          <EvidenceList
            icon={<GroupsIcon fontSize="small" />}
            label={t("peladas.detail.draw_report.benched")}
            items={benched}
            format={(player) => player.name.trim()}
            separator=", "
          />
        </Stack>

        <Box sx={{ mt: 2.5 }}>{justification.teams.map(renderTeam)}</Box>

        <Typography
          variant="caption"
          sx={{ display: "block", color: "text.secondary", mt: 2 }}
        >
          {t("peladas.detail.draw_report.caveat")}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 2, fontWeight: 900, px: 3 }}
          data-testid="close-draw-report-button"
        >
          {t("common.close", "Fechar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
