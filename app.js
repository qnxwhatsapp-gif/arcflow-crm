// ================= STATE & MOCK DATABASE =================

const DEFAULT_USERS = {
  "principal": { username: "principal", name: "Arthur Pendelton", role: "principal", avatar: "AP", email: "a.pendelton@arcflow.com" },
  "architect": { username: "architect", name: "Sarah Lin", role: "architect", avatar: "SL", email: "s.lin@arcflow.com" },
  "architect2": { username: "architect2", name: "Marcus Vance", role: "architect", avatar: "MV", email: "m.vance@arcflow.com" },
  "client": { username: "client", name: "Jonathan Wright", role: "client", avatar: "JW", email: "j.wright@wrightholdings.com", company: "Wright Holdings" },
  "client2": { username: "client2", name: "Elena Rostova", role: "client", avatar: "ER", email: "e.rostova@rostovestates.com", company: "Rostov Estates" }
};

const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    name: "Helix Residential Villa",
    clientUsername: "client",
    leadUsername: "architect",
    phase: "DD", // SD, DD, CD, CA
    budget: 280000,
    deadline: "2026-08-15",
    description: "Sleek, helical-staircase residential luxury villa integrating sustainable geothermal cooling and local limestone work. Designed with open spans and green roofing.",
    tasks: [
      { 
        id: "task-1-1", 
        title: "Structural Framework Review", 
        status: "inprogress", 
        priority: "High", 
        phase: "DD", 
        assignee: "architect", 
        deadline: "2026-06-10", 
        desc: "Collaborate with structural engineering team to finalize load-bearing calculations for helical concrete columns.",
        subtasks: [
          { id: "subtask-1-1-1", title: "Review engineer comments on concrete shear limits", status: "completed", assignee: "architect", deadline: "2026-06-03" },
          { id: "subtask-1-1-2", title: "Draft updated helical core columns detail plan", status: "todo", assignee: "architect2", deadline: "2026-06-08" }
        ]
      },
      { 
        id: "task-1-2", 
        title: "Interior Lighting Layout Plan", 
        status: "todo", 
        priority: "Medium", 
        phase: "DD", 
        assignee: "architect2", 
        deadline: "2026-06-25", 
        desc: "Draft localized lighting patterns for the primary guest wing and double-height living room.",
        subtasks: []
      },
      { 
        id: "task-1-3", 
        title: "Zoning & Site Permit Approval", 
        status: "completed", 
        priority: "High", 
        phase: "SD", 
        assignee: "architect", 
        deadline: "2026-05-15", 
        desc: "Submit master plan and setbacks to city zoning office for authorization.",
        subtasks: [
          { id: "subtask-1-3-1", title: "Calculate setback boundaries for secondary parking", status: "completed", assignee: "architect", deadline: "2026-05-10" }
        ]
      }
    ],
    workLogs: [
      { id: "wl-1-1", taskId: "task-1-3", userName: "Sarah Lin", date: "2026-05-12", duration: 6, unit: "hours", notes: "Completed site mapping drawings and calculated clearance setbacks for boundary line review." },
      { id: "wl-1-2", taskId: "task-1-1", userName: "Sarah Lin", date: "2026-05-28", duration: 1.5, unit: "days", notes: "Reviewed seismic load calculations with primary mechanical and structural engineers." }
    ],
    comments: [
      { id: "c-1-1", author: "Sarah Lin", role: "architect", text: "Sent the updated elevations to structural engineers. They are validating load tolerances for the helical staircase.", timestamp: "2026-05-29T10:15:00Z" },
      { id: "c-1-2", author: "Jonathan Wright", role: "client", text: "Layout option A looks spectacular. Let's make sure the master bedroom balcony has a clear view of the eastern valley range.", timestamp: "2026-05-30T14:40:00Z" }
    ]
  },
  {
    id: "proj-2",
    name: "Zenith Office Tower",
    clientUsername: "client2",
    leadUsername: "architect2",
    phase: "CD",
    budget: 4500000,
    deadline: "2026-12-01",
    description: "High-density commercial office building featuring intelligent curtain wall glass, integrated PV solar shingles, and dual atrium airflow systems.",
    tasks: [
      { 
        id: "task-2-1", 
        title: "Curtain Wall Joinery Details", 
        status: "inreview", 
        priority: "High", 
        phase: "CD", 
        assignee: "architect2", 
        deadline: "2026-06-05", 
        desc: "Draft detailed CAD/BIM sections of the solar-glazed unitized curtain wall junctions for shop drawing submittal.",
        subtasks: [
          { id: "subtask-2-1-1", title: "Model double pane glazed joints", status: "completed", assignee: "architect2", deadline: "2026-05-28" },
          { id: "subtask-2-1-2", title: "Coordinate PV wiring seals detail", status: "todo", assignee: "architect2", deadline: "2026-06-04" }
        ]
      },
      { 
        id: "task-2-2", 
        title: "HVAC Engineering Coordination", 
        status: "inprogress", 
        priority: "Medium", 
        phase: "CD", 
        assignee: "architect", 
        deadline: "2026-06-18", 
        desc: "Review structural beam web penetrations for the secondary mechanical room air handlers and duct runs.",
        subtasks: []
      }
    ],
    workLogs: [
      { id: "wl-2-1", taskId: "task-2-1", userName: "Marcus Vance", date: "2026-05-30", duration: 8, unit: "hours", notes: "Drafted details for structural floor interface joints and thermal seals." }
    ],
    comments: [
      { id: "c-2-1", author: "Marcus Vance", role: "architect", text: "Finished drafts for the level 1-10 curtain wall joins. Submitting to Arthur for principal approval.", timestamp: "2026-05-31T09:00:00Z" }
    ]
  }
];

let state = {
  users: {},
  projects: [],
  permissions: {},
  currentUser: null,
  currentView: "dashboard",
  selectedProjectId: null
};

// Tracks active tab in Project Details Workspace
let activeProjectTab = "overview"; // overview, tasks, worklogs, collab

// Initialize Application State
function initApp() {
  const storedUsers = localStorage.getItem("arcflow_users");
  if (storedUsers) {
    state.users = JSON.parse(storedUsers);
  } else {
    state.users = DEFAULT_USERS;
    saveUsers();
  }

  const storedProjects = localStorage.getItem("arcflow_projects");
  if (storedProjects) {
    state.projects = JSON.parse(storedProjects);
  } else {
    state.projects = DEFAULT_PROJECTS;
    state.projects.forEach(p => {
      if (!p.workLogs) p.workLogs = [];
      p.tasks.forEach(t => {
        if (!t.subtasks) t.subtasks = [];
      });
    });
    saveProjects();
  }

  // Load and seed dynamic role permissions
  const storedPermissions = localStorage.getItem("arcflow_permissions");
  if (storedPermissions) {
    state.permissions = JSON.parse(storedPermissions);
  } else {
    state.permissions = {
      "architect": {
        canCreateProjects: false,
        canCreateTasks: true,
        canLogWork: true,
        canChangePhase: true,
        canViewFinancials: false,
        canModerateComments: true
      },
      "client": {
        canCreateProjects: false,
        canCreateTasks: false,
        canLogWork: false,
        canChangePhase: false,
        canViewFinancials: false,
        canModerateComments: true
      }
    };
    savePermissions();
  }

  const activeSession = sessionStorage.getItem("arcflow_session");
  if (activeSession) {
    state.currentUser = JSON.parse(activeSession);
    showAppView();
  } else {
    showAuthView();
  }
}

