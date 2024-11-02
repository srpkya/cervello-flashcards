# Cervello Flashcards

A modern spaced repetition flashcard app built with Next.js 13, featuring an intelligent learning algorithm and a clean, minimalist design.

<img width="1677" alt="Screenshot 2024-11-02 at 02 51 34" src="https://github.com/user-attachments/assets/49fcf940-9426-4df7-8af4-77198871fa9b">

## Features

- **Smart Learning Algorithm**: Implements the Free Spaced Repetition Scheduler (FSRS) algorithm for optimal retention
- **Clean, Minimalist Design**: Focus on what matters - learning
- **Cross-Platform**: Works seamlessly across desktop and mobile devices
- **Dark Mode Support**: Easy on the eyes, day or night
- **Translation Support**: Built-in translation capabilities for language learning
- **Community Features**: Share and discover flashcard decks from other users
- **Progress Tracking**: Detailed statistics and learning analytics


## Tech Stack

- **Frontend**: Next.js 13, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: Turso (SQLite)
- **Authentication**: NextAuth.js with Google Provider
- **Testing**: Vitest, React Testing Library
- **AI Integration**: Hugging Face for translations

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- pnpm (preferred) or npm
- A Turso database
- Google OAuth credentials
- Hugging Face API token

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_TURSO_DATABASE_URL=your_turso_database_url
NEXT_PUBLIC_TURSO_AUTH_TOKEN=your_turso_auth_token
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
HUGGINGFACE_API_TOKEN=your_huggingface_token
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/srpkya/cervello_flashcards.git
```

2. Install dependencies:
```bash
pnpm install
```

3. Run database migrations:
```bash
pnpm migrate
```

4. Start the development server:
```bash
pnpm dev
```

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Key Features Overview

### Spaced Repetition System
- Implements FSRS algorithm for optimal review scheduling
- Adapts to individual learning pace
- Intelligent card scheduling based on performance

<img width="1678" alt="Screenshot 2024-11-02 at 02 54 03" src="https://github.com/user-attachments/assets/0a835a8a-e841-464f-8732-255bde80d11c">


### Collection Management
- Create and organize flashcard collections
- Add labels for better organization

### Marketplace
- Share collections with the community
- Rate and comment on shared collections
- Clone collections from other users

<img width="1680" alt="Screenshot 2024-11-02 at 02 55 15" src="https://github.com/user-attachments/assets/396f6765-0cce-45c5-842d-da303f233568">

### Translation Cards

- Generate translation cards with ease 
Supports multiple language pairs:

- English ↔️ German
- English ↔️ French
- English ↔️ Spanish
- English ↔️ Italian
- English ↔️ Portuguese
- English ↔️ Russian

Powered by Helsinki-NLP's OPUS-MT models via Hugging Face

<img width="1677" alt="Screenshot 2024-11-02 at 03 16 35" src="https://github.com/user-attachments/assets/b3bfab8f-3173-4b62-813f-ca581e4b5cee">
<img width="528" alt="Screenshot 2024-11-02 at 03 17 29" src="https://github.com/user-attachments/assets/1d0fe7cf-05cc-42d0-aac6-c77aad29ffcb">

### Study Statistics
- Detailed learning analytics
- Progress tracking
- Study streaks
- Performance metrics

<img width="1679" alt="Screenshot 2024-11-02 at 02 51 09" src="https://github.com/user-attachments/assets/70454a94-e1b6-4074-94ab-076d8ae48d4b">

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue in the GitHub repository.

