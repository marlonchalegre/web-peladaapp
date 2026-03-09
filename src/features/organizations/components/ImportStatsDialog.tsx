import { useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  Autocomplete,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";
import { type Player } from "../../../shared/api/endpoints";

interface ImportStatsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (stats: ImportedStat[]) => Promise<void>;
  players: Player[];
  defaultYear: number;
}

export interface ImportedStat {
  player_id: number;
  player_name: string;
  year: number;
  goals: number;
  assists: number;
  own_goals: number;
  username?: string;
  notFound?: boolean;
}

export default function ImportStatsDialog({
  open,
  onClose,
  onImport,
  players,
  defaultYear,
}: ImportStatsDialogProps) {
  const { t } = useTranslation();
  const [importedData, setImportedData] = useState<ImportedStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setImportedData([]);
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        setError(t("organizations.stats.import.error.empty"));
        return;
      }

      // Aggregate data by username and year
      const aggregated: Record<string, ImportedStat> = {};

      lines.slice(1).forEach((line) => {
        const [username, yearStr, goalsStr, assistsStr] = line.split(",");
        const year = Number(yearStr) || defaultYear;
        const goals = Math.max(0, Number(goalsStr) || 0);
        const assists = Math.max(0, Number(assistsStr) || 0);
        const key = `${username.toLowerCase()}_${year}`;

        if (aggregated[key]) {
          aggregated[key].goals += goals;
          aggregated[key].assists += assists;
        } else {
          const player = players.find(
            (p) =>
              p.user_username === username ||
              p.user_name?.toLowerCase() === username.toLowerCase(),
          );

          aggregated[key] = {
            player_id: player?.id || 0,
            player_name: player?.user_name || username || "",
            username: username,
            year,
            goals,
            assists,
            own_goals: 0,
            notFound: !player,
          };
        }
      });

      setImportedData((prev) => [...Object.values(aggregated), ...prev]);
      setError(null);
    } catch {
      setError(t("organizations.stats.import.error.invalid_format"));
    }
  };

  const handleAddRow = () => {
    setImportedData((prev) => [
      {
        player_id: 0,
        player_name: "",
        year: defaultYear,
        goals: 0,
        assists: 0,
        own_goals: 0,
        notFound: true,
      },
      ...prev,
    ]);
  };

  const handleUpdateRow = (
    index: number,
    field: keyof ImportedStat,
    value: string | number,
  ) => {
    setImportedData((prev) => {
      const next = [...prev];
      const row = { ...next[index] };

      if (
        field === "year" ||
        field === "goals" ||
        field === "assists" ||
        field === "own_goals"
      ) {
        const num = Math.max(0, value as number);
        row[field] = num;
      } else if (field === "player_name" || field === "username") {
        row[field] = value as string;
      }
      next[index] = row;
      return next;
    });
  };

  const handlePlayerSelect = (index: number, player: Player | null) => {
    setImportedData((prev) => {
      if (!player) {
        const next = [...prev];
        next[index] = { ...next[index], player_id: 0, notFound: true };
        return next;
      }

      // Check if this player already exists for the same year in another row
      const currentYear = prev[index].year;
      const existingIdx = prev.findIndex(
        (row, i) =>
          i !== index &&
          row.player_id === player.id &&
          row.year === currentYear,
      );

      if (existingIdx !== -1) {
        // Merge this row into the existing one and remove current
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          goals: next[existingIdx].goals + prev[index].goals,
          assists: next[existingIdx].assists + prev[index].assists,
          own_goals: next[existingIdx].own_goals + prev[index].own_goals,
        };
        return next.filter((_, i) => i !== index);
      }

      // Normal update
      const next = [...prev];
      next[index] = {
        ...next[index],
        player_id: player.id,
        player_name: player.user_name || "",
        username: player.user_username,
        notFound: false,
      };
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setImportedData((prev) => prev.filter((_, i) => i !== index));
  };

  const hasValidData = useMemo(() => {
    return importedData.some((d) => !d.notFound && d.player_id > 0);
  }, [importedData]);

  const handleImport = async () => {
    // Final aggregation by player_id and year just in case
    const aggregatedData: Record<string, ImportedStat> = {};
    importedData.forEach((row) => {
      if (!row.notFound && row.player_id > 0) {
        const key = `${row.player_id}_${row.year}`;
        if (aggregatedData[key]) {
          aggregatedData[key].goals += row.goals;
          aggregatedData[key].assists += row.assists;
          aggregatedData[key].own_goals += row.own_goals;
        } else {
          aggregatedData[key] = { ...row };
        }
      }
    });

    const validData = Object.values(aggregatedData);
    if (validData.length === 0) {
      setError(t("organizations.stats.import.error.no_valid_data"));
      return;
    }

    setLoading(true);
    try {
      await onImport(validData);
      handleClose();
    } catch {
      setError(t("organizations.stats.import.error.failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleNumberKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "-" || e.key === "e" || e.key === "+") {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("organizations.stats.import.title")}</DialogTitle>
      <DialogContent sx={{ minHeight: "400px" }}>
        <Box sx={{ mb: 3, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("organizations.stats.import.description")}
          </Typography>

          <Box
            sx={{
              bgcolor: "action.selected",
              p: 2,
              borderRadius: 1,
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <List sx={{ p: 0 }}>
              {[
                t("organizations.stats.import.help.manual"),
                t("organizations.stats.import.help.csv_format"),
                t("organizations.stats.import.help.negative_numbers"),
              ].map((text, i) => (
                <ListItem key={i} sx={{ p: 0, pb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <InfoOutlinedIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              data-testid="upload-csv-button"
            >
              {t("organizations.stats.import.button.upload_csv")}
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                data-testid="csv-file-input"
              />
            </Button>
            <Button
              variant="outlined"
              onClick={handleAddRow}
              data-testid="add-manual-row-button"
            >
              {t("organizations.stats.import.button.add_manual")}
            </Button>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid="import-error-alert"
            >
              {error}
            </Alert>
          )}

          {importedData.length > 0 && (
            <Box
              sx={{
                maxHeight: 500,
                overflow: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width="40%">{t("common.player")}</TableCell>
                    <TableCell align="center">{t("common.year")}</TableCell>
                    <TableCell align="center">{t("common.goals")}</TableCell>
                    <TableCell align="center">{t("common.assists")}</TableCell>
                    <TableCell align="center">
                      {t("common.own_goals")}
                    </TableCell>
                    <TableCell align="center" width="50px"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importedData.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        transition: "background-color 0.2s",
                      }}
                      data-testid={`import-row-${index}`}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {row.notFound ? (
                            <Tooltip
                              title={t(
                                "organizations.stats.import.player_not_found",
                              )}
                            >
                              <ErrorOutlineIcon
                                color="error"
                                fontSize="small"
                              />
                            </Tooltip>
                          ) : (
                            <CheckCircleOutlineIcon
                              color="success"
                              fontSize="small"
                            />
                          )}
                          <Autocomplete
                            size="small"
                            fullWidth
                            options={players}
                            getOptionLabel={(option) =>
                              typeof option === "string"
                                ? option
                                : option.user_name || option.user_username || ""
                            }
                            isOptionEqualToValue={(option, value) =>
                              typeof value === "string"
                                ? option.user_name === value
                                : option.id === value.id
                            }
                            value={
                              players.find((p) => p.id === row.player_id) ||
                              row.player_name ||
                              null
                            }
                            onChange={(_, newValue) => {
                              if (typeof newValue === "string") {
                                handleUpdateRow(index, "player_name", newValue);
                              } else {
                                handlePlayerSelect(index, newValue);
                              }
                            }}
                            onInputChange={(_, newInputValue) => {
                              handleUpdateRow(
                                index,
                                "player_name",
                                newInputValue,
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="standard"
                                error={row.notFound}
                                placeholder={t("common.player")}
                                inputProps={{
                                  ...params.inputProps,
                                  "data-testid": `player-autocomplete-input-${index}`,
                                }}
                                sx={{
                                  "& .MuiInput-root": {
                                    fontSize: "0.875rem",
                                  },
                                }}
                              />
                            )}
                            freeSolo
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={row.year}
                          onChange={(e) =>
                            handleUpdateRow(
                              index,
                              "year",
                              Number(e.target.value),
                            )
                          }
                          onKeyDown={handleNumberKeyPress}
                          slotProps={{
                            htmlInput: {
                              min: 1900,
                              max: 2100,
                              style: {
                                textAlign: "center",
                                fontSize: "0.875rem",
                              },
                              "data-testid": `year-input-${index}`,
                            },
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={row.goals}
                          onChange={(e) =>
                            handleUpdateRow(
                              index,
                              "goals",
                              Number(e.target.value),
                            )
                          }
                          onKeyDown={handleNumberKeyPress}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              style: {
                                textAlign: "center",
                                fontSize: "0.875rem",
                              },
                              "data-testid": `goals-input-${index}`,
                            },
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={row.assists}
                          onChange={(e) =>
                            handleUpdateRow(
                              index,
                              "assists",
                              Number(e.target.value),
                            )
                          }
                          onKeyDown={handleNumberKeyPress}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              style: {
                                textAlign: "center",
                                fontSize: "0.875rem",
                              },
                              "data-testid": `assists-input-${index}`,
                            },
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          variant="standard"
                          value={row.own_goals}
                          onChange={(e) =>
                            handleUpdateRow(
                              index,
                              "own_goals",
                              Number(e.target.value),
                            )
                          }
                          onKeyDown={handleNumberKeyPress}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              style: {
                                textAlign: "center",
                                fontSize: "0.875rem",
                              },
                              "data-testid": `own-goals-input-${index}`,
                            },
                          }}
                          sx={{ width: "100%" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRow(index)}
                          color="default"
                          data-testid={`remove-row-button-${index}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          color="inherit"
          data-testid="import-cancel-button"
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={loading || !hasValidData}
          sx={{ px: 4 }}
          data-testid="import-confirm-button"
        >
          {t("organizations.stats.import.button.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