function saveProjects() {
  localStorage.setItem("arcflow_projects", JSON.stringify(state.projects));
}

function saveUsers() {
  localStorage.setItem("arcflow_users", JSON.stringify(state.users));
}

function savePermissions() {
  localStorage.setItem("arcflow_permissions", JSON.stringify(state.permissions));
}

// Permission Checker Helper
function hasPermission(permissionKey) {
  if (!state.currentUser) return false;
  const role = state.currentUser.role;
  // Principal/Admin always has absolute access overrides
  if (role === 'principal') return true;
  if (!state.permissions || !state.permissions[role]) return false;
  return !!state.permissions[role][permissionKey];
}

// ================= AUTHENTICATION HANDLERS =================

function quickLogin(roleKey) {
  let user = null;
  if (roleKey === 'principal') user = state.users.principal;
  else if (roleKey === 'architect') user = state.users.architect;
  else if (roleKey === 'client') user = state.users.client;

  if (user) {
    state.currentUser = user;
    sessionStorage.setItem("arcflow_session", JSON.stringify(user));
    showAppView();
  }
}

function handleLogin() {
  const userField = document.getElementById("username").value.trim().toLowerCase();
  const foundUser = state.users[userField];
  
  if (foundUser) {
    state.currentUser = foundUser;
    sessionStorage.setItem("arcflow_session", JSON.stringify(foundUser));
    showAppView();
  } else {
    alert("Mock User not found. Use Quick Test Logins or enter principal, architect, or client.");
  }
}

function handleLogout() {
  state.currentUser = null;
  state.selectedProjectId = null;
  state.currentView = "dashboard";
  sessionStorage.removeItem("arcflow_session");
  showAuthView();
}

function showAuthView() {
  document.getElementById("auth-view").style.display = "flex";
  document.getElementById("app-view").style.display = "none";
}

function showAppView() {
  document.getElementById("auth-view").style.display = "none";
  document.getElementById("app-view").style.display = "grid";
  
  document.getElementById("user-avatar").innerText = state.currentUser.avatar;
  document.getElementById("user-display-name").innerText = state.currentUser.name;
  
  const badge = document.getElementById("user-role-badge");
  badge.innerText = state.currentUser.role;
  badge.className = "profile-role role-" + state.currentUser.role;

  const navTeam = document.getElementById("nav-team-container");
  if (state.currentUser.role === "client") {
    navTeam.style.display = "none";
  } else {
    navTeam.style.display = "block";
  }

  switchView("dashboard");
}

// ================= ROUTING & VIEW CONTROLLER =================

function switchView(viewName, projectId = null) {
  state.currentView = viewName;
  state.selectedProjectId = projectId;
  activeProjectTab = "overview"; 

  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const activeLink = document.getElementById(`nav-${viewName}`);
  if (activeLink) activeLink.classList.add("active");

  document.querySelectorAll(".view-panel").forEach(panel => panel.style.display = "none");
  
  const actionsContainer = document.getElementById("navbar-actions-container");
  actionsContainer.innerHTML = "";

  if (viewName === "dashboard") {
    document.getElementById("view-dashboard").style.display = "block";
    document.getElementById("page-title").innerText = "Dashboard Overview";
    
    if (hasPermission("canCreateProjects")) {
      actionsContainer.innerHTML = `
        <button class="action-btn primary" onclick="openCreateProjectModal()">
          <i class="fa-solid fa-plus"></i> New Project
        </button>
      `;
    }
    renderDashboard();
  } 
  else if (viewName === "projects") {
    document.getElementById("view-projects").style.display = "block";
    document.getElementById("page-title").innerText = "Projects Portfolio";
    
    if (hasPermission("canCreateProjects")) {
      actionsContainer.innerHTML = `
        <button class="action-btn primary" onclick="openCreateProjectModal()">
          <i class="fa-solid fa-plus"></i> New Project
        </button>
      `;
    }
    renderProjectsList();
  } 
  else if (viewName === "project-details") {
    document.getElementById("view-project-details").style.display = "block";
    document.getElementById("page-title").innerText = "Project Workspace";
    
    const proj = state.projects.find(p => p.id === projectId);
    if (proj && hasPermission("canCreateTasks")) {
      actionsContainer.innerHTML = `
        <button class="action-btn" onclick="switchView('projects')">
          <i class="fa-solid fa-arrow-left"></i> Back to Portfolio
        </button>
        <button class="action-btn primary" onclick="openAddTaskModal('${projectId}')">
          <i class="fa-solid fa-plus"></i> Add Task
        </button>
      `;
    } else {
      actionsContainer.innerHTML = `
        <button class="action-btn" onclick="switchView('dashboard')">
          <i class="fa-solid fa-arrow-left"></i> Back to Dashboard
        </button>
      `;
    }
    renderProjectDetails(projectId);
  } 
  else if (viewName === "team") {
    document.getElementById("view-team").style.display = "block";
    document.getElementById("page-title").innerText = "Studio & Client Directory";
    
    const addClientContainer = document.getElementById("add-client-btn-container");
    if (addClientContainer) {
      if (state.currentUser.role === 'principal') {
        addClientContainer.innerHTML = `
          <button class="action-btn primary" onclick="openModal('modal-add-client')">
            <i class="fa-solid fa-plus"></i> Add Client
          </button>
        `;
      } else {
        addClientContainer.innerHTML = "";
      }
    }

    const addStaffContainer = document.getElementById("add-staff-btn-container");
    if (addStaffContainer) {
      if (state.currentUser.role === 'principal') {
        addStaffContainer.innerHTML = `
          <button class="action-btn primary" onclick="openModal('modal-add-staff')">
            <i class="fa-solid fa-plus"></i> Add Staff
          </button>
        `;
      } else {
        addStaffContainer.innerHTML = "";
      }
    }
    renderTeamAndClients();
  }
}

// ================= STATS HELPERS =================

const PHASES = {
  "SD": "Schematic Design (SD)",
  "DD": "Design Development (DD)",
  "CD": "Construction Documents (CD)",
  "CA": "Construction Admin (CA)"
};

function getProjectLoggedHours(project) {
  if (!project.workLogs) return 0;
  let total = 0;
  project.workLogs.forEach(w => {
    if (w.unit === "days") {
      total += parseFloat(w.duration) * 8;
    } else {
      total += parseFloat(w.duration);
    }
  });
  return Math.round(total * 10) / 10;
}

