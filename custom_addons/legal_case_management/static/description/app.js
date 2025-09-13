// Store application data
const appData = {
    auth: {
        isLoggedIn: false,
        currentUser: null,
        token: null,
        userRole: null // 'user' or 'manager'
    },
    cases: [],
    // Hearing records with case references
    hearings: [
        {
            id: 1,
            name: "Initial Consultation - Brown Case",
            caseId: 1,
            caseName: "CASE/2025/0001",
            client: "Michael Brown",
            lawyer: "John Smith",
            dateStart: "2025-01-15T10:00:00",
            dateEnd: "2025-01-15T12:00:00",
            location: "Court Room A, NYC Civil Court",
            status: "Planned",
            notes: "First hearing to discuss contract dispute details."
        },
        {
            id: 2,
            name: "Document Review - Davis M&A",
            caseId: 2,
            caseName: "CASE/2025/0002",
            client: "Emily Davis",
            lawyer: "Sarah Jones",
            dateStart: "2025-01-20T14:00:00",
            dateEnd: "2025-01-20T17:00:00",
            location: "Conference Room B, Law Office",
            status: "Planned",
            notes: "Review merger documentation with client and opposing counsel."
        },
        {
            id: 3,
            name: "Final Settlement - Wilson Property",
            caseId: 3,
            caseName: "CASE/2025/0003",
            client: "Robert Wilson",
            lawyer: "John Smith",
            dateStart: "2024-12-15T11:00:00",
            dateEnd: "2024-12-15T13:00:00",
            location: "Real Estate Office, Manhattan",
            status: "Held",
            notes: "Final closing completed successfully. All documents signed."
        }
    ],
    clients: [
        {
            id: 1,
            name: "Michael Brown",
            email: "michael.brown@email.com",
            phone: "+1-555-0201",
            address: "789 Client Road, Brooklyn, NY 11201",
            isClient: true,
            caseCount: 1
        },
        {
            id: 2,
            name: "Emily Davis",
            email: "emily.davis@email.com",
            phone: "+1-555-0202",
            address: "321 Business Blvd, Manhattan, NY 10003",
            isClient: true,
            caseCount: 1
        },
        {
            id: 3,
            name: "Robert Wilson",
            email: "robert.wilson@email.com",
            phone: "+1-555-0203",
            address: "654 Consumer St, Queens, NY 11101",
            isClient: true,
            caseCount: 1
        }
    ],
    lawyers: [
        {
            id: 1,
            name: "John Smith",
            email: "john.smith@lawfirm.com",
            phone: "+1-555-0101",
            address: "123 Legal Street, New York, NY 10001",
            barNumber: "BAR12345",
            isLawyer: true,
            caseCount: 2,
            specialization: "Civil Law, Property Law"
        },
        {
            id: 2,
            name: "Sarah Jones",
            email: "sarah.jones@lawfirm.com",
            phone: "+1-555-0102",
            address: "456 Justice Ave, New York, NY 10002",
            barNumber: "BAR67890",
            isLawyer: true,
            caseCount: 1,
            specialization: "Corporate Law, M&A"
        }
    ]
};

// Application State
let appState = {
    currentPage: "welcome",
    isAuthenticated: false,
    currentUser: null,
    activeDashboardPage: "dashboard",
    // Add token for authentication with Odoo backend
    authToken: null,
    sessionId: null, // Odoo session ID
    baseUrl: '/web/dataset/call_kw' // Odoo RPC endpoint
};

// UI Functions
function showWelcome() {
    document.getElementById('welcome-page').classList.remove('hidden');
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('dashboard-app').classList.add('hidden');
    appState.currentPage = "welcome";
    
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        try {
            appState.authToken = savedToken;
            appState.currentUser = JSON.parse(savedUser);
            appState.isAuthenticated = true;
            showDashboard();
        } catch (e) {
            console.error('Error restoring session:', e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }
}

function showLogin() {
    document.getElementById('welcome-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('dashboard-app').classList.add('hidden');
    appState.currentPage = "login";
    
    // Clear any previous error messages
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function showSignup() {
    document.getElementById('welcome-page').classList.add('hidden');
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.remove('hidden');
    document.getElementById('dashboard-app').classList.add('hidden');
    appState.currentPage = "signup";
    
    // Clear any previous error messages
    const errorElement = document.getElementById('signup-error');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

function showDashboard() {
    document.getElementById('welcome-page').classList.add('hidden');
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('dashboard-app').classList.remove('hidden');
    appState.currentPage = "dashboard";
    appState.isAuthenticated = true;
    
    // Update user info in the dashboard
    if (appState.currentUser) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = appState.currentUser.name;
        }
        
        const userRoleElement = document.getElementById('user-role');
        if (userRoleElement && appState.currentUser.role) {
            userRoleElement.textContent = appState.currentUser.role;
        }
    }
    
    // Load dashboard data
    loadDashboardData();
}

function logout() {
    logoutFromOdoo();
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showWelcome();
}

// Authentication Functions
async function authenticateWithOdoo(email, password) {
    try {
        // Call the Odoo authentication endpoint
        const response = await fetch('/web/session/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    db: 'legal_case_management',
                    login: email,
                    password: password
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            showLoginError(data.error.data.message || 'Authentication failed');
            return false;
        }
        
        if (data.result) {
            // Store session info
            appState.isAuthenticated = true;
            appState.currentUser = {
                id: data.result.uid,
                name: data.result.name || email,
                email: email,
                 role: 'Legal User'
             };
             appState.authToken = data.result.session_id;
            appState.sessionId = data.result.session_id;
            
            // Save to local storage
            localStorage.setItem('authToken', appState.authToken);
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            
            return true;
        } else {
            showLoginError('Invalid credentials');
            return false;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showLoginError('An error occurred during login');
        return false;
    }
}

async function registerWithOdoo(userData) {
    try {
        // Call the Odoo registration endpoint
        const response = await fetch('/web/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: userData
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showSignupError(data.error.data.message || 'Registration failed');
            return false;
        }
        
        if (data.result && data.result.success) {
            // Auto-login after successful registration
            return await authenticateWithOdoo(userData.email, userData.password);
        } else {
            showSignupError('Registration failed');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showSignupError('An error occurred during registration');
        return false;
    }
}

async function logoutFromOdoo() {
    try {
        // Call Odoo logout endpoint
        await fetch('/web/session/destroy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call'
            }),
            credentials: 'include'
        });
        
        appState.isAuthenticated = false;
        appState.currentUser = null;
        appState.authToken = null;
        appState.sessionId = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        showWelcome();
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

// Helper Functions
function showLoginError(message) {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    } else {
        alert(message);
    }
}

function showSignupError(message) {
    const errorElement = document.getElementById('signup-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    } else {
        alert(message);
    }
}

async function simulateApiCall(endpoint, data) {
    // This function simulates API calls for demo purposes
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful login for demo
            if (endpoint === '/web/session/authenticate') {
                if (data.login === 'demo@legalcms.com' && data.password === 'demo123') {
                    resolve({
                        success: true,
                        user: {
                            id: 1,
                            name: 'Demo User',
                            email: 'demo@legalcms.com',
                            role: 'Legal User'
                        },
                        token: 'demo-token-123456789'
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }
            } 
            // Simulate successful registration
            else if (endpoint === '/web/signup') {
                resolve({
                    success: true,
                    user: {
                        id: 2,
                        name: data.name,
                        email: data.email,
                        role: 'Legal User'
                    },
                    token: 'new-user-token-123456789'
                });
            }
        }, 1000); // Simulate network delay
    });
}

