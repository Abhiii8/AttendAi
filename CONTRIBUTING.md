# Contributing to AttendAI 🤝

First off, thank you for considering contributing to **AttendAI**! It's people like you that make open-source such an amazing place to learn, inspire, and create.

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
* Be respectful and inclusive in all communications.
* Welcome newcomers and encourage diverse perspectives.
* Focus on constructive feedback and collaboration.

---

## 🛠 How Can I Contribute?

### 1. Reporting Bugs 🐛
Before creating an issue, please check the existing issues to ensure it hasn’t already been reported. When creating a bug report, include:
* A clear and descriptive title.
* Steps to reproduce the behavior.
* Expected vs actual behavior.
* Relevant screenshots, console logs, or error stack traces.
* Your environment details (OS, Node version, Browser).

### 2. Suggesting Enhancements 💡
Feature requests are always welcome! Please detail:
* The problem your enhancement addresses.
* Proposed solution or workflow.
* Alternatives considered.

### 3. Submitting Code Changes 💻

#### Step-by-Step Workflow:
1. **Fork the repo** to your personal GitHub account.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/AttendAi.git
   cd AttendAi
   ```
3. **Install dependencies**:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```
4. **Create a descriptive branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
5. **Make your code edits** and test locally.
6. **Commit using Conventional Commits**:
   ```bash
   git commit -m "feat(module): description of changes"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request (PR)** against `Abhiii8/AttendAi:main`.

---

## 📋 Pull Request Checklist

Before submitting your PR, please verify:
- [ ] My code adheres to the project's coding standards.
- [ ] I have tested changes locally on both Desktop and Mobile viewports.
- [ ] My branch is rebased with the latest `main` branch.
- [ ] I have added appropriate documentation or comments if needed.
- [ ] Any new environment variables are documented in `backend/.env.example`.

Thank you for helping make AttendAI better!
