# Hooran CMS

A modern, headless Content Management System built with **Clean Architecture** principles, React, TypeScript, and Firebase.

## 🌟 Features

- **Clean Architecture** - Framework-independent, testable, and maintainable codebase
- **Multi-tenancy** - Full project isolation and multi-tenant support
- **Dynamic Schema Builder** - Create custom content types on the fly
- **Role-Based Access Control** - Granular permissions for users
- **Audit Logging** - Complete audit trail for all operations
- **Real-time Updates** - Firebase Firestore for instant data synchronization
- **Type-Safe** - 100% TypeScript with zero compilation errors
- **Modern UI** - Built with shadcn/ui and Tailwind CSS

## 🏗️ Architecture

This project follows **Clean Architecture** (aka Hexagonal Architecture or Ports & Adapters):

```
┌─────────────────────────────────────────┐
│   Presentation Layer                    │
│   React Components, Pages, Context      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│   Application Layer                     │
│   Use Cases (Business Logic)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│   Domain Layer                           │
│   Entities, Interfaces, DTOs            │
└─────────────────┬───────────────────────┘
                  ↑
┌─────────────────┴───────────────────────┐
│   Infrastructure Layer                  │
│   Firebase, Adapters, Implementations   │
└─────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── domain/                    # 🎯 Core Business Logic (Framework-Independent)
│   ├── entities/              # Domain models (Project, Schema, Content, User)
│   ├── repositories/          # Repository interfaces (abstractions)
│   ├── dtos/                  # Data Transfer Objects
│   └── di/                    # Dependency Injection configuration
│
├── application/               # 🔧 Application Use Cases
│   └── usecases/              # Business workflows and orchestration
│       ├── AuthUseCase
│       ├── ContentManagementUseCase
│       ├── SchemaManagementUseCase
│       ├── DashboardDataUseCase
│       ├── AuditRetrievalUseCase
│       └── UserManagementUseCase
│
├── infrastructure/            # 🔌 External Frameworks & Tools
│   ├── repositories/          # Firebase repository implementations
│   ├── adapters/              # Data adapters (Firebase ↔ Domain)
│   ├── services/              # Infrastructure services
│   ├── config/                # Database initialization
│   └── di/                    # DI container setup
│
├── presentation/              # 🎨 User Interface
│   ├── components/            # React components
│   ├── pages/                 # Route-level components
│   ├── context/               # React Context providers
│   └── hooks/                 # Custom React hooks
│
├── firebase/                  # 🔥 Firebase configuration
├── lib/                       # Utility functions
└── __tests__/                 # 🧪 Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hooran-cms.git
   cd hooran-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**

   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components

### Backend/Database
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage

### Architecture & Patterns
- **Clean Architecture** - Separation of concerns
- **Dependency Injection** - Loose coupling
- **Repository Pattern** - Data access abstraction
- **Use Case Pattern** - Business logic encapsulation

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

## 🏃 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint
- `npm test` - Run tests
- `npm run type-check` - TypeScript type checking

## 📚 Core Concepts

### Domain Layer (domain/)

The **domain layer** is the heart of the application. It contains:

- **Entities**: Core business objects (Project, Schema, ContentEntry, User)
- **Repository Interfaces**: Abstract contracts for data access
- **DTOs**: Simplified data structures for specific use cases

**Key Principle**: This layer has NO dependencies on external frameworks. It's pure TypeScript.

### Application Layer (application/)

The **application layer** contains **use cases** - the business workflows:

- `ContentManagementUseCase` - Create, update, delete content
- `SchemaManagementUseCase` - Manage content schemas
- `AuthUseCase` - Handle authentication logic
- `DashboardDataUseCase` - Aggregate dashboard statistics

**Key Principle**: Use cases orchestrate business logic using domain entities and repository interfaces.

### Infrastructure Layer (infrastructure/)

The **infrastructure layer** implements the repository interfaces using Firebase:

- `FirebaseProjectRepository` - Project data access
- `FirebaseSchemaRepository` - Schema data access
- `FirebaseContentRepository` - Content data access
- `FirebaseAuditRepository` - Audit logging
- `FirebaseUserRepository` - User management

**Key Principle**: All Firebase-specific code lives here. You can swap Firebase for another database without changing business logic.

### Presentation Layer (presentation/)

The **presentation layer** contains React components and UI logic:

- **Components**: Reusable UI components
- **Pages**: Route-level components
- **Context**: React Context providers
- **Hooks**: Custom React hooks

**Key Principle**: UI depends on use cases, not repositories directly.

## 🔒 Security

- **Firebase Authentication** for secure user login
- **Firestore Security Rules** for data access control
- **Role-Based Access Control (RBAC)** for fine-grained permissions
- **Project-level isolation** for multi-tenancy
- **Audit logging** for all critical operations

## 🎯 Key Features Explained

### Dynamic Schema Builder

Create custom content types without coding:
```typescript
// Define a "Blog Post" schema
{
  id: "blog_posts",
  name: "Blog Posts",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "content", type: "richtext", required: true },
    { name: "author", type: "reference", options: { collection: "users" } },
    { name: "published", type: "boolean", defaultValue: false }
  ]
}
```

### Multi-tenancy

Complete project isolation:
- Each project has its own data space
- Users can be assigned to multiple projects
- Project-specific roles and permissions

### Audit Trail

Every action is logged:
- Who performed the action
- What was changed
- When it happened
- Detailed change information

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://react.dev/) - The UI library
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Support

For support, email support@hooran.com or open an issue on GitHub.

---

**Built with ❤️ using Clean Architecture principles**
