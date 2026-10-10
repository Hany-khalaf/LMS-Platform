const app = document.getElementById('app');

const state = {
  user: null,
  dashboard: null,
  students: [],
  teachers: [],
  lessons: []
};

function showAlert(type, message) {
  const existing = document.querySelector('.alert');
  if (existing) existing.remove();

  const alert = document.createElement('div');
  alert.className = `alert ${type} show`;
  alert.textContent = message;
  const target = document.querySelector('.panel');
  if (target) target.prepend(alert);
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'string' ? data : data.message || 'Request failed');
  }

  return data;
}

function renderLogin() {
  app.innerHTML = `
    <div class="app-shell">
      <div class="login-card">
        <div class="brand">
          <div class="brand-badge">S</div>
          <div>
            <h1>SchoolHub</h1>
            <p>Admin Learning Platform</p>
          </div>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="admin@school.com" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" value="admin123" required />
          </div>

          <button type="submit" class="primary-btn">Login as Admin</button>
        </form>

        <div class="login-meta">
          Demo admin account:<br />admin@school.com / admin123
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const result = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      state.user = result.user;
      await loadDashboard();
    } catch (error) {
      showAlert('error', error.message);
    }
  });
}

async function loadDashboard() {
  try {
    const [dashboard, students, teachers, lessons] = await Promise.all([
      apiFetch('/api/dashboard'),
      apiFetch('/api/students'),
      apiFetch('/api/teachers'),
      apiFetch('/api/lessons')
    ]);

    state.dashboard = dashboard;
    state.students = students;
    state.teachers = teachers;
    state.lessons = lessons;
    renderDashboard();
  } catch (error) {
    showAlert('error', error.message);
  }
}

function renderDashboard() {
  app.innerHTML = `
    <div class="dashboard">
      <div class="topbar">
        <div class="topbar-left">
          <div class="mini-badge">S</div>
          <div>
            <h2>SchoolHub Dashboard</h2>
          </div>
        </div>
        <div class="user-pill">👤 ${state.user.name} • Admin</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card students">
          <div class="stat-header">
            <div class="stat-label">Students</div>
            <div class="stat-icon">👨‍🎓</div>
          </div>
          <div class="stat-number">${state.dashboard.studentCount}</div>
        </div>

        <div class="stat-card teachers">
          <div class="stat-header">
            <div class="stat-label">Teachers</div>
            <div class="stat-icon">👩‍🏫</div>
          </div>
          <div class="stat-number">${state.dashboard.teacherCount}</div>
        </div>

        <div class="stat-card lessons">
          <div class="stat-header">
            <div class="stat-label">Lessons</div>
            <div class="stat-icon">📚</div>
          </div>
          <div class="stat-number">${state.dashboard.lessonCount}</div>
        </div>
      </div>

      <div class="content-grid">
        <section class="panel">
          <div class="panel-header">
            <h3>Add Student</h3>
          </div>

          <form id="studentForm">
            <div class="form-grid">
              <div class="full">
                <div class="form-group">
                  <label>Name</label>
                  <input name="name" required placeholder="Enter student name" />
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Email</label>
                  <input name="email" type="email" required placeholder="student@mail.com" />
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Phone</label>
                  <input name="phone" placeholder="+966..." />
                </div>
              </div>

              <div class="full">
                <div class="form-group">
                  <label>Level</label>
                  <select name="level">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <button class="primary-btn" type="submit">Add Student</button>
          </form>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h3>Add Teacher</h3>
          </div>

          <form id="teacherForm">
            <div class="form-grid">
              <div class="full">
                <div class="form-group">
                  <label>Name</label>
                  <input name="name" required placeholder="Enter teacher name" />
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="teacher@mail.com" />
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Phone</label>
                  <input name="phone" placeholder="+966..." />
                </div>
              </div>

              <div class="full">
                <div class="form-group">
                  <label>Specialty</label>
                  <input name="specialty" placeholder="Mathematics / Science / Languages" />
                </div>
              </div>
            </div>

            <button class="primary-btn" type="submit">Add Teacher</button>
          </form>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h3>Lessons</h3>
          </div>

          <form id="lessonForm">
            <div class="form-grid">
              <div class="full">
                <div class="form-group">
                  <label>Lesson Title</label>
                  <input name="title" required placeholder="Algebra Basics" />
                </div>
              </div>

              <div class="full">
                <div class="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="3" placeholder="Short lesson description"></textarea>
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Teacher</label>
                  <select name="teacher_id">
                    <option value="">No teacher</option>
                    ${state.teachers.map((teacher) => `<option value="${teacher.id}">${teacher.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Day</label>
                  <select name="day">
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Time</label>
                  <input type="time" name="time" required />
                </div>
              </div>

              <div>
                <div class="form-group">
                  <label>Duration (min)</label>
                  <input type="number" name="duration" value="60" min="30" step="15" />
                </div>
              </div>

              <div class="full">
                <div class="form-group">
                  <label>Room</label>
                  <input name="room" value="Main Room" />
                </div>
              </div>
            </div>

            <button class="primary-btn" type="submit">Add Lesson</button>
          </form>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h3>Student List</h3>
          </div>

          <div id="studentsList" class="list"></div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h3>Teacher List</h3>
          </div>

          <div id="teachersList" class="list"></div>
        </section>

        <section class="panel" style="grid-column: 1 / -1;">
          <div class="panel-header">
            <h3>Lesson Schedule</h3>
          </div>

          <div id="lessonsList" class="list"></div>
        </section>
      </div>
    </div>
  `;

  document.getElementById('studentForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const student = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      level: form.level.value
    };

    try {
      await apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(student)
      });
      form.reset();
      await loadDashboard();
    } catch (error) {
      showAlert('error', error.message);
    }
  });

  document.getElementById('teacherForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const teacher = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      specialty: form.specialty.value.trim()
    };

    try {
      await apiFetch('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(teacher)
      });
      form.reset();
      await loadDashboard();
    } catch (error) {
      showAlert('error', error.message);
    }
  });

  document.getElementById('lessonForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const lesson = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      teacher_id: form.teacher_id.value || null,
      day: form.day.value,
      time: form.time.value,
      duration: Number(form.duration.value) || 60,
      room: form.room.value.trim() || 'Main Room'
    };

    try {
      await apiFetch('/api/lessons', {
        method: 'POST',
        body: JSON.stringify(lesson)
      });
      form.reset();
      await loadDashboard();
    } catch (error) {
      showAlert('error', error.message);
    }
  });

  renderStudents();
  renderTeachers();
  renderLessons();
}

