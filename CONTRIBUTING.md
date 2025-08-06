# Contributing to TechyComm Blog

Thank you for your interest in contributing! 🎉  
We welcome all kinds of contributions: bug reports, feature requests, code, documentation, and design.

---

## 🏁 Getting Started

1. **Fork the repository**  
   Click the "Fork" button at the top right of this repo and clone your fork:
   ```sh
   git clone https://github.com/yourusername/techy-comm-blog.git
   cd techy-comm-blog
   ```

2. **Set up the project**  
   - Install dependencies for both `api` and `client`:
     ```sh
     cd api
     npm install
     cd ../client
     npm install
     ```
   - Copy and configure environment variables:
     ```sh
     cp api/.env.example api/.env
     cp client/.env.example client/.env
     ```
   - Start the servers:
     ```sh
     cd api
     npm run dev
     # In a new terminal:
     cd ../client
     npm run dev
     ```

---

## 🌱 Branch Naming Convention

Follow these conventions ([details](https://www.geeksforgeeks.org/git/how-to-naming-conventions-for-git-branches/)):

- `feature/<feature-name>` – New features  
  _e.g._, `feature/user-profile`
- `bugfix/<bug-description>` – Bug fixes  
  _e.g._, `bugfix/login-error`
- `hotfix/<hotfix-description>` – Urgent fixes  
  _e.g._, `hotfix/crash-on-start`
- `release/<version>` – Release branches  
  _e.g._, `release/v1.0.0`
- `test/<test-description>` – Testing branches  
  _e.g._, `test/api-endpoints`

---

## 🧑‍💻 Coding Standards

- Use **TypeScript** for all code.
- Follow the existing code style (Prettier and ESLint are configured).
- Write clear, descriptive variable and function names.
- Add comments for complex logic.
- Keep functions small and focused.

---

## 📝 Commit Messages

- Use clear, concise commit messages.
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat: add user profile page`
  - `fix: correct login validation`
  - `docs: update README`
  - `refactor: improve API structure`
  - `test: add tests for auth`
  - `chore: update dependencies`

---

## 🧪 Testing

- Add or update tests for your changes.
- Run tests before submitting:
  ```sh
  cd api && npm test
  cd ../client && npm test
  ```

---

## 🚀 Submitting a Pull Request

1. **Sync your fork** with the latest changes from `main`.
2. **Create a branch** for your change.
3. **Make your changes** and commit them.
4. **Push your branch** to your fork.
5. **Open a Pull Request** on GitHub.
   - Describe your changes and reference any related issues.
   - Ensure all checks pass (CI, tests, lint).

---

## 🙋 Need Help?

- Open an [issue](https://github.com/yourusername/techy-comm-blog/issues) for questions or suggestions.
- Join discussions in the repo.

---

Thank you for helping make TechyComm Blog better! ☕