// Render Dashboard View
function renderDashboard() {
  const statsGrid = document.getElementById("dashboard-stats-grid");
  const projectsTableBody = document.getElementById("dashboard-projects-table-body");
  const activityFeed = document.getElementById("dashboard-activity-feed");
  
  let userProjects = state.projects;
  if (state.currentUser.role === "client") {
    userProjects = state.projects.filter(p => p.clientUsername === state.currentUser.username);
  } else if (state.currentUser.role === "architect") {
    userProjects = state.projects.filter(p => p.leadUsername === state.currentUser.username || p.tasks.some(t => t.assignee === state.currentUser.username));
  }

  const activeCount = userProjects.length;
  let totalTasks = 0;
  let completedTasks = 0;
  let portfolioBudget = 0;
  let overdueTasksCount = 0;

  userProjects.forEach(p => {
    portfolioBudget += p.budget;
    p.tasks.forEach(t => {
      totalTasks++;
      if (t.status === "completed") completedTasks++;
      
      if (t.status !== "completed" && new Date(t.deadline) < new Date()) {
        overdueTasksCount++;
      }
    });
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Render stats depending on View Budgets Permission
  if (hasPermission("canViewFinancials")) {
    statsGrid.innerHTML = `
      <div class="stat-card gold">
        <div class="stat-title">Portfolio Valuation</div>
        <div class="stat-value">$${portfolioBudget.toLocaleString()}</div>
        <div class="stat-desc">Valuation across ${activeCount} active commissions</div>
      </div>
      <div class="stat-card teal">
        <div class="stat-title">Active Projects</div>
        <div class="stat-value">${activeCount}</div>
        <div class="stat-desc">Commissions currently in drafting/review</div>
      </div>
      <div class="stat-card green">
        <div class="stat-title">Task Completion</div>
        <div class="stat-value">${completionRate}%</div>
        <div class="stat-desc">${completedTasks} of ${totalTasks} design milestones achieved</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-title">Overdue Deliverables</div>
        <div class="stat-value" style="color: var(--priority-high)">${overdueTasksCount}</div>
        <div class="stat-desc">Milestones that require immediate oversight</div>
      </div>
    `;
  } else {
    statsGrid.innerHTML = `
      <div class="stat-card teal">
        <div class="stat-title">My Projects</div>
        <div class="stat-value">${activeCount}</div>
        <div class="stat-desc">Projects you are assigned or leading</div>
      </div>
      <div class="stat-card green">
        <div class="stat-title">Task Completion Rate</div>
        <div class="stat-value">${completionRate}%</div>
        <div class="stat-desc">${completedTasks} / ${totalTasks} tasks resolved</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-title">My Pending Tasks</div>
        <div class="stat-value">${totalTasks - completedTasks}</div>
        <div class="stat-desc">Awaiting drafting or layout review</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-title">Overdue Milestones</div>
        <div class="stat-value" style="color: var(--priority-high)">${overdueTasksCount}</div>
        <div class="stat-desc">Requires immediate update & client alert</div>
      </div>
    `;
  }

  projectsTableBody.innerHTML = "";
  if (userProjects.length === 0) {
    projectsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No active projects matching your profile.</td></tr>`;
  } else {
    userProjects.forEach(p => {
      const progress = getProjectProgress(p);
      const lead = state.users[p.leadUsername]?.name || p.leadUsername;
      
      const row = document.createElement("tr");
      row.className = "project-row";
      row.onclick = () => switchView("project-details", p.id);
      row.innerHTML = `
        <td>
          <div class="project-name-cell">
            <strong>${p.name}</strong>
            <span class="project-client-name">${state.users[p.clientUsername]?.company || "Private Client"}</span>
          </div>
        </td>
        <td>${lead}</td>
        <td><span class="phase-badge phase-${p.phase.toLowerCase()}">${p.phase}</span></td>
        <td>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${progress}% complete</span>
        </td>
        <td>${new Date(p.deadline).toLocaleDateString()}</td>
      `;
      projectsTableBody.appendChild(row);
    });
  }

  activityFeed.innerHTML = "";
  let allComments = [];
  userProjects.forEach(p => {
    p.comments.forEach(c => {
      allComments.push({
        project: p.name,
        projectId: p.id,
        author: c.author,
        role: c.role,
        text: c.text,
        time: new Date(c.timestamp)
      });
    });
  });

  allComments.sort((a, b) => b.time - a.time);

  if (allComments.length === 0) {
    activityFeed.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px;">No updates logged yet.</div>`;
  } else {
    allComments.slice(0, 5).forEach(c => {
      let iconColor = "teal";
      if (c.role === "client") iconColor = "green";
      else if (c.role === "principal") iconColor = "gold";
      
      const dateStr = c.time.toLocaleDateString() + " " + c.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      activityFeed.innerHTML += `
        <div class="activity-item">
          <div class="activity-icon ${iconColor}">
            <i class="fa-solid fa-comment-dots"></i>
          </div>
          <div class="activity-details">
            <div>
              <strong>${c.author}</strong> in 
              <span style="color: var(--accent-teal); cursor: pointer;" onclick="switchView('project-details', '${c.projectId}')">${c.project}</span>
            </div>
            <div style="color: var(--text-secondary); margin-top: 4px;">"${c.text}"</div>
            <div class="activity-time">${dateStr}</div>
          </div>
        </div>
      `;
    });
  }
}

// Render Projects Portfolio List View
function renderProjectsList() {
  const tbody = document.getElementById("projects-table-body");
  const searchQuery = document.getElementById("project-search-input").value.toLowerCase();
  
  let filtered = state.projects;
  if (state.currentUser.role === "client") {
    filtered = state.projects.filter(p => p.clientUsername === state.currentUser.username);
  } else if (state.currentUser.role === "architect") {
    filtered = state.projects.filter(p => p.leadUsername === state.currentUser.username || p.tasks.some(t => t.assignee === state.currentUser.username));
  }

  if (searchQuery) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchQuery) || 
      (state.users[p.clientUsername]?.company || "").toLowerCase().includes(searchQuery) ||
      (state.users[p.leadUsername]?.name || "").toLowerCase().includes(searchQuery)
    );
  }

  tbody.innerHTML = "";
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted)">No projects matching query.</td></tr>`;
  } else {
    filtered.forEach(p => {
      const progress = getProjectProgress(p);
      const lead = state.users[p.leadUsername]?.name || p.leadUsername;
      const client = state.users[p.clientUsername];
      const clientStr = client ? `${client.name} (${client.company})` : "Private Client";

      const total = p.tasks.length;
      const completed = p.tasks.filter(t => t.status === "completed").length;
      const progressTasks = p.tasks.filter(t => t.status === "inprogress").length;
      const reviewTasks = p.tasks.filter(t => t.status === "inreview").length;

      const tr = document.createElement("tr");
      tr.className = "project-row";
      tr.onclick = () => switchView("project-details", p.id);
      tr.innerHTML = `
        <td>
          <div class="project-name-cell">
            <strong>${p.name}</strong>
            <span class="project-client-name">${clientStr}</span>
          </div>
        </td>
        <td>${lead}</td>
        <td><span class="phase-badge phase-${p.phase.toLowerCase()}">${p.phase}</span></td>
        <td>
          <span style="color: var(--text-secondary); font-size: 12px;">
            ${completed}/${total} Done (${progressTasks} Prog, ${reviewTasks} Rev)
          </span>
        </td>
        <td>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${progress}%</span>
        </td>
        <td>${new Date(p.deadline).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// ================= PROJECT WORKSPACE RENDERING =================

function setProjectTab(tabName, projectId) {
  activeProjectTab = tabName;
  renderProjectDetails(projectId);
}

function renderProjectDetails(projectId) {
  const container = document.getElementById("view-project-details");
  const proj = state.projects.find(p => p.id === projectId);
  
  if (!proj) {
    container.innerHTML = `<div class="content-block">Project details not found.</div>`;
    return;
  }

  const leadName = state.users[proj.leadUsername]?.name || proj.leadUsername;
  const clientObj = state.users[proj.clientUsername];
  const clientName = clientObj ? `${clientObj.name} (${clientObj.company})` : "N/A";
  
  // Phase indicator timeline calculations
  const phasesArr = ["SD", "DD", "CD", "CA"];
  const currentPhaseIndex = phasesArr.indexOf(proj.phase);
  
  let phaseStepsHTML = "";
  phasesArr.forEach((ph, idx) => {
    let statusClass = "";
    if (idx < currentPhaseIndex) statusClass = "completed";
    else if (idx === currentPhaseIndex) statusClass = "active";
    
    // Check permission to change project phase
    const clickAttr = hasPermission("canChangePhase") ? `onclick="changeProjectPhase('${proj.id}', '${ph}')"` : '';
    
    phaseStepsHTML += `
      <div class="phase-step ${statusClass}" ${clickAttr} title="${PHASES[ph]}">
        <div class="phase-dot">${idx + 1}</div>
        <div class="phase-title-text">${ph}</div>
      </div>
    `;
  });

  const budgetHTML = hasPermission("canViewFinancials") ? 
    `<div class="project-meta-item">
      <span class="project-meta-label">Design & Construction Budget</span>
      <span class="project-meta-value" style="color: var(--accent-gold);">$${proj.budget.toLocaleString()}</span>
    </div>` : '';

  const tabsHTML = `
    <div class="project-tabs">
      <button class="project-tab ${activeProjectTab === 'overview' ? 'active' : ''}" onclick="setProjectTab('overview', '${proj.id}')">
        <i class="fa-solid fa-circle-nodes"></i> Overview Dashboard
      </button>
      <button class="project-tab ${activeProjectTab === 'tasks' ? 'active' : ''}" onclick="setProjectTab('tasks', '${proj.id}')">
        <i class="fa-solid fa-list-check"></i> Design Board
      </button>
      <button class="project-tab ${activeProjectTab === 'worklogs' ? 'active' : ''}" onclick="setProjectTab('worklogs', '${proj.id}')">
        <i class="fa-solid fa-clock-rotate-left"></i> Timesheet & Work Logs
      </button>
      <button class="project-tab ${activeProjectTab === 'collab' ? 'active' : ''}" onclick="setProjectTab('collab', '${proj.id}')">
        <i class="fa-solid fa-comments"></i> Client Collaboration
      </button>
    </div>
  `;

  let html = `
    <div class="project-header-panel" style="margin-bottom: 20px;">
      <div class="flex-between">
        <div>
          <h2 class="brand-title" style="margin-bottom: 5px;">${proj.name}</h2>
          <p style="color: var(--text-secondary); max-width: 800px; font-size: 14px;">${proj.description}</p>
        </div>
        <div style="text-align: right;">
          <span class="phase-badge phase-${proj.phase.toLowerCase()}" style="font-size: 14px; padding: 6px 12px;">
            ${PHASES[proj.phase]}
          </span>
        </div>
      </div>
      
      <div class="phases-timeline">
        ${phaseStepsHTML}
      </div>

      <div class="project-meta-grid">
        <div class="project-meta-item">
          <span class="project-meta-label">Commission Owner (Client)</span>
          <span class="project-meta-value">${clientName}</span>
        </div>
        <div class="project-meta-item">
          <span class="project-meta-label">Design Lead (PM)</span>
          <span class="project-meta-value">${leadName}</span>
        </div>
        ${budgetHTML}
        <div class="project-meta-item">
          <span class="project-meta-label">Target Commission Date</span>
          <span class="project-meta-value">${new Date(proj.deadline).toLocaleDateString()}</span>
        </div>
      </div>
    </div>

    ${tabsHTML}
    <div class="project-tab-contents">
  `;

  if (activeProjectTab === "overview") {
    html += renderProjectOverviewDashboard(proj);
  } 
  else if (activeProjectTab === "tasks") {
    html += renderProjectTaskBoard(proj);
  } 
  else if (activeProjectTab === "worklogs") {
    html += renderProjectWorkLogs(proj);
  } 
  else if (activeProjectTab === "collab") {
    html += renderProjectCollaboration(proj);
  }

  html += `</div>`; 
  container.innerHTML = html;
}

// 1. PROJECT WORKSPACE OVERVIEW DASHBOARD VIEW
function renderProjectOverviewDashboard(proj) {
  const progressPercent = getProjectProgress(proj);
  const totalHours = getProjectLoggedHours(proj);

  let totalSub = 0;
  let completedSub = 0;
  proj.tasks.forEach(t => {
    if (t.subtasks) {
      t.subtasks.forEach(s => {
        totalSub++;
        if (s.status === 'completed') completedSub++;
      });
    }
  });

  const userHoursMap = {};
  if (proj.workLogs) {
    proj.workLogs.forEach(w => {
      const hrs = w.unit === "days" ? parseFloat(w.duration) * 8 : parseFloat(w.duration);
      userHoursMap[w.userName] = (userHoursMap[w.userName] || 0) + hrs;
    });
  }

  let teamContributionHTML = "";
  Object.keys(userHoursMap).forEach(username => {
    const hours = Math.round(userHoursMap[username] * 10) / 10;
    const name = state.users[username]?.name || username;
    const avatar = state.users[username]?.avatar || "??";
    
    teamContributionHTML += `
      <div class="flex-between" style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="assignee-dot" style="width:24px; height:24px; font-size:10px;">${avatar}</div>
          <strong>${name}</strong>
        </div>
        <span class="time-badge">${hours} Hours Logged</span>
      </div>
    `;
  });

  if (teamContributionHTML === "") {
    teamContributionHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No timesheet logs entered yet.</div>`;
  }

  const phaseList = ["SD", "DD", "CD", "CA"];
  const currIdx = phaseList.indexOf(proj.phase);
  let phaseCompletionProgressList = "";
  
  phaseList.forEach((ph, index) => {
    let progressVal = 0;
    if (index < currIdx) progressVal = 100;
    else if (index === currIdx) progressVal = progressPercent;
    
    phaseCompletionProgressList += `
      <div style="margin-bottom: 12px;">
        <div class="flex-between" style="font-size: 12px; margin-bottom: 4px;">
          <span><strong>${PHASES[ph]}</strong></span>
          <span>${progressVal}% resolved</span>
        </div>
        <div class="progress-container">
          <div class="progress-bar phase-${ph.toLowerCase()}" style="width: ${progressVal}%; background: var(--phase-${ph.toLowerCase()})"></div>
        </div>
      </div>
    `;
  });

  return `
    <div class="dashboard-grid">
      <div class="stat-card teal">
        <div class="stat-title">Overall Task Milestone Progress</div>
        <div class="stat-value">${progressPercent}%</div>
        <div class="stat-desc">${proj.tasks.filter(t=>t.status==='completed').length} / ${proj.tasks.length} major deliverables resolved</div>
      </div>
      <div class="stat-card green">
        <div class="stat-title">Subtask Deliverables</div>
        <div class="stat-value">${completedSub} / ${totalSub}</div>
        <div class="stat-desc">${totalSub > 0 ? Math.round((completedSub/totalSub)*100) : 0}% subtask completion rate</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-title">Total Effort Logged</div>
        <div class="stat-value">${totalHours} hrs</div>
        <div class="stat-desc">Calculated from team timesheet submissions</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-title">Active Phase</div>
        <div class="stat-value" style="font-size: 26px;">${proj.phase}</div>
        <div class="stat-desc">${PHASES[proj.phase]}</div>
      </div>
    </div>

    <div class="dashboard-split">
      <div class="content-block">
        <h3 class="block-title" style="margin-bottom: 20px;"><i class="fa-solid fa-list-check"></i> Project Phase Progress</h3>
        ${phaseCompletionProgressList}
      </div>

      <div class="content-block">
        <h3 class="block-title" style="margin-bottom: 15px;"><i class="fa-solid fa-hourglass-half"></i> Design Studio Hours</h3>
        <div style="display: flex; flex-direction: column;">
          ${teamContributionHTML}
        </div>
      </div>
    </div>
  `;
}

// 2. PROJECT WORKSPACE DESIGN BOARD KANBAN VIEW
function renderProjectTaskBoard(proj) {
  const todoTasks = proj.tasks.filter(t => t.status === "todo");
  const inProgressTasks = proj.tasks.filter(t => t.status === "inprogress");
  const inReviewTasks = proj.tasks.filter(t => t.status === "inreview");
  const completedTasks = proj.tasks.filter(t => t.status === "completed");

  return `
    <div class="content-block">
      <div class="flex-between" style="margin-bottom: 20px;">
        <h3 class="block-title"><i class="fa-solid fa-cubes"></i> Interactive Kanban Board</h3>
        <span style="font-size: 13px; color: var(--text-secondary)">Click on cards to manage subtasks and details</span>
      </div>

      <div class="project-boards-container">
        <!-- TO DO column -->
        <div class="kanban-column">
          <div class="column-header todo">
            <span class="column-title">To Do</span>
            <span class="task-count">${todoTasks.length}</span>
          </div>
          <div class="kanban-cards-wrapper" id="col-todo" ondragover="allowDrop(event)" ondrop="dropTask(event, 'todo', '${proj.id}')">
            ${renderKanbanCards(todoTasks, proj.id)}
          </div>
        </div>

        <!-- IN PROGRESS column -->
        <div class="kanban-column">
          <div class="column-header inprogress">
            <span class="column-title">In Progress</span>
            <span class="task-count">${inProgressTasks.length}</span>
          </div>
          <div class="kanban-cards-wrapper" id="col-inprogress" ondragover="allowDrop(event)" ondrop="dropTask(event, 'inprogress', '${proj.id}')">
            ${renderKanbanCards(inProgressTasks, proj.id)}
          </div>
        </div>

        <!-- IN REVIEW column -->
        <div class="kanban-column">
          <div class="column-header inreview">
            <span class="column-title">In Review</span>
            <span class="task-count">${inReviewTasks.length}</span>
          </div>
          <div class="kanban-cards-wrapper" id="col-inreview" ondragover="allowDrop(event)" ondrop="dropTask(event, 'inreview', '${proj.id}')">
            ${renderKanbanCards(inReviewTasks, proj.id)}
          </div>
        </div>

        <!-- COMPLETED column -->
        <div class="kanban-column">
          <div class="column-header completed">
            <span class="column-title">Completed</span>
            <span class="task-count">${completedTasks.length}</span>
          </div>
          <div class="kanban-cards-wrapper" id="col-completed" ondragover="allowDrop(event)" ondrop="dropTask(event, 'completed', '${proj.id}')">
            ${renderKanbanCards(completedTasks, proj.id)}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Detailed subtask checklist rendering for Kanban cards
function renderKanbanCards(tasks, projectId) {
  if (tasks.length === 0) {
    return `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 30px 10px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">No active tasks</div>`;
  }

  // Task moving check based on task edit permission
  const canEditTasks = hasPermission("canCreateTasks");

  return tasks.map(t => {
    const isOverdue = t.status !== "completed" && new Date(t.deadline) < new Date();
    const deadlineClass = isOverdue ? "card-deadline overdue" : "card-deadline";
    const deadlineIcon = isOverdue ? `<i class="fa-solid fa-triangle-exclamation"></i>` : `<i class="fa-solid fa-calendar-days"></i>`;
    
    // Status Select Options
    let statusSelectorHTML = '';
    if (canEditTasks) {
      statusSelectorHTML = `
        <select class="modal-select" style="font-size: 11px; padding: 2px 4px; height: auto; width: auto; margin-top: 8px;" onchange="changeTaskStatus('${projectId}', '${t.id}', this.value)" onclick="event.stopPropagation()">
          <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="inprogress" ${t.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
          <option value="inreview" ${t.status === 'inreview' ? 'selected' : ''}>In Review</option>
          <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      `;
    }

    const assigneeObj = state.users[t.assignee];
    const assigneeInitial = assigneeObj ? assigneeObj.avatar : "??";
    const assigneeName = assigneeObj ? assigneeObj.name : t.assignee;

    let subtaskSummaryHTML = "";
    if (t.subtasks && t.subtasks.length > 0) {
      const total = t.subtasks.length;
      const completed = t.subtasks.filter(s => s.status === 'completed').length;
      const subtaskPct = Math.round((completed / total) * 100);

      subtaskSummaryHTML = `
        <div class="subtask-list-mini">
          <div class="flex-between" style="font-size: 10px; color: var(--text-secondary)">
            <span><i class="fa-solid fa-list-check"></i> Subtasks: ${completed}/${total}</span>
            <span>${subtaskPct}%</span>
          </div>
          <div class="progress-container" style="height: 4px; margin-top: 2px;">
            <div class="progress-bar" style="width: ${subtaskPct}%; height: 100%;"></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="kanban-card" draggable="${canEditTasks}" ondragstart="dragTask(event, '${t.id}')" onclick="openTaskDetailsModal('${projectId}', '${t.id}')">
        <div class="card-header">
          <span class="priority-tag priority-${t.priority.toLowerCase()}">${t.priority}</span>
          <span class="phase-badge phase-${t.phase.toLowerCase()}" style="font-size: 9px; padding: 2px 4px;">${t.phase}</span>
        </div>
        <div class="card-title">${t.title}</div>
        <div class="card-desc">${t.desc}</div>
        
        ${subtaskSummaryHTML}

        <div class="card-footer" style="margin-top: 10px;">
          <div class="${deadlineClass}">
            ${deadlineIcon}
            <span>${new Date(t.deadline).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
          </div>
          <div class="card-assignee" title="Assigned to ${assigneeName}">
            <div class="assignee-dot">${assigneeInitial}</div>
          </div>
        </div>
        ${statusSelectorHTML}
      </div>
    `;
  }).join('');
}

// 3. PROJECT WORKSPACE TIMESHEET & WORK LOGS VIEW
function renderProjectWorkLogs(proj) {
  let logsListHTML = "";

  const chronological = [...(proj.workLogs || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  chronological.forEach(wl => {
    const taskName = proj.tasks.find(t => t.id === wl.taskId)?.title || "General Milestone";
    const dateStr = new Date(wl.date).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    
    logsListHTML += `
      <div class="work-log-item">
        <div class="work-log-header">
          <span><strong>${state.users[wl.userName]?.name || wl.userName}</strong> on <em>${taskName}</em></span>
          <span class="time-badge">${wl.duration} ${wl.unit}</span>
        </div>
        <div class="work-log-notes">"${wl.notes}"</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Log Date: ${dateStr}</div>
      </div>
    `;
  });

  if (logsListHTML === "") {
    logsListHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 40px 10px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">No work details recorded yet for this project.</div>`;
  }

  // Work Log Post action check
  const logButtonHTML = hasPermission("canLogWork") ? 
    `<button class="action-btn primary" onclick="openLogWorkModalFromProject('${proj.id}')">
       <i class="fa-solid fa-plus"></i> Post Daily Log
     </button>` : '';

  return `
    <div class="content-block">
      <div class="flex-between" style="margin-bottom: 20px;">
        <h3 class="block-title"><i class="fa-solid fa-clock"></i> Daily Work Details & Timesheets</h3>
        ${logButtonHTML}
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${logsListHTML}
      </div>
    </div>
  `;
}

// 4. PROJECT WORKSPACE CLIENT COLLABORATION VIEW
function renderProjectCollaboration(proj) {
  // Moderate/Comment permission check
  const commentFormHTML = hasPermission("canModerateComments") ? `
    <div class="comment-input-area">
      <form onsubmit="event.preventDefault(); submitComment('${proj.id}');">
        <textarea id="new-comment-textarea-${proj.id}" class="modal-textarea" placeholder="Add feedback, upload notes, or request design decisions..." style="min-height: 80px; margin-bottom: 12px; font-size: 13px;" required></textarea>
        <div class="flex-between">
          ${state.currentUser.role === 'client' ? 
            `<button type="button" class="action-btn" onclick="submitQuickClientFeedback('${proj.id}', 'Approve Designs')">
               <i class="fa-solid fa-circle-check" style="color: var(--status-completed)"></i> Approve Active Deliverables
             </button>
             <button type="button" class="action-btn" onclick="submitQuickClientFeedback('${proj.id}', 'Request Revision')">
               <i class="fa-solid fa-rotate-left" style="color: var(--priority-high)"></i> Request Revision
             </button>` : ''
          }
          <button type="submit" class="action-btn primary" style="margin-left: auto; padding: 8px 16px;">Post Comment</button>
        </div>
      </form>
    </div>
  ` : `<div style="text-align:center; color:var(--text-muted); font-size:13px; padding-top:15px; border-top: 1px solid var(--border-color)">Your account does not have permission to post messages.</div>`;

  return `
    <div class="dashboard-split">
      <div class="content-block" style="grid-column: span 2;">
        <div class="block-header">
          <h3 class="block-title"><i class="fa-solid fa-comments"></i> Direct Feedback Channel</h3>
        </div>
        
        <div class="comments-container" id="comments-container-${proj.id}" style="max-height: 450px;">
          ${renderComments(proj.comments)}
        </div>

        ${commentFormHTML}
      </div>
    </div>
  `;
}

function renderComments(comments) {
  if (comments.length === 0) {
    return `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No messages. Write a comment to start.</div>`;
  }

  const chronological = [...comments].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return chronological.map(c => {
    const timeVal = new Date(c.timestamp);
    const dateStr = timeVal.toLocaleDateString() + " " + timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let badgeClass = "architect";
    if (c.role === "client") badgeClass = "client";
    else if (c.role === "principal") badgeClass = "admin";

    let commentStyle = "";
    if (c.text.includes("Approve Designs") || c.text.includes("Approve Active Deliverables")) {
      commentStyle = "border-left: 3px solid var(--status-completed); background: rgba(5, 150, 105, 0.04);";
    } else if (c.text.includes("Request Revision")) {
      commentStyle = "border-left: 3px solid var(--priority-high); background: rgba(220, 38, 38, 0.04);";
    }

    return `
      <div class="comment-card" style="${commentStyle}">
        <div class="comment-meta">
          <span class="comment-author">
            ${c.author} 
            <span class="comment-author-badge ${badgeClass}">${c.role}</span>
          </span>
          <span class="comment-time">${dateStr}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      </div>
    `;
  }).join('');
}

// Render Team & Clients Directory View & Role Access Matrix
function renderTeamAndClients() {
  const teamBody = document.getElementById("team-table-body");
  const clientsBody = document.getElementById("clients-table-body");

  teamBody.innerHTML = "";
  clientsBody.innerHTML = "";

  Object.values(state.users).forEach(u => {
    const assignedProjects = state.projects.filter(p => 
      p.leadUsername === u.username || 
      p.clientUsername === u.username || 
      p.tasks.some(t => t.assignee === u.username)
    ).map(p => p.name).join(', ') || "None";

    if (u.role === "client") {
      clientsBody.innerHTML += `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.company || "N/A"}</td>
          <td>${u.email}</td>
          <td>${assignedProjects}</td>
        </tr>
      `;
    } else {
      teamBody.innerHTML += `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td><span class="phase-badge phase-${u.role === 'principal' ? 'sd' : 'dd'}">${u.role}</span></td>
          <td>${u.email}</td>
          <td>${assignedProjects}</td>
        </tr>
      `;
    }
  });

  // Render Access Controls (ACL) Matrix - visible to Principal Admin only
  const matrixBlock = document.getElementById("permissions-matrix-block");
  const matrixBody = document.getElementById("permissions-matrix-body");
  
  if (state.currentUser.role === 'principal') {
    matrixBlock.style.display = "block";
    matrixBody.innerHTML = "";

    const definitions = [
      { key: "canCreateProjects", label: "Initialize New Commission Projects", desc: "Allows creating projects from dashboard/portfolio panels." },
      { key: "canCreateTasks", label: "Manage Milestones & Subtasks", desc: "Allows creating tasks, checking off subtasks, and shifting Kanban statuses." },
      { key: "canLogWork", label: "Submit Daily Work Logs (Timesheets)", desc: "Allows accessing work-log screens and entering hours/days spent." },
      { key: "canChangePhase", label: "Progress Project Milestones (SD-CA Stepper)", desc: "Allows advancing active project development phases." },
      { key: "canViewFinancials", label: "View Portfolio Valuation & Budgets", desc: "Allows seeing financial metrics cards and project budget figures." },
      { key: "canModerateComments", label: "Post Collaboration Feed Comments", desc: "Allows writing feedback messages and logging approval updates." }
    ];

    definitions.forEach(d => {
      const archChecked = state.permissions.architect[d.key] ? "checked" : "";
      const clientChecked = state.permissions.client[d.key] ? "checked" : "";

      matrixBody.innerHTML += `
        <tr>
          <td>
            <strong>${d.label}</strong><br>
            <span style="color: var(--text-muted); font-size: 11px;">${d.desc}</span>
          </td>
          <td><code>${d.key}</code></td>
          <td>
            <label class="switch">
              <input type="checkbox" ${archChecked} onchange="togglePermissionState('architect', '${d.key}', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
          <td>
            <label class="switch">
              <input type="checkbox" ${clientChecked} onchange="togglePermissionState('client', '${d.key}', this.checked)">
              <span class="slider"></span>
            </label>
          </td>
        </tr>
      `;
    });
  } else {
    matrixBlock.style.display = "none";
  }
}

// Toggle permission state from dashboard
function togglePermissionState(role, permissionKey, isChecked) {
  if (!state.permissions[role]) return;
  state.permissions[role][permissionKey] = isChecked;
  savePermissions();
  renderTeamAndClients();
}

// ================= INTERACTION HANDLERS & MUTATORS =================

let draggedTaskId = null;
function dragTask(event, taskId) {
  draggedTaskId = taskId;
}

function allowDrop(event) {
  event.preventDefault();
}

function dropTask(event, newStatus, projectId) {
  event.preventDefault();
  if (!draggedTaskId) return;
  changeTaskStatus(projectId, draggedTaskId, newStatus);
  draggedTaskId = null;
}

function changeTaskStatus(projectId, taskId, newStatus) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const task = proj.tasks.find(t => t.id === taskId);
  if (!task) return;

  const oldStatus = task.status;
  if (oldStatus === newStatus) return;

  task.status = newStatus;
  
  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Updated task milestone [${task.title}] status to '${newStatus}'.`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  renderProjectDetails(projectId);
}

function changeProjectPhase(projectId, newPhase) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const oldPhase = proj.phase;
  if (oldPhase === newPhase) return;

  proj.phase = newPhase;

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Progressed project phase to '${PHASES[newPhase]}'.`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  renderProjectDetails(projectId);
}

function submitComment(projectId) {
  const textarea = document.getElementById(`new-comment-textarea-${projectId}`);
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) return;

  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: text,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  textarea.value = "";
  renderProjectDetails(projectId);
}

function submitQuickClientFeedback(projectId, actionType) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const text = actionType === 'Approve Designs' 
    ? `✅ CLIENT UPDATE: Approve Active Deliverables. I authorize proceeding to the next stage.`
    : `⚠️ CLIENT UPDATE: Request Revision. Revisions requested. Please review the design changes in progress.`;

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: text,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  renderProjectDetails(projectId);
}

