 URL Shortener Frontend (React + TypeScript + Material UI)

This project is a frontend React application it implements a simple URL Shortener Dashboard with client-side persistence, robust error handling, and a responsive Material UI design.

Features

Authentication – User login & logout (mocked for this evaluation).
<img width="1717" height="597" alt="Screenshot 2025-09-08 144303" src="https://github.com/user-attachments/assets/b6986c64-60ce-41df-b829-fb6498e59749" />

🔗 URL Shortening – Create short links with:
<img width="1477" height="748" alt="Screenshot 2025-09-08 144436" src="https://github.com/user-attachments/assets/2da5459b-387d-40f6-951f-9f2f219d97e7" />

Custom short code (optional)

Default expiry (30 minutes) if not provided

 Analytics Dashboard –

Displays all created short links
<img width="1717" height="796" alt="Screenshot 2025-09-08 144534" src="https://github.com/user-attachments/assets/fe5965a0-edb2-4d51-9312-dad0979d5df9" />

Shows creation & expiry timestamps

Tracks total clicks & click history (timestamp + source)

 Clipboard Support – Copy short link directly.
<img width="1361" height="722" alt="Screenshot 2025-09-08 144555" src="https://github.com/user-attachments/assets/f39ba9d9-9125-4091-a788-b2b400bf910b" />

Link Management – Delete short links, simulate clicks.

 Responsive UI – Built with Material UI only.

 Client-side Persistence – Data stored in localStorage.

 Custom Logger – Inbuilt logger disabled, app uses custom appLog().

 Tech Stack

 React (TypeScript) – For building UI components.

 Material UI (MUI) – For styling and responsive layouts.

 LocalStorage – For persistence (no backend required in this test).

React Router – For URL routing & redirection.

 Project Structure
src/
 ├── components/        # Reusable UI components
 ├── pages/             # Dashboard, Login, Register
 ├── hooks/             # Custom hooks (e.g., useAuth)
 ├── utils/             # Helpers (logger, validation, date utils)
 ├── types/             # TypeScript interfaces & models
 └── App.tsx            # Main entry point

⚙️ Setup & Run Locally

Clone repo:

git clone https://github.com/<your-username>/url-shortener-react.git
cd url-shortener-react


Install dependencies:

npm install


Start development server:

npm start


Runs at http://localhost:3000

 Deployment (GitHub Pages)

Install GitHub Pages:

npm install gh-pages --save-dev


Add this to package.json:

"homepage": "https://<your-username>.github.io/url-shortener-react",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}


Deploy:

npm run deploy

 Assumptions & Constraints

Users are considered pre-authorized (as per test requirements).

Short link expiry defaults to 30 minutes if not specified.

Only Material UI is allowed for styling.

No backend API; all data stored client-side.