// Dashboard Data Loading Functions
async function loadDashboardData() {
    // Load summary data for the main dashboard
    try {
        // Fetch dashboard data from Odoo backend
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.dashboard',
                    method: 'get_dashboard_summary',
                    args: [],
                    kwargs: {}
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to load dashboard data');
        }
        
        if (data.result) {
            // Update dashboard summary cards
            updateDashboardSummary(data.result);
            
            // Load data for the active dashboard page
            switch(appState.activeDashboardPage) {
                case 'cases':
                    loadCasesData();
                    break;
                case 'hearings':
                    loadHearingsData();
                    break;
                case 'clients':
                    loadClientsData();
                    break;
                case 'invoices':
                    loadInvoicesData();
                    break;
                default:
                    // Default dashboard view
                    loadRecentActivity();
                    break;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to simulated data for demo purposes
        const dashboardData = await simulateApiCall('/legal/dashboard/summary', {
            token: appState.authToken
        });
        
        if (dashboardData.success) {
            updateDashboardSummary(dashboardData.data);
        }
    }
}

function updateDashboardSummary(data) {
    // Update summary cards with counts
    const elements = {
        'cases-count': data.casesCount || 0,
        'hearings-count': data.hearingsCount || 0,
        'clients-count': data.clientsCount || 0,
        'invoices-count': data.invoicesCount || 0
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

async function loadCasesData() {
    try {
        // Fetch cases from Odoo backend
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.case',
                    method: 'search_read',
                    args: [],
                    kwargs: {
                        fields: ['name', 'case_number', 'client_id', 'responsible_lawyer_id', 'state', 'date_created']
                    }
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to fetch cases');
        }
        
        if (data.result) {
            // Store cases in appData
            appData.cases = data.result;
            
            // Update the cases list in the UI
            updateCasesList(data.result);
        }
    } catch (error) {
        console.error('Error loading cases:', error);
        // Fallback to simulated data for demo
        const response = await simulateApiCall('/legal/cases', {
            token: appState.authToken
        });
        
        if (response.success) {
            appData.cases = response.data;
            updateCasesList(response.data);
        }
    }
}

function updateCasesList(cases) {
    const casesContainer = document.getElementById('cases-list');
    if (!casesContainer) return;
    
    casesContainer.innerHTML = '';
    
    if (cases.length === 0) {
        casesContainer.innerHTML = '<div class="empty-state">No cases found</div>';
        return;
    }
    
    // Create table header if it's a table display
    if (casesContainer.tagName === 'TBODY') {
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Case Number</th>
            <th>Name</th>
            <th>Client</th>
            <th>Responsible</th>
            <th>Status</th>
            <th>Actions</th>
        `;
        casesContainer.appendChild(headerRow);
    }
    
    cases.forEach(caseItem => {
        // Handle different data structures between Odoo and simulated data
        const clientName = caseItem.client_id ? caseItem.client_id[1] : caseItem.client;
        const lawyerName = caseItem.responsible_lawyer_id ? caseItem.responsible_lawyer_id[1] : caseItem.responsibleLawyer;
        const status = caseItem.state || caseItem.stage;
        const caseNumber = caseItem.case_number || caseItem.caseNumber || '';
        
        if (casesContainer.tagName === 'TBODY') {
            // Table row display
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${caseNumber}</td>
                <td>${caseItem.name}</td>
                <td>${clientName}</td>
                <td>${lawyerName}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${formatStatus(status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" data-case-id="${caseItem.id}">View</button>
                    <button class="btn btn-sm btn-secondary" data-edit-id="${caseItem.id}">Edit</button>
                </td>
            `;
            casesContainer.appendChild(row);
            
            // Add event listeners
            const viewButton = row.querySelector('button[data-case-id]');
            if (viewButton) {
                viewButton.addEventListener('click', () => {
                    showCaseDetails(caseItem.id);
                });
            }
            
            const editButton = row.querySelector('button[data-edit-id]');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    showCaseForm(caseItem.id);
                });
            }
        } else {
            // Card display
            const caseElement = document.createElement('div');
            caseElement.className = 'case-item';
            caseElement.innerHTML = `
                <div class="case-header">
                    <h3>${caseItem.name}</h3>
                    <span class="case-stage status-${status.toLowerCase()}">${formatStatus(status)}</span>
                </div>
                <div class="case-details">
                    <p><strong>Case Number:</strong> ${caseNumber}</p>
                    <p><strong>Client:</strong> ${clientName}</p>
                    <p><strong>Responsible:</strong> ${lawyerName}</p>
                </div>
                <div class="case-actions">
                    <button class="btn btn-sm btn-primary" data-case-id="${caseItem.id}">View Details</button>
                    <button class="btn btn-sm btn-secondary" data-edit-id="${caseItem.id}">Edit</button>
                </div>
            `;
            casesContainer.appendChild(caseElement);
            
            // Add event listeners
            const viewButton = caseElement.querySelector('button[data-case-id]');
            if (viewButton) {
                viewButton.addEventListener('click', () => {
                    showCaseDetails(caseItem.id);
                });
            }
            
            const editButton = caseElement.querySelector('button[data-edit-id]');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    showCaseForm(caseItem.id);
                });
            }
        }
    });
}

