# ⚽ PeladaApp - Frontend

Modern web interface for managing casual soccer matches (peladas) with friends. Built with React 19, TypeScript, Vite, and Material-UI.

---

## 📖 Overview

Frontend application that allows:

- **Authentication**: JWT-based user registration and login.
- **User Management**: View and manage user profiles.
- **Organizations**: Create and manage soccer organizations, including detailed statistics.
- **Peladas (Game Days)**: Configure match days, manage attendance, and view dashboards.
- **Teams**: View team compositions and standings.
- **Matches**: Live score tracking, detailed match events, and player statistics.
- **Voting System**: Post-match voting (1-5 stars) to calculate normalized player scores.
- **Statistics**: Dashboard for player and team performance.

---

## 🚀 Technology Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Material-UI (MUI) 7
- **Routing**: React Router 7
- **Testing**: Vitest + React Testing Library
- **API Client**: Axios & Fetch API
- **Internationalization**: i18next (support for English and Portuguese)

---

## 🛠️ Installation & Development

```bash
# Install dependencies
npm install

# Run in development mode (with Hot Module Replacement)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run unit tests
npm test

# Format all code
npm run format:all

# Preview production build locally
npm run preview
```

---

## 🗂️ Project Structure

The project follows a feature-based architecture:

```text
/src
├── app/                  # Application-wide providers and routing setup
├── features/             # Core business features
│   ├── auth/             # Login, Registration, JWT management
│   ├── organizations/    # Org management, player lists, invitations
│   ├── peladas/          # Match day configuration, attendance, scheduling
│   ├── user/             # User profile and settings
│   ├── home/             # Dashboard and organization listing
├── shared/               # Reusable components and logic
│   ├── api/              # API client, endpoints, and types
│   ├── components/       # Common UI elements (buttons, inputs, etc.)
│   ├── hooks/            # Shared React hooks
├── lib/                  # Library configurations (MUI theme, i18n, etc.)
├── test/                 # Test setup and mocks
```

---

## ⚡ Key Features

### Authentication & Authorization

- Secure JWT storage in `localStorage`.
- Protected routes based on authentication state.
- Permission-based UI elements (Admin vs. Player).

### Organization Management

- **Invitations**: Invite players via email or public link.
- **Join Flows**: Users can join organizations using invitation tokens.
- **Leave Organization**: Players can voluntarily leave an organization (unless they are the last administrator).
- **Administration**: Manage roles and permissions within the organization.

### Attendance Management

- **RSVP**: Players can confirm or decline their attendance for a specific match day.
- **Admin Control**: Admins can manually update player attendance and close the list.
- **Confirmation Dialog**: Safety confirmation when closing the list to avoid accidental team creation.

### Schedule Management

- **Automatic Generation**: Generate fair match schedules based on the number of teams.
- **Manual Adjustments**: Admins can swap team positions and manually edit the schedule.

### Team Management

- **Randomization**: Algorithmically generate balanced teams based on player performance scores.
- **Fixed Goalkeepers**: Option to mark players as permanent goalkeepers during team generation.
- **Drag-and-Drop**: Easily move players between teams.

### Match Tracking

- Real-time score updates.
- Detailed event logging (Goals, Assists, Own Goals).
- Match lineup and substitution management.
- **Manual Stats**: Admins can override or manually enter statistics if needed.

### Voting & Scores

- Integrated voting flow after matches are closed.
- Automatic calculation of normalized scores (1-10) and performance indexes.
- **Voting Results**: Detailed breakdown of post-match feedback.

### Statistics & Dashboards

- **Organization Stats**: Comprehensive view of player rankings, win rates, and goal contributions.
- **Match Day Dashboard**: Real-time summary of current pelada standings and player performance.
- **History**: View past peladas and their results.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file at the root:

```env
VITE_API_URL=http://localhost:8000/api
```

In development with Docker, the proxy is configured in `vite.config.ts` to direct `/api` requests to the backend service.

---

## ✅ Testing

```bash
# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

Test suite covers:

- Component rendering and interactions.
- API client logic and error handling.
- Auth flow and protected route logic.
- Redirection and routing logic.

---

## 🎨 UI/UX

- **Responsive Design**: Mobile-first approach for on-the-pitch use.
- **i18n Support**: Full support for English and Portuguese (pt-BR).
- **Material Design**: Modern aesthetic using MUI.
- **Interactive Elements**: Drag-and-drop, loading skeletons, and real-time feedback.

---

## ⚖️ Licença

MIT License