// ================= SUBTASK MANAGEMENT LOGIC =================

function openTaskDetailsModal(projectId, taskId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const task = proj.tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById("detail-task-id").value = taskId;
  document.getElementById("detail-project-id").value = projectId;

  document.getElementById("task-detail-title").innerText = task.title;
  document.getElementById("task-detail-desc").innerText = task.desc || "No milestone details specified.";

  const subAssignee = document.getElementById("new-subtask-assignee");
  subAssignee.innerHTML = "";
  Object.values(state.users).forEach(u => {
    if (u.role !== 'client') {
      subAssignee.innerHTML += `<option value="${u.username}">${u.name}</option>`;
    }
  });

  // Display edits based on access control matrix permissions
  const canEditSubtasks = hasPermission("canCreateTasks");
  const canLogTimesheet = hasPermission("canLogWork");
  
  const creationRow = document.getElementById("subtask-creation-controls");
  const logBtn = document.getElementById("task-log-work-btn");

  creationRow.style.display = canEditSubtasks ? "block" : "none";
  logBtn.style.display = canLogTimesheet ? "block" : "none";

  renderTaskDetailsModalContent(proj, task);
  openModal("modal-task-details");
}

function renderTaskDetailsModalContent(proj, task) {
  const subtasksList = document.getElementById("detail-subtasks-list");
  subtasksList.innerHTML = "";

  const canEditSubtasks = hasPermission("canCreateTasks");

  if (!task.subtasks || task.subtasks.length === 0) {
    subtasksList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 15px;">No subtasks created for this milestone.</div>`;
  } else {
    task.subtasks.forEach(s => {
      const isCompleted = s.status === "completed";
      const uBadge = state.users[s.assignee]?.avatar || "??";
      const uName = state.users[s.assignee]?.name || s.assignee;
      const completedClass = isCompleted ? "subtask-item-mini completed" : "subtask-item-mini";

      const div = document.createElement("div");
      div.className = "subtask-panel-item";
      
      const disableCheckbox = canEditSubtasks ? '' : 'disabled';

      div.innerHTML = `
        <div class="${completedClass}" style="gap: 12px; width: 100%;">
          <div class="subtask-left">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} ${disableCheckbox} onchange="toggleSubtaskStatus('${proj.id}', '${task.id}', '${s.id}', this.checked)">
            <span>${s.title}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary);">
          <span>Due ${new Date(s.deadline).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
          <div class="subtask-assignee-avatar" title="Assigned to ${uName}">${uBadge}</div>
        </div>
      `;
      subtasksList.appendChild(div);
    });
  }

  const taskLogs = document.getElementById("detail-work-logs");
  taskLogs.innerHTML = "";
  
  const relevantLogs = (proj.workLogs || []).filter(l => l.taskId === task.id);
  if (relevantLogs.length === 0) {
    taskLogs.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; padding: 5px;">No hours logged specifically to this milestone.</div>`;
  } else {
    relevantLogs.forEach(wl => {
      taskLogs.innerHTML += `
        <div class="work-log-item" style="padding: 8px 10px;">
          <div class="work-log-header">
            <span><strong>${state.users[wl.userName]?.name || wl.userName}</strong></span>
            <span class="time-badge">${wl.duration} ${wl.unit}</span>
          </div>
          <div style="font-size: 12px; margin-top: 2px;">"${wl.notes}"</div>
        </div>
      `;
    });
  }
}