// Helper function to format status strings
function formatStatus(status) {
    if (!status) return 'Unknown';
    
    // Convert snake_case or kebab-case to Title Case
    return status
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

async function loadHearingsData() {
    try {
        // Fetch hearings from Odoo backend
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.hearing',
                    method: 'search_read',
                    args: [],
                    kwargs: {
                        fields: ['name', 'case_id', 'dateStart', 'dateEnd', 'location', 'status', 'notes']
                    }
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to fetch hearings');
        }
        
        if (data.result) {
            // Store hearings in appData
            appData.hearings = data.result;
            
            // Update the hearings list in the UI
            updateHearingsList(data.result);
        }
    } catch (error) {
        console.error('Error loading hearings:', error);
        // Fallback to simulated data for demo
        const response = await simulateApiCall('/legal/hearings', {
            token: appState.authToken
        });
        
        if (response.success) {
            appData.hearings = response.data;
            updateHearingsList(response.data);
        }
    }
}

function updateHearingsList(hearings) {
    const hearingsContainer = document.getElementById('hearings-list');
    if (!hearingsContainer) return;
    
    hearingsContainer.innerHTML = '';
    
    if (hearings.length === 0) {
        hearingsContainer.innerHTML = '<div class="empty-state">No hearings found</div>';
        return;
    }
    
    hearings.forEach(hearing => {
        const hearingElement = document.createElement('div');
        hearingElement.className = 'hearing-item';
        hearingElement.innerHTML = `
            <div class="hearing-header">
                <h3>${hearing.name}</h3>
                <span class="hearing-status ${hearing.status.toLowerCase()}">${hearing.status}</span>
            </div>
            <div class="hearing-details">
                <p><strong>Case:</strong> ${hearing.caseName}</p>
                <p><strong>Date:</strong> ${formatDate(hearing.dateStart)}</p>
                <p><strong>Location:</strong> ${hearing.location}</p>
            </div>
            <div class="hearing-actions">
                <button class="btn btn-sm btn-primary" data-hearing-id="${hearing.id}">View Details</button>
            </div>
        `;
        hearingsContainer.appendChild(hearingElement);
        
        // Add event listener for the view details button
        const viewButton = hearingElement.querySelector('button[data-hearing-id]');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                showHearingDetails(hearing.id);
            });
        }
    });
}

async function loadClientsData() {
    try {
        // Fetch clients from Odoo backend
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'res.partner',
                    method: 'search_read',
                    args: [['is_client', '=', true]],
                    kwargs: {
                        fields: ['name', 'email', 'phone', 'address', 'caseCount']
                    }
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to fetch clients');
        }
        
        if (data.result) {
            // Store clients in appData
            appData.clients = data.result;
            
            // Update the clients list in the UI
            updateClientsList(data.result);
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        // Fallback to simulated data for demo
        const response = await simulateApiCall('/legal/clients', {
            token: appState.authToken
        });
        
        if (response.success) {
            appData.clients = response.data;
            updateClientsList(response.data);
        }
    }
}

function updateClientsList(clients) {
    const clientsContainer = document.getElementById('clients-list');
    if (!clientsContainer) return;
    
    clientsContainer.innerHTML = '';
    
    if (clients.length === 0) {
        clientsContainer.innerHTML = '<div class="empty-state">No clients found</div>';
        return;
    }
    
    clients.forEach(client => {
        const clientElement = document.createElement('div');
        clientElement.className = 'client-item';
        clientElement.innerHTML = `
            <div class="client-header">
                <h3>${client.name}</h3>
            </div>
            <div class="client-details">
                <p><strong>Email:</strong> ${client.email}</p>
                <p><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
                <p><strong>Cases:</strong> ${client.caseCount || 0}</p>
            </div>
            <div class="client-actions">
                <button class="btn btn-sm btn-primary" data-client-id="${client.id}">View Details</button>
            </div>
        `;
        clientsContainer.appendChild(clientElement);
        
        // Add event listener for the view details button
        const viewButton = clientElement.querySelector('button[data-client-id]');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                showClientDetails(client.id);
            });
        }
    });
}

async function loadInvoicesData() {
    try {
        // Fetch invoices from Odoo backend
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.invoice',
                    method: 'search_read',
                    args: [],
                    kwargs: {
                        fields: ['name', 'number', 'case_id', 'client_id', 'date', 'due_date', 'amount', 'state', 'invoice_type', 'fixed_fee_amount', 'hourly_rate', 'hours_spent']
                    }
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to fetch invoices');
        }
        
        if (data.result) {
            // Store invoices in appData
            appData.invoices = data.result;
            
            // Update the invoices list in the UI
            updateInvoicesList(data.result);
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        // Fallback to simulated data for demo
        const response = await simulateApiCall('/legal/invoices', {
            token: appState.authToken
        });
        
        if (response.success) {
            appData.invoices = response.data;
            updateInvoicesList(response.data);
        }
    }
}

