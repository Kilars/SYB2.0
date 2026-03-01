import { Breadcrumbs, Link, Tooltip, Typography } from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
import { Link as RouterLink } from "react-router";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type Props = {
    items: BreadcrumbItem[];
};

export default function AppBreadcrumbs({ items }: Props) {
    return (
        <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ mb: 1 }}
            separator={<NavigateNext fontSize="small" sx={{ color: 'text.secondary' }} />}
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                if (isLast || !item.href) {
                    return (
                        <Tooltip key={index} title={item.label} enterDelay={500}>
                            <Typography
                                color="text.primary"
                                fontWeight={isLast ? 'bold' : 'normal'}
                                noWrap
                                sx={{ maxWidth: { xs: 120, sm: 200 } }}
                            >
                                {item.label}
                            </Typography>
                        </Tooltip>
                    );
                }
                return (
                    <Tooltip key={index} title={item.label} enterDelay={500}>
                        <Link
                            component={RouterLink}
                            to={item.href}
                            underline="hover"
                            color="secondary"
                            fontWeight={600}
                            noWrap
                            sx={{ maxWidth: { xs: 120, sm: 200 }, display: 'block' }}
                        >
                            {item.label}
                        </Link>
                    </Tooltip>
                );
            })}
        </Breadcrumbs>
    );
}