function toggleSubtaskStatus(projectId, taskId, subtaskId, isChecked) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const task = proj.tasks.find(t => t.id === taskId);
  if (!task) return;
  const sub = task.subtasks.find(s => s.id === subtaskId);
  if (!sub) return;

  const oldStatus = sub.status;
  sub.status = isChecked ? "completed" : "todo";

  if (isChecked && task.status === 'todo' && task.subtasks.every(s => s.status === 'completed')) {
    task.status = 'inreview';
  }

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Marked subtask [${sub.title}] under task [${task.title}] as ${isChecked ? 'Completed' : 'To Do'}.`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  renderTaskDetailsModalContent(proj, task);
  renderProjectDetails(projectId);
}

function submitAddSubtask() {
  const projectId = document.getElementById("detail-project-id").value;
  const taskId = document.getElementById("detail-task-id").value;
  const title = document.getElementById("new-subtask-title").value.trim();
  const assignee = document.getElementById("new-subtask-assignee").value;
  const deadline = document.getElementById("new-subtask-deadline").value;

  if (!title || !deadline) {
    alert("Please fill out subtask name and deadline.");
    return;
  }

  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const task = proj.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!task.subtasks) task.subtasks = [];

  const newSub = {
    id: "subtask-" + Date.now(),
    title: title,
    status: "todo",
    assignee: assignee,
    deadline: deadline
  };

  task.subtasks.push(newSub);

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Added new subtask [${title}] to task [${task.title}], assigned to ${state.users[assignee]?.name || assignee}.`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  document.getElementById("new-subtask-title").value = "";
  document.getElementById("new-subtask-deadline").value = "";
  
  renderTaskDetailsModalContent(proj, task);
  renderProjectDetails(projectId);
}

