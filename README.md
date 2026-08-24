# ExamPortal — Online Examination System

A full-stack online exam portal built with **React (Vite + TailwindCSS)** on the frontend and **Node.js + Express + MongoDB** on the backend.

---

## Features

### Student
- Register & login with JWT authentication
- Browse and search published exams
- Start/resume exam attempts with a live countdown timer
- Paginated question navigator with progress tracking
- Submit answers and view instant results with score breakdown
- Review correct/incorrect answers with explanations

### Admin
- Create, edit, publish/unpublish, and delete exams
- Add, edit, and delete questions (single choice, multiple choice, true/false)
- Bulk question import support
- View all student submissions with pass/fail stats
- Manage users (activate/deactivate, promote/demote roles)

---

## Question Upload Format

Use [QUESTION_UPLOAD_TEMPLATE.rtf](QUESTION_UPLOAD_TEMPLATE.rtf) as a Word-compatible preparation template. It includes answered examples for single choice, multiple choice, true/false, short answer, fill-in-the-blank, essay, and matching questions.

The Question Bank now accepts `.json`, `.docx`, `.rtf`, and `.txt` imports. Word and text files must follow the labels in the template. JSON can be imported through the Question Bank or sent to `POST /api/questions/bank/import`; the existing bulk APIs remain available at `POST /api/questions/bulk` and `POST /api/questions/bank/bulk`. Each question must use this shape:

```json
{
    "questionText": "Which language runs in a web browser?",
    "questionType": "single",
    "difficultyLevel": "easy",
    "marks": 1,
    "options": [
        { "text": "JavaScript", "isCorrect": true },
        { "text": "Python", "isCorrect": false }
    ],
    "correctAnswerText": "",
    "matchingPairs": [],
    "explanation": "JavaScript runs in web browsers."
}
```

For `multiple`, mark every correct option with `isCorrect: true`. For `shortanswer` and `fillinblank`, put the answer in `correctAnswerText`. For `essay`, use `correctAnswerText` as the model answer. For `matching`, use `{ "left": "...", "right": "..." }` objects in `matchingPairs`.

## Exam Upload Format

Use [EXAM_UPLOAD_TEMPLATE.rtf](EXAM_UPLOAD_TEMPLATE.rtf) from **Admin > Exams** or **Teacher > My Exams**. The import accepts `.docx`, `.rtf`, `.txt`, and `.json`, creates the exam with all questions, calculates total marks, and saves it as a draft.

For JSON exam imports, use `{ "exam": { "title": "...", "subject": "...", "duration": 30, "passingMarks": 40 }, "questions": [] }`. The question objects use the same format described above.

---

## Project Structure

```
Online Exam1/
├── backend/
│   ├── controllers/       # Route handlers (auth, exams, questions, results, users)
│   ├── middleware/        # JWT auth, error handler
│   ├── models/            # Mongoose models (User, Exam, Question, Result)
│   ├── routes/            # Express routers
│   ├── utils/             # JWT token generator
│   ├── seed.js            # Demo data seeder
│   ├── server.js          # Entry point
│   ├── .env               # Environment variables (edit before running)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/           # Axios API call functions
    │   ├── components/    # Navbar, ExamCard, QuestionCard, Timer, etc.
    │   ├── context/       # AuthContext (global auth state)
    │   └── pages/
    │       ├── student/   # Dashboard, ExamList, TakeExam, MyResults, ResultDetail
    │       └── admin/     # AdminDashboard, AdminExams, ExamForm, ExamManage, AdminResults, AdminUsers
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally on `mongodb://localhost:27017` (or provide Atlas URI)
- **npm** v9+

---

## Setup & Run

### 1. Backend

```powershell
cd backend
npm install
```

Edit `.env` if needed (MongoDB URI, JWT secret):

```
MONGODB_URI=mongodb://localhost:27017/online_exam_portal
JWT_SECRET=your_secret_key_here
PORT=5000
```

Seed demo data (optional but recommended for first run):

```powershell
npm run seed
```

Start the backend server:

```powershell
npm run dev       # development (nodemon, auto-restart)
# or
npm start         # production
```

Server runs on **http://localhost:5000**

---

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000` automatically.

### Deploying with a GitHub link

A GitHub repository link only shows the source code; it does not run the React frontend,
Node backend, or MongoDB. Deploy the `frontend` folder to a static host such as GitHub
Pages, and deploy the `backend` folder plus MongoDB to a service such as Render or Railway.

Before building the frontend, set `VITE_API_URL` to the public backend API URL, including
the `/api` suffix (for example, `https://your-backend.example.com/api`). For the deployed
frontend, set the backend `CLIENT_URL` to its public frontend URL. The frontend uses hash
routing so direct page links work on GitHub Pages.

---

---

## API Reference

### Auth
`Public` means the endpoint does not require an existing JWT token. It does not expose
passwords or make account data public. Login and registration must remain public so a
user can create an account or obtain a token; all account-management endpoints are
protected.

| Method | Endpoint                  | Access  | Description           |
|--------|---------------------------|---------|-----------------------|
| POST   | /api/auth/register        | Public* | Register new user     |
| POST   | /api/auth/login           | Public* | Login                 |
| GET    | /api/auth/me              | Private | Get own profile       |
| PUT    | /api/auth/me              | Private | Update profile        |
| PUT    | /api/auth/change-password | Private | Change password       |

To hide the source code from GitHub, change the repository visibility to **Private** in
GitHub repository **Settings > General > Danger Zone > Change repository visibility**.
That setting is separate from the API access controls above.

### Exams
| Method | Endpoint                  | Access  | Description                      |
|--------|---------------------------|---------|----------------------------------|
| GET    | /api/exams                | Private | List exams                       |
| POST   | /api/exams                | Admin   | Create exam                      |
| GET    | /api/exams/:id            | Private | Get exam details                 |
| PUT    | /api/exams/:id            | Admin   | Update exam                      |
| DELETE | /api/exams/:id            | Admin   | Delete exam + questions + results|
| GET    | /api/exams/:id/questions  | Private | Get exam questions (no answers for students) |
| GET    | /api/exams/stats          | Admin   | Get portal stats                 |

### Questions
| Method | Endpoint            | Access | Description          |
|--------|---------------------|--------|----------------------|
| POST   | /api/questions      | Admin  | Add single question  |
| POST   | /api/questions/bulk | Admin  | Add multiple at once |
| GET    | /api/questions/:id  | Admin  | Get question         |
| PUT    | /api/questions/:id  | Admin  | Update question      |
| DELETE | /api/questions/:id  | Admin  | Delete question      |

### Results
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| POST   | /api/results/start           | Student | Start exam attempt       |
| POST   | /api/results/:id/submit      | Student | Submit answers           |
| GET    | /api/results/my              | Student | Get own results          |
| GET    | /api/results/:id             | Private | Get result details       |
| GET    | /api/results                 | Admin   | Get all results          |
| GET    | /api/results/exam/:examId    | Admin   | Get results for one exam |

---

## Tech Stack

| Layer     | Technology                                         |
|-----------|----------------------------------------------------|
| Frontend  | React 18, Vite, TailwindCSS, React Router v6, Axios |
| Backend   | Node.js, Express 4, Mongoose 8                     |
| Database  | MongoDB                                            |
| Auth      | JWT (jsonwebtoken), bcryptjs                       |
| UI Extras | react-hot-toast                                    |
