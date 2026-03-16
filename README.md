# [Syntxt] 
— Minimalist Logic. Maximum Reach.

**Syntxt** is a high-end, monospace-driven microblogging platform designed for pure text communication. It strips away the noise of modern social media—no images, no bulky UI, just raw context and crisp typography.

![Syntxt Banner](https://raw.githubusercontent.com/raselshikdar/syntxt/main/public/syntxt-logo.png) ## ✨ Features

- **Text-Only Experience**: Strictly limited to 300 characters to encourage concise and meaningful thoughts.
- **Monospace Aesthetics**: Designed with a terminal/hacker vibe using high-quality monospace fonts.
- **Dim Dark Mode**: A custom "Dim" theme that's easy on the eyes, avoiding the harshness of pure black.
- **Compact & Fast**: Built for speed with a mobile-first, border-driven minimalist UI.
- **Social Core**: Follow/Unfollow system, Likes, Reposts, and Bookmarks.
- **Markdown Support**: Render bold, italics, and code snippets directly within your posts.

## 🛠️ Tech Stack

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

To run Syntxt locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/raselshikdar/syntxt
cd syntxt
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a .env file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```

## 📐 Design Philosophy
Syntxt follows the "Less Noise. Raw Context." principle. Every element, from the 1px solid borders to the carefully picked character limits, is designed to keep the focus on the written word.


## 📄 License
This project is licensed under the MIT License - see the [LICENSE](/LICENSE) file for details.
Developed with ❤️ by Rasel Shikdar