// ================= WORK LOG (TIMESHEET) MANAGEMENT LOGIC =================

function openLogWorkModalFromTask() {
  const taskId = document.getElementById("detail-task-id").value;
  const projectId = document.getElementById("detail-project-id").value;
  
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  
  const taskSelect = document.getElementById("log-work-task-select");
  taskSelect.innerHTML = "";
  
  proj.tasks.forEach(t => {
    taskSelect.innerHTML += `<option value="${t.id}" ${t.id === taskId ? 'selected' : ''}>${t.title}</option>`;
  });
  
  taskSelect.disabled = true; 
  
  document.getElementById("log-work-project-id").value = projectId;
  document.getElementById("log-work-task-id").value = taskId;
  document.getElementById("log-work-date").value = new Date().toISOString().substring(0, 10);
  
  closeModal("modal-task-details");
  openModal("modal-log-work");
}

function openLogWorkModalFromProject(projectId) {
  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const taskSelect = document.getElementById("log-work-task-select");
  taskSelect.innerHTML = "";
  
  proj.tasks.forEach((t, idx) => {
    taskSelect.innerHTML += `<option value="${t.id}" ${idx === 0 ? 'selected' : ''}>${t.title}</option>`;
  });
  
  if (proj.tasks.length === 0) {
    alert("Please create a task milestone first before logging work.");
    return;
  }

  taskSelect.disabled = false;
  
  document.getElementById("log-work-project-id").value = projectId;
  document.getElementById("log-work-task-id").value = taskSelect.value;
  document.getElementById("log-work-date").value = new Date().toISOString().substring(0, 10);

  openModal("modal-log-work");
}

