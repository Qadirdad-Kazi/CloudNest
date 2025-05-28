# CloudNest

A modern, secure cloud storage platform built with React, TypeScript, and Node.js.

## Features

- 🔐 Secure file storage and sharing
- 👥 Role-based access control
- 📁 Intuitive file management
- 🌙 Dark mode support
- 📊 Admin dashboard
- 📱 Responsive design

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
- Vite
- Axios

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cloudnest.git
cd cloudnest
```

2. Set up environment variables:
   - For the backend, copy `.env.example` to `.env` in the server directory
   - For the frontend, copy `.env.example` to `.env` in the client directory
   - Update the values in both files according to your setup

3. Install dependencies and start the servers:

```bash
# Backend setup
cd server
npm install
npm run dev

# Frontend setup (in a new terminal)
cd client
npm install
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Environment Configuration

#### Backend (.env)
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/cloudnest
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5001/api
VITE_NODE_ENV=development
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
```

## Deployment

CloudNest is configured for easy deployment to Netlify (frontend) and Vercel (backend). See the [DEPLOYMENT.md](DEPLOYMENT.md) file for detailed instructions.

### Quick Deployment Steps

1. Push your code to GitHub
2. Deploy the backend to Vercel
   - Connect your GitHub repository
   - Set the required environment variables
   - Deploy
3. Deploy the frontend to Netlify
   - Connect your GitHub repository
   - Set the required environment variables
   - Deploy

### Demo Users

- Admin: admin@cloudnest.com
- User: user@cloudnest.com
- Guest: guest@cloudnest.com

Password for all accounts: `password`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/       # React context providers
├── data/          # Mock data and constants
├── pages/         # Page components
└── types/         # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.