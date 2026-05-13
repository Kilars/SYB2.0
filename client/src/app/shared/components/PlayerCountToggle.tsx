import { FormHelperText, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

type PlayerCountToggleProps = {
  value: 2 | 3 | 4;
  onChange: (value: 2 | 3 | 4) => void;
  disabled?: boolean;
  helperText?: string;
  labels?: {
    two?: string;
    three?: string;
    four?: string;
  };
};

const DEFAULT_LABELS = {
  two: "1v1 Bo3",
  three: "3-FFA Single",
  four: "4-FFA Single",
};

export default function PlayerCountToggle({
  value,
  onChange,
  disabled,
  helperText,
  labels,
}: PlayerCountToggleProps) {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue === null) return; // Prevent deselection
    onChange(Number(newValue) as 2 | 3 | 4);
  };

  return (
    <div>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        Format
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={String(value)}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Player count"
        data-testid="player-count-toggle"
        size="small"
      >
        <ToggleButton value="2" aria-label={resolvedLabels.two}>
          <span>
            <Typography variant="body2" fontWeight={600} component="span">
              2
            </Typography>
            <Typography variant="caption" display="block" component="span" sx={{ lineHeight: 1.2, display: "block" }}>
              {resolvedLabels.two}
            </Typography>
          </span>
        </ToggleButton>
        <ToggleButton value="3" aria-label={resolvedLabels.three}>
          <span>
            <Typography variant="body2" fontWeight={600} component="span">
              3
            </Typography>
            <Typography variant="caption" display="block" component="span" sx={{ lineHeight: 1.2, display: "block" }}>
              {resolvedLabels.three}
            </Typography>
          </span>
        </ToggleButton>
        <ToggleButton value="4" aria-label={resolvedLabels.four}>
          <span>
            <Typography variant="body2" fontWeight={600} component="span">
              4
            </Typography>
            <Typography variant="caption" display="block" component="span" sx={{ lineHeight: 1.2, display: "block" }}>
              {resolvedLabels.four}
            </Typography>
          </span>
        </ToggleButton>
      </ToggleButtonGroup>
      {helperText && (
        <FormHelperText disabled={disabled}>{helperText}</FormHelperText>
      )}
    </div>
  );
}