function updateInvoicesList(invoices) {
    const invoicesContainer = document.getElementById('invoices-list');
    if (!invoicesContainer) return;
    
    invoicesContainer.innerHTML = '';
    
    if (invoices.length === 0) {
        invoicesContainer.innerHTML = '<div class="empty-state">No invoices found</div>';
        return;
    }
    
    invoices.forEach(invoice => {
        // Handle different data structures between Odoo and simulated data
        const clientName = invoice.client_id ? invoice.client_id[1] : invoice.client;
        const caseName = invoice.case_id ? invoice.case_id[1] : invoice.caseName;
        const status = invoice.state || invoice.status;
        const invoiceNumber = invoice.number || `INV-${invoice.id}`;
        const amount = invoice.amount || 0;
        const invoiceType = invoice.invoice_type || 'hourly';
        const fixedFeeAmount = invoice.fixed_fee_amount || 0;
        const hourlyRate = invoice.hourly_rate || 0;
        const hoursSpent = invoice.hours_spent || 0;
        
        const invoiceElement = document.createElement('div');
        invoiceElement.className = 'invoice-item';
        invoiceElement.innerHTML = `
            <div class="invoice-header">
                <h3>Invoice #${invoiceNumber}</h3>
                <span class="invoice-status ${status.toLowerCase()}">${formatStatus(status)}</span>
            </div>
            <div class="invoice-details">
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Case:</strong> ${caseName}</p>
                <p><strong>Type:</strong> ${invoiceType === 'fixed_fee' ? 'Fixed Fee' : 'Hourly Rate'}</p>
                <p><strong>Amount:</strong> $${parseFloat(amount).toFixed(2)}</p>
                ${invoiceType === 'fixed_fee' ? 
                    `<p><strong>Fixed Fee:</strong> $${parseFloat(fixedFeeAmount).toFixed(2)}</p>` : 
                    `<p><strong>Hours:</strong> ${hoursSpent} @ $${parseFloat(hourlyRate).toFixed(2)}/hr</p>`
                }
                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
            </div>
            <div class="invoice-actions">
                <button class="btn btn-sm btn-primary" data-invoice-id="${invoice.id}">View Invoice</button>
                ${status.toLowerCase() !== 'paid' ? 
                    `<button class="btn btn-sm btn-success" data-pay-id="${invoice.id}">Mark as Paid</button>` : ''
                }
            </div>
        `;
        invoicesContainer.appendChild(invoiceElement);
        
        // Add event listener for the view invoice button
        const viewButton = invoiceElement.querySelector('button[data-invoice-id]');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                showInvoiceDetails(invoice.id);
            });
        }
        
        // Add event listener for the mark as paid button
        const payButton = invoiceElement.querySelector('button[data-pay-id]');
        if (payButton) {
            payButton.addEventListener('click', () => {
                markInvoiceAsPaid(invoice.id);
            });
        }
    });
}

