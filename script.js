let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
window.db = { accounts: [], departments: [], employees: [], requests: [] };

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      window.db = JSON.parse(saved);
    } else {
      window.db = {
        accounts: [
          {
            id: 1,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'Password123!',
            role: 'admin',
            verified: true
          }
        ],
        departments: [
          { id: 1, name: 'Engineering', description: 'Software team' },
          { id: 2, name: 'HR', description: 'Human Resources' }
        ],
        employees: [],
        requests: []
      };
      saveToStorage();
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

const routes = {
  '#/': 'home-page',
  '#/register': 'register-page',
  '#/verify-email': 'verify-email-page',
  '#/login': 'login-page',
  '#/profile': 'profile-page',
  '#/employees': 'employees-page',
  '#/departments': 'departments-page',
  '#/accounts': 'accounts-page',
  '#/requests': 'requests-page'
};

const protectedRoutes = ['#/profile', '#/requests'];
const adminRoutes = ['#/employees', '#/departments', '#/accounts'];

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';

  if (protectedRoutes.includes(hash) && !currentUser) {
    navigateTo('#/login');
    return;
  }

  if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'admin')) {
    alert('Access denied. Admins only.');
    navigateTo('#/');
    return;
  }

  document.querySelectorAll('.page').forEach(function(page) {
    page.classList.remove('active');
  });

  const pageId = routes[hash];
  if (pageId && document.getElementById(pageId)) {
    document.getElementById(pageId).classList.add('active');
  } else {
    document.getElementById('home-page').classList.add('active');
  }

  if (hash === '#/verify-email') {
    const email = localStorage.getItem('unverified_email') || '';
    document.getElementById('verify-email-display').textContent = email;
  }

  if (hash === '#/login') {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    const errorDiv = document.getElementById('login-error');
    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';
  }

  if (hash === '#/register') {
    document.getElementById('reg-fname').value = '';
    document.getElementById('reg-lname').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    const errorDiv = document.getElementById('reg-error');
    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';
  }

  if (hash === '#/profile') renderProfile();
  if (hash === '#/accounts') renderAccountsList();
  if (hash === '#/departments') renderDepartmentsTable();
  if (hash === '#/employees') renderEmployeesTable();
  if (hash === '#/requests') renderRequestsTable();
}

function setAuthState(isAuth, user) {
  if (user === undefined) user = null;
  currentUser = user;

  document.body.classList.remove('authenticated', 'not-authenticated', 'is-admin');

  if (isAuth && user) {
    document.body.classList.add('authenticated');
    if (user.role === 'admin') {
      document.body.classList.add('is-admin');
    }
    document.getElementById('navUsername').textContent = user.firstName + ' ' + user.lastName;
  } else {
    document.body.classList.add('not-authenticated');
  }
}

