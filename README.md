# 💧 Aqua Track
### Smart Laundry Management System

Aqua Track is a web-based laundry management system developed as an academic project under the subject **Software Engineering**. It digitizes laundry operations through role-based access, QR-based identification, laundry status tracking, and centralized management of users, orders, and operational workflows.

The system is designed to coordinate students, administrators, delivery staff, and washing staff through a single application.

## 📌 Project Overview

Traditional laundry management can involve manual record-keeping, difficulty tracking laundry status, and coordination challenges between users and operational staff.

Aqua Track addresses these challenges by providing a structured digital workflow for managing laundry requests, processing laundry bags, coordinating pickups and deliveries, and monitoring operational activities.

### 🎯 Objectives

- Digitize laundry management and record-keeping.
- Provide separate interfaces and permissions for different user roles.
- Track laundry throughout its processing lifecycle.
- Use QR-based scanning to support laundry identification and handling.
- Centralize pickup sessions, washing batches, complaints, and notifications.
- Improve operational visibility through dashboards, analytics, and audit records.

## ✨ Key Features

### 🔐 Authentication and Access Control
- User registration and login.
- Password recovery and password updates.
- Role-based access to application features.
- Protected routes and role-specific dashboards.
- Database-level security policies and controlled profile updates.

### 🎓 Student Portal
- Student dashboard.
- Laundry information and order history.
- Laundry status and progress tracking.
- Complaint submission and status viewing.
- Notifications and profile management.
- Laundry-related messaging.

### 🛡️ Admin Portal
- Administrative dashboard.
- User management.
- Laundry order monitoring and authorized overrides.
- Pickup session creation and announcements.
- Laundry bag and facility management.
- Complaint management.
- Operational analytics and audit records.
- Application settings.

### 🚚 Delivery Management
- Delivery dashboard.
- Pickup and delivery workflow management.
- Pickup session handling.
- Laundry bag collection.
- QR scanning and laundry identification.
- Batch-related operations and retry handling.

### 🧺 Washing Management
- Washing dashboard and processing queue.
- Laundry lookup and QR scanning.
- Laundry batch management.
- Receiving batches and updating processing statuses.
- Controlled laundry status transitions.

### ⚙️ Shared System Capabilities
- Centralized database integration.
- Server-side validation and application logic.
- Reusable UI components.
- Notifications and status updates.
- Structured database migrations and security policies.

*Features are described from the repository structure and should be verified against the final application before submission.*

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Application Framework | Next.js App Router |
| Backend | Next.js server-side logic, Server Actions and API routes |
| Database | PostgreSQL |
| Backend Platform | Supabase |
| Authentication | Supabase Auth integration |
| Database Security | Row Level Security (RLS), SQL policies and database functions |
| QR Functionality | QR-scanning components and scanner utilities |
| Styling | CSS, Tailwind CSS-related project configuration and reusable UI components |
| Language | TypeScript, JavaScript and SQL |
| Package Management | npm |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

Aqua Track separates the user interface, application logic, shared services, and database operations into organized modules.

```text
                 USERS
                   |
                   v
       Next.js Application Interface
                   |
                   v
       Authentication & Role Access
                   |
                   v
        Application Workflows
       /          |           \
      v           v            v
   Student       Admin      Operations
                            /         \
                           v           v
                       Delivery     Washing
                            \         /
                             v       v
                         Service Layer
                              |
                              v
                       Supabase Client
                              |
                              v
                       PostgreSQL DB
                 + RLS + SQL Functions
```

The application includes shared services, validation schemas, authentication utilities, and database migrations to organize business logic and access control.

## 🔄 Application Workflow

1. **Authentication:** The user signs in or registers through the authentication interface.
2. **Authorization:** The application checks the user's role and restricts access to the relevant areas.
3. **Dashboard:** The user accesses the dashboard and operations available to that role.
4. **Laundry Management:** Laundry records are created, retrieved, and processed through the appropriate workflows.
5. **QR Identification:** Supported scanning interfaces help identify laundry records and bags.
6. **Processing:** Authorized staff handle pickup, delivery, batch processing, and laundry status transitions.
7. **Tracking:** Students and authorized staff can view relevant laundry information and progress.
8. **Administration:** Administrators manage supported users, facilities, complaints, pickup sessions, and operational records.