async function loadRecentActivity() {
    try {
        const response = await simulateApiCall('/legal/activity', {
            token: appState.authToken
        });
        
        if (response.success) {
            updateActivityFeed(response.data);
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

function updateActivityFeed(activities) {
    const activityContainer = document.getElementById('activity-feed');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = '';
    
    if (activities.length === 0) {
        activityContainer.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }
    
    activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-icon ${activity.type.toLowerCase()}">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <p class="activity-time">${formatTimeAgo(activity.timestamp)}</p>
            </div>
        `;
        activityContainer.appendChild(activityElement);
    });
}

// Helper functions for the dashboard
function getActivityIcon(type) {
    const icons = {
        'case': 'fa-briefcase',
        'hearing': 'fa-gavel',
        'client': 'fa-user',
        'invoice': 'fa-file-invoice-dollar',
        'document': 'fa-file-alt',
        'message': 'fa-comment'
    };
    
    return icons[type.toLowerCase()] || 'fa-bell';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    return Math.floor(seconds) + ' second' + (seconds === 1 ? '' : 's') + ' ago';
}

// Detail view functions
function showCaseDetails(caseId) {
    const caseData = appData.cases.find(c => c.id === caseId);
    if (!caseData) return;
    
    // Create modal element
    let modal = document.getElementById('case-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'case-details-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Handle different data structures between Odoo and simulated data
    const clientName = caseData.client_id ? caseData.client_id[1] : caseData.client;
    const lawyerName = caseData.responsible_lawyer_id ? caseData.responsible_lawyer_id[1] : caseData.responsibleLawyer;
    const status = caseData.state || caseData.stage;
    const caseNumber = caseData.case_number || caseData.caseNumber || '';
    
    // Populate modal with case details
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${caseData.name}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h3>Case Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Case Number:</span>
                            <span class="detail-value">${caseNumber}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-badge status-${status.toLowerCase()}">${formatStatus(status)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Client:</span>
                            <span class="detail-value">${clientName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Responsible Lawyer:</span>
                            <span class="detail-value">${lawyerName}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Related Hearings</h3>
                    <div class="related-items" id="related-hearings">
                        <!-- Will be populated with related hearings -->
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Related Invoices</h3>
                    <div class="related-items" id="related-invoices">
                        <!-- Will be populated with related invoices -->
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" id="edit-case-btn">Edit Case</button>
                    <button class="btn btn-primary" id="create-case-invoice-btn">Create Invoice</button>
                    <button class="btn btn-secondary" id="close-details-btn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    const editCaseBtn = modal.querySelector('#edit-case-btn');
    if (editCaseBtn) {
        editCaseBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            showCaseForm(caseId);
        });
    }
    
    const createInvoiceBtn = modal.querySelector('#create-case-invoice-btn');
    if (createInvoiceBtn) {
        createInvoiceBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            showInvoiceForm(caseId);
        });
    }
    
    const closeBtn = modal.querySelector('#close-details-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showHearingDetails(hearingId) {
    const hearingData = appData.hearings.find(h => h.id === hearingId);
    if (!hearingData) return;
    
    // Implementation for showing hearing details modal or page
    alert(`Hearing details for: ${hearingData.name}\nThis would show a detailed view in a real implementation.`);
}

function showClientDetails(clientId) {
    const clientData = appData.clients.find(c => c.id === clientId);
    if (!clientData) return;
    
    // Implementation for showing client details modal or page
    alert(`Client details for: ${clientData.name}\nThis would show a detailed view in a real implementation.`);
}

function showInvoiceDetails(invoiceId) {
    const invoice = appData.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    // Get or create modal element
    let modal = document.getElementById('invoice-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'invoice-detail-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Handle different data structures between Odoo and simulated data
    const clientName = invoice.client_id ? invoice.client_id[1] : invoice.client;
    const caseName = invoice.case_id ? invoice.case_id[1] : invoice.caseName;
    const status = invoice.state || invoice.status;
    const invoiceNumber = invoice.number || `INV-${invoice.id}`;
    const amount = invoice.amount || 0;
    const invoiceType = invoice.invoice_type || 'hourly';
    const fixedFeeAmount = invoice.fixed_fee_amount || 0;
    const hourlyRate = invoice.hourly_rate || 0;
    const hoursSpent = invoice.hours_spent || 0;
    
    // Populate modal with invoice details
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Invoice #${invoiceNumber}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="invoice-detail-header">
                    <div class="invoice-status-badge ${status.toLowerCase()}">${formatStatus(status)}</div>
                    <div class="invoice-date">${formatDate(invoice.date)}</div>
                </div>
                
                <div class="invoice-detail-section">
                    <h3>Client Information</h3>
                    <p><strong>Client:</strong> ${clientName}</p>
                    <p><strong>Case:</strong> ${caseName}</p>
                </div>
                
                <div class="invoice-detail-section">
                    <h3>Billing Information</h3>
                    <p><strong>Invoice Type:</strong> ${invoiceType === 'fixed_fee' ? 'Fixed Fee' : 'Hourly Rate'}</p>
                    ${invoiceType === 'fixed_fee' ? 
                        `<p><strong>Fixed Fee Amount:</strong> $${parseFloat(fixedFeeAmount).toFixed(2)}</p>` : 
                        `<p><strong>Hours Spent:</strong> ${hoursSpent}</p>
                         <p><strong>Hourly Rate:</strong> $${parseFloat(hourlyRate).toFixed(2)}</p>
                         <p><strong>Total Hours Charge:</strong> $${(parseFloat(hourlyRate) * parseFloat(hoursSpent)).toFixed(2)}</p>`
                    }
                    <p><strong>Total Amount:</strong> $${parseFloat(amount).toFixed(2)}</p>
                    ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
                </div>
                
                <div class="invoice-detail-section">
                    <h3>Payment Information</h3>
                    ${status.toLowerCase() === 'paid' ? 
                        `<p><strong>Payment Date:</strong> ${invoice.payment_date ? formatDate(invoice.payment_date) : 'N/A'}</p>
                         <p><strong>Payment Method:</strong> ${invoice.payment_method || 'N/A'}</p>` : 
                        `<p>This invoice has not been paid yet.</p>`
                    }
                </div>
                
                <div class="invoice-detail-actions">
                    <button class="btn btn-primary" id="print-invoice">Print Invoice</button>
                    ${status.toLowerCase() !== 'paid' ? 
                        `<button class="btn btn-success" id="pay-invoice">Mark as Paid</button>` : ''
                    }
                    <button class="btn btn-secondary" id="close-modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.querySelector('#close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    const printButton = modal.querySelector('#print-invoice');
    if (printButton) {
        printButton.addEventListener('click', () => {
            printInvoice(invoiceId);
        });
    }
    
    const payButton = modal.querySelector('#pay-invoice');
    if (payButton) {
        payButton.addEventListener('click', () => {
            markInvoiceAsPaid(invoiceId);
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function markInvoiceAsPaid(invoiceId) {
    try {
        // Call Odoo backend to mark invoice as paid
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.invoice',
                    method: 'mark_as_paid',
                    args: [invoiceId],
                    kwargs: {
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'bank_transfer'
                    }
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to mark invoice as paid');
        }
        
        if (data.result) {
            // Update the invoice in the local data
            const invoice = appData.invoices.find(i => i.id === invoiceId);
            if (invoice) {
                invoice.state = 'paid';
                invoice.status = 'Paid';
                invoice.payment_date = new Date().toISOString();
                invoice.payment_method = 'bank_transfer';
            }
            
            // Refresh the invoices list
            loadInvoicesData();
            
            // Show success message
            alert('Invoice has been marked as paid successfully!');
        }
    } catch (error) {
        console.error('Error marking invoice as paid:', error);
        // Fallback for demo
        const invoice = appData.invoices.find(i => i.id === invoiceId);
        if (invoice) {
            invoice.state = 'paid';
            invoice.status = 'Paid';
            invoice.payment_date = new Date().toISOString();
            invoice.payment_method = 'bank_transfer';
        }
        
        // Refresh the invoices list
        updateInvoicesList(appData.invoices);
        
        // Show success message
        alert('Invoice has been marked as paid successfully! (Demo mode)');
    }
}

function printInvoice(invoiceId) {
    const invoice = appData.invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    // Create a printable version of the invoice
    const printWindow = window.open('', '_blank');
    
    // Handle different data structures between Odoo and simulated data
    const clientName = invoice.client_id ? invoice.client_id[1] : invoice.client;
    const caseName = invoice.case_id ? invoice.case_id[1] : invoice.caseName;
    const status = invoice.state || invoice.status;
    const invoiceNumber = invoice.number || `INV-${invoice.id}`;
    const amount = invoice.amount || 0;
    const invoiceType = invoice.invoice_type || 'hourly';
    const fixedFeeAmount = invoice.fixed_fee_amount || 0;
    const hourlyRate = invoice.hourly_rate || 0;
    const hoursSpent = invoice.hours_spent || 0;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-title { font-size: 24px; font-weight: bold; }
                .invoice-details { margin-bottom: 30px; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .invoice-table th { background-color: #f2f2f2; }
                .invoice-total { text-align: right; font-weight: bold; margin-top: 20px; }
                .invoice-footer { margin-top: 50px; font-size: 12px; text-align: center; color: #666; }
                .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; color: white; }
                .status-paid { background-color: #28a745; }
                .status-pending { background-color: #ffc107; }
                .status-overdue { background-color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <div>
                    <div class="invoice-title">INVOICE</div>
                    <div>Legal Case Management System</div>
                    <div>123 Law Street, Suite 101</div>
                    <div>New York, NY 10001</div>
                </div>
                <div>
                    <div><strong>Invoice #:</strong> ${invoiceNumber}</div>
                    <div><strong>Date:</strong> ${formatDate(invoice.date)}</div>
                    <div><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase()}">${formatStatus(status)}</span></div>
                </div>
            </div>
            
            <div class="invoice-details">
                <div><strong>Client:</strong> ${clientName}</div>
                <div><strong>Case:</strong> ${caseName}</div>
                ${invoice.due_date ? `<div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>` : ''}
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Details</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceType === 'fixed_fee' ? 
                        `<tr>
                            <td>Legal Services - Fixed Fee</td>
                            <td>Fixed fee for legal services related to case ${caseName}</td>
                            <td>$${parseFloat(fixedFeeAmount).toFixed(2)}</td>
                        </tr>` : 
                        `<tr>
                            <td>Legal Services - Hourly Rate</td>
                            <td>${hoursSpent} hours @ $${parseFloat(hourlyRate).toFixed(2)}/hour</td>
                            <td>$${(parseFloat(hourlyRate) * parseFloat(hoursSpent)).toFixed(2)}</td>
                        </tr>`
                    }
                </tbody>
            </table>
            
            <div class="invoice-total">
                <div><strong>Total Amount:</strong> $${parseFloat(amount).toFixed(2)}</div>
            </div>
            
            <div class="invoice-footer">
                <p>Thank you for your business!</p>
                <p>For questions regarding this invoice, please contact billing@legalcms.com</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Form Functions
function showInvoiceForm(caseId = null) {
    // Get or create modal element
    let modal = document.getElementById('invoice-form-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'invoice-form-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Get case data if caseId is provided
    let caseData = null;
    if (caseId) {
        caseData = appData.cases.find(c => c.id === caseId);
    }
    
    // Populate modal with invoice form
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Invoice</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="invoice-form">
                    <div class="form-group">
                        <label for="invoice-case">Case</label>
                        <select id="invoice-case" class="form-control" required>
                            <option value="">Select a case</option>
                            ${appData.cases.map(c => `<option value="${c.id}" ${caseId === c.id ? 'selected' : ''}>${c.name} (${c.caseNumber || c.case_number || ''})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="invoice-type">Invoice Type</label>
                        <select id="invoice-type" class="form-control" required>
                            <option value="hourly">Hourly Rate</option>
                            <option value="fixed_fee">Fixed Fee</option>
                        </select>
                    </div>
                    
                    <div id="hourly-rate-fields">
                        <div class="form-group">
                            <label for="invoice-hourly-rate">Hourly Rate ($)</label>
                            <input type="number" id="invoice-hourly-rate" class="form-control" min="0" step="0.01" value="150.00" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="invoice-hours">Hours Spent</label>
                            <input type="number" id="invoice-hours" class="form-control" min="0" step="0.25" value="1.00" required>
                        </div>
                    </div>
                    
                    <div id="fixed-fee-fields" style="display: none;">
                        <div class="form-group">
                            <label for="invoice-fixed-fee">Fixed Fee Amount ($)</label>
                            <input type="number" id="invoice-fixed-fee" class="form-control" min="0" step="0.01" value="500.00">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="invoice-date">Invoice Date</label>
                        <input type="date" id="invoice-date" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="invoice-due-date">Due Date</label>
                        <input type="date" id="invoice-due-date" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="invoice-notes">Notes</label>
                        <textarea id="invoice-notes" class="form-control" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Invoice</button>
                        <button type="button" class="btn btn-secondary" id="cancel-invoice">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Set default dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30); // Due in 30 days
    
    document.getElementById('invoice-date').value = today.toISOString().split('T')[0];
    document.getElementById('invoice-due-date').value = dueDate.toISOString().split('T')[0];
    
    // Add event listeners
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    document.getElementById('cancel-invoice').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Toggle between hourly and fixed fee fields
    document.getElementById('invoice-type').addEventListener('change', (e) => {
        const hourlyFields = document.getElementById('hourly-rate-fields');
        const fixedFeeFields = document.getElementById('fixed-fee-fields');
        
        if (e.target.value === 'fixed_fee') {
            hourlyFields.style.display = 'none';
            fixedFeeFields.style.display = 'block';
        } else {
            hourlyFields.style.display = 'block';
            fixedFeeFields.style.display = 'none';
        }
    });
    
    // Handle form submission
    document.getElementById('invoice-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const caseId = document.getElementById('invoice-case').value;
        const invoiceType = document.getElementById('invoice-type').value;
        const invoiceDate = document.getElementById('invoice-date').value;
        const dueDate = document.getElementById('invoice-due-date').value;
        const notes = document.getElementById('invoice-notes').value;
        
        let amount = 0;
        let hourlyRate = 0;
        let hoursSpent = 0;
        let fixedFeeAmount = 0;
        
        if (invoiceType === 'hourly') {
            hourlyRate = parseFloat(document.getElementById('invoice-hourly-rate').value);
            hoursSpent = parseFloat(document.getElementById('invoice-hours').value);
            amount = hourlyRate * hoursSpent;
        } else {
            fixedFeeAmount = parseFloat(document.getElementById('invoice-fixed-fee').value);
            amount = fixedFeeAmount;
        }
        
        // Create the invoice
        await createInvoice({
            caseId,
            invoiceType,
            date: invoiceDate,
            dueDate,
            amount,
            hourlyRate,
            hoursSpent,
            fixedFeeAmount,
            notes
        });
        
        // Close the modal
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function createInvoice(invoiceData) {
    try {
        // Call Odoo backend to create invoice
        const response = await fetch(appState.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    model: 'legal.invoice',
                    method: 'create',
                    args: [{
                        case_id: parseInt(invoiceData.caseId),
                        date: invoiceData.date,
                        due_date: invoiceData.dueDate,
                        amount: invoiceData.amount,
                        state: 'draft',
                        invoice_type: invoiceData.invoiceType,
                        fixed_fee_amount: invoiceData.fixedFeeAmount,
                        hourly_rate: invoiceData.hourlyRate,
                        hours_spent: invoiceData.hoursSpent,
                        notes: invoiceData.notes
                    }],
                    kwargs: {}
                }
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.data.message || 'Failed to create invoice');
        }
        
        if (data.result) {
            // Refresh the invoices list
            loadInvoicesData();
            
            // Show success message
            alert('Invoice has been created successfully!');
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        // Fallback for demo
        const caseData = appData.cases.find(c => c.id === parseInt(invoiceData.caseId));
        
        // Generate a new invoice ID
        const newId = appData.invoices ? Math.max(...appData.invoices.map(i => i.id)) + 1 : 1;
        
        // Create a new invoice object
        const newInvoice = {
            id: newId,
            number: `INV-${newId}`,
            case_id: [parseInt(invoiceData.caseId), caseData ? caseData.name : 'Unknown Case'],
            client_id: caseData && caseData.client_id ? caseData.client_id : [1, 'Demo Client'],
            date: invoiceData.date,
            due_date: invoiceData.dueDate,
            amount: invoiceData.amount,
            state: 'draft',
            status: 'Draft',
            invoice_type: invoiceData.invoiceType,
            fixed_fee_amount: invoiceData.fixedFeeAmount,
            hourly_rate: invoiceData.hourlyRate,
            hours_spent: invoiceData.hoursSpent,
            notes: invoiceData.notes
        };
        
        // Add to local data
        if (!appData.invoices) {
            appData.invoices = [];
        }
        appData.invoices.push(newInvoice);
        
        // Refresh the invoices list
        updateInvoicesList(appData.invoices);
        
        // Show success message
        alert('Invoice has been created successfully! (Demo mode)');
    }
}

function showCaseForm(caseId = null) {
    // Get the modal element
    const modal = document.getElementById('case-form-modal');
    const modalTitle = modal.querySelector('.modal-title');
    const form = document.getElementById('case-form');
    
    // Clear previous form data
    form.reset();
    
    // Set the form title based on whether it's an edit or new case
    modalTitle.textContent = caseId ? 'Edit Case' : 'New Case';
    
    // If editing an existing case, populate the form with case data
    if (caseId) {
        const caseData = appData.cases.find(c => c.id === caseId);
        if (caseData) {
            document.getElementById('case-name').value = caseData.name || '';
            document.getElementById('case-number').value = caseData.case_number || '';
            
            // Set client dropdown
            if (caseData.client_id) {
                document.getElementById('case-client').value = caseData.client_id[0];
            }
            
            // Set lawyer dropdown
            if (caseData.responsible_lawyer_id) {
                document.getElementById('case-lawyer').value = caseData.responsible_lawyer_id[0];
            }
            
            // Set case type
            if (caseData.case_type) {
                document.getElementById('case-type').value = caseData.case_type;
            }
            
            // Set status
            if (caseData.state) {
                document.getElementById('case-status').value = caseData.state;
            }
            
            // Set description
            if (caseData.description) {
                document.getElementById('case-description').value = caseData.description;
            }
            
            // Set the case ID as a data attribute on the form
            form.setAttribute('data-case-id', caseId);
        }
    } else {
        // Remove any case ID data attribute
        form.removeAttribute('data-case-id');
    }
    
    // Populate client dropdown if not already populated
    const clientDropdown = document.getElementById('case-client');
    if (clientDropdown.options.length <= 1) {
        populateClientDropdown(clientDropdown);
    }
    
    // Populate lawyer dropdown if not already populated
    const lawyerDropdown = document.getElementById('case-lawyer');
    if (lawyerDropdown.options.length <= 1) {
        populateLawyerDropdown(lawyerDropdown);
    }
    
    // Show the modal
    modal.classList.add('active');
    
    // Add event listener for form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('case-name').value,
            case_number: document.getElementById('case-number').value,
            client_id: parseInt(document.getElementById('case-client').value),
            responsible_lawyer_id: parseInt(document.getElementById('case-lawyer').value),
            case_type: document.getElementById('case-type').value,
            state: document.getElementById('case-status').value,
            description: document.getElementById('case-description').value
        };
        
        try {
            let result;
            if (caseId) {
                // Update existing case
                result = await updateCase(caseId, formData);
            } else {
                // Create new case
                result = await createCase(formData);
            }
            
            if (result.success) {
                // Close the modal
                modal.classList.remove('active');
                
                // Reload cases data
                await loadCasesData();
                
                // Show success message
                showNotification('Case saved successfully', 'success');
            } else {
                showNotification(result.message || 'Failed to save case', 'error');
            }
        } catch (error) {
            console.error('Error saving case:', error);
            showNotification('An error occurred while saving the case', 'error');
        }
    };
    
    // Add event listener for close button
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = function() {
            modal.classList.remove('active');
        };
    });
}

