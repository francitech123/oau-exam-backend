# Health check
curl https://oau-exam-api.onrender.com/api/health

# API docs
curl https://oau-exam-api.onrender.com/

# Leaderboard (public)
curl https://oau-exam-api.onrender.com/api/leaderboard

# Comments (public)
curl https://oau-exam-api.onrender.com/api/comments

# Post a comment (requires auth)
curl -X POST https://oau-exam-api.onrender.com/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text":"This platform is amazing! 🎓"}'
