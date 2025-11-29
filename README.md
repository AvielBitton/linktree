# 🔗 avielbitton Linktree

A beautiful, custom Linktree-style page built with React + Vite + TailwindCSS.

![Preview](preview.png)

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173/linktree/` to see your page.

### Build for Production

```bash
npm run build
```

---

## 📦 Deploy to GitHub Pages

### 1. Push to GitHub

First, make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Initial commit - Linktree page"
git remote add origin https://github.com/AvielBitton/linktree.git
git branch -M main
git push -u origin main
```

### 2. Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
- Build your project (`npm run build`)
- Push the `dist` folder to the `gh-pages` branch

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: Select `gh-pages` and `/ (root)`
4. Click **Save**

### 4. Access Your Site

Your site will be live at:

```
https://avielbitton.github.io/linktree
```

*Note: It may take a few minutes for the site to become available after the first deploy.*

---

## 🎨 Customization

### Replace Background Image

Replace `public/bg.jpg` with your own background image. The image should be:
- High resolution (recommended: 1920x1080 or larger)
- Portrait orientation works best for mobile
- Dark or vibrant images work well with the gradient overlay

### Update Links

Edit `src/App.jsx` to update your social links:

```jsx
const links = [
  {
    id: 'instagram',
    title: 'Instagram',
    url: 'https://instagram.com/YOUR_USERNAME',
    icon: /* ... */
  },
  // Add more links...
]
```

### Update Profile Info

In `src/App.jsx`, update the profile section:

```jsx
<h1>YOUR_NAME</h1>
<p>Your bio here</p>
```

---

## 📁 Project Structure

```
linktree/
├── public/
│   ├── bg.jpg          # Background image (replace this!)
│   └── favicon.svg     # Favicon
├── src/
│   ├── components/
│   │   ├── AsteriskButton.jsx
│   │   ├── Footer.jsx
│   │   ├── LinkButton.jsx
│   │   └── SocialIcons.jsx
│   ├── App.jsx         # Main app component
│   ├── index.css       # Global styles + Tailwind
│   └── main.jsx        # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 🛠 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **gh-pages** - Deployment

---

## 📄 License

MIT © avielbitton

