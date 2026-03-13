import { Breadcrumbs, Link, Typography, Box, Paper } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function BreadcrumbNav({ items }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        px: { xs: 1.5, sm: 2 },
        py: 0.75,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        mb: 3,
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar for a cleaner look
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <Breadcrumbs
        separator={
          <NavigateNextIcon fontSize="small" sx={{ color: "text.disabled" }} />
        }
        aria-label="breadcrumb"
        sx={{
          whiteSpace: "nowrap",
          "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
        }}
      >
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            color: "primary.main",
            "&:hover": { color: "primary.dark" },
          }}
        >
          <HomeIcon sx={{ fontSize: 20 }} />
        </Link>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          if (isLast) {
            return (
              <Box
                key={index}
                sx={{
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  px: 1.5,
                  py: 0.25,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.path || "#"}
              underline="hover"
              color="inherit"
              sx={{
                fontSize: "0.85rem",
                fontWeight: "medium",
                color: "text.secondary",
                "&:hover": { color: "text.primary" },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Paper>
  );
}
