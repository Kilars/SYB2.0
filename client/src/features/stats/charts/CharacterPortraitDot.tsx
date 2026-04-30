import { useTheme } from "@mui/material";

type Props = {
  cx: number;
  cy: number;
  size: number;
  imageUrl: string;
  name: string;
  uid: string;
};

export default function CharacterPortraitDot({ cx, cy, size, imageUrl, name, uid }: Props) {
  const theme = useTheme();
  const clipId = `clip-${uid}-${name.replace(/\s+/g, "")}`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={size / 2} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={size / 2 + 2} fill={theme.palette.divider} />
      <image
        href={imageUrl}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}