function showHearingForm(hearingId = null) {
    // Get the modal element
    const modal = document.getElementById('hearing-form-modal');
    const modalTitle = modal.querySelector('.modal-title');
    const form = document.getElementById('hearing-form');
    
    // Clear previous form data
    form.reset();
    
    // Set the form title based on whether it's an edit or new hearing
    modalTitle.textContent = hearingId ? 'Edit Hearing' : 'New Hearing';
    
    // If editing an existing hearing, populate the form with hearing data
    if (hearingId) {
        const hearingData = appData.hearings.find(h => h.id === hearingId);
        if (hearingData) {
            document.getElementById('hearing-name').value = hearingData.name || '';
            
            // Set case dropdown
            if (hearingData.case_id) {
                document.getElementById('hearing-case').value = hearingData.case_id[0];
            }
            
            // Set date and time
            if (hearingData.dateStart) {
                const date = new Date(hearingData.dateStart);
                document.getElementById('hearing-date').value = date.toISOString().split('T')[0];
                document.getElementById('hearing-time').value = date.toTimeString().slice(0, 5);
            }
            
            // Set location
            if (hearingData.location) {
                document.getElementById('hearing-location').value = hearingData.location;
            }
            
            // Set status
            if (hearingData.status) {
                document.getElementById('hearing-status').value = hearingData.status;
            }
            
            // Set notes
            if (hearingData.notes) {
                document.getElementById('hearing-notes').value = hearingData.notes;
            }
            
            // Set the hearing ID as a data attribute on the form
            form.setAttribute('data-hearing-id', hearingId);
        }
    } else {
        // Remove any hearing ID data attribute
        form.removeAttribute('data-hearing-id');
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('hearing-date').value = today;
    }
    
    // Populate case dropdown if not already populated
    const caseDropdown = document.getElementById('hearing-case');
    if (caseDropdown.options.length <= 1) {
        populateCaseDropdown(caseDropdown);
    }
    
    // Show the modal
    modal.classList.add('active');
    
    // Add event listener for form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        // Get form data
        const date = document.getElementById('hearing-date').value;
        const time = document.getElementById('hearing-time').value;
        const dateTime = new Date(`${date}T${time}:00`);
        
        const formData = {
            name: document.getElementById('hearing-name').value,
            case_id: parseInt(document.getElementById('hearing-case').value),
            dateStart: dateTime.toISOString(),
            dateEnd: new Date(dateTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours duration
            location: document.getElementById('hearing-location').value,
            status: document.getElementById('hearing-status').value,
            notes: document.getElementById('hearing-notes').value
        };
        
        try {
            let result;
            if (hearingId) {
                // Update existing hearing
                result = await updateHearing(hearingId, formData);
            } else {
                // Create new hearing
                result = await createHearing(formData);
            }
            
            if (result.success) {
                // Close the modal
                modal.classList.remove('active');
                
                // Reload hearings data
                await loadHearingsData();
                
                // Show success message
                showNotification('Hearing saved successfully', 'success');
            } else {
                showNotification(result.message || 'Failed to save hearing', 'error');
            }
        } catch (error) {
            console.error('Error saving hearing:', error);
            showNotification('An error occurred while saving the hearing', 'error');
        }
    };
    
    // Add event listener for close button
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = function() {
            modal.classList.remove('active');
        };
    });
}

