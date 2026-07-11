Task API
A small REST API for managing tasks, built with Node.js and Express, with JSON-file persistence and a demo frontend included.

Run it
npm install
npm start
Then open http://localhost:3000 for the demo console, or hit the API directly at http://localhost:3000/api/tasks.

Endpoints
Method	Path	Description
GET	/api/tasks	List tasks. Query params: status (done/pending), priority (low/medium/high), search
GET	/api/tasks/:id	Get a single task
POST	/api/tasks	Create a task — body: { "title": "...", "priority": "medium" }
PUT	/api/tasks/:id	Update a task — any of title, priority, done
PATCH	/api/tasks/:id/toggle	Toggle a task's done status
DELETE	/api/tasks/:id	Delete a task
GET	/api/stats	Summary counts (total, done, pending, by priority)
Example requests
# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write tests","priority":"high"}'

# List pending tasks
curl http://localhost:3000/api/tasks?status=pending

# Toggle done
curl -X PATCH http://localhost:3000/api/tasks/<id>/toggle

# Delete
curl -X DELETE http://localhost:3000/api/tasks/<id>
Project structure
backend-task-api/
├── server.js        # Express app and all routes
├── package.json
├── data/
│   └── tasks.json    # created automatically on first run
└── public/
    └── index.html     # demo frontend that calls the API
Notes
Data persists to data/tasks.json on disk — no database needed, but you could swap readTasks/writeTasks in server.js for a real database without touching the routes.
CORS is enabled, so the API can be called from a separately hosted frontend too.
Input validation: title must be 1–200 characters; priority must be low, medium, or high.