function checkExistingSession() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    const user = window.db.accounts.find(function(a) {
      return a.email === token;
    });
    if (user) {
      setAuthState(true, user);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

function handleRegister() {
  const firstName = document.getElementById('reg-fname').value.trim();
  const lastName = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorDiv = document.getElementById('reg-error');

  errorDiv.classList.add('d-none');
  errorDiv.textContent = '';

  if (!firstName || !lastName || !email || !password) {
    errorDiv.textContent = 'All fields are required.';
    errorDiv.classList.remove('d-none');
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'Password must be at least 6 characters.';
    errorDiv.classList.remove('d-none');
    return;
  }

  const alreadyExists = window.db.accounts.find(function(a) {
    return a.email === email;
  });

  if (alreadyExists) {
    errorDiv.textContent = 'An account with that email already exists.';
    errorDiv.classList.remove('d-none');
    return;
  }

  const newAccount = {
    id: Date.now(),
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    role: 'user',
    verified: false
  };

  window.db.accounts.push(newAccount);
  saveToStorage();
  localStorage.setItem('unverified_email', email);
  navigateTo('#/verify-email');
}

function simulateVerification() {
  const email = localStorage.getItem('unverified_email');

  if (!email) {
    alert('No email to verify.');
    return;
  }

  const account = window.db.accounts.find(function(a) {
    return a.email === email;
  });

  if (account) {
    account.verified = true;
    saveToStorage();
    localStorage.removeItem('unverified_email');
    alert('Email verified! You can now log in.');
    navigateTo('#/login');
  } else {
    alert('Account not found.');
  }
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');

  errorDiv.classList.add('d-none');
  errorDiv.textContent = '';

  const user = window.db.accounts.find(function(a) {
    return a.email === email && a.password === password && a.verified === true;
  });

  if (user) {
    localStorage.setItem('auth_token', email);
    setAuthState(true, user);
    navigateTo('#/profile');
  } else {
    errorDiv.textContent = 'Invalid email or password, or account not verified.';
    errorDiv.classList.remove('d-none');
  }
}

function logout() {
  localStorage.removeItem('auth_token');
  setAuthState(false);
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('reg-fname').value = '';
  document.getElementById('reg-lname').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-password').value = '';
  navigateTo('#/login');
}

function renderProfile() {
  if (!currentUser) return;

  document.getElementById('profile-content').innerHTML =
    '<p><strong>Name:</strong> ' + currentUser.firstName + ' ' + currentUser.lastName + '</p>' +
    '<p><strong>Email:</strong> ' + currentUser.email + '</p>' +
    '<p><strong>Role:</strong> <span class="badge bg-' + (currentUser.role === 'admin' ? 'danger' : 'primary') + '">' +
      currentUser.role +
    '</span></p>' +
    '<button class="btn btn-sm btn-primary mt-3" onclick="alert(\'Edit Profile — coming soon!\')">Edit Profile</button>';
}

function renderAccountsList() {
  const tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = '';

  window.db.accounts.forEach(function(acc) {
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + acc.firstName + ' ' + acc.lastName + '</td>' +
      '<td>' + acc.email + '</td>' +
      '<td><span class="badge bg-' + (acc.role === 'admin' ? 'danger' : 'secondary') + '">' + acc.role + '</span></td>' +
      '<td>' + (acc.verified ? '✅' : '❌') + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-warning me-1" onclick="openAccountForm(' + acc.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-info me-1 text-white" onclick="resetPassword(' + acc.id + ')">Reset PW</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteAccount(' + acc.id + ')">Delete</button>' +
      '</td>';
    tbody.appendChild(row);
  });
}

function openAccountForm(id) {
  const container = document.getElementById('account-form-container');
  container.classList.remove('d-none');

  if (id) {
    const acc = window.db.accounts.find(function(a) { return a.id === id; });
    document.getElementById('account-form-title').textContent = 'Edit Account';
    document.getElementById('acc-id').value = acc.id;
    document.getElementById('acc-fname').value = acc.firstName;
    document.getElementById('acc-lname').value = acc.lastName;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-password').value = acc.password;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
  } else {
    document.getElementById('account-form-title').textContent = 'Add Account';
    document.getElementById('acc-id').value = '';
    document.getElementById('acc-fname').value = '';
    document.getElementById('acc-lname').value = '';
    document.getElementById('acc-email').value = '';
    document.getElementById('acc-password').value = '';
    document.getElementById('acc-role').value = 'user';
    document.getElementById('acc-verified').checked = false;
  }
}

function closeAccountForm() {
  document.getElementById('account-form-container').classList.add('d-none');
}

function saveAccount() {
  const id = document.getElementById('acc-id').value;
  const firstName = document.getElementById('acc-fname').value.trim();
  const lastName = document.getElementById('acc-lname').value.trim();
  const email = document.getElementById('acc-email').value.trim();
  const password = document.getElementById('acc-password').value;
  const role = document.getElementById('acc-role').value;
  const verified = document.getElementById('acc-verified').checked;

  if (!firstName || !lastName || !email || !password) {
    alert('All fields are required.');
    return;
  }

  if (id) {
    const acc = window.db.accounts.find(function(a) { return a.id == id; });
    acc.firstName = firstName;
    acc.lastName = lastName;
    acc.email = email;
    acc.password = password;
    acc.role = role;
    acc.verified = verified;
  } else {
    window.db.accounts.push({
      id: Date.now(),
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      role: role,
      verified: verified
    });
  }

  saveToStorage();
  closeAccountForm();
  renderAccountsList();
}

function resetPassword(id) {
  const newPw = prompt('Enter new password (min 6 characters):');
  if (!newPw) return;
  if (newPw.length < 6) {
    alert('Password must be at least 6 characters!');
    return;
  }
  const acc = window.db.accounts.find(function(a) { return a.id === id; });
  acc.password = newPw;
  saveToStorage();
  alert('Password reset successfully!');
}

function deleteAccount(id) {
  if (currentUser && currentUser.id === id) {
    alert('You cannot delete your own account!');
    return;
  }
  if (!confirm('Are you sure you want to delete this account?')) return;
  window.db.accounts = window.db.accounts.filter(function(a) { return a.id !== id; });
  saveToStorage();
  renderAccountsList();
}

function renderDepartmentsTable() {
  const tbody = document.getElementById('departments-tbody');
  tbody.innerHTML = '';

  if (window.db.departments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No departments yet.</td></tr>';
    return;
  }

  window.db.departments.forEach(function(dept) {
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + dept.name + '</td>' +
      '<td>' + dept.description + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-warning me-1" onclick="openDeptForm(' + dept.id + ')">Edit</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteDept(' + dept.id + ')">Delete</button>' +
      '</td>';
    tbody.appendChild(row);
  });
}

function openDeptForm(id) {
  const container = document.getElementById('dept-form-container');
  container.classList.remove('d-none');

  if (id) {
    const dept = window.db.departments.find(function(d) { return d.id === id; });
    document.getElementById('dept-form-title').textContent = 'Edit Department';
    document.getElementById('dept-record-id').value = dept.id;
    document.getElementById('dept-name').value = dept.name;
    document.getElementById('dept-desc').value = dept.description;
  } else {
    document.getElementById('dept-form-title').textContent = 'Add Department';
    document.getElementById('dept-record-id').value = '';
    document.getElementById('dept-name').value = '';
    document.getElementById('dept-desc').value = '';
  }
}

function closeDeptForm() {
  document.getElementById('dept-form-container').classList.add('d-none');
}

function saveDept() {
  const id = document.getElementById('dept-record-id').value;
  const name = document.getElementById('dept-name').value.trim();
  const desc = document.getElementById('dept-desc').value.trim();

  if (!name || !desc) {
    alert('Name and description are required.');
    return;
  }

  if (id) {
    const dept = window.db.departments.find(function(d) { return d.id == id; });
    dept.name = name;
    dept.description = desc;
  } else {
    window.db.departments.push({ id: Date.now(), name: name, description: desc });
  }

  saveToStorage();
  closeDeptForm();
  renderDepartmentsTable();
}

function deleteDept(id) {
  if (!confirm('Delete this department?')) return;
  window.db.departments = window.db.departments.filter(function(d) { return d.id !== id; });
  saveToStorage();
  renderDepartmentsTable();
}

function renderEmployeesTable() {
  const tbody = document.getElementById('employees-tbody');
  tbody.innerHTML = '';

  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees yet.</td></tr>';
    return;
  }

  window.db.employees.forEach(function(emp) {
    const dept = window.db.departments.find(function(d) { return d.id === emp.deptId; });
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + emp.employeeId + '</td>' +
      '<td>' + emp.userEmail + '</td>' +
      '<td>' + emp.position + '</td>' +
      '<td>' + (dept ? dept.name : 'Unknown') + '</td>' +
      '<td>' + emp.hireDate + '</td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="deleteEmployee(' + emp.id + ')">Delete</button></td>';
    tbody.appendChild(row);
  });
}

function openEmployeeForm() {
  const container = document.getElementById('employee-form-container');
  container.classList.remove('d-none');

  const deptSelect = document.getElementById('emp-dept');
  deptSelect.innerHTML = '';

  window.db.departments.forEach(function(dept) {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    deptSelect.appendChild(option);
  });

  document.getElementById('emp-id').value = '';
  document.getElementById('emp-email').value = '';
  document.getElementById('emp-position').value = '';
  document.getElementById('emp-date').value = '';
}

function closeEmployeeForm() {
  document.getElementById('employee-form-container').classList.add('d-none');
}

function saveEmployee() {
  const employeeId = document.getElementById('emp-id').value.trim();
  const userEmail = document.getElementById('emp-email').value.trim();
  const position = document.getElementById('emp-position').value.trim();
  const deptId = parseInt(document.getElementById('emp-dept').value);
  const hireDate = document.getElementById('emp-date').value;

  if (!employeeId || !userEmail || !position || !hireDate) {
    alert('All fields are required.');
    return;
  }

  const userExists = window.db.accounts.find(function(a) { return a.email === userEmail; });
  if (!userExists) {
    alert('No account found with that email!');
    return;
  }

  window.db.employees.push({
    id: Date.now(),
    employeeId: employeeId,
    userEmail: userEmail,
    position: position,
    deptId: deptId,
    hireDate: hireDate
  });

  saveToStorage();
  closeEmployeeForm();
  renderEmployeesTable();
}

function deleteEmployee(id) {
  if (!confirm('Delete this employee record?')) return;
  window.db.employees = window.db.employees.filter(function(e) { return e.id !== id; });
  saveToStorage();
  renderEmployeesTable();
}

let requestModalInstance = null;

function openRequestModal() {
  document.getElementById('req-items-container').innerHTML = '';
  addRequestItem();

  if (!requestModalInstance) {
    requestModalInstance = new bootstrap.Modal(document.getElementById('requestModal'));
  }
  requestModalInstance.show();
}

function addRequestItem() {
  const container = document.getElementById('req-items-container');
  const row = document.createElement('div');
  row.className = 'd-flex gap-2 mb-2';
  row.innerHTML =
    '<input type="text" class="form-control req-item-name" placeholder="Item name">' +
    '<input type="number" class="form-control req-item-qty" value="1" min="1" style="width:80px">' +
    '<button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(row);
}

function submitRequest() {
  const type = document.getElementById('req-type').value;
  const nameInputs = document.querySelectorAll('.req-item-name');
  const qtyInputs = document.querySelectorAll('.req-item-qty');
  const items = [];

  nameInputs.forEach(function(input, index) {
    const name = input.value.trim();
    const qty = qtyInputs[index].value;
    if (name) {
      items.push({ name: name, qty: qty });
    }
  });

  if (items.length === 0) {
    alert('Please add at least one item.');
    return;
  }

  window.db.requests.push({
    id: Date.now(),
    type: type,
    items: items,
    status: 'Pending',
    date: new Date().toLocaleDateString(),
    employeeEmail: currentUser.email
  });

  saveToStorage();
  if (requestModalInstance) requestModalInstance.hide();
  renderRequestsTable();
}

function renderRequestsTable() {
  const tbody = document.getElementById('requests-tbody');
  const emptyDiv = document.getElementById('requests-empty');
  tbody.innerHTML = '';

  const myRequests = window.db.requests.filter(function(r) {
    return r.employeeEmail === currentUser.email;
  });

  if (myRequests.length === 0) {
    emptyDiv.classList.remove('d-none');
    return;
  }

  emptyDiv.classList.add('d-none');

  myRequests.forEach(function(req, index) {
    const badgeClass = req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark';
    const itemsText = req.items.map(function(i) { return i.name + ' ×' + i.qty; }).join(', ');
    const row = document.createElement('tr');
    row.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td>' + req.type + '</td>' +
      '<td>' + itemsText + '</td>' +
      '<td>' + req.date + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + req.status + '</span></td>';
    tbody.appendChild(row);
  });
}

window.addEventListener('hashchange', handleRouting);

window.addEventListener('load', function() {
  loadFromStorage();s
  checkExistingSession();
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  handleRouting();
});