function showClientForm(clientId = null) {
    // Get the modal element
    const modal = document.getElementById('client-form-modal');
    const modalTitle = modal.querySelector('.modal-title');
    const form = document.getElementById('client-form');
    
    // Clear previous form data
    form.reset();
    
    // Set the form title based on whether it's an edit or new client
    modalTitle.textContent = clientId ? 'Edit Client' : 'New Client';
    
    // If editing an existing client, populate the form with client data
    if (clientId) {
        const clientData = appData.clients.find(c => c.id === clientId);
        if (clientData) {
            document.getElementById('client-name').value = clientData.name || '';
            document.getElementById('client-email').value = clientData.email || '';
            document.getElementById('client-phone').value = clientData.phone || '';
            document.getElementById('client-address').value = clientData.address || '';
            
            // Set the client ID as a data attribute on the form
            form.setAttribute('data-client-id', clientId);
        }
    } else {
        // Remove any client ID data attribute
        form.removeAttribute('data-client-id');
    }
    
    // Show the modal
    modal.classList.add('active');
    
    // Add event listener for form submission
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value,
            isClient: true
        };
        
        try {
            let result;
            if (clientId) {
                // Update existing client
                result = await updateClient(clientId, formData);
            } else {
                // Create new client
                result = await createClient(formData);
            }
            
            if (result.success) {
                // Close the modal
                modal.classList.remove('active');
                
                // Reload clients data
                await loadClientsData();
                
                // Show success message
                showNotification('Client saved successfully', 'success');
            } else {
                showNotification(result.message || 'Failed to save client', 'error');
            }
        } catch (error) {
            console.error('Error saving client:', error);
            showNotification('An error occurred while saving the client', 'error');
        }
    };
    
    // Add event listener for close button
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = function() {
            modal.classList.remove('active');
        };
    });
}