function renderStudents() {
  const list = document.getElementById('studentsList');

  if (!state.students.length) {
    list.innerHTML = '<div class="empty-state">No students added yet.</div>';
    return;
  }

  list.innerHTML = state.students.map((student) => `
    <div class="list-item">
      <div class="item-main">
        <h4>${student.name}</h4>
        <p>${student.email}</p>
        <p>${student.phone || 'No phone'} • ${student.level}</p>
      </div>
      <button class="danger-btn" data-type="student" data-id="${student.id}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.id);
      try {
        await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
        await loadDashboard();
      } catch (error) {
        showAlert('error', error.message);
      }
    });
  });
}

function renderTeachers() {
  const list = document.getElementById('teachersList');

  if (!state.teachers.length) {
    list.innerHTML = '<div class="empty-state">No teachers added yet.</div>';
    return;
  }

  list.innerHTML = state.teachers.map((teacher) => `
    <div class="list-item">
      <div class="item-main">
        <h4>${teacher.name}</h4>
        <p>${teacher.specialty || 'General teaching'}</p>
        <p>${teacher.email || 'No email'} • ${teacher.phone || 'No phone'}</p>
      </div>
      <button class="danger-btn" data-type="teacher" data-id="${teacher.id}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.id);
      try {
        await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
        await loadDashboard();
      } catch (error) {
        showAlert('error', error.message);
      }
    });
  });
}

function renderLessons() {
  const list = document.getElementById('lessonsList');

  if (!state.lessons.length) {
    list.innerHTML = '<div class="empty-state">No lessons scheduled yet.</div>';
    return;
  }

  list.innerHTML = state.lessons.map((lesson) => `
    <div class="list-item">
      <div class="item-main">
        <h4>${lesson.title}</h4>
        <p>${lesson.description || 'No description'}</p>
        <p>${lesson.day} • ${lesson.time} • ${lesson.duration} min • ${lesson.room || 'Main Room'}</p>
        <p>Teacher: ${lesson.teacher_name || 'No teacher assigned'}</p>
      </div>
      <button class="danger-btn" data-type="lesson" data-id="${lesson.id}">Remove</button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.id);
      try {
        await apiFetch(`/api/lessons/${id}`, { method: 'DELETE' });
        await loadDashboard();
      } catch (error) {
        showAlert('error', error.message);
      }
    });
  });
}

renderLogin();
