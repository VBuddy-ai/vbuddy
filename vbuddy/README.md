# VBuddy - Virtual Assistant Job Platform

VBuddy is a platform connecting employers with virtual assistants, built with Next.js, TypeScript, and Supabase.

## Features

### Authentication

- [x] User registration and login
- [x] Role-based authentication (Employer/VA)
- [x] Protected routes
- [x] Session management

### Employer Dashboard

- [x] Company profile management
  - Create and edit company profile
  - Upload company logo
  - Set company details (name, description, industry, size, location)
- [x] Job posting
  - Create new job listings
  - Edit existing job listings
  - View job applications
- [x] Hired VAs management
  - View hired virtual assistants
  - Track VA performance
- [x] Job applications review
  - View and manage job applications
  - Accept/reject applications
  - Schedule interviews

### Virtual Assistant Dashboard

- [x] Profile management
  - Create and edit VA profile
  - Upload profile picture
  - Set skills and experience
- [x] Job search and application
  - Browse available jobs
  - Apply for jobs
  - Track application status

## Pending Features

- [ ] Real-time chat between employers and VAs
- [ ] Payment integration
- [ ] Rating and review system
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] Document sharing system
- [ ] Calendar integration for scheduling
- [ ] Analytics dashboard

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- React Query
- Zod (Schema validation)

## Security Features

### Authentication & Authorization

- [x] CSRF Protection
  - CSRF tokens for all state-changing operations
  - Token validation on server-side
  - Automatic token refresh mechanism
- [x] Session Management
  - Secure session handling with Supabase
  - Automatic session refresh
  - Session timeout handling
- [x] Role-Based Access Control (RBAC)
  - Strict separation between Employer and VA roles
  - Protected routes based on user roles
  - Middleware-based route protection

### Data Protection

- [x] Input Validation
  - Server-side validation using Zod
  - Type-safe API endpoints
  - Sanitized user inputs
- [x] Secure File Handling
  - Secure file uploads with size limits
  - File type validation
  - Secure file storage in Supabase

### API Security

- [x] Protected API Routes
  - Authentication checks on all API routes
  - Rate limiting implementation
  - Request validation
- [x] Secure Headers
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security (HSTS)

## Performance Optimizations

The application includes several performance optimizations to ensure fast loading times and smooth user experience:

### Build Optimizations

- **Tree Shaking**: Enabled for production builds to remove unused code
- **Code Splitting**: Automatic code splitting for better initial load times
- **CSS Optimization**: Enabled through Next.js experimental features
- **Image Optimization**: Automatic image optimization with WebP and AVIF support
- **Bundle Size Optimization**: Configured webpack splitChunks for optimal bundle sizes

### Runtime Optimizations

- **Route Prefetching**: Automatic prefetching of pages on link hover
- **Static Generation**: Pages are statically generated where possible
- **Caching Strategy**:
  - Static assets: 1 year cache with immutable flag
  - API routes: No-store with must-revalidate
- **Dynamic Imports**: Heavy components are dynamically imported with loading states

### Component Optimizations

- **Suspense Boundaries**: Used for better loading UX
- **Loading States**: Skeleton loading states for better perceived performance
- **Lazy Loading**: Images and components are lazy loaded when possible

### Development Experience

- **Fast Refresh**: Enabled for quick development iterations
- **TypeScript**: Strict type checking for better code quality
- **ESLint**: Code quality and best practices enforcement

To monitor performance:

1. Use Chrome DevTools Performance tab
2. Check Lighthouse scores
3. Monitor Core Web Vitals in production

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vbuddy.git
cd vbuddy
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing Features

### Authentication Testing

1. Register a new account:

   - Visit `/signup`
   - Fill in the registration form
   - Verify email confirmation

2. Login:
   - Visit `/login`
   - Enter credentials
   - Verify successful login and redirection to dashboard

### Employer Features Testing

1. Company Profile:

   - Visit `/dashboard/employer/company-profile`
   - Create/Edit company profile
   - Verify profile information is saved correctly

2. Job Posting:

   - Visit `/dashboard/employer/post-job`
   - Create a new job listing
   - Verify job appears in job listings
   - Edit job details
   - Delete job listing

3. Applications Management:
   - Visit `/dashboard/employer/my-jobs`
   - View applications for posted jobs
   - Test application review process

### VA Features Testing

1. Profile Management:

   - Visit `/dashboard/va/profile`
   - Create/Edit VA profile
   - Verify profile information is saved

2. Job Search:
   - Visit `/dashboard/va/jobs`
   - Browse available jobs
   - Test job application process
   - Verify application status updates

## Database Schema

### Tables

- users
- employer_profiles
- employer_company_profiles
- va_profiles
- jobs
- job_applications
- hired_vas

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