function submitLogWork() {
  const projectId = document.getElementById("log-work-project-id").value;
  const taskId = document.getElementById("log-work-task-id").value;
  const duration = parseFloat(document.getElementById("log-work-duration").value);
  const unit = document.getElementById("log-work-unit").value;
  const date = document.getElementById("log-work-date").value;
  const notes = document.getElementById("log-work-notes").value.trim();

  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;
  const task = proj.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!proj.workLogs) proj.workLogs = [];

  const newLog = {
    id: "wl-" + Date.now(),
    taskId: taskId,
    userName: state.currentUser.username,
    date: date,
    duration: duration,
    unit: unit,
    notes: notes
  };

  proj.workLogs.push(newLog);

  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Logged ${duration} ${unit} of work on [${task.title}]. notes: "${notes}"`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  closeModal("modal-log-work");
  document.getElementById("log-work-form").reset();

  renderProjectDetails(projectId);
}

// ================= CLIENT REGISTRATION LOGIC =================

function submitAddClient() {
  const name = document.getElementById("client-name").value.trim();
  const company = document.getElementById("client-company").value.trim();
  const email = document.getElementById("client-email").value.trim();
  const username = document.getElementById("client-username").value.trim().toLowerCase();

  if (state.users[username]) {
    alert("A user with this username already exists.");
    return;
  }

  const parts = name.split(' ');
  const avatar = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();

  const newClient = {
    username: username,
    name: name,
    role: "client",
    avatar: avatar,
    email: email,
    company: company
  };

  state.users[username] = newClient;
  saveUsers();
  closeModal("modal-add-client");
  document.getElementById("add-client-form").reset();
  
  renderTeamAndClients();
}

// ================= STAFF REGISTRATION LOGIC =================

function submitAddStaff() {
  const name = document.getElementById("staff-name").value.trim();
  const role = document.getElementById("staff-role").value;
  const email = document.getElementById("staff-email").value.trim();
  const username = document.getElementById("staff-username").value.trim().toLowerCase();

  if (state.users[username]) {
    alert("A user with this username already exists.");
    return;
  }

  const parts = name.split(' ');
  const avatar = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();

  const newStaff = {
    username: username,
    name: name,
    role: role,
    avatar: avatar,
    email: email
  };

  state.users[username] = newStaff;
  saveUsers();
  closeModal("modal-add-staff");
  document.getElementById("add-staff-form").reset();
  
  renderTeamAndClients();
}

// ================= MODAL WINDOW CONTROLLERS =================

function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

function openCreateProjectModal() {
  const clientSelect = document.getElementById("proj-client");
  const leadSelect = document.getElementById("proj-lead");
  
  clientSelect.innerHTML = "";
  leadSelect.innerHTML = "";

  Object.values(state.users).forEach(u => {
    if (u.role === 'client') {
      clientSelect.innerHTML += `<option value="${u.username}">${u.name} (${u.company})</option>`;
    } else {
      leadSelect.innerHTML += `<option value="${u.username}">${u.name}</option>`;
    }
  });

  openModal("modal-create-project");
}

function submitCreateProject() {
  const name = document.getElementById("proj-name").value.trim();
  const clientUsername = document.getElementById("proj-client").value;
  const leadUsername = document.getElementById("proj-lead").value;
  const budget = parseFloat(document.getElementById("proj-budget").value);
  const deadline = document.getElementById("proj-deadline").value;
  const description = document.getElementById("proj-desc").value.trim();

  const newProj = {
    id: "proj-" + Date.now(),
    name: name,
    clientUsername: clientUsername,
    leadUsername: leadUsername,
    phase: "SD",
    budget: budget,
    deadline: deadline,
    description: description || "No design intent specified.",
    tasks: [],
    workLogs: [],
    comments: [
      {
        id: "comment-" + Date.now(),
        author: state.currentUser.name,
        role: state.currentUser.role,
        text: `Initialized project and assigned lead architect. Active phase set to Schematic Design (SD).`,
        timestamp: new Date().toISOString()
      }
    ]
  };

  state.projects.push(newProj);
  saveProjects();
  closeModal("modal-create-project");
  document.getElementById("create-project-form").reset();
  
  if (state.currentView === "dashboard") renderDashboard();
  else renderProjectsList();
}

function openAddTaskModal(projectId) {
  document.getElementById("task-project-id").value = projectId;
  
  const assigneeSelect = document.getElementById("task-assignee");
  assigneeSelect.innerHTML = "";

  Object.values(state.users).forEach(u => {
    if (u.role !== 'client') {
      assigneeSelect.innerHTML += `<option value="${u.username}">${u.name} (${u.role})</option>`;
    }
  });

  openModal("modal-add-task");
}

function submitAddTask() {
  const projectId = document.getElementById("task-project-id").value;
  const title = document.getElementById("task-title").value.trim();
  const phase = document.getElementById("task-phase").value;
  const assignee = document.getElementById("task-assignee").value;
  const priority = document.getElementById("task-priority").value;
  const deadline = document.getElementById("task-deadline").value;
  const desc = document.getElementById("task-desc").value.trim();

  const proj = state.projects.find(p => p.id === projectId);
  if (!proj) return;

  const newTask = {
    id: "task-" + Date.now(),
    title: title,
    status: "todo",
    priority: priority,
    phase: phase,
    assignee: assignee,
    deadline: deadline,
    desc: desc,
    subtasks: []
  };

  proj.tasks.push(newTask);
  
  proj.comments.push({
    id: "comment-" + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role,
    text: `Created new task milestone [${title}] and assigned it to ${state.users[assignee]?.name || assignee}.`,
    timestamp: new Date().toISOString()
  });

  saveProjects();
  closeModal("modal-add-task");
  document.getElementById("add-task-form").reset();
  
  renderProjectDetails(projectId);
}

window.onload = initApp;
