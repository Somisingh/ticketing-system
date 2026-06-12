# IT Help Desk — Ticketing System

A lightweight, internal IT support ticketing system built for organisations. Employees can raise support tickets with rich-text descriptions and screenshots, while the IT team can triage, assign, track, and resolve tickets through a Kanban-style dashboard — with automated email notifications on resolution.

---

## ✨ Features

### For Employees
- Submit support tickets with a rich-text editor (supports images, screenshots, formatting, links)
- Set urgency (Urgent / Not Urgent) and notification preference
- View all open tickets in **My Tickets**
- View resolution history for closed/resolved tickets, including IT's resolution notes
- Demo video walkthrough available from the landing page

### For IT Team
- Unified dashboard showing all incoming tickets across a Kanban board (Open → ToDo → In Progress → Blocked → Under Review → Resolved → Closed)
- Filter tickets by status
- Assign tickets to any IT team member via dropdown
- Update ticket status and write rich-text resolution notes (images, links, formatting)
- Send a pre-filled Outlook email to the employee on ticket closure

### Authentication
- Email/password login with hashed password storage
- Forgot password flow
- Single unified `User` table with an `IsITTeam` flag controlling access to the IT dashboard vs employee view

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + React Router + Tailwind CSS v4 + React Quill (rich text editor) |
| Backend | ASP.NET Core 8 (Minimal APIs) |
| Database | SQLite + Entity Framework Core 8 |
| Auth | ASP.NET Core Identity Password Hasher |
| Hosting | IIS (Windows Server) |

---

## 📁 Project Structure

```
TicketingSystem/
├── TicketingSystem.Test/      # Domain models (User, Ticket)
├── TicketingSystem.Db/        # EF Core DbContext, migrations, seed data
├── TicketingSystem.Server/             # ASP.NET Core API (Minimal APIs + Controllers)
│   ├── Endpoints/Authentication/       # API for Login, Register, Forgot Password
│   ├── Endpoints/Ticket/               # API for Tickets Create, Update, Fetch Delete
│   └── Dtos/                           # Request/response models
└── ticketingsystem.client/             # React frontend (Vite)
    ├── src/pages/                      # Landing, Login, Register, Demo,
    │                                   # EmployeeDashboard, ITDashboard, TicketDetail, SubmitTicket
    ├── src/components/                 # Layout, ProtectedRoute, StatusBadge, UrgencyBadge
    └── public/demo/                    # Demo video (demo.mp4)
```

---

## 🚀 Local Development

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQLite

### Setup

```bash
# 1. Restore frontend dependencies
cd ticketingsystem.client
npm install

# 2. Update connection string
# Edit TicketingSystem.Server/appsettings.json:
#   "DefaultConnection": "DataSource=ticketing.db"

# 3. Run the backend (auto-runs migrations + seed data on first start)
cd ../TicketingSystem.Server
dotnet run
```

The React dev server runs automatically via the SPA proxy at `http://localhost:59320` and proxies `/api/*` to the .NET backend.


---

## 🌐 Production Deployment (IIS)

1. **Publish** the app:
   ```bash
   dotnet publish TicketingSystem.Server/TicketingSystem.Server.csproj -c Release -o C:\YourWebsiteLoation
   ```
   This automatically builds the React app and copies it into `wwwroot/`.

2. **IIS Setup**:
   - Install the [.NET 8 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)
   - Create a site pointing to the publish folder
   - Set the Application Pool to **No Managed Code**
   - Ensure `web.config` is present (handles SPA routing + ASP.NET Core module)

3. **Database**: connection string in `appsettings.json` must point to your production SQL Server. Migrations and seed data run automatically on first startup.

4. **HTTPS**: a self-signed certificate is used for internal LAN access. The certificate is distributed organisation-wide via Group Policy (Trusted Root Certification Authorities) — no manual install needed on domain-joined PCs.

Full deployment notes are in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

## 🎬 Demo

A short walkthrough video is available on the landing page via the **▶ Watch Demo** button (`/demo`).

---
