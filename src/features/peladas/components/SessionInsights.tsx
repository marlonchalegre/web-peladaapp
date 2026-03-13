import { Box, Tabs, Tab, Paper } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import StandingsPanel, { type StandingRow } from "./StandingsPanel";
import PlayerStatsPanel, { type PlayerStatRow } from "./PlayerStatsPanel";
import PeladaTimeline from "./PeladaTimeline";
import type { MatchEvent, Match } from "../../../shared/api/endpoints";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HistoryIcon from "@mui/icons-material/History";

interface SessionInsightsProps {
  standings: StandingRow[];
  playerStats: PlayerStatRow[];
  onToggleSort: (by: "goals" | "assists") => void;
  // Timeline props
  events: MatchEvent[];
  matches: Match[];
  userIdToName: Record<number, string>;
  orgPlayerIdToUserId: Record<number, number>;
  teamNameById: Record<number, string>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      style={{ height: "calc(100% - 72px)", overflowY: "auto" }}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export default function SessionInsights({
  standings,
  playerStats,
  onToggleSort,
  events,
  matches,
  userIdToName,
  orgPlayerIdToUserId,
  teamNameById,
}: SessionInsightsProps) {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleChange}
          aria-label="session insights tabs"
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            "& .MuiTab-root": {
              minHeight: 72,
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "text.secondary",
              "&.Mui-selected": {
                color: "primary.main",
                bgcolor: "action.selected",
              },
            },
          }}
        >
          <Tab
            icon={<FormatListNumberedIcon />}
            label={t("peladas.panel.standings.title")}
            id="session-tab-0"
          />
          <Tab
            icon={<SportsSoccerIcon />}
            label={t("peladas.panel.stats.title")}
            id="session-tab-1"
          />
          <Tab
            icon={<HistoryIcon />}
            label={t("peladas.timeline.title")}
            id="session-tab-2"
          />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <StandingsPanel standings={standings} />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        <PlayerStatsPanel
          playerStats={playerStats}
          onToggleSort={onToggleSort}
        />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        <PeladaTimeline
          events={events}
          matches={matches}
          userIdToName={userIdToName}
          orgPlayerIdToUserId={orgPlayerIdToUserId}
          teamNameById={teamNameById}
        />
      </CustomTabPanel>
    </Paper>
  );
}