## 🗄️ Database and Data Management

Aqua Track uses Supabase with PostgreSQL for persistent application data.

The repository includes:

- SQL database migrations.
- Authentication and authorization policies.
- Row Level Security policies.
- Laundry status transition functions.
- Database functions for supported bag collection operations.
- Pickup session and washing batch functionality.
- Realtime publication configuration.
- Initial and test-data setup scripts.

The migration history provides a structured way to manage changes to the database schema and related security rules.

## 📁 Project Structure

```text
aqua-track/
├── src/
│   ├── app/
│   │   ├── (auth)/       # Authentication-related routes
│   │   ├── (student)/    # Student portal
│   │   ├── admin/        # Administrative portal
│   │   ├── delivery/     # Delivery workflows
│   │   ├── washing/      # Washing operations
│   │   └── api/          # API routes
│   ├── components/       # Shared UI components
│   ├── config/           # Application configuration
│   ├── features/         # Feature-specific data access
│   ├── lib/              # Auth, Supabase and utilities
│   ├── services/         # Application service modules
│   └── types/            # Shared TypeScript types
├── scripts/              # Data setup and demo utilities
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── config.toml       # Supabase configuration
│   └── seed.sql          # Database seed data
├── package.json
├── next.config.ts
└── README.md
```

## 🚀 Running the Project Locally

### Prerequisites

- Node.js compatible with the project's dependencies.
- npm.
- A configured Supabase project.
- Git.

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd aqua-track
```

Replace the repository URL with your GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the local environment file expected by the application and configure the required Supabase connection details.

Use the exact environment variable names expected by the project's Supabase client configuration. Do not commit real credentials or private environment files to GitHub.

### 4. Configure the database

Configure the Supabase project and apply the migrations located in `supabase/migrations/` using the database workflow supported by the repository.

Ensure the required database objects, authentication settings, and security policies are configured before running the application.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### 6. Build the application

Check the scripts available in `package.json` before running the production build and any linting or testing commands.

## 🧪 Software Engineering Concepts

This project demonstrates practical application of the following software engineering concepts:

- **Modular design:** Separation of routes, UI components, services, utilities, and types.
- **Separation of concerns:** Organization of authentication, business operations, validation, and database access.
- **Role-based authorization:** Different access permissions for different categories of users.
- **Database design and migrations:** Versioned SQL changes for managing the database schema and security rules.
- **Business logic enforcement:** Controlled status transitions and database operations.
- **Validation and error handling:** Shared validation schemas and application error utilities.
- **Maintainability:** Reusable components and feature-specific modules.

## 👥 Team and Contributions

Aqua Track is a three-member academic project developed under the subject Software Engineering.

- **Bichel Sood — Core Development:** Led the implementation of the application, including system architecture, frontend and backend development, authentication, role-based access, QR workflows, database integration, and major feature integration.
- **Saket — Project Support:** Include the actual responsibilities assigned to this member, such as requirements documentation, workflow review, or testing, where applicable.
- **Sabitra — Project Support:** Include the actual responsibilities assigned to this member, such as test-case preparation, validation, or project documentation, where applicable.

## 🎓 Academic Information

- **Project:** Aqua Track — Smart Laundry Management System
- **Subject:** Software Engineering
- **Project Type:** Academic Team Project
- **Team Size:** 3 Members


## 🔮 Future Scope

Potential future improvements include:

- Automated notifications for important laundry status changes.
- More detailed operational reports.
- Expanded activity monitoring and audit reporting.
- Additional workflow automation.
- Further improvements to mobile usability and accessibility.

## 📄 License

This project was developed for academic purposes. No open-source license has been specified at this time. Any reuse or distribution should respect the applicable ownership rights and institutional policies.

---

**Aqua Track — A structured digital approach to laundry management.**
