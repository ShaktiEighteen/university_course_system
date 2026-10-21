// Centralized API Client for CourseHub

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export async function fetchApi(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };

  const csrftoken = getCookie('csrftoken');
  if (csrftoken) {
    headers['X-CSRFToken'] = csrftoken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP error ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async login(username, password) {
    return fetchApi('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout() {
    return fetchApi('/logout/', {
      method: 'POST',
    }).catch(() => {
      // If logout view does not accept POST without redirect, use GET fallback
      window.location.href = '/logout/';
    });
  },

  async getMe() {
    return fetchApi('/api/me/');
  },

  // Student Endpoints
  async getCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/courses/catalog/?${query}`);
  },

  async registerCourse(sectionId) {
    return fetchApi('/api/registration/register/', {
      method: 'POST',
      body: JSON.stringify({ section_id: sectionId }),
    });
  },

  async dropCourse(sectionId) {
    return fetchApi('/api/registration/drop/', {
      method: 'POST',
      body: JSON.stringify({ section_id: sectionId }),
    });
  },

  async getTimetable() {
    return fetchApi('/api/registration/timetable/');
  },

  async getGrades() {
    return fetchApi('/api/registration/grades/');
  },

  // Instructor Endpoints
  async getInstructorSections() {
    return fetchApi('/api/instructor/sections/');
  },

  async getInstructorRoster(sectionId) {
    return fetchApi(`/api/instructor/roster/${sectionId}/`);
  },

  async updateGrade(studentId, sectionId, grade) {
    return fetchApi('/api/instructor/grade/', {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        section_id: sectionId,
        grade: grade,
      }),
    });
  },

  // Admin Endpoints
  async getAdminOverview() {
    return fetchApi('/api/admin/overview/');
  },

  async getAdminHelpers() {
    return fetchApi('/api/admin/helpers/');
  },

  async createDepartment(data) {
    return fetchApi('/api/admin/departments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createCourse(data) {
    return fetchApi('/api/admin/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createSection(data) {
    return fetchApi('/api/admin/sections/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
