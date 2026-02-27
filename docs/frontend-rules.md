# Frontend Rules — SYB2.0

## Project Structure

```
client/src/
├── app/
│   ├── layout/              # App shell: App.tsx, NavBar.tsx, CreateLeague.tsx
│   ├── router/              # Routes.tsx, RequireAuth.tsx
│   └── shared/components/   # Reusable form inputs, buttons, chips
├── features/
│   ├── account/             # LoginForm, RegisterForm
│   ├── error/               # ServerError
│   ├── home/                # HomePage
│   ├── leagues/             # LeagueList, LeagueForm, Leaderboard, LeagueTabs
│   ├── matches/             # MatchDetails, MatchDetailsForm, CharacterSelect
│   └── stats/               # LeagueStats, UserStats
├── lib/
│   ├── api/agent.ts         # Axios instance with interceptors
│   ├── hooks/               # useAccount, useLeagues, useMatch, useCharacters, etc.
│   ├── schemas/             # Zod schemas: login, register, league, match
│   ├── stores/              # MobX: store.ts, uiStore.ts
│   ├── types/index.d.ts     # Global TypeScript type declarations
│   └── util/util.ts         # formatDate, timeAgo, requiredString
└── main.tsx                 # Entry point: providers, QueryClient, router
```

---

## React Query Patterns

### Queries

```typescript
// Standard query with conditional enabling
const { data, isLoading } = useQuery({
    queryKey: ["feature", id],
    queryFn: async () => {
        const res = await agent.get<Type>(`/endpoint/${id}`);
        return res.data;
    },
    enabled: !!id
});
```

**Conventions**:
- Query keys are arrays: `["feature"]` or `["feature", id]`
- Always type the axios generic: `agent.get<Type>()`
- Use `enabled` for conditional fetching (don't fetch without required params)
- `staleTime` for rarely-changing data (e.g., characters use `Infinity`)

### Mutations

```typescript
const mutation = useMutation({
    mutationFn: async (data: Schema) => {
        await agent.post(`/endpoint`, data);
    },
    onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["feature", id] });
    }
});
```

**Conventions**:
- Always invalidate related queries on success
- Use `mutateAsync` in form submit handlers (allows try/catch)
- Return data from mutationFn only when needed (e.g., createLeague returns id)

### Hook Organization

Each hook file exports a single function returning all queries and mutations for that domain:

```typescript
export function useLeagues(id?: string) {
    const queryClient = useQueryClient();
    // queries...
    // mutations...
    return { leagues, league, isLoading, createLeague, updateLeague, ... };
}
```

---

## Form Patterns (React Hook Form + Zod)

### Standard Form Setup

```typescript
const { control, handleSubmit, formState: { isValid, isSubmitting, isDirty }, reset } = useForm<Schema>({
    mode: 'onTouched',
    resolver: zodResolver(schema)
});
```

**Conventions**:
- Always use `mode: 'onTouched'` — validates after first blur
- Use `zodResolver` for all validation
- Destructure `control` and pass to shared input components
- Use `reset(data)` in useEffect when loading existing data for edit forms

### Shared Input Components

All form inputs wrap `useController` with MUI components:

| Component | MUI Base | Props Pattern |
|-----------|----------|---------------|
| `TextInput` | TextField | `UseControllerProps<T> & TextFieldProps` |
| `DateTimeInput` | DateTimePicker | `UseControllerProps<T>` |
| `SelectInput` | Select | `UseControllerProps<T> & { items }` |
| `UserSelectInput` | Select + Chip | `UseControllerProps<T> & { users, currentUser }` |

### Zod Schemas

```typescript
// Use requiredString helper for consistent required field messages
export const requiredString = (fieldName: string) => z
    .string({ error: `${fieldName} is required` })
    .min(1, { message: `${fieldName} is required` });

// Complex validation with superRefine for game logic
export const matchSchema = z.array(roundInputSchema).superRefine((rounds, ctx) => {
    // Custom validation: win conditions, tied results, incomplete rounds
});
```

---

## API Communication

### Axios Configuration (`lib/api/agent.ts`)

- Base URL: `/api` (Vite proxy handles routing to backend)
- Response interceptor: toast errors by status code (400, 401, 403, 404), navigate on 401 → `/login`, 500 → `/server-error`
- Dev mode: 500ms artificial delay for loading state visibility
- Cookie-based auth (no Authorization header management needed)

### Error Handling Pattern

```typescript
// Backend errors are handled by interceptor — components don't need try/catch for display
// Only use try/catch for control flow (e.g., preventing navigation on error)
const onSubmit = async (data: Schema) => {
    await mutation.mutateAsync(data);
    navigate('/success-route');
};
```

---

## Component Patterns

### Feature Components

- One component per file, default export
- Feature folder per domain: `features/leagues/`, `features/matches/`
- Co-locate related components in the same feature folder

### Shared Components

- Live in `app/shared/components/`
- Generic over form field values using `<T extends FieldValues>`
- Wrap MUI components with `useController` for form integration

### Layout Pattern

```typescript
// App.tsx: conditional layout — HomePage gets full viewport, all other pages get NavBar + Container
{location.pathname === '/' ? <HomePage /> : (
    <>
        <NavBar />
        <Container maxWidth='xl' sx={{ pt: 10 }}>
            <Outlet />
        </Container>
    </>
)}
```

### Auth Guard

```typescript
// RequireAuth wraps protected routes — redirects to /login with return location
if (!currentUser) return <Navigate to='/login' state={{ from: location }} />;
return <Outlet />;
```

---

## Type System

### Global Types (`lib/types/index.d.ts`)

- All domain types declared as `type` (not `interface`)
- Types mirror backend DTOs — must stay in sync
- No generic API response wrapper (axios returns `res.data` directly)

### Key Types

```
League, LeagueMember, User, Match, Player, Round, Character, LeaderboardUser
```

---

## Material UI Styling

### SX Prop (Primary Approach)

```typescript
<Box sx={{ bgcolor: '#eeeeee', minHeight: '100vh' }}>
<Paper sx={{ display: 'flex', flexDirection: 'column', p: 3, gap: 3, maxWidth: 'md', mx: 'auto', borderRadius: 3 }}>
```

### Styled Components (For Complex Cases)

```typescript
const StyledButton = styled(Button)<StyledButtonProps>(({ theme }) => ({
    '&.Mui-disabled': {
        backgroundColor: theme.palette.grey[600],
    }
}));
```

### No Custom Theme

- Default MUI theme with Roboto font
- Custom colors applied inline via sx prop
- NavBar uses gradient: `linear-gradient(135deg, #182a73 0%, #218aae 69%, #20a78c 89%)`

---

## 8 Enforcement Rules

1. **Queries in hooks, not components** — All `useQuery`/`useMutation` calls live in `lib/hooks/use*.ts`, never directly in components
2. **Zod schemas in `lib/schemas/`** — Never inline validation. One schema file per domain
3. **Shared inputs for all forms** — Use TextInput/SelectInput/DateTimeInput, never raw MUI inputs in forms
4. **Types in `index.d.ts`** — All domain types in one file, never scattered across feature folders
5. **Invalidate on mutation success** — Every mutation must invalidate affected query keys
6. **No frontend statistics logic** — Points, flawless counts, leaderboard ordering come from backend only
7. **Agent base URL is `/api`** — Never hardcode full URLs. Vite proxy handles routing in dev
8. **`mode: 'onTouched'` for all forms** — Consistent validation timing across the app
