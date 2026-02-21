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
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) 7
- **Routing**: React Router 7
- **Testing**: Vitest + React Testing Library
- **API Client**: Axios & Fetch API

---

## 🛠️ Installation & Development

```bash
# Install dependencies
npm install

# Run in development mode (with Hot Module Replacement)
npm run dev

# Build for production
npm run build

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
│   ├── organizations/    # Org management and player lists
│   ├── peladas/          # Match day configuration and dashboard
│   ├── user/             # User profile and settings
├── shared/               # Reusable components and logic
│   ├── api/              # API client, endpoints, and types
│   ├── components/       # Common UI elements (buttons, inputs, etc.)
│   ├── hooks/            # Shared React hooks
├── lib/                  # Library configurations (MUI theme, etc.)
├── test/                 # Test setup and mocks
```

---

## ⚡ Key Features

### Authentication & Authorization

- Secure JWT storage in `localStorage`.
- Protected routes based on authentication state.
- Permission-based UI elements (Admin vs. Player).

### Attendance Management

- **RSVP**: Players can confirm or decline their attendance for a specific match day.
- **Admin Control**: Admins can manually update player attendance and close the list to start team randomization.

### Team Management

- **Drag-and-Drop**: Easily move players between teams.
- **Randomization**: Algorithmically generate balanced teams based on player scores.

### Match Tracking

- Real-time score updates.
- Detailed event logging (Goals, Assists, Own Goals).
- Match lineup management.

### Voting & Scores

- Integrated voting flow after matches are closed.
- Automatic calculation of normalized scores (1-10) to help balance future games.

### Statistics & Dashboards

- **Organization Stats**: Comprehensive view of player rankings, win rates, and goal contributions within an organization.
- **Match Day Dashboard**: Real-time summary of current pelada standings and player performance.

### Organization Management

- **Leave Organization**: Players can voluntarily leave an organization they are a member of (unless they are the last administrator).

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file at the root:

```env
VITE_API_URL=http://localhost:8080/api
```

In development with Docker, the proxy is configured to direct `/api` requests to the backend service.

---

## ✅ Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

Test suite covers:

- Component rendering and interactions.
- API client logic and error handling.
- Auth flow and protected route logic.

---

## 🎨 UI/UX

- **Responsive Design**: Mobile-friendly interface for on-the-pitch use.
- **Material Design**: Clean and professional aesthetic using MUI.
- **Interactive Elements**: Drag-and-drop and real-time feedbacks.

---

## ⚖️ Licença

MIT License
