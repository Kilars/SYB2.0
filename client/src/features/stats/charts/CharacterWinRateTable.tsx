import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

type Props = {
  data: CharacterWinRate[];
  minRounds?: number;
};

export default function CharacterWinRateTable({ data, minRounds = 3 }: Props) {
  const filtered = [...data]
    .filter((a) => a.total >= minRounds)
    .sort((a, b) => b.winRate - a.winRate);

  return (
    <TableContainer sx={{ maxHeight: "40vh", overflowX: "auto" }}>
      <Table stickyHeader aria-label="Character win rates table">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
            >
              Character
            </TableCell>
            <TableCell
              sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
              align="right"
            >
              WR
            </TableCell>
            <TableCell
              sx={{ backgroundColor: "primary.main", color: "white", fontWeight: "bold" }}
              align="right"
            >
              Rounds
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((stats, i) => (
            <TableRow
              key={stats.characterId}
              sx={{
                backgroundColor: i % 2 === 0 ? "action.hover" : "background.paper",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {stats.imageUrl && (
                    <img
                      src={stats.imageUrl}
                      alt={stats.name}
                      style={{ width: 28, height: 28, borderRadius: 4 }}
                    />
                  )}
                  {stats.name}
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: 40,
                  textAlign: "right",
                  paddingRight: 2,
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                  color:
                    stats.winRate >= 60
                      ? "success.main"
                      : stats.winRate <= 40
                        ? "error.main"
                        : "text.primary",
                }}
              >
                {stats.winRate}%
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: 40,
                  textAlign: "right",
                  paddingRight: 2,
                  letterSpacing: "0.05em",
                }}
              >
                {stats.total}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
