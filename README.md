<p align="center">
  <img src="https://lh3.googleusercontent.com/pw/AP1GczP42usITm10yc2j45bzIWFZnuLDmIrVLOr_aGpSqMnQqZiXxGEdAKbOv103csKm-18I8edfCNHjwzv4lXiCDllEns4BD6fJxG-08v1D2NOqGsqZ8L1W3gFqSTE95lxzKeL3RJqK6jlgvYDITEbrjsM=w605-h605-s-no-gm?authuser=0" alt="TechyComm Logo" width="120" height="120" />
</p>

<h1 align="center">TechyComm Blog</h1>
<p align="center">
  A modern, full-stack, feature-rich blogging platform built with Next.js, Express, MongoDB, and TypeScript.
</p>

---

## ✨ Features

- **Rich Editor:** Markdown and WYSIWYG support, image uploads, code blocks.
- **Authentication:** OAuth (GitHub, Google), email/password, JWT sessions.
- **Real-Time Notifications:** In-app and email notifications via Socket.IO.
- **User Profiles:** Custom avatars, bios, social links, skills, and interests.
- **Blog Management:** Categories, tags, drafts, publishing, and analytics.
- **Comments & Replies:** Nested comments, likes, and moderation.
- **Internationalization:** Multi-language support (i18n).
- **Accessibility & Responsive:** Fully responsive and accessible UI.
- **Dark/Light Mode:** Theme toggle for user preference.
- **Admin Panel:** User and content management (optional).

---

## 🗂️ Monorepo Structure

```
/
├── api/      # Express.js backend (REST API, MongoDB, Socket.IO)
├── client/   # Next.js frontend (React, Tailwind CSS, NextAuth)
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/techy-comm-blog.git
cd techy-comm-blog
```

### 2. Setup Environment Variables

Copy the example environment files and fill in your credentials:

```sh
cp api/.env.example api/.env
cp client/.env.example client/.env
```

- For the API, see [`api/.env.example`](api/.env.example)
- For the client, see [`client/.env.example`](client/.env.example)

### 3. Install Dependencies

```sh
cd api
npm install
cd ../client
npm install
```

### 4. Start the Development Servers

**Start the API:**

```sh
cd ../api
npm run dev
```

**Start the Client:**

```sh
cd ../client
npm run dev
```

- Client: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000) (default)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, NextAuth.js, TypeScript
- **Backend:** Express.js, MongoDB, Mongoose, Socket.IO, TypeScript
- **Other:** Jest, ESLint, Prettier, Firebase Storage

---

## 🧪 Running Tests

**API:**

```sh
cd api
npm test
```

**Client:**

```sh
cd client
npm test
```

---

## 📝 Contributing

Contributions are welcome! Please open issues and pull requests.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

### Branch Naming Convention

Please follow [these branch naming conventions](https://www.geeksforgeeks.org/git/how-to-naming-conventions-for-git-branches/):

- `feature/<feature-name>` for new features
- `bugfix/<bug-description>` for bug fixes
- `hotfix/<hotfix-description>` for urgent fixes
- `release/<version>` for release branches
- `test/<test-description>` for testing

---

## 👥 Contributors

Thanks to all these amazing contributors:

[![Contributors](https://contrib.rocks/image?repo=davidfcopozo/techy-comm-blog)](https://github.com/davidfcopozo/techy-comm-blog/graphs/contributors)

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.IO](https://socket.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [next-auth](https://next-auth.js.org/)

---

<p align="center">
  <a href="https://github.com/davidfcopozo/techy-comm-blog">GitHub</a> •
  <a href="https://nextjs.org/">Next.js</a> •
  <a href="https://expressjs.com/">Express</a>
</p>

<p align="center">
  Made with <span style="font-size:1.2em;">☕</span> by [Your Name](https://github.com/yourusername)
</p>