// This older version of showInvoiceForm has been replaced by the updated version at line 1438
        
/* Removed orphaned code that was causing syntax errors */

/* Original code removed - this was part of the duplicate showInvoiceForm function that has been replaced */

// Helper functions for populating dropdowns
function populateClientDropdown(dropdown) {
    // Clear existing options except the first one (placeholder)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Add clients to dropdown
    appData.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        dropdown.appendChild(option);
    });
}

function populateLawyerDropdown(dropdown) {
    // Clear existing options except the first one (placeholder)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Add lawyers to dropdown
    appData.lawyers.forEach(lawyer => {
        const option = document.createElement('option');
        option.value = lawyer.id;
        option.textContent = lawyer.name;
        dropdown.appendChild(option);
    });
}

function populateCaseDropdown(dropdown) {
    // Clear existing options except the first one (placeholder)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Add cases to dropdown
    appData.cases.forEach(caseItem => {
        const option = document.createElement('option');
        option.value = caseItem.id;
        option.textContent = caseItem.name;
        dropdown.appendChild(option);
    });
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Add notification to the DOM
    const notificationsContainer = document.getElementById('notifications-container');
    if (!notificationsContainer) {
        // Create notifications container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'notifications-container';
        document.body.appendChild(container);
        container.appendChild(notification);
    } else {
        notificationsContainer.appendChild(notification);
    }
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.add('notification--fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        try {
            appState.authToken = savedToken;
            appState.currentUser = JSON.parse(savedUser);
            appState.isAuthenticated = true;
            showDashboard();
        } catch (e) {
            console.error('Error restoring session:', e);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }
    
    // Login Form Submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Simple validation
            if (email && password) {
                const loginBtn = loginForm.querySelector('button[type="submit"]');
                if (loginBtn) {
                    loginBtn.disabled = true;
                    loginBtn.textContent = 'Logging in...';
                }
                
                const success = await authenticateWithOdoo(email, password);
                
                if (success) {
                    showDashboard();
                    loadDashboardData();
                }
                
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Sign In';
                }
            }
        });
    }
    
    // Signup Form Submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstName = document.getElementById('signup-firstname').value;
            const lastName = document.getElementById('signup-lastname').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Simple validation
            if (firstName && lastName && email && password && confirmPassword) {
                if (password !== confirmPassword) {
                    showSignupError('Passwords do not match');
                    return;
                }
                
                const signupBtn = signupForm.querySelector('button[type="submit"]');
                if (signupBtn) {
                    signupBtn.disabled = true;
                    signupBtn.textContent = 'Creating account...';
                }
                
                const userData = {
                    name: `${firstName} ${lastName}`,
                    email: email,
                    password: password
                };
                
                const success = await registerWithOdoo(userData);
                
                if (success) {
                    showDashboard();
                    loadDashboardData();
                }
                
                if (signupBtn) {
                    signupBtn.disabled = false;
                    signupBtn.textContent = 'Sign Up';
                }
            } else {
                showSignupError('Please fill in all required fields');
            }
        });
    }
    
    // Dashboard Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(`${targetPage}-page`).classList.add('active');
            
            appState.activeDashboardPage = targetPage;
            
            // Load specific data based on the selected page
            switch(targetPage) {
                case 'cases':
                    loadCasesData();
                    break;
                case 'hearings':
                    loadHearingsData();
                    break;
                case 'clients':
                    loadClientsData();
                    break;
                case 'invoices':
                    loadInvoicesData();
                    break;
            }
        });
    });
    
    // Add case button
    const addCaseBtn = document.getElementById('add-case-btn');
    if (addCaseBtn) {
        addCaseBtn.addEventListener('click', function() {
            showCaseForm();
        });
    }
    
    // Add hearing button
    const addHearingBtn = document.getElementById('add-hearing-btn');
    if (addHearingBtn) {
        addHearingBtn.addEventListener('click', function() {
            showHearingForm();
        });
    }
    
    // Add client button
    const addClientBtn = document.getElementById('add-client-btn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            showClientForm();
        });
    }
    
    // Create invoice button
    const createInvoiceBtn = document.getElementById('create-invoice-btn');
    if (createInvoiceBtn) {
        createInvoiceBtn.addEventListener('click', function() {
            showInvoiceForm();
        });
    }
    
    // Search and filter handlers
    const caseSearch = document.getElementById('case-search');
    if (caseSearch) {
        caseSearch.addEventListener('input', function() {
            filterCases();
        });
    }
    
    const caseStatusFilter = document.getElementById('case-status-filter');
    if (caseStatusFilter) {
        caseStatusFilter.addEventListener('change', function() {
            filterCases();
        });
    }
});