# DevX Client

A modern React application built with Vite, featuring a comprehensive UI component library, state management, routing, and development tools.

## Features

✨ **Modern Stack**

- React 19 with Vite for lightning-fast development
- TailwindCSS v4 with custom theme configuration
- 40+ Align/ui components ready to use

🛠 **Development Tools**

- ESLint + Prettier for code quality and formatting
- Husky + lint-staged for pre-commit hooks
- Jest + React Testing Library for testing

🔧 **Core Features**

- Redux Toolkit for state management
- React Router with protected routes
- Axios API client with interceptors
- Sonner for toast notifications
- Error boundaries and loading states

📦 **Project Structure**

- Custom hooks (useAuth, useMobile, useDialogState, usePagination)
- Reusable UI components
- Utility functions and helpers
- Zod schemas for validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd devx_client
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.development
# Edit .env.development with your configuration
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

### Development

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Code Quality

```bash
npm run lint         # Run ESLint and show all issues
npm run lint:fix     # Run ESLint and auto-fix issues
npm run lint:check   # Run ESLint with zero warnings tolerance (for CI)
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
devx_client/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and service functions
│   │   ├── axios.js    # Axios instance with interceptors
│   │   └── index.js    # API service functions
│   ├── assets/         # Images, SVGs, and other assets
│   ├── components/     # React components
│   │   ├── common/     # Common components (ErrorBoundary, LoadingFallbacks, etc.)
│   │   ├── ui/         # shadcn/ui components (40+ components)
│   │   ├── AppRouter.jsx  # Main router with protected routes
│   │   └── Layout.jsx     # App layout component
│   ├── hooks/          # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useMobile.js
│   │   ├── useDialogState.js
│   │   └── usePagination.js
│   ├── lib/            # Utility functions
│   │   ├── utils.js    # General utilities and cn() helper
│   │   └── table-utils.js
│   ├── pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   └── Profile.jsx
│   ├── redux/          # Redux store and slices
│   │   ├── store.js
│   │   ├── authSlice.js
│   │   └── uiSlice.js
│   ├── schemas/        # Zod validation schemas
│   ├── App.jsx         # Root component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles and Tailwind imports
├── __mocks__/          # Jest mocks
├── .husky/             # Git hooks
├── .env.example        # Environment variables template
├── components.json     # shadcn/ui configuration
├── eslint.config.js    # ESLint configuration
├── jest.config.cjs     # Jest configuration
├── jsconfig.json       # JavaScript path aliases
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Architecture

### State Management (Redux Toolkit)

The application uses Redux Toolkit for global state management:

- **authSlice**: User authentication and authorization state
- **uiSlice**: UI state (modals, sidebars, theme, etc.)

Add new slices in `src/redux/` and register them in `store.js`.

### Routing (React Router)

Routes are defined in `src/components/AppRouter.jsx`:

- **Public routes**: Login, registration, etc.
- **Protected routes**: Require authentication
- **Role-based routes**: Require specific user roles

Example protected route:

```jsx
<Route
  path='/dashboard'
  element={
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### API Client

The API client is configured in `src/api/axios.js`:

- Automatic authentication token handling
- Request/response interceptors
- Error handling
- Base URL from environment variables

Example usage:

```javascript
import { apiService } from '@/api';

// Make API calls
const data = await apiService.getItems({ page: 1, limit: 10 });
```

### UI Components

40+ shadcn/ui components are available in `src/components/ui/`:

- Button, Card, Input, Dialog, Select, etc.
- Fully customizable with Tailwind classes
- Accessible and responsive

Import and use:

```jsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
```

### Custom Hooks

Reusable hooks in `src/hooks/`:

- **useAuth**: Access authentication state and user info
- **useMobile**: Detect mobile viewport
- **useDialogState**: Manage dialog open/close state
- **usePagination**: Handle pagination logic

## Environment Variables

Configure your environment variables in `.env.development` or `.env.production`:

| Variable            | Description       | Example                 |
| ------------------- | ----------------- | ----------------------- |
| `VITE_API_URL`      | API base URL      | `http://localhost:8000` |
| `VITE_APP_NAME`     | Application name  | `DevX`                  |
| `VITE_ENV`          | Environment       | `development`           |
| `VITE_ENABLE_DEBUG` | Enable debug mode | `true`                  |

### Environment File Loading

Vite automatically loads environment files based on the mode:

- **Development** (`npm run dev`): Loads `.env.development`
- **Production** (`npm run build`): Loads `.env.production`
- **All modes**: Also loads `.env` (if present)

**Loading Priority** (higher priority overrides lower):

1. `.env.[mode].local` (highest priority, ignored by git)
2. `.env.local` (ignored by git)
3. `.env.[mode]` (e.g., `.env.development`, `.env.production`)
4. `.env` (lowest priority)

All environment variables must be prefixed with `VITE_` to be accessible in the application.

**Access in code:**

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.MODE === 'development';
```

## Development Workflow

1. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**:

```bash
git add .
git commit -m "feat: your feature description"
```

Pre-commit hooks will automatically:

- Run ESLint and fix issues
- Format code with Prettier

3. **Push and create a pull request**:

```bash
git push origin feature/your-feature-name
```

## Testing

Tests are located alongside the components they test:

```
src/
├── components/
│   ├── Button.jsx
│   └── __tests__/
│       └── Button.test.jsx
```

Write tests using Jest and React Testing Library:

```javascript
import { render, screen } from '@testing-library/react';
import Button from '../Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

## Code Style

This project follows a comprehensive ESLint configuration:

- **React**: Best practices for React 17+
- **React Hooks**: Exhaustive deps checking
- **Unicorn**: Modern JavaScript patterns
- **Code Quality**: No console statements, unused vars, etc.

### Key Rules

- Single quotes for strings
- Semicolons required
- 2-space indentation
- Trailing commas in multiline
- Max line length: 120 characters

### Prettier Configuration

Prettier is configured to work seamlessly with ESLint. Code formatting happens automatically on save and pre-commit.

## Branch Structure

- `main` - Production-ready code
- `dev` - Development branch for integration
- `feature/*` - Feature branches for new development

## Adding New Components

### shadcn/ui Components

Add new shadcn/ui components:

```bash
npx shadcn@latest add <component-name>
```

Example:

```bash
npx shadcn@latest add form
```

### Custom Components

Create in appropriate directory:

- `src/components/common/` - Shared components
- `src/components/ui/` - UI library components
- `src/pages/` - Page components

## Troubleshooting

### Port Already in Use

If port 5173 is in use :

```bash
npm run dev -- --port 3000
```

### ESLint Errors

Fix ESLint errors automatically:

```bash
npm run lint:fix
```

### Test Failures

Run tests in watch mode to debug:

```bash
npm run test:watch
```

### Module Resolution

If you encounter module resolution issues, ensure `jsconfig.json` is properly configured and restart your IDE.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential.

## Support

For questions or issues, please contact the development team.